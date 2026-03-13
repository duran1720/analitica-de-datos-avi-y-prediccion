import joblib
import pandas as pd

model = joblib.load("model/modelo_demanda.pkl")
explainer = joblib.load("model/explainer.pkl")

def predict_demanda(data):

    df = pd.DataFrame([data])

    pred = model.predict(df)[0]

    shap_values = explainer.shap_values(df)

    impacto = dict(zip(df.columns, shap_values[0]))

    return {
        "demanda_predicha": float(pred),
        "explicacion": impacto
    }