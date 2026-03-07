from fastapi import FastAPI
from predict import predict_desercion

app = FastAPI()

@app.post("/predict")
def predict(data: dict):

    resultado = predict_desercion(
        data["programaId"],
        data["horas_inasistidas"]
    )

    return {
        "resultado": resultado
    }