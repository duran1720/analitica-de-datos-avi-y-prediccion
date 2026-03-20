"""
predict.py — Motor de Prediccion AVI v3.0

Carga el pipeline StackingRegressor entrenado por train_model.py y expone
funciones de prediccion incremental y legacy (predict_demanda_simple).
"""
import os
from datetime import datetime

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
PKL_PATH  = os.path.join(MODEL_DIR, "modelo_demanda.pkl")
META_PATH = os.path.join(MODEL_DIR, "model_meta.pkl")

_pipeline = None
_meta     = None

try:
    import joblib
    if os.path.exists(PKL_PATH):
        _pipeline = joblib.load(PKL_PATH)
    if os.path.exists(META_PATH):
        _meta = joblib.load(META_PATH)
except Exception as exc:
    print(f"[Predict] Modelo pkl no disponible: {exc}. Usando heuristica.")


FEATURES = [
    "total_aspirantes", "aspirantes_norm",
    "ranking_promedio", "diversidad_barrios",
    "puntajeR", "puntajeI", "puntajeA", "puntajeS", "puntajeE", "puntajeC",
    "riasec_afinidad", "riasec_amplitud", "riasec_suma",
    "aprendices_activos",
    "tasa_desercion", "tasa_exito", "promedio_horas_inasistidas",
    "demanda_neta", "score_riasec_demanda", "penalizacion_desercion",
    "score_viabilidad",
]

_MAX_ASP_REF = 50.0


def _build_features(datos: dict, max_asp: float = _MAX_ASP_REF) -> dict:
    """Construye el vector de features identico al pipeline de entrenamiento."""
    R = datos.get("puntajeR", 0)
    I = datos.get("puntajeI", 0)
    A = datos.get("puntajeA", 0)
    S = datos.get("puntajeS", 0)
    E = datos.get("puntajeE", 0)
    C = datos.get("puntajeC", 0)

    riasec_suma     = max(R + I + A + S + E + C, 0.01)
    riasec_max      = max(R, I, A, S, E, C)
    riasec_afinidad = riasec_max / riasec_suma
    riasec_amplitud = 1 - riasec_afinidad

    total_asp       = datos.get("total_aspirantes", 0)
    aspirantes_norm = min(total_asp / max(max_asp, 1), 1.0)
    aprendices      = datos.get("aprendices_activos", 0)
    tasa_des        = float(datos.get("tasa_desercion", 0.0))
    tasa_ext        = float(datos.get("tasa_exito", 0.5))
    tasa_retencion  = 1 - tasa_des

    return {
        "total_aspirantes":        total_asp,
        "aspirantes_norm":         aspirantes_norm,
        "ranking_promedio":        datos.get("ranking_promedio", 0.0),
        "diversidad_barrios":      datos.get("diversidad_barrios", 0),
        "puntajeR": R, "puntajeI": I, "puntajeA": A,
        "puntajeS": S, "puntajeE": E, "puntajeC": C,
        "riasec_afinidad":         riasec_afinidad,
        "riasec_amplitud":         riasec_amplitud,
        "riasec_suma":             riasec_suma,
        "aprendices_activos":      aprendices,
        "tasa_desercion":          tasa_des,
        "tasa_exito":              tasa_ext,
        "promedio_horas_inasistidas": float(datos.get("promedio_horas_inasistidas", 0.0)),
        "demanda_neta":            aspirantes_norm * (1 - tasa_des),
        "score_riasec_demanda":    aspirantes_norm * riasec_afinidad,
        "penalizacion_desercion":  min(tasa_des * (aprendices / max(aprendices, 1)), 1.0),
        "score_viabilidad":        (aspirantes_norm * 0.6) + (tasa_retencion * 0.4),
    }


def _calcular_trimestre_objetivo() -> str:
    now = datetime.utcnow()
    q   = (now.month - 1) // 3 + 2
    yr  = now.year
    if q > 4:
        q, yr = 1, yr + 1
    return f"{yr}-Q{q}"


def score_to_business_outputs(
    score_oferta: float,
    aspirantes_norm: float,
    tasa_desercion: float,
    score_viabilidad: float,
    total_aspirantes: float,
    aprendices_activos: float,
) -> dict:
    """Convierte el score del modelo en salidas de negocio para planificacion educativa."""
    score_oferta       = max(0.0, min(100.0, float(score_oferta)))
    aspirantes_norm    = max(0.0, min(1.0, float(aspirantes_norm)))
    tasa_desercion     = max(0.0, min(1.0, float(tasa_desercion)))
    score_viabilidad   = max(0.0, min(1.0, float(score_viabilidad)))
    total_aspirantes   = max(0, int(total_aspirantes))
    aprendices_activos = max(0, int(aprendices_activos))

    if score_oferta >= 85:
        tendencia = "Alta"
    elif score_oferta >= 70:
        tendencia = "Media-Alta"
    elif score_oferta >= 50:
        tendencia = "Media"
    elif score_oferta >= 30:
        tendencia = "Baja"
    else:
        tendencia = "Critica"

    condiciones_aumentar = (
        score_oferta >= 90
        and aspirantes_norm >= 0.80
        and tasa_desercion < 0.35
        and score_viabilidad >= 0.65
    )

    if score_oferta < 35 or tasa_desercion > 0.70:
        accion_sugerida = "Suspender"
    elif condiciones_aumentar:
        accion_sugerida = "Aumentar"
    else:
        accion_sugerida = "Mantener"

    confianza = (
        0.35
        + min(total_aspirantes / 100.0, 0.30)
        + min(aprendices_activos / 200.0, 0.20)
        + (score_viabilidad * 0.15)
    )
    confianza = round(min(confianza, 0.95), 3)

    # Validaciones de consistencia
    if score_oferta <= 0:
        confianza = min(confianza, 0.40)
    if score_oferta >= 90 and accion_sugerida == "Mantener":
        accion_sugerida = "Aumentar"
    if aspirantes_norm >= 0.90 and accion_sugerida == "Suspender":
        accion_sugerida = "Mantener"
    if tasa_desercion >= 0.80 and accion_sugerida == "Aumentar":
        accion_sugerida = "Suspender"

    return {
        "tendencia":            tendencia,
        "accion_sugerida":      accion_sugerida,
        "confianza_prediccion": confianza,
    }


def _score_to_salidas(score: float, feat: dict) -> dict:
    """Wrapper sobre score_to_business_outputs para el flujo de prediccion."""
    return score_to_business_outputs(
        score_oferta=score,
        aspirantes_norm=feat["aspirantes_norm"],
        tasa_desercion=feat["tasa_desercion"],
        score_viabilidad=feat.get("score_viabilidad", 0.0),
        total_aspirantes=feat["total_aspirantes"],
        aprendices_activos=feat["aprendices_activos"],
    )


def _heuristica_score(feat: dict) -> float:
    """Score heuristico de respaldo cuando el modelo pkl no esta disponible."""
    ranking = feat.get("ranking_promedio", 3.0) or 3.0
    score = (
        feat["aspirantes_norm"] * 30 +
        feat["riasec_afinidad"] * 15 +
        feat["tasa_exito"]      * 20 +
        (1 - feat["tasa_desercion"]) * 10 +
        (ranking / 5.0) * 45
    )
    if ranking < 2.5:
        score -= 20
    return max(0, min(100, score))


# ── API Publica ───────────────────────────────────────────────────────────────

def predict_incremental(datos: dict, max_asp: float = _MAX_ASP_REF) -> dict:
    """Prediccion cientifica para un programa. Usa pkl si esta disponible."""
    import pandas as pd

    feat     = _build_features(datos, max_asp=max_asp)
    prog_id  = datos.get("programaId", 0)
    nombre   = datos.get("nombre_programa", f"Programa_{prog_id}")
    tasa_des = feat["tasa_desercion"]

    if feat["total_aspirantes"] == 0 and feat["aprendices_activos"] == 0:
        score   = 40.0
        fuente  = "safe_default_sin_datos"
        negocio = _score_to_salidas(score, feat)
        return {
            "programaId":           prog_id,
            "nombre_programa":      nombre,
            "demanda_predicha":     score,
            "confianza_prediccion": negocio["confianza_prediccion"],
            "tendencia":            negocio["tendencia"],
            "accion_sugerida":      negocio["accion_sugerida"],
            "riesgo_desercion":     round(tasa_des, 3),
            "trimestre_objetivo":   _calcular_trimestre_objetivo(),
            "fuente_modelo":        fuente,
        }

    if _pipeline is not None:
        try:
            df_feat = pd.DataFrame([feat])[FEATURES]
            raw     = float(_pipeline.predict(df_feat)[0])
            score   = round(max(0.0, min(100.0, raw)), 2)
            fuente  = "stacking_gbm_rf"
        except Exception as exc:
            print(f"[Predict] PKL fallo ({exc}), usando heuristica.")
            score  = round(_heuristica_score(feat), 2)
            fuente = "heuristica_fallback"
    else:
        score  = round(_heuristica_score(feat), 2)
        fuente = "heuristica"

    negocio = _score_to_salidas(score, feat)

    return {
        "programaId":           prog_id,
        "nombre_programa":      nombre,
        "demanda_predicha":     score,
        "confianza_prediccion": negocio["confianza_prediccion"],
        "tendencia":            negocio["tendencia"],
        "accion_sugerida":      negocio["accion_sugerida"],
        "riesgo_desercion":     round(tasa_des, 3),
        "trimestre_objetivo":   _calcular_trimestre_objetivo(),
        "fuente_modelo":        fuente,
    }


def predict_demanda_simple(data: dict) -> dict:
    """Compatibilidad legacy con /predict-demanda (AdminController)."""
    pred = predict_incremental(data)
    return {
        "demanda_predicha": pred["demanda_predicha"],
        "explicacion": {
            "tendencia": pred["tendencia"],
            "confianza": pred["confianza_prediccion"],
            "accion":    pred["accion_sugerida"],
        }
    }