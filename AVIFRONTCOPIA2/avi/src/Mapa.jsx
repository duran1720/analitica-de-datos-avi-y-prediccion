import React from "react";
import "./Mapa.css";

function Mapa() {

  const descargarApp = () => {
    window.location.href = "https://play.google.com/store";
  };

  return (
    <div className="mapa-container">
      <div className="contenidomapa">

        <h1 className="titulo">BIENVENIDO AL MAPA DEL SENA</h1>
        <h2 className="subtitulo">"CTPI"</h2>

        <div className="layout">

          {/* COLUMNA IZQUIERDA */}
          <div className="col-izquierda">

            <video 
              src="/video.mp4" 
              controls 
              autoPlay 
              loop 
              className="video"
            />

            <button 
              className="btn-descargar" 
              onClick={descargarApp}
            >
              Descargar Aplicación
            </button>

          </div>

          {/* COLUMNA DERECHA */}
          <div className="col-derecha">

            <div className="card-blanca">
              <img 
                src="/aplicacion.png" 
                alt="Aplicación móvil" 
                className="imagen"
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Mapa;
