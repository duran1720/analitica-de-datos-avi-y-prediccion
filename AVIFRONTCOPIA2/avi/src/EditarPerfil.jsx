import { useEffect, useState } from "react";
import "./Perfil.css";
import { useAuth } from "./context/AuthContext";

function EditarPerfil() {
  const PERFIL_API = import.meta.env.VITE_API_PERFILASPIRANTE;
  const { token, guardarFoto } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState({
    nombre_completo: false,
    email: false,
    telefono: false,
    barrio: false,
  });
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    if (!token || !PERFIL_API) return;
    fetch(`${PERFIL_API}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsuario(data);
        if (data?.foto) guardarFoto(data.foto);
      });
  }, [token, PERFIL_API, guardarFoto]);

  const toggleEditar = (campo) => {
    setEditando({
      nombre_completo: false,
      email: false,
      telefono: false,
      barrio: false,
      [campo]: !editando[campo],
    });
  };

  const handleChange = (e) => {
    setUsuario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const subirFoto = () => {
    if (!window.cloudinary) return;
    setSubiendoFoto(true);

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "doeyxhpn3",
        uploadPreset: "perfiles-app",
        sources: ["local"],
        folder: "imagen de perfil",
        maxFiles: 1,
      },
      async (error, result) => {
        if (error) {
          alert("Error al subir la foto");
          setSubiendoFoto(false);
          return;
        }

        if (result?.event !== "success") return;

        const url = result.info.secure_url;
        const res = await fetch(`${PERFIL_API}/editar`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ foto: url }),
        });

        if (!res.ok) {
          alert("No se pudo guardar la foto en el perfil");
          setSubiendoFoto(false);
          return;
        }

        const data = await res.json();
        const fotoPerfil = data?.data?.foto || url;
        setUsuario((prev) => ({ ...prev, foto: fotoPerfil }));
        guardarFoto(fotoPerfil);
        setSubiendoFoto(false);
      }
    );

    widget.open();
  };

  const guardarCambios = async () => {
    if (!usuario) return;
    setGuardando(true);

    const res = await fetch(`${PERFIL_API}/editar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(usuario),
    });

    if (res.ok) {
      const data = await res.json();
      setUsuario(data.data || usuario);
      alert("Datos actualizados correctamente");
      setEditando({
        nombre_completo: false,
        email: false,
        telefono: false,
        barrio: false,
      });
    } else {
      alert("Error al actualizar los datos");
    }

    setGuardando(false);
  };

  const volver = () => window.history.back();

  if (!usuario) return <p>Cargando perfil...</p>;

  const lapizStyle = { fontSize: "0.8rem", marginLeft: "5px", cursor: "pointer" };

  return (
    <section className="perfil-page">
      <div className="editar-perfil-container">
        <div className="editar-header">
          <button className="btn-volver" onClick={volver}>
            Volver
          </button>
          <h1>Mi Perfil</h1>
        </div>

        <div className="perfil-card">
          <div className="perfil-card-header">
            <img
              src={usuario.foto || "/placeholder-user.jpg"}
              alt="Foto de perfil"
              className="perfil-card-foto"
              style={{
                cursor: "pointer",
                width: "150px",
                height: "150px",
                objectFit: "cover",
                borderRadius: "50%",
              }}
              onClick={subirFoto}
              title="Haz clic para cambiar la foto"
            />

            <div className="perfil-card-info">
              <h2>{usuario.nombre_completo || "Sin nombre"}</h2>
              <span className="perfil-badge">Aspirante</span>
            </div>
          </div>

          <div className="perfil-datos">
            {["idASPIRANTE", "nombre_completo", "email", "telefono", "barrio"].map((campo) => (
              <div className="dato-item" key={campo}>
                <span className="dato-label">
                  {campo === "idASPIRANTE" ? "Identificacion" : campo.replace("_", " ").toUpperCase()}
                </span>
                {editando[campo] ? (
                  campo === "idASPIRANTE" ? (
                    <span className="dato-valor">{usuario[campo] || "---"}</span>
                  ) : (
                  <input
                    type={campo === "email" ? "email" : "text"}
                    name={campo}
                    value={usuario[campo] || ""}
                    onChange={handleChange}
                  />
                  )
                ) : (
                  <span className="dato-valor">{usuario[campo] || "---"}</span>
                )}
                {campo !== "idASPIRANTE" ? (
                  <span style={lapizStyle} onClick={() => toggleEditar(campo)}>
                    Editar
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <button
            className="btn-guardar"
            onClick={guardarCambios}
            disabled={guardando || subiendoFoto}
            style={{ fontSize: "12px", padding: "4px 8px", height: "28px", minWidth: "60px" }}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default EditarPerfil;
