import pandas as pd
import joblib
import shap

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

df = pd.read_csv("dataset/demanda_programas.csv")

X = df[
[
"programaId",
"puntajeR",
"puntajeI",
"puntajeA",
"puntajeS",
"puntajeE",
"puntajeC",
"aprendices_actuales"
]
]

y = df["demanda"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=300,
    random_state=42
)

model.fit(X_train, y_train)

score = model.score(X_test, y_test)

print("R2 Score:", score)

joblib.dump(model, "model/modelo_demanda.pkl")

explainer = shap.TreeExplainer(model)

joblib.dump(explainer, "model/explainer.pkl")

print("Modelo entrenado y guardado")