"""
powerbi_sender.py — Envio de predicciones al Streaming Dataset de Power BI Service.

Esquema del evento (requerido por el dataset):
    programa             : str
    demanda_proyectada   : float  (rango 0.00 - 100.00)
    tendencia            : str    ("Critica" | "Baja" | "Media" | "Media-Alta" | "Alta")
    fecha_prediccion     : str    (ISO-8601 UTC, ej. "2026-03-19T18:30:00Z")
    trimestre_estimado   : str    (ej. "2026-Q2")
    recomendacion_oferta : str    ("Aumentar" | "Mantener" | "Suspender")

La Push API de Power BI espera el body como lista de objetos JSON: [{...}].
"""
import json
import logging
import os
from datetime import datetime, timezone

import requests

logger = logging.getLogger("avi-powerbi")

POWERBI_PUSH_URL = os.getenv(
    "POWERBI_PUSH_URL",
    "https://api.powerbi.com/beta/cbc2c381-2f2e-4d93-91d1-506c9316ace7/datasets/"
    "efd586e0-13b1-4dc7-b6a6-245786ebe580/rows?experience=power-bi&clientSideAuth=0"
    "&key=1SvAKv6v1Q7Aj87zlUg%2Biv0B4BWOZq6%2FwArKF0%2F3onXVbD%2FwJH5pfAQYgBPlhmNY"
    "NMB2%2F9kzUmO06Ik2Xi7paw%3D%3D",
)

_REQUEST_TIMEOUT = 15


def _mapear_evento(evento: dict) -> dict:
    """Normaliza un evento al esquema exacto esperado por el Streaming Dataset."""
    raw_demanda = evento.get("demanda_proyectada", 0.0)
    return {
        "programa":             evento.get("programa", "Desconocido"),
        "demanda_proyectada":   round(max(0.0, min(100.0, float(raw_demanda))), 2),
        "tendencia":            evento.get("tendencia", "Media"),
        "fecha_prediccion":     evento.get("fecha_prediccion") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "trimestre_estimado":   evento.get("trimestre_estimado", ""),
        "recomendacion_oferta": evento.get("recomendacion_oferta", "Mantener"),
    }


def send_to_powerbi(eventos: list[dict]) -> dict:
    """
    Envia una lista de predicciones al Streaming Dataset de Power BI.
    Retorna: { enviados: int, errores: list, estado: str, http_status?: int }
    """
    if not eventos:
        return {"enviados": 0, "errores": [], "estado": "sin_datos", "mensaje": "Sin eventos para enviar"}

    push_url = os.getenv("POWERBI_PUSH_URL", POWERBI_PUSH_URL).strip()

    if not push_url:
        logger.warning("POWERBI_PUSH_URL no configurada — envio omitido.")
        return {"enviados": 0, "errores": ["POWERBI_PUSH_URL no configurada"], "estado": "skip"}

    payload = [_mapear_evento(evt) for evt in eventos]

    try:
        logger.info("Enviando %d eventos al Streaming Dataset de Power BI...", len(payload))
        response = requests.post(
            push_url,
            data=json.dumps(payload, ensure_ascii=False),
            headers={"Content-Type": "application/json"},
            timeout=_REQUEST_TIMEOUT,
        )

        if response.status_code == 200:
            logger.info("%d eventos enviados. HTTP %s", len(payload), response.status_code)
            return {"enviados": len(payload), "errores": [], "estado": "ok", "http_status": response.status_code}

        error_msg = f"HTTP {response.status_code}: {response.text[:300]}"
        logger.error("Power BI rechazo el envio: %s", error_msg)
        return {"enviados": 0, "errores": [error_msg], "estado": "error", "http_status": response.status_code}

    except requests.exceptions.Timeout:
        msg = f"Timeout al conectar con Power BI ({_REQUEST_TIMEOUT}s)"
        logger.error(msg)
        return {"enviados": 0, "errores": [msg], "estado": "error"}

    except requests.exceptions.ConnectionError as exc:
        msg = f"Error de conexion con Power BI: {exc}"
        logger.error(msg)
        return {"enviados": 0, "errores": [msg], "estado": "error"}

    except Exception as exc:
        msg = f"Error inesperado: {exc}"
        logger.error(msg)
        return {"enviados": 0, "errores": [msg], "estado": "error"}
