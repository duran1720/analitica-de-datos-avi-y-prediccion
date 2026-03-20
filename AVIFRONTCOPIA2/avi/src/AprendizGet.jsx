import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Aspirante.css";

function AprendizGet() {

  const API = import.meta.env.VITE_API_GETAPRENDICES;

  const [aprendices, setAprendices] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();

  const obtenerAprendices = async () => {
    try {
      const res = await fetch(API, {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setAprendices(data);
    } catch (error) {
      console.error("Error al obtener aprendices:", error);
    }
  };

  useEffect(() => {
    obtenerAprendices();
  }, []);

  const editarAprendiz = (id) => {
    navigate(`/editar-aprendiz/${id}`);
  };

  const cambiarEstado = async (id, estado) => {
    try {
      const res = await fetch(`${API}/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: !estado })
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      obtenerAprendices();
    } catch (error) {
      console.error("Error al cambiar estado del aprendiz:", error);
    }
  };

  const aprendicesFiltrados = aprendices.filter((aprendiz) =>
    `${aprendiz.nombre} ${aprendiz.apellidos}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (

    <div className="asp-container">

      <div className="asp-header">

        <h2>Aprendices</h2>

        <button
          className="btn-nuevo"
          onClick={() => navigate("/crear-aprendiz")}
        >
          + Nuevo Aprendiz
        </button>

      </div>

      <input
        className="asp-search"
        placeholder="Buscar por nombre o apellido"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="asp-list">

        {aprendicesFiltrados.map((aprendiz) => (

          <div key={aprendiz.idAPRENDIZ} className="asp-card">

            <div className="asp-avatar">
              {aprendiz.nombre.charAt(0)}
            </div>

            <div className="asp-info">

              <h3>
                {aprendiz.nombre} {aprendiz.apellidos}
              </h3>

              <p>🪪 {aprendiz.tipoDocumento}</p>

              <p>
                🎓 {aprendiz.programa?.nombre} ({aprendiz.programa?.nivel})
              </p>

              <p>
                ⏱️ Inasistencias: {aprendiz.horas_inasistidas} horas
              </p>

              <p>
                {aprendiz.estado ? "✅ Habilitado" : "❌ Deshabilitado"}
              </p>

            </div>

            <div className="ad-actions">

              <button
                onClick={() => editarAprendiz(aprendiz.idAPRENDIZ)}
                className="icon editar"
              >
                ✏️
              </button>

              <button
                onClick={() =>
                  cambiarEstado(aprendiz.idAPRENDIZ, aprendiz.estado)
                }
                className="icon bloquear"
              >
                {aprendiz.estado ? "🔒" : "🔓"}
              </button>

              <button
                onClick={() =>
                  navigate(`/prediccion-aprendiz/${aprendiz.idAPRENDIZ}`)
                }
                className="icon bloquear"
              >
                🤖
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}

export default AprendizGet;