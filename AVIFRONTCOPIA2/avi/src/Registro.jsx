import Swal from "sweetalert2";
import { useState } from "react";
import "./Registro.css"

function Registro() {
  const REGISTROASPIRANTES_API = import.meta.env.VITE_API_REGISTROASPIRANTES;

  const [idASPIRANTE, setId] = useState("");
  const [nombre_completo, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [barrio, setBarrio] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ocupacion, setOcupacion] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [password, setPass] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];


  // 🔍 Validaciones en tiempo real
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  async function registrarAspirante(event) {
    event.preventDefault();

    if (!/^\d{8,}$/.test(idASPIRANTE)) {
      Swal.fire("Error", "La identificación debe tener mínimo 8 números", "error");
      return;
    }

    if (!/^\d{10}$/.test(telefono)) {
      Swal.fire("Error", "El teléfono debe tener exactamente 10 dígitos", "error");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Swal.fire("Error", "Correo electrónico inválido", "error");
      return;
    }

    if (!Object.values(validations).every(Boolean)) {
      Swal.fire(
        "Error",
        "La contraseña no cumple con todos los requisitos",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      return;
    }

    const respuesta = await fetch(`${REGISTROASPIRANTES_API}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idASPIRANTE: parseInt(idASPIRANTE),
        nombre_completo,
        fechaNacimiento,
        email,
        telefono,
        barrio,
        direccion,
        ocupacion,
        institucion:
          ocupacion === "Colegio" || ocupacion === "Universidad"
            ? institucion
            : null,
        password,
      }),

    });

    if (respuesta.ok) {
      Swal.fire({
        icon: "success",
        title: "¡Registro exitoso!",
        text: "Tu cuenta ha sido creada correctamente",
        confirmButtonColor: "#39a900",
      }).then(() => {
        window.location.href = "/login";
      });
    } else {
      Swal.fire("Error", "Error en el registro", "error");
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Crear Cuenta</h1>
          <p>Regístrate para acceder al test vocacional AVI</p>
        </div>

        <form className="auth-form" onSubmit={registrarAspirante}>
          <div className="form-group">
            <label>Número de Identificación *</label>
            <input type="text" required onChange={(e) => setId(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Nombre Completo *</label>
            <input type="text" required onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Correo Electrónico *</label>
            <input type="email" required onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label for="fechaNacimiento">Fecha de nacimiento:</label>
            <input 
              type="date" max={hoy}
              id="fechaNacimiento" 
              name="fechaNacimiento" 
              required
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>


          <div className="form-group">
            <label>Teléfono *</label>
            <input type="tel" required onChange={(e) => setTelefono(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Barrio *</label>
            <input type="text" required onChange={(e) => setBarrio(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Direccion *</label>
            <input type="text" required onChange={(e) => setDireccion(e.target.value)} />
          </div>

          <div className="form-group">
            <label>¿A qué te dedicas actualmente? *</label>

            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="ocupacion"
                  value="Colegio"
                  onChange={(e) => setOcupacion(e.target.value)}
                  required
                />
                Estudio en colegio
              </label>

              <label>
                <input
                  type="radio"
                  name="ocupacion"
                  value="Universidad"
                  onChange={(e) => setOcupacion(e.target.value)}
                />
                Estudio en universidad
              </label>

              <label>
                <input
                  type="radio"
                  name="ocupacion"
                  value="Trabajo"
                  onChange={(e) => setOcupacion(e.target.value)}
                />
                Trabajo
              </label>

              <label>
                <input
                  type="radio"
                  name="ocupacion"
                  value="Ninguno"
                  onChange={(e) => setOcupacion(e.target.value)}
                />
                No estudio ni trabajo
              </label>
            </div>
          </div>

          {/* Mostrar institución solo si estudia */}
          {(ocupacion === "Colegio" || ocupacion === "Universidad") && (
            <div className="form-group">
              <label>Nombre de la institución *</label>
              <input
                type="text"
                required
                value={institucion}
                onChange={(e) => setInstitucion(e.target.value)}
                placeholder="Ej: Colegio XYZ / Universidad ABC"
              />
            </div>
          )}


          {/* 🔐 CONTRASEÑA */}
          <div className="form-group">
            <label>Contraseña *</label>

            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                required
                onChange={(e) => setPass(e.target.value)}
              />
              <span
                className="eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </span>
            </div>

            <ul className="password-requirements">
              <li className={validations.length ? "ok" : ""}>
                Mínimo 8 caracteres
              </li>
              <li className={validations.uppercase ? "ok" : ""}>
                Una letra mayúscula
              </li>
              <li className={validations.number ? "ok" : ""}>
                Un número
              </li>
              <li className={validations.special ? "ok" : ""}>
                Un carácter especial
              </li>
            </ul>
          </div>

          {/* 🔁 CONFIRMAR */}
          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <div className="password-input">
              <input
                type={showConfirm ? "text" : "password"}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span
                className="eye"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? "Ocultar" : "Ver"}
              </span>
            </div>
          </div>

          <button type="submit" className="auth-button">
            Registrarse
          </button>
        </form>
      </div>
    </section>
  );
}

export default Registro;
