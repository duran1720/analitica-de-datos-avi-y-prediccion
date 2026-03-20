import {useNavigate} from "react-router-dom"

export default function Inicio() {

  const navigate = useNavigate();
      
        function irRegistro() {
          navigate("/registro");
        }

  return (
    <div>
      <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1 class="hero-title">Bienvenido a AVI</h1>
        <p class="hero-text">
          ¿Buscas estudiar alguno de los técnicos o tecnólogos que ofrece el SENA? <br />
          AVI te ayuda a evaluar tus talentos y habilidades para escoger el programa de formación más adecuado para ti.
        </p>
        <button class="cta-button" onClick={irRegistro}>Regístrate Ahora</button>
      </div>
      <div class="hero-image">
        <img src="/aprendices.jpg" alt="Aprendices SENA" class="hero-img" />
      </div>
    </div>
  </section>

  <section class="info-section">
    <div class="container">
      <h2 class="section-title">¿Cómo funciona AVI?</h2>
      <div class="info-grid">
        <div class="info-card">
          <div className="card-icon"></div>
          <h3>Realiza el Test</h3>
          <p>Responde preguntas sobre tus intereses, habilidades y preferencias profesionales.</p>
        </div>
        <div class="info-card">
          <div className="card-icon"></div>
          <h3>Obtén Resultados</h3>
          <p>Recibe recomendaciones personalizadas de programas SENA que se ajusten a tu perfil.</p>
        </div>
        <div class="info-card">
          <div className="card-icon"></div>
          <h3>Inicia tu Carrera</h3>
          <p>Encuentra información detallada sobre los programas y cómo aplicar.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="programs-preview">
    <div class="container">
      <h2 class="section-title">Programas Destacados</h2>
      <div class="programs-grid">
        <div class="program-card">
          <h4>Desarrollo de Software</h4>
          <p>Aprende a crear aplicaciones y sistemas informáticos.</p>
        </div>
        <div class="program-card">
          <h4>Administración de Empresas</h4>
          <p>Desarrolla habilidades gerenciales y empresariales.</p>
        </div>
        <div class="program-card">
          <h4>Mecatrónica Industrial</h4>
          <p>Combina mecánica, electrónica y programación.</p>
        </div>
        <div class="program-card">
          <h4>Diseño Gráfico</h4>
          <p>Crea contenido visual y comunicación efectiva.</p>
        </div>
      </div>
    </div>
  </section>

    </div>
  );
}
