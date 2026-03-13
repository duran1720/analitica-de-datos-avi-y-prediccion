import "./AprendicesIA.css";

function AprendicesIA() {

  const POWERBI_URL = import.meta.env.VITE_POWERBI_DASHBOARD;

  return (

    <div className="ia-container">

      <div className="ia-header">
        <h2>Dashboard Inteligente de Programas</h2>
        <p>Análisis de demanda y comportamiento de aprendices</p>
      </div>

      <div className="powerbi-frame">

        <iframe
          title="Dashboard PowerBI"
          width="100%"
          height="600"
          src={POWERBI_URL}
          frameBorder="0"
          allowFullScreen
        ></iframe>

      </div>

    </div>

  );
}

export default AprendicesIA;