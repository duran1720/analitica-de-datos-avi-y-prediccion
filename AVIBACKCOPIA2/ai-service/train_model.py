"""
train_model.py — Pipeline Científico de Alto Rendimiento AVI v3.0
════════════════════════════════════════════════════════════════════
INGENIERÍA DE DATOS:
  - Merge interno: ASPIRANTE (demanda RIASEC) ✕ APRENDIZ (estado / inasistencias)
  - Feature engineering: afinidad RIASEC, índice deserción ponderado, score demanda neta

LÓGICA DE PESOS (diseño académico):
  - Tasa deserción     → PENALIZA  la recomendación de oferta  (factor negativo)
  - Demanda aspirantes → POTENCIA  la recomendación de oferta  (factor positivo)
  - Afinidad RIASEC    → POTENCIA  el score de demanda neta    (amplificador)

SALIDAS GARANTIZADAS:
  - model/modelo_demanda.pkl       → modelo productivo
  - model/model_meta.pkl           → metadata (columnas, versión)
  - model/auditoria_entrenamiento.csv → MAE, RMSE, R², volumen, fecha
"""

import logging
import os
import sys
import warnings
import json
from datetime import datetime

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# ML
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
    StackingRegressor,
)
from sklearn.linear_model import Ridge
from sklearn.model_selection import cross_val_score, KFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.impute import SimpleImputer
import joblib

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("avi-train")

# ════════════════════════════════════════════════════════════════════
# 0. CONFIGURACIÓN
# ════════════════════════════════════════════════════════════════════
_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(_env_path)
if not os.path.isfile(_env_path):
    logger.warning("No se encontró .env en %s; usando variables de entorno del sistema.", _env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:1234@localhost:3306/AVI")
DB_URL_SA = DATABASE_URL.replace("mysql://", "mysql+pymysql://")

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "model")
PKL_PATH   = os.path.join(MODEL_DIR, "modelo_demanda.pkl")
META_PATH  = os.path.join(MODEL_DIR, "model_meta.pkl")
AUDIT_PATH = os.path.join(MODEL_DIR, "auditoria_entrenamiento.csv")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = [
    # Demanda (aspirantes)
    "total_aspirantes",
    "aspirantes_norm",          # normalizado por max (0-1)
    "ranking_promedio",         # 1 a 5
    "diversidad_barrios",       # Nro de barrios inst.
    # RIASEC promedios brutos
    "puntajeR", "puntajeI", "puntajeA",
    "puntajeS", "puntajeE", "puntajeC",
    # Features derivados RIASEC
    "riasec_afinidad",          # concentración del perfil (0-1)
    "riasec_amplitud",          # dispersión = 1 - afinidad
    "riasec_suma",              # intensidad total
    # Estado aprendices
    "aprendices_activos",
    "tasa_desercion",           # PENALIZADORA
    "tasa_exito",               # POTENCIADORA
    "promedio_horas_inasistidas",
    # Features combinados (interacciones diseñadas)
    "demanda_neta",             # aspirantes * (1 - tasa_desercion)
    "score_riasec_demanda",     # aspirantes_norm * riasec_afinidad
    "penalizacion_desercion",   # tasa_desercion * aprendices_activos
    "score_viabilidad",         # (Demanda * 0.6) + (Retencion * 0.4)
]

SEED  = 42
CV_K  = 5   # folds para cross-validation


# ════════════════════════════════════════════════════════════════════
# 1. EXTRACCIÓN DE DATOS (MERGE INTERNO)
# ════════════════════════════════════════════════════════════════════
print("\n╔══════════════════════════════════════════════════╗")
print("║  AVI — Pipeline IA de Alto Rendimiento  v3.0    ║")
print("╚══════════════════════════════════════════════════╝\n")
print(f"[Train] Conectando a BD: {DB_URL_SA[:40]}...")

try:
    engine = create_engine(DB_URL_SA, pool_pre_ping=True)

    with engine.connect() as conn:

        # ── Tabla 1: Programas base ─────────────────────────────────────
        programas_df = pd.read_sql(text("""
            SELECT
                p.idPROGRAMA  AS programaId,
                p.nombre      AS nombre_programa,
                p.nivel
            FROM PROGRAMA p
            WHERE p.activo = 1
        """), conn)

        # ── Tabla 2: Demanda RIASEC, Ranking y Geografía ────────────────
        # Usa la relación RECOMENDACION.programaId -> PROGRAMA (TestService.js ahora usa programaElegidoId, usaremos el mismo guardado)
        riasec_df = pd.read_sql(text("""
            SELECT
                rec.programaElegidoId   AS programaId,
                COUNT(DISTINCT r.idREPORTE)  AS total_aspirantes,
                AVG(r.puntajeR) AS puntajeR,
                AVG(r.puntajeI) AS puntajeI,
                AVG(r.puntajeA) AS puntajeA,
                AVG(r.puntajeS) AS puntajeS,
                AVG(r.puntajeE) AS puntajeE,
                AVG(r.puntajeC) AS puntajeC,
                AVG(rec.ranking) AS ranking_promedio,
                COUNT(DISTINCT a.barrio) AS diversidad_barrios
            FROM REPORTE r
            INNER JOIN RECOMENDACION rec ON rec.reporteId = r.idREPORTE
            INNER JOIN ASPIRANTE a ON r.aspiranteId = a.idASPIRANTE
            WHERE rec.programaElegidoId IS NOT NULL
            GROUP BY rec.programaElegidoId
        """), conn)

        # ── Tabla 3: Estado aprendices por programa ─────────────────────
        aprendices_df = pd.read_sql(text("""
            SELECT
                programaId,
                COUNT(*)                                                         AS aprendices_activos,
                SUM(CASE WHEN LOWER(estado) IN ('desertor','inasistencia','retiro voluntario','retiro') THEN 1 ELSE 0 END)
                                                                                 AS desertores,
                SUM(CASE WHEN LOWER(estado) IN ('certificado','en formacion','activo') THEN 1 ELSE 0 END)
                                                                                 AS exitosos,
                AVG(horas_inasistidas)                                           AS promedio_horas_inasistidas
            FROM APRENDIZ
            GROUP BY programaId
        """), conn)

except Exception as exc:
    import traceback
    error_log_path = os.path.join(os.path.dirname(__file__), "error.log")
    with open(error_log_path, "w", encoding="utf-8") as f:
        f.write(traceback.format_exc())
    logger.exception("Error de conexión o extracción de BD; detalle en %s", error_log_path)
    logger.error("Abortando — se requieren datos reales para entrenar.")
    sys.exit(1)

print(f"[Train] Programas activos: {len(programas_df)}")
print(f"[Train] Programas con aspirantes RIASEC: {len(riasec_df)}")
print(f"[Train] Programas con aprendices: {len(aprendices_df)}")


# ════════════════════════════════════════════════════════════════════
# 2. MERGE INTERNO COMPLETO
# ════════════════════════════════════════════════════════════════════
df = (
    programas_df
    .merge(riasec_df,    on="programaId", how="left")
    .merge(aprendices_df, on="programaId", how="left")
)

# Relleno conservador de NaN
df["total_aspirantes"]           = df["total_aspirantes"].fillna(0)
df["aprendices_activos"]         = df["aprendices_activos"].fillna(0)
df["desertores"]                 = df["desertores"].fillna(0)
df["exitosos"]                   = df["exitosos"].fillna(0)
df["promedio_horas_inasistidas"] = df["promedio_horas_inasistidas"].fillna(0)
df["ranking_promedio"]           = df["ranking_promedio"].fillna(3.0)  # neutral
df["diversidad_barrios"]         = df["diversidad_barrios"].fillna(0)

for col in ["puntajeR","puntajeI","puntajeA","puntajeS","puntajeE","puntajeC"]:
    df[col] = df[col].fillna(0)


# ════════════════════════════════════════════════════════════════════
# 3. INGENIERÍA DE FEATURES (LÓGICA DE PESOS)
# ════════════════════════════════════════════════════════════════════

# ── 3a. RIASEC ──────────────────────────────────────────────────────
riasec_cols = ["puntajeR","puntajeI","puntajeA","puntajeS","puntajeE","puntajeC"]
df["riasec_suma"]     = df[riasec_cols].sum(axis=1).clip(lower=0.01)
df["riasec_max"]      = df[riasec_cols].max(axis=1)
df["riasec_afinidad"] = (df["riasec_max"] / df["riasec_suma"]).clip(0, 1)
df["riasec_amplitud"] = 1 - df["riasec_afinidad"]           # dispersión del perfil

# ── 3b. Tasas (penalización / potenciación) ─────────────────────────
n_apr = df["aprendices_activos"].clip(lower=1)
df["tasa_desercion"] = (df["desertores"]  / n_apr).clip(0, 1)  # ← PENALIZA
df["tasa_exito"]     = (df["exitosos"]    / n_apr).clip(0, 1)  # ← POTENCIA

# ── 3c. Normalización de aspirantes ────────────────────────────────
max_asp = df["total_aspirantes"].max() or 1
df["aspirantes_norm"] = (df["total_aspirantes"] / max_asp).clip(0, 1)

# ── 3d. Features de interacción (diseñados con lógica de pesos) ─────
#
#  demanda_neta = aspirantes × (1 − tasa_desercion)
#   → cuantos más desertores, menos atractivo el programa
#
#  score_riasec_demanda = aspirantes_norm × riasec_afinidad
#   → programas con perfil RIASEC definido y alta demanda = máximo potencial
#
#  penalizacion_desercion = tasa_desercion × aprendices_activos
#   → volumétrico: muchos desertores en programas grandes = penalización mayor
#
df["demanda_neta"]         = df["aspirantes_norm"] * (1 - df["tasa_desercion"])
df["score_riasec_demanda"] = df["aspirantes_norm"] * df["riasec_afinidad"]
df["penalizacion_desercion"] = df["tasa_desercion"] * (df["aprendices_activos"] / (df["aprendices_activos"].max() or 1))
df["tasa_retencion"] = 1 - df["tasa_desercion"]
df["score_viabilidad"] = (df["aspirantes_norm"] * 0.6) + (df["tasa_retencion"] * 0.4)

# ── 3e. Variable objetivo: score_oferta (0-100) ─────────────────────
#
#  Diseño con pesos explícitos actualizados con ranking:
#    30 pts → demanda aspirantes (potencia)
#    15 pts → afinidad RIASEC    (potencia)
#    20 pts → tasa de éxito      (potencia)
#   -10 pts → tasa de deserción  (penaliza)
#    45 pts → ranking promedio (potencia, basado en 5 estrellas -> ranking/5 * 45)
#
def calc_score_oferta(row):
    r = row["ranking_promedio"]
    r_score = (r / 5.0) * 45
    s = (
        row["aspirantes_norm"] * 30 +
        row["riasec_afinidad"] * 15 +
        row["tasa_exito"]      * 20 +
        (1 - row["tasa_desercion"]) * 10 +
        r_score
    )
    if r < 2.5:
        s -= 20
    return max(0, min(100, s))

df["score_oferta"] = df.apply(calc_score_oferta, axis=1).round(4)

print(f"\n[Train] Muestra del dataset enriquecido:")
print(df[["nombre_programa","total_aspirantes","tasa_desercion","tasa_exito","riasec_afinidad","score_oferta"]].to_string(index=False))


# ════════════════════════════════════════════════════════════════════
# 4. VALIDACIÓN: NECESITAMOS AL MENOS 5 FILAS
# ════════════════════════════════════════════════════════════════════
df_train = df.dropna(subset=["score_oferta"])
df_train = df_train[df_train["total_aspirantes"] > 0].reset_index(drop=True)

if len(df_train) < 3:
    print(f"\n[Train] ⚠️  Solo {len(df_train)} filas con datos válidos.")
    print("[Train] Necesitas al menos 3 filas con aspirantes para entrenar.")
    sys.exit(0)

X = df_train[FEATURES]
y = df_train["score_oferta"]

print(f"\n[Train] Dataset final: {len(X)} filas × {len(FEATURES)} features")


# ════════════════════════════════════════════════════════════════════
# 5. PIPELINE CIENTÍFICO (STACKING GBM + RF → RIDGE)
# ════════════════════════════════════════════════════════════════════
#
#  Nivel 0 (estimadores base):
#    - GradientBoostingRegressor  → captura relaciones no lineales complejas
#    - RandomForestRegressor      → robusto ante ruido y valores atípicos
#
#  Nivel 1 (meta-modelo):
#    - Ridge                      → combina linealmente las predicciones base
#
#  El Imputer + Scaler aseguran que el pipeline no rompa en producción
#  si llegan datos con NaN o escalas diferentes.
#

gbm = GradientBoostingRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=4,
    subsample=0.8,
    min_samples_leaf=2,
    random_state=SEED,
)

rf = RandomForestRegressor(
    n_estimators=400,
    max_depth=8,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=SEED,
    n_jobs=-1,
)

stacking = StackingRegressor(
    estimators=[("gbm", gbm), ("rf", rf)],
    final_estimator=Ridge(alpha=1.0),
    cv=3,
    n_jobs=-1,
)

pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler",  StandardScaler()),
    ("model",   stacking),
])

# ── Cross-validation ────────────────────────────────────────────────
n_splits = min(CV_K, len(X))   # evitar splits > n_samples
kf = KFold(n_splits=n_splits, shuffle=True, random_state=SEED)

print(f"\n[Train] Ejecutando {n_splits}-fold cross-validation...")
cv_mae  = -cross_val_score(pipeline, X, y, scoring="neg_mean_absolute_error",  cv=kf, n_jobs=-1)
cv_rmse = np.sqrt(-cross_val_score(pipeline, X, y, scoring="neg_mean_squared_error", cv=kf, n_jobs=-1))
cv_r2   = cross_val_score(pipeline, X, y, scoring="r2", cv=kf, n_jobs=-1)

print(f"  MAE  CV media  : {cv_mae.mean():.4f}  ± {cv_mae.std():.4f}")
print(f"  RMSE CV media  : {cv_rmse.mean():.4f}  ± {cv_rmse.std():.4f}")
print(f"  R²   CV media  : {cv_r2.mean():.4f}  ± {cv_r2.std():.4f}")

# ── Entrenamiento final sobre TODO el dataset ───────────────────────
print("\n[Train] Entrenando modelo final sobre dataset completo...")
pipeline.fit(X, y)

# ── Métricas en conjunto completo (optimismo esperado) ──────────────
y_pred   = pipeline.predict(X)
mae_full  = mean_absolute_error(y, y_pred)
rmse_full = np.sqrt(mean_squared_error(y, y_pred))
r2_full   = r2_score(y, y_pred)

print(f"  MAE  (full set): {mae_full:.4f}")
print(f"  RMSE (full set): {rmse_full:.4f}")
print(f"  R²   (full set): {r2_full:.4f}")


# ════════════════════════════════════════════════════════════════════
# 6. GUARDAR MODELO + METADATA
# 7. CSV DE AUDITORÍA (MAE/RMSE + VOLUMEN + PREDICCIONES)
# ════════════════════════════════════════════════════════════════════
try:
    joblib.dump(pipeline, PKL_PATH, compress=3)
    logger.info("Modelo pkl guardado → %s", PKL_PATH)

    meta = {
        "features": FEATURES,
        "version": "3.0",
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "n_samples": int(len(X)),
        "cv_mae_mean": float(cv_mae.mean()),
        "cv_rmse_mean": float(cv_rmse.mean()),
        "cv_r2_mean": float(cv_r2.mean()),
        "target": "score_oferta",
    }
    joblib.dump(meta, META_PATH)
    logger.info("Metadata guardada → %s", META_PATH)

    audit_df = df_train[["programaId","nombre_programa","nivel",
                          "total_aspirantes","aprendices_activos",
                          "tasa_desercion","tasa_exito",
                          "riasec_afinidad","score_oferta"]].copy()

    audit_df["prediccion_modelo"] = y_pred.round(4)
    audit_df["residual"]          = (y - y_pred).round(4)
    audit_df["abs_residual"]      = audit_df["residual"].abs().round(4)

    resumen_row = pd.DataFrame([{
        "programaId": "RESUMEN",
        "nombre_programa": "—",
        "nivel": "—",
        "total_aspirantes": int(len(X)),
        "aprendices_activos": int(df_train["aprendices_activos"].sum()),
        "tasa_desercion": round(float(df_train["tasa_desercion"].mean()), 4),
        "tasa_exito": round(float(df_train["tasa_exito"].mean()), 4),
        "riasec_afinidad": round(float(df_train["riasec_afinidad"].mean()), 4),
        "score_oferta": "—",
        "prediccion_modelo": f"MAE={mae_full:.4f} | RMSE={rmse_full:.4f} | R²={r2_full:.4f}",
        "residual": "—",
        "abs_residual": f"CV_MAE={cv_mae.mean():.4f} | CV_RMSE={cv_rmse.mean():.4f} | CV_R²={cv_r2.mean():.4f}",
    }])

    audit_final = pd.concat([audit_df, resumen_row], ignore_index=True)
    audit_final.insert(0, "fecha_entrenamiento", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"))
    audit_final.to_csv(AUDIT_PATH, index=False, encoding="utf-8-sig")
    logger.info("Auditoría CSV guardada → %s", AUDIT_PATH)
except Exception as exc:
    import traceback
    error_log_path = os.path.join(os.path.dirname(__file__), "error.log")
    with open(error_log_path, "w", encoding="utf-8") as f:
        f.write(traceback.format_exc())
    logger.exception("Error guardando modelo/auditoría; detalle en %s", error_log_path)
    sys.exit(1)


# ════════════════════════════════════════════════════════════════════
# 8. IMPORTANCIA DE FEATURES (opcional — requiere modelo interno)
# ════════════════════════════════════════════════════════════════════
try:
    rf_inner = pipeline.named_steps["model"].estimators_[1][1]  # RandomForest dentro del stacking
    importancias = pd.Series(
        rf_inner.feature_importances_,
        index=FEATURES
    ).sort_values(ascending=False)
    print("\n[Train] Top 10 features más importantes (RandomForest interno):")
    print(importancias.head(10).to_string())
    importancias.to_csv(os.path.join(MODEL_DIR, "feature_importance.csv"), header=["importancia"], index_label="feature")
    logger.info("Feature importance guardado → %s", os.path.join(MODEL_DIR, "feature_importance.csv"))
except Exception as e:
    logger.debug("Feature importance no guardado (opcional): %s", e)


# ════════════════════════════════════════════════════════════════════
# 9. RESUMEN FINAL
# ════════════════════════════════════════════════════════════════════
print(f"""
╔══════════════════════════════════════════════════╗
║      ENTRENAMIENTO COMPLETADO — AVI v3.0         ║
╠══════════════════════════════════════════════════╣
║  Muestras entrenadas  : {len(X):<24}║
║  Features             : {len(FEATURES):<24}║
║  MAE  (CV)            : {cv_mae.mean():<24.4f}║
║  RMSE (CV)            : {cv_rmse.mean():<24.4f}║
║  R²   (CV)            : {cv_r2.mean():<24.4f}║
╠══════════════════════════════════════════════════╣
║  PKL  → model/modelo_demanda.pkl                 ║
║  Meta → model/model_meta.pkl                     ║
║  CSV  → model/auditoria_entrenamiento.csv         ║
╚══════════════════════════════════════════════════╝
""")


# ════════════════════════════════════════════════════════════════════
# 10. ENVÍO AL STREAMING DATASET DE POWER BI
#     Se ejecuta automáticamente tras guardar el modelo.
#     Si POWERBI_PUSH_URL no está configurada se omite sin error.
# ════════════════════════════════════════════════════════════════════
try:
    from powerbi_sender import send_to_powerbi  # noqa: E402

    trimestre_actual: str
    q_actual = (datetime.utcnow().month - 1) // 3 + 2
    yr_actual = datetime.utcnow().year
    if q_actual > 4:
        q_actual, yr_actual = 1, yr_actual + 1
    trimestre_actual = f"{yr_actual}-Q{q_actual}"
    fecha_prediccion_now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # Construir lista de eventos con el esquema exacto de Power BI
    eventos_powerbi: list[dict] = []
    for _, fila in audit_df.iterrows():
        # Determinar recomendación a partir de prediccion_modelo
        score_val = float(fila["prediccion_modelo"])
        td = float(fila["tasa_desercion"])
        asp_n = float(fila["total_aspirantes"]) / max(float(df_train["total_aspirantes"].max()), 1)

        if score_val < 35 or td > 0.70:
            rec = "Suspender"
        elif score_val >= 90 and asp_n >= 0.80 and td < 0.35:
            rec = "Aumentar"
        else:
            rec = "Mantener"

        if score_val >= 85:
            tend = "Alta"
        elif score_val >= 70:
            tend = "Media-Alta"
        elif score_val >= 50:
            tend = "Media"
        elif score_val >= 30:
            tend = "Baja"
        else:
            tend = "Crítica"

        eventos_powerbi.append({
            "programa":             str(fila["nombre_programa"]),
            "demanda_proyectada":   round(score_val, 4),
            "tendencia":            tend,
            "fecha_prediccion":     fecha_prediccion_now,
            "trimestre_estimado":   trimestre_actual,
            "recomendacion_oferta": rec,
        })

    if eventos_powerbi:
        logger.info("[PowerBI] Enviando %d predicciones de entrenamiento a Power BI...", len(eventos_powerbi))
        resultado_powerbi = send_to_powerbi(eventos_powerbi)
        logger.info("[PowerBI] Resultado: %s", json.dumps(resultado_powerbi, ensure_ascii=False))
        if resultado_powerbi.get("estado") == "ok":
            print(f"\n✅ [PowerBI] {resultado_powerbi['enviados']} predicciones enviadas al Streaming Dataset.")
        elif resultado_powerbi.get("estado") == "skip":
            print("\n⚠️  [PowerBI] Envío omitido — POWERBI_PUSH_URL no configurada en .env")
        else:
            print(f"\n⚠️  [PowerBI] Error al enviar: {resultado_powerbi}")
    else:
        logger.warning("[PowerBI] No hay eventos para enviar (audit_df vacío).")

except Exception as exc_powerbi:
    logger.warning("[PowerBI] Error no crítico al enviar a Power BI: %s — el modelo ya está guardado.", exc_powerbi)