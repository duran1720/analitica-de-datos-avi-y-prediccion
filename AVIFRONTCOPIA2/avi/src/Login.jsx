import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import "./Login.css";

function Login() {
  const LOGINASPIRANTE_API = import.meta.env.VITE_API_LOGINASPIRANTE;
  const LOGINADMINS_API = import.meta.env.VITE_API_LOGINADMINS;

  const navigate = useNavigate();

  const [rolSeleccionado, setRolSeleccionado] = useState("aspirante");
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { guardarToken, guardarNombre, guardarRol, guardarEmail, guardarId, guardarFoto } = useAuth();

  async function Ingresar(e) {
    e.preventDefault();

    const endpoint =
      rolSeleccionado === "aspirante"
        ? LOGINASPIRANTE_API
        : LOGINADMINS_API;

    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: parseInt(id),
        pass,
      }),
    });

    const data = await respuesta.json();

    if (!respuesta.ok || data.mensaje === "Credenciales incorrectas") {
      Swal.fire({
        icon: "error",
        title: "Datos incorrectos",
        confirmButtonColor: "#7b2cbf",
      });
      return;
    }

    guardarToken(data.token);
    guardarRol(data.rol);
    guardarId(data.id)
    

    if (rolSeleccionado === "aspirante") {
      guardarNombre(data.usuario.nombre_completo);
      guardarEmail(data.usuario.email);
      guardarId(data.usuario.idASPIRANTE)

      guardarFoto(data.usuario.foto)
    } else {
      guardarNombre(data.nombre);
    }

    Swal.fire({
      icon: "success",
      title: "¡Bienvenido a AVI!",
      confirmButtonColor: "#7b2cbf",
    }).then(() => {
      navigate(
        rolSeleccionado === "aspirante"
          ? "/BienvenidaTest"
          : "/Estadisticas"
      );
    });
  }

  return (
    <section className="login-page">
        
      <div className="login-card">

        {/* Selector de rol */}
        <div className="role-switch">
          <button
            className={rolSeleccionado === "aspirante" ? "active" : ""}
            onClick={() => setRolSeleccionado("aspirante")}
            type="button"
          >
            Aspirante
          </button>
          <button
            className={rolSeleccionado === "admin" ? "active" : ""}
            onClick={() => setRolSeleccionado("admin")}
            type="button"
          >
            Administrador
          </button>
          
        </div>

        <div className="login-description">
            {rolSeleccionado === "aspirante" ? (
                <p>
                Ingresa como <strong>aspirante</strong> para conocer las recomendaciones
                que nuestro test vocacional tiene para ti.
                </p>
            ) : (
                <p>
                Ingresa como <strong>administrador</strong> para visualizar estadísticas,
                gestionar usuarios y administrar la plataforma.
                </p>
            )}
            </div>


        <form onSubmit={Ingresar} className="login-form">
          <input
            type="text"
            placeholder="Número de identificación"
            required
            onChange={(e) => setId(e.target.value)}
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              required
              onChange={(e) => setPass(e.target.value)}
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button type="submit" className="login-btn">
            Iniciar Sesión
          </button>
        </form>

        <div className="login-footer">
          <a href="#">Olvidé mi contraseña</a>
          {rolSeleccionado === "aspirante" && (

            <a href="/registro">Crear cuenta</a>
          )}
        </div>
      </div>
    </section>
  );
}

export default Login;
