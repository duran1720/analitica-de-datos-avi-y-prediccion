import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import "./MisReportes.css"

function MisReportes() {

  const API = import.meta.env.VITE_API_REPORTES;
  const { token } = useAuth();

  const [reportes, setReportes] = useState([]);

useEffect(() => {
  if (token) {
    traer();
  }
}, [token]);


async function traer() {

  try {

    const respuesta = await fetch(
      `${API}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      }
    );

    const res = await respuesta.json();
    console.log(res);

    setReportes(res);

  } catch (error) {
    console.error(error);
  }
}

  return (

  <div className="reportes-container">
    <h2 className="titulo">Mis Reportes</h2>

    {reportes.map((reporte) => (
      <div key={reporte.idREPORTE} className="reporte-card">

        <p className="fecha">
             {new Date(reporte.Fecha).toLocaleDateString()}
        </p>

          <h4 className="seccion-titulo">Puntajes RIASEC</h4>
            <div className="puntajes-grid">
                <div className="puntaje-box">R: {reporte.puntajeR}</div>
                <div className="puntaje-box">I: {reporte.puntajeI}</div>
                <div className="puntaje-box">A: {reporte.puntajeA}</div>
                <div className="puntaje-box">S: {reporte.puntajeS}</div>
                <div className="puntaje-box">E: {reporte.puntajeE}</div>
                <div className="puntaje-box">C: {reporte.puntajeC}</div>
            </div>

          <h4 className="seccion-titulo">Recomendaciones</h4>

          {reporte.recomendaciones.map((rec) => (
            <div key={rec.idRECOMENDACION} className="recomendacion-card">
            <p><strong>{rec.nombre}</strong></p>
              <p>{rec.descripcion}</p>
            </div>
          ))}

        </div>
      ))}

    </div>
  );
}

export default MisReportes;