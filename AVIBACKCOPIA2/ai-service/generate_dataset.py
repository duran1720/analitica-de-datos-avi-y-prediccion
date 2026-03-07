import pandas as pd
import random
import os

# asegurar que exista la carpeta dataset
os.makedirs("dataset", exist_ok=True)

data = []

programas = [
"ACTIVIDAD FISICA",
"ELECTRICIDAD INDUSTRIAL",
"ANIMACION 3D",
"GESTION DE REDES DE DATOS",
"ANIMACION DIGITAL",
"ANALISIS Y DESARROLLO DE SOFTWARE",
"AUTOMATIZACIÓN DE SISTEMAS MECATRÓNICOS",
"SISTEMAS",
"PROGRAMACIÓN DE SOFTWARE",
"MANTENIMIENTO DE MOTORES DIESEL",
"CONSTRUCCIÓN DE EDIFICACIONES",
"DESARROLLO DE SISTEMAS ELECTRÓNICOS INDUSTRIALES",
"CONTROL AMBIENTAL",
"GESTIÓN EMPRESARIAL",
"MANTENIMIENTO MECATRÓNICO DE AUTOMOTORES",
"ADMINISTRACIÓN DE SISTEMAS DE INFORMACIÓN",
"PRODUCCIÓN MULTIMEDIA",
"MANTENIMIENTO DE EQUIPOS DE CÓMPUTO",
"MECÁNICA DE MAQUINARIA INDUSTRIAL",
"CONSTRUCCIÓN Y MONTAJE DE INSTALACIONES ELÉCTRICAS",
"ELABORACIÓN DE AUDIOVISUALES",
"GESTIÓN Y SEGURIDAD DE BASES DE DATOS",
"CONFECCIONES Y PRODUCCIÓN TEXTIL",
"MARROQUINERÍA Y PROCESOS DEL CUERO",
"JOYERÍA Y ORFEBRERÍA"
]

# crear un ID para cada programa
mapa_programas = {nombre: i+1 for i, nombre in enumerate(programas)}

for i in range(10000):

    programa = random.choice(programas)
    programaId = mapa_programas[programa]

    horas_inasistidas = random.randint(0, 200)

    # simulación de deserción
    if horas_inasistidas > 120:
        estado = 0
    else:
        estado = 1

    data.append({
        "programaId": programaId,
        "horas_inasistidas": horas_inasistidas,
        "estado": estado
    })

df = pd.DataFrame(data)

df.to_csv("dataset/aprendices.csv", index=False)

print("Dataset generado correctamente")
print("Total registros:", len(df))