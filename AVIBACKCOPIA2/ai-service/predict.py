import joblib
import pandas as pd

model = joblib.load("model/modelo_desercion.pkl")

def predict_desercion(programaId, horas):

    data = pd.DataFrame([{
        "programaId": programaId,
        "horas_inasistidas": horas
    }])

    pred = model.predict(data)[0]

    if pred == 0:
        return "ALTO RIESGO DE DESERCIÓN"
    else:
        return "RIESGO BAJO"