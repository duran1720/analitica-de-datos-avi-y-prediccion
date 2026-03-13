from fastapi import FastAPI
from predict import predict_demanda

app = FastAPI()

@app.post("/predict-demanda")
def predict(data: dict):

    resultado = predict_demanda(data)

    return resultado