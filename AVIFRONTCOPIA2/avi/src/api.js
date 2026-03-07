const API_URL = "http://127.0.0.1:8000";

export async function iniciarDialogo() {
  const res = await fetch(`${API_URL}/dialogo/iniciar`);
  return await res.json();
}

export async function enviarRespuesta(respuesta) {
  const res = await fetch(`${API_URL}/dialogo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respuesta }),
  });

  return await res.json();
}