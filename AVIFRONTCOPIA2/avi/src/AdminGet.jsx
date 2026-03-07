import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Aspirante.css"

function AdminGet() {

  const VITE_API_GETADMINS = import.meta.env.VITE_API_GETADMINS
  
  const API = VITE_API_GETADMINS;

  const [admins, setAdmins] = useState([]);

  const navigate = useNavigate()

  const obtenerAdmins = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setAdmins(data);
  };

  useEffect(() => {
    obtenerAdmins();
  }, []);


  const editarAdmin = (id) => {
    navigate(`/editar/${id}`);
  };

  function nuevoadmin() {
    navigate("/registroadmin");
  }

  const cambiarEstado = async (id, activo) => {
    await fetch(`${API}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    obtenerAdmins();
  };

  return (

      <div className="asp-container">
      <div className="asp-header">
        <h2>Administradores</h2>
        <button className="btn-nuevo" onClick={nuevoadmin}>+ Nuevo Administrador</button>
      </div>

      <input
        className="asp-search"
        placeholder="Buscar por nombre o email"
      />

      <div className="asp-list">

      {admins.map((admin) => (
        <div key={admin.idADMIN} className="asp-card">

          <div className="asp-avatar">
              {admin.nombre.charAt(0)}
            </div>

          <div className="asp-info">
          <h3>{admin.nombre}</h3>
          <p>📧 {admin.email}</p>
          <p>
            {admin.activo ? "✅ Habilitado" : "❌ Deshabilitado"}
          </p>

          </div>

          <div className="ad-actions">
          
            <button onClick={() => editarAdmin(admin.idADMIN)}
              className="icon editar">
              ✏️
            </button>
            
            <button onClick={() => cambiarEstado(admin.idADMIN, admin.activo)}
              className="icon bloquear">
              {admin.activo ? "🔒 " : "🔓 "}
            </button>
          </div>
        </div>
      ))}
            
      </div>
    </div>
      
  );
}

export default AdminGet;