import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";


function BienvenidaTest() {

  const NOMBREASPIRANTE_API = import.meta.env.NOMBREASPIRANTE_API

  const navigate = useNavigate();

  const {token} = useAuth();
    const {nombre} = useAuth();


  function iniciartest() {
    navigate("/pretest");
  }

  useEffect(() => {
        traer()
    }, [])

    async function traer(){
        const respuesta = await fetch(`${NOMBREASPIRANTE_API}`,{
            method: 'GET',
            headers:{
                Authorization: "bearer" + token
            }
        })
        const res = await respuesta.json();
        console.log(res);
    }

  return (
    <div>
      <section className="welcome-section">
        <div className="container">
          <div className="welcome-content">
            <h1 className="welcome-title">¡Bienvenido al Test Vocacional!</h1>

            <div className="user-info">
              <p>Hola, {nombre}</p>
            </div>

            <div className="test-info">
              <h2>Sobre el Test Vocacional </h2>
              <div className="info-cards">
                <div className="info-card-small">
                  <div className="card-icon">⏱️</div>
                  <h3>Duración</h3>
                  <p>Aproximadamente 15-20 minutos</p>
                </div>
                <div className="info-card-small">
                  <div className="card-icon">❓</div>
                  <h3>Preguntas</h3>
                  <p>30 preguntas sobre tus intereses y habilidades</p>
                </div>
                <div className="info-card-small">
                  <div className="card-icon">🎯</div>
                  <h3>Resultado</h3>
                  <p>Recomendaciones personalizadas de programas SENA</p>
                </div>
              </div>
            </div>

            <div className="instructions">
              <h3>Instrucciones:</h3>
              <ul>
                <li>Lee cada pregunta carefully</li>
                <li>Responde de manera honesta según tus preferencias</li>
                <li>No hay respuestas correctas o incorrectas</li>
                <li>Puedes tomarte el tiempo que necesites</li>
                <li>Al finalizar, recibirás un reporte detallado</li>
              </ul>
            </div>

            <div className="test-actions">
              <button type="button" className="start-test-button" onClick={iniciartest}>
                🚀 Iniciar Test Vocacional
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BienvenidaTest;
