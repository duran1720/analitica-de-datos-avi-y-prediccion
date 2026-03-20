# AVI AI Service — Servicio de Prediccion de Demanda

Pipeline cientifico de prediccion de demanda formativa (GBM + RF Stacking)
con envio automatico al Streaming Dataset de Power BI Service.

---

## Requisitos

- Python 3.10+
- Entorno virtual (`venv`)
- Dependencias listadas en `requirements.txt`

---

## Configuracion inicial

### 1. Crear y activar el entorno virtual

**Windows (PowerShell)**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux / macOS**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```
DATABASE_URL=mysql+pymysql://usuario:password@localhost:3306/AVI
POWERBI_PUSH_URL=<push_url_del_streaming_dataset>
```

El archivo `.env` debe ubicarse en la raiz del proyecto (`AVIBACKCOPIA2/.env`).
`powerbi_sender.py` incluye la URL de produccion como fallback; configurar la
variable de entorno para sobreescribirla sin modificar codigo.

---

## Entrenar el modelo

Ejecutar una vez antes de levantar el servidor, o cada vez que los datos cambien:

```bash
python train_model.py
```

Genera los artefactos en `model/`:
- `modelo_demanda.pkl` — pipeline productivo (StackingRegressor)
- `model_meta.pkl`     — metadatos (columnas, version, metricas CV)
- `auditoria_entrenamiento.csv` — registro de cada entrenamiento

---

## Levantar el servidor

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Documentacion interactiva disponible en: `http://localhost:8000/docs`

---

## Endpoints

| Metodo | Ruta                   | Descripcion                                      |
|--------|------------------------|--------------------------------------------------|
| GET    | `/health`              | Estado del servicio y metadatos del modelo       |
| POST   | `/predict-demanda`     | Prediccion simple (compatibilidad legacy)        |
| POST   | `/predict-incremental` | Prediccion incremental + envio a Power BI        |

---

## Estructura del modulo

```
ai-service/
  main.py              # FastAPI: definicion de endpoints y modelos Pydantic
  predict.py           # Motor de prediccion: pipeline pkl + heuristica de respaldo
  powerbi_sender.py    # Cliente HTTP para la Push API de Power BI
  train_model.py       # Pipeline de entrenamiento cientifico (GBM + RF Stacking)
  test_powerbi_connection.py  # Script de prueba de conectividad con Power BI
  model/               # Artefactos generados por train_model.py (no versionar)
```

---

## Notas para el revisor

- Si `model/modelo_demanda.pkl` no existe, el servicio utiliza automaticamente
  la heuristica de respaldo. El endpoint `/health` informa el estado del modelo.
- El campo `fuente_modelo` en cada prediccion indica si se uso el pipeline pkl
  (`stacking_gbm_rf`) o la heuristica (`heuristica` / `safe_default_sin_datos`).
- La deduplicacion incremental (ventana de 12h por programa) se gestiona en
  `AVIBACKCOPIA2/services/FabricService.js`; este servicio Python recibe
  unicamente los programas que requieren actualizacion.
