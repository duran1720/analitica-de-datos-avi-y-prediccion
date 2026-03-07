import { useEffect, useState } from "react";
import "./AprendicesIA.css";

function AprendicesIA() {

  const API = import.meta.env.VITE_API_RIESGO_PROGRAMAS;

  const [programas, setProgramas] = useState([]);

  const obtenerRiesgo = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setProgramas(data.programas);
    } catch (error) {
      console.error("Error obteniendo predicciones", error);
    }
  };

  useEffect(() => {
    obtenerRiesgo();
  }, []);

  return (
    <div className="ia-container">

      <div className="ia-header">
        <h2> Análisis de Deserción (IA)</h2>
      </div>

      <div className="ia-list">

        {programas.map((programa, index) => (

          <div key={index} className="ia-card">

            <div className="ia-avatar">
              {programa.programa.charAt(0)}
            </div>

            <div className="ia-info">
              <h3>{programa.programa}</h3>

              <p>
                👨‍🎓 Total aprendices: {programa.total_aprendices}
              </p>

              <p>
                ⚠️ Riesgo alto detectado: {programa.riesgo_alto}
              </p>

              <div className="ia-tags">

                <span className="tag total">
                  {programa.total_aprendices} aprendices
                </span>

                <span className="tag riesgo">
                  {programa.riesgo_alto} riesgo alto
                </span>

              </div>
            </div>

          </div>

        ))}

      </div>
    </div>
  );
}

export default AprendicesIA;