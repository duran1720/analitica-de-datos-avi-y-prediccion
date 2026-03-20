"""
main.py — FastAPI AVI AI Service v3.0

Endpoints:
  GET  /health              : Health check + metadatos del modelo cargado.
  POST /predict-demanda     : Prediccion simple (compatibilidad legacy con AdminController).
  POST /predict-incremental : Prediccion incremental cientifica con envio a Power BI.
"""
import logging
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("avi-ai")

from predict import predict_incremental, predict_demanda_simple, _meta as MODEL_META
from powerbi_sender import send_to_powerbi

app = FastAPI(
    title="AVI AI Service",
    description="Pipeline Cientifico (GBM + RF Stacking) + Power BI Streaming Dataset",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    logger.info("AVI AI Service v3.0 iniciado. Modelo cargado: %s", MODEL_META is not None)


# ── Modelos Pydantic ──────────────────────────────────────────────────────────

class ProgramaInput(BaseModel):
    programaId:                 int
    nombre_programa:            str
    puntajeR:                   float = 0.0
    puntajeI:                   float = 0.0
    puntajeA:                   float = 0.0
    puntajeS:                   float = 0.0
    puntajeE:                   float = 0.0
    puntajeC:                   float = 0.0
    ranking_promedio:           float = 0.0
    diversidad_barrios:         int   = 0
    institucion_principal:      str   = ""
    total_aspirantes:           int   = 0
    aprendices_activos:         int   = 0
    tasa_desercion:             float = 0.0
    tasa_exito:                 float = 0.5
    promedio_horas_inasistidas: float = 0.0


class IncrementalRequest(BaseModel):
    programas:          list[ProgramaInput]
    enviar_a_powerbi:   Optional[bool]  = True
    max_aspirantes_ref: Optional[float] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check y metadatos del modelo en memoria."""
    meta_info = {}
    if MODEL_META:
        meta_info = {
            "version":    MODEL_META.get("version", "?"),
            "trained_at": MODEL_META.get("trained_at", "?"),
            "n_samples":  MODEL_META.get("n_samples", "?"),
            "cv_mae":     round(MODEL_META.get("cv_mae_mean", 0), 4),
            "cv_rmse":    round(MODEL_META.get("cv_rmse_mean", 0), 4),
            "cv_r2":      round(MODEL_META.get("cv_r2_mean", 0), 4),
        }
    return {
        "status":         "ok",
        "service":        "AVI AI Service v3.0",
        "modelo_cargado": MODEL_META is not None,
        "modelo_info":    meta_info,
    }


@app.post("/predict-demanda")
def predict_demanda_legacy(data: dict):
    """Compatibilidad legacy con AdminController. No modificar firma."""
    try:
        return predict_demanda_simple(data)
    except Exception:
        logger.exception("Error en predict-demanda")
        raise HTTPException(status_code=500, detail="Error en prediccion de demanda")


@app.post("/predict-incremental")
def predict_incremental_endpoint(request: IncrementalRequest):
    """
    Prediccion incremental con deduplicacion garantizada.
    Node.js filtra previamente los programas sin prediccion reciente (<12h),
    este endpoint solo procesa los que requieren actualizacion.
    """
    try:
        if not request.programas:
            return {
                "procesados": 0,
                "omitidos":   0,
                "mensaje":    "Sin programas para procesar en este ciclo incremental",
                "resultados": [],
                "powerbi":    None,
            }

        # Referencia de normalizacion: valor del cliente > n_samples del modelo > max del batch
        max_asp = request.max_aspirantes_ref
        if max_asp is None:
            if MODEL_META and MODEL_META.get("n_samples"):
                max_asp = float(MODEL_META["n_samples"])
            else:
                max_asp = max((p.total_aspirantes for p in request.programas), default=50) or 50

        resultados, errores = [], []

        for prog in request.programas:
            try:
                datos = {
                    "programaId":              prog.programaId,
                    "nombre_programa":         prog.nombre_programa,
                    "puntajeR":                prog.puntajeR,
                    "puntajeI":                prog.puntajeI,
                    "puntajeA":                prog.puntajeA,
                    "puntajeS":                prog.puntajeS,
                    "puntajeE":                prog.puntajeE,
                    "puntajeC":                prog.puntajeC,
                    "ranking_promedio":        prog.ranking_promedio,
                    "diversidad_barrios":      prog.diversidad_barrios,
                    "total_aspirantes":        prog.total_aspirantes,
                    "aprendices_activos":      prog.aprendices_activos,
                    "tasa_desercion":          prog.tasa_desercion,
                    "tasa_exito":              prog.tasa_exito,
                    "promedio_horas_inasistidas": prog.promedio_horas_inasistidas,
                }
                resultados.append(predict_incremental(datos, max_asp=float(max_asp)))
            except Exception as exc:
                logger.warning("predict-incremental programa %s: %s", prog.programaId, exc)
                errores.append({"programaId": prog.programaId, "error": str(exc)})

        powerbi_result = None
        if request.enviar_a_powerbi and resultados:
            eventos = [
                {
                    "programa":             r["nombre_programa"],
                    "demanda_proyectada":   round(max(0.0, min(100.0, r["demanda_predicha"])), 2),
                    "tendencia":            r["tendencia"],
                    "fecha_prediccion":     r.get("fecha_prediccion", ""),
                    "trimestre_estimado":   r["trimestre_objetivo"],
                    "recomendacion_oferta": r["accion_sugerida"],
                }
                for r in resultados
            ]
            powerbi_result = send_to_powerbi(eventos)

        return {
            "procesados": len(resultados),
            "omitidos":   len(errores),
            "mensaje":    f"{len(resultados)} programas procesados correctamente",
            "resultados": resultados,
            "errores":    errores,
            "powerbi":    powerbi_result,
        }

    except Exception:
        logger.exception("Error en predict-incremental")
        raise HTTPException(status_code=500, detail="Error en prediccion incremental")