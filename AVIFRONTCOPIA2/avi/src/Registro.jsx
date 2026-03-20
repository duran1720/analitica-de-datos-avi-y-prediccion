import Swal from "sweetalert2";
import { useState, useEffect, useRef } from "react";
import "./Registro.css";

function Registro() {
  const REGISTROASPIRANTES_API  = import.meta.env.VITE_API_REGISTROASPIRANTES;
  const VERIFICAR_CODIGO_API    = import.meta.env.VITE_API_VERIFICAR_CODIGO;
  const REENVIAR_CODIGO_API     = import.meta.env.VITE_API_REENVIAR_CODIGO;

  /* ── PASO: "form" | "verificacion" ── */
  const [paso, setPaso] = useState("form");

  /* ── Datos del formulario ── */
  const [idASPIRANTE, setId]               = useState("");
  const [nombre_completo, setNombre]        = useState("");
  const [email, setEmail]                   = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono]             = useState("");
  const [barrio, setBarrio]                 = useState("");
  const [direccion, setDireccion]           = useState("");
  const [ocupacion, setOcupacion]           = useState("");
  const [institucion, setInstitucion]       = useState("");
  const [password, setPass]                 = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [enviando, setEnviando]             = useState(false);

  /* ── Estado de verificación ── */
  const [codigo, setCodigo]                 = useState(["", "", "", "", "", ""]);
  const [verificando, setVerificando]       = useState(false);
  const [reenviando, setReenviando]         = useState(false);
  const [contador, setContador]             = useState(0);
  const inputsRef = useRef([]);

  const hoy = new Date().toISOString().split("T")[0];

  /* ── Validaciones contraseña ── */
  const validations = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /\d/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  };

  /* ── Contador de reenvío ── */
  useEffect(() => {
    if (contador <= 0) return;
    const t = setTimeout(() => setContador((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [contador]);

  /* ════════════════════════════════════════
     PASO 1 — Enviar datos → backend genera código
  ════════════════════════════════════════ */
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
      Swal.fire("Error", "La contraseña no cumple con todos los requisitos", "error");
      return;
    }
    if (password !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(REGISTROASPIRANTES_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          idASPIRANTE: parseInt(idASPIRANTE),
          nombre_completo,
          fechaNacimiento,
          email,
          telefono,
          barrio,
          direccion,
          ocupacion,
          institucion: (ocupacion === "Colegio" || ocupacion === "Universidad") ? institucion : null,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        Swal.fire("Error", data.mensaje || "Error al enviar el código", "error");
        return;
      }

      /* Pasar al paso de verificación */
      setPaso("verificacion");
      setContador(60);

    } catch (error) {
      console.error(error);
      Swal.fire("Error de red", "No se pudo conectar con el servidor", "error");
    } finally {
      setEnviando(false);
    }
  }

  /* ════════════════════════════════════════
     PASO 2 — Validar código de 6 dígitos
  ════════════════════════════════════════ */
  async function verificarCodigo(event) {
    event.preventDefault();
    const codigoCompleto = codigo.join("");
    if (codigoCompleto.length < 6) {
      Swal.fire("Error", "Ingresa el código completo de 6 dígitos", "error");
      return;
    }

    setVerificando(true);
    try {
      const res = await fetch(VERIFICAR_CODIGO_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, codigo: codigoCompleto }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        Swal.fire("Código incorrecto", data.mensaje || "El código no es válido o ha expirado", "error");
        return;
      }

      Swal.fire({
        icon:             "success",
        title:            "¡Cuenta creada!",
        text:             "Tu registro ha sido verificado correctamente.",
        confirmButtonColor: "#39a900",
      }).then(() => {
        window.location.href = "/login";
      });

    } catch (error) {
      console.error(error);
      Swal.fire("Error de red", "No se pudo verificar el código", "error");
    } finally {
      setVerificando(false);
    }
  }

  /* ── Reenviar código ── */
  async function reenviarCodigo() {
    if (contador > 0) return;
    setReenviando(true);
    try {
      const res = await fetch(REENVIAR_CODIGO_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setContador(60);
        Swal.fire({ icon: "success", title: "Código reenviado", text: "Revisa tu correo nuevamente.", confirmButtonColor: "#39a900" });
      } else {
        Swal.fire("Error", data.mensaje, "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo reenviar el código", "error");
    } finally {
      setReenviando(false);
    }
  }

  /* ── Manejo del input de código (6 celdas) ── */
  function handleCodigoChange(value, index) {
    if (!/^\d*$/.test(value)) return;
    const nuevo = [...codigo];
    nuevo[index] = value.slice(-1);
    setCodigo(nuevo);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleCodigoKeyDown(e, index) {
    if (e.key === "Backspace" && !codigo[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handleCodigoPaste(e) {
    const pasted = e.clipboardData.getData("Text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCodigo(pasted.split(""));
      inputsRef.current[5]?.focus();
      e.preventDefault();
    }
  }

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <section className="auth-section">
      <div className="auth-container">

        {/* ── PASO 2: VERIFICACIÓN ── */}
        {paso === "verificacion" && (
          <div className="verificacion-wrapper">
            <div className="auth-header">
              <h1>Verifica tu correo</h1>
              <p>
                Enviamos un código de 6 dígitos a{" "}
                <strong>{email}</strong>.<br />
                Expira en 15 minutos.
              </p>
            </div>

            <form className="auth-form" onSubmit={verificarCodigo}>

              <div className="codigo-grid">
                {codigo.map((digit, i) => (
                  <input
                    key={i}
                    id={`codigo-digit-${i}`}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    className="codigo-cell"
                    onChange={(e) => handleCodigoChange(e.target.value, i)}
                    onKeyDown={(e) => handleCodigoKeyDown(e, i)}
                    onPaste={handleCodigoPaste}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={verificando}
              >
                {verificando ? "Verificando..." : "Confirmar código"}
              </button>
            </form>

            <div className="reenviar-wrapper">
              {contador > 0 ? (
                <p className="reenviar-info">
                  Puedes reenviar el código en{" "}
                  <strong>{contador}s</strong>
                </p>
              ) : (
                <button
                  className="reenviar-btn"
                  onClick={reenviarCodigo}
                  disabled={reenviando}
                >
                  {reenviando ? "Reenviando..." : "Reenviar código"}
                </button>
              )}

              <button
                className="reenviar-btn secondary"
                onClick={() => setPaso("form")}
              >
                Volver al formulario
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 1: FORMULARIO ── */}
        {paso === "form" && (
          <>
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
                <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
                <input
                  type="date"
                  max={hoy}
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
                <label>Dirección *</label>
                <input type="text" required onChange={(e) => setDireccion(e.target.value)} />
              </div>

              <div className="form-group">
                <label>¿A qué te dedicas actualmente? *</label>
                <div className="radio-group">
                  {["Colegio", "Universidad", "Trabajo", "Ninguno"].map((op) => (
                    <label key={op}>
                      <input
                        type="radio"
                        name="ocupacion"
                        value={op}
                        onChange={(e) => setOcupacion(e.target.value)}
                        required
                      />
                      {op === "Colegio"
                        ? "Estudio en colegio"
                        : op === "Universidad"
                        ? "Estudio en universidad"
                        : op === "Trabajo"
                        ? "Trabajo"
                        : "No estudio ni trabajo"}
                    </label>
                  ))}
                </div>
              </div>

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

              {/* CONTRASEÑA */}
              <div className="form-group">
                <label>Contraseña *</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    onChange={(e) => setPass(e.target.value)}
                  />
                  <span className="eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Ocultar" : "Ver"}
                  </span>
                </div>
                <ul className="password-requirements">
                  <li className={validations.length    ? "ok" : ""}>Mínimo 8 caracteres</li>
                  <li className={validations.uppercase ? "ok" : ""}>Una letra mayúscula</li>
                  <li className={validations.number    ? "ok" : ""}>Un número</li>
                  <li className={validations.special   ? "ok" : ""}>Un carácter especial</li>
                </ul>
              </div>

              {/* CONFIRMAR */}
              <div className="form-group">
                <label>Confirmar Contraseña *</label>
                <div className="password-input">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <span className="eye" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? "Ocultar" : "Ver"}
                  </span>
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={enviando}>
                {enviando ? "Enviando código..." : "Continuar"}
              </button>
            </form>
          </>
        )}

      </div>
    </section>
  );
}

export default Registro;
