#!/usr/bin/env python3
"""
Arranque en producción del servicio FastAPI con Uvicorn.
Uso: python run_server.py
  o:  uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
"""
import os
import uvicorn

if __name__ == "__main__":
    host = os.getenv("UVICORN_HOST", "0.0.0.0")
    port = int(os.getenv("UVICORN_PORT", "8000"))
    workers = int(os.getenv("UVICORN_WORKERS", "1"))  # 1 evita condiciones de carrera con el modelo en memoria
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        log_level="info",
    )
