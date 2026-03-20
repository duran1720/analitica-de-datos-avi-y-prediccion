import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Aspirante.css"

function AspiranteGet() {

  const VITE_API_GETASPIRANTES = import.meta.env.VITE_API_GETASPIRANTES
  
  const API = VITE_API_GETASPIRANTES;

  const [aspirantes, setAspirantes] = useState([]);

  const navigate = useNavigate()

  const obtenerAspirantes = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setAspirantes(data);
    } catch (error) {
      console.error("Error al obtener aspirantes:", error);
    }
  };

  useEffect(() => {
    obtenerAspirantes();
  }, []);


  const editarAspirante = (id) => {
    navigate(`/editar-aspirante/${id}`);
  };

  const cambiarEstado = async (id, activo) => {
    try {
      const res = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activo }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      obtenerAspirantes();
    } catch (error) {
      console.error("Error al cambiar estado del aspirante:", error);
    }
  };

  return (

      <div className="asp-container">
      <div className="asp-header">
        <h2>Aspirantes</h2>
        <button className="btn-nuevo">+ Nuevo Aspirante</button>
      </div>

      <input
        className="asp-search"
        placeholder="Buscar por nombre o email"
      />

      <div className="asp-list">

      {aspirantes.map((aspirante) => (
        <div key={aspirante.idASPIRANTE} className="asp-card">

          <div className="asp-avatar">
              {aspirante.nombre_completo.charAt(0)}
            </div>

          <div className="asp-info">
          <h3>{aspirante.nombre_completo}</h3>
          <p>🗓️ {aspirante.edad}</p>
          <p>📧 {aspirante.email}</p>
          <p>📞 {aspirante.telefono}</p>
          <p>🏡 {aspirante.barrio}, {aspirante.direccion}</p>
          <p> </p>
          <p>
            {aspirante.activo ? "✅ Habilitado" : "❌ Deshabilitado"}
          </p>

          </div>

          <div className="ad-actions">
          
            <button onClick={() => editarAspirante(aspirante.idASPIRANTE)}
              className="icon editar">
              ✏️
            </button>
            <button onClick={() => cambiarEstado(aspirante.idASPIRANTE, aspirante.activo)}
              className="icon bloquear">
              {aspirante.activo ? "🔒" : "🔓"}
            </button>
          </div>
        </div>
      ))}
            
      </div>
    </div>
      
  );
}

export default AspiranteGet;