import { useLocation, useNavigate } from "react-router-dom";
import "./Resultado.css"
import "./Mapa.css";

import { useEffect, useState } from "react";
import Avatar3D from "./components/Avatar3D";

function Resultado() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [speaking, setSpeaking] = useState(false);
  const [emotion, setEmotion] = useState("neutral");

  const results = location.state?.result;


useEffect(() => {
  if (!results) return;

  if (recommendedPrograms.length === 0) return;

  const nombres = recommendedPrograms
    .slice(0, 3)
    .map(p => p.name);

  let listaProgramas = "";

  if (nombres.length === 1) {
    listaProgramas = nombres[0];
  } else if (nombres.length === 2) {
    listaProgramas = `${nombres[0]} y ${nombres[1]}`;
  } else {
    listaProgramas = `${nombres[0]}, ${nombres[1]} y ${nombres[2]}`;
  }

  const texto = `
  Revisé tus respuestas y encontré tres programas ideales para ti.
  Te recomiendo especialmente ${listaProgramas}.
  Puedes tocar cada uno para conocer más detalles.
  `;

  speak(texto);

}, [results]);



  console.log("RESULTS EN RESULTADO:", results);

  if (!results) {
    return <p>No se encontraron resultados.</p>;
  }

  const recommendedPrograms =
  results?.resultadoIA?.recommendations || [];

  const descargarApp = () => {
    window.location.href = "https://play.google.com/store";
  };

  function verprogramas() {
    navigate("/programas");
  }

  function irtest() {
    navigate("/bienvenidatest");
  }



  const speak = (text) => {
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-ES";
  utter.pitch = 1.1;
  utter.rate = 1;

  const voices = window.speechSynthesis.getVoices();

  const femaleVoice =
    voices.find(v =>
      v.lang.startsWith("es") &&
      (
        v.name.includes("Maria") ||
        v.name.includes("Helena") ||
        v.name.includes("Sabina") ||
        v.name.toLowerCase().includes("female")
      )
    ) ||
    voices.find(v => v.lang.startsWith("es"));

  if (femaleVoice) utter.voice = femaleVoice;

  utter.onstart = () => {
    setSpeaking(true);
    setEmotion("happy");
  };

  utter.onend = () => {
    setSpeaking(false);
    setEmotion("neutral");
  };

  window.speechSynthesis.speak(utter);
};




const handleProgramOpen = (program) => {
  const texto = `
  ${program.name} es una excelente opción para ti.
  ${program.reason}.
  Puedes conocer más información sobre ${program.name} en nuestra aplicación móvil.
  `;

  speak(texto);
};





  return (
    <div className="resultado-container">
      <div className="resultado-card">
        {/* Avatar dentro de la card */}

        

        {/* Titulo centrado */}
        <h1 className="resultado-title">Resultados del Test Vocacional</h1>
        <p className="resultado-subtitle">
          Estos son los programas de formación recomendados para ti
        </p>


         <div className="avatar-wrapper">
            <div className="avatar-circle">
                <Avatar3D emotion={emotion} speaking={speaking} compact={true}/>
            </div>
        </div>

        <hr className="resultado-divider" />

        {/* Tarjetas desplegables */}
        <div className="programs-pane">
          {recommendedPrograms.map((program, index) => (
            <details
              key={index}
              className="program-card"
              onToggle={(e) => {
                if (e.target.open) {
                  handleProgramOpen(program);
                }
              }}
            >
              <summary className="program-summary">
                <span className="program-number">{index + 1}</span>
                <span className="program-summary-text">{program.name}</span>
                <span className="program-arrow">▾</span>
              </summary>

              <div className="program-content">
                <div className="program-content-inner">
                  <p>{program.reason}</p>

                    <img src="qrAVI.png" className="qrimg"></img>
                  
                </div>
              </div>
            </details>
          ))}
        </div>

        {/* Botones */}
        <section className="acciones">
          <button type="button" className="btn-primary" onClick={verprogramas}>
            Ver mas programas
          </button>
          <button type="button" className="btn-secondary" onClick={irtest}>
            Volver a intentar
          </button>
        </section>
      </div>
    </div>
  );


}

export default Resultado