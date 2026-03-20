"""
test_powerbi_connection.py
Script de prueba rápida para verificar el envío al Streaming Dataset de Power BI.

Uso:
    python test_powerbi_connection.py

Envía 1 evento sintético con el esquema canónico de Power BI y reporta el resultado.
No necesita que el servidor FastAPI esté corriendo.
"""
import os
import sys
from datetime import datetime, timezone

# Cargar .env del directorio padre (AVIBACKCOPIA2/.env) por si hay override de la URL
from dotenv import load_dotenv
_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(_env_path)

from powerbi_sender import send_to_powerbi, POWERBI_PUSH_URL  # noqa: E402

print("\n=== Test de conexión: Power BI Streaming Dataset ===")
push_url = os.getenv("POWERBI_PUSH_URL", POWERBI_PUSH_URL).strip()
url_preview = push_url[:60] + "..." if len(push_url) > 60 else push_url
print(f"  Push URL : {url_preview}")

# Evento de prueba con el esquema canónico de Power BI
evento_prueba = {
    "programa":             "PRUEBA DE CONEXION — AVI",
    "demanda_proyectada":   72.5,
    "tendencia":            "Media-Alta",
    "fecha_prediccion":     datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "trimestre_estimado":   "2026-Q2",
    "recomendacion_oferta": "Mantener",
}

print(f"\n  Enviando evento de prueba a Power BI Streaming Dataset...")
print(f"  Payload : {evento_prueba}")

resultado = send_to_powerbi([evento_prueba])

print()
if resultado.get("estado") == "ok" and resultado.get("enviados", 0) > 0:
    print("OK  Evento enviado correctamente al Streaming Dataset de Power BI.")
    print(f"    Enviados    : {resultado['enviados']}")
    print(f"    HTTP Status : {resultado.get('http_status', 'N/A')}")
    print("\n  Abre Power BI Service -> tu dataset -> 'Ver datos de streaming' para ver el evento.")
elif resultado.get("estado") == "sin_datos":
    print("SKIP: Sin eventos para enviar.")
elif resultado.get("estado") == "skip":
    print("SKIP: POWERBI_PUSH_URL vacia o no configurada.")
else:
    print("ERROR al enviar al Streaming Dataset:")
    for err in resultado.get("errores", []):
        print(f"    • {err}")
    sys.exit(1)
