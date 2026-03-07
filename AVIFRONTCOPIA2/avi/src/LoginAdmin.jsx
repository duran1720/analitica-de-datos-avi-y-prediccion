import Swal from 'sweetalert2'

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "./context/AuthContext";

function LoginAdmin() {

    const LOGINADMINS_API = import.meta.env.VITE_API_LOGINADMINS

    const navigate = useNavigate();

    const [id, setId] = useState("");
    const [pass, setPass] = useState("");

    const {guardarToken} = useAuth();
    const {guardarNombre} = useAuth(); 
    const {guardarRol} = useAuth();

    const [showPassword, setShowPassword] = useState(false);


    async function Ingresar(event) {
        event.preventDefault();

        const idEntero = parseInt(id)

        const respuesta = await fetch(`${LOGINADMINS_API}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: idEntero, pass }),
        });

        const data = await respuesta.json();
        console.log(data)


        if (data.mensaje==="Credenciales incorrectas") {
            Swal.fire({
                icon: "error",
                title: "Datos incorrectos",
                confirmButtonColor: "#39a900",
            })
            return
        }

        if (!respuesta.ok) {
            Swal.fire({
                icon: "error",
                title: "Error al iniciar sesion",
                confirmButtonColor: "#39a900",
            })
            return
        }

            guardarToken(data.token);
            guardarNombre(data.nombre);
            guardarRol(data.rol)

            console.log(data.rol);

        

            Swal.fire({
                icon: "success",
                title: "¡Bienvenido a AVI!",
                confirmButtonColor: "#39a900",
            }).then(() => {
                    navigate("/Estadisticas")
            })

        
        
    }


    return (
        <section className="auth-section">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Iniciar Sesión</h1>
                    <p>Accede a tu cuenta como Administrador </p>
                </div>

                <form id="loginForm" className="auth-form" onSubmit={Ingresar}>
                    <div className="form-group">
                        <label htmlFor="identificacion">Número de Identificación</label>
                        <input type="text" id="identificacion" name="identificacion" required onChange={(event)=> setId(event.target.value)}/>
                        <span className="error-message" id="identificacion-error"></span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>

                        <div className="password-input">
                            <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            required
                            onChange={(event) => setPass(event.target.value)}
                            />

                            <span
                            className="eye"
                            onClick={() => setShowPassword(!showPassword)}
                            >
                            {showPassword ? "🙈" : "👁️"}
                            </span>
                        </div>

                        <span className="error-message" id="password-error"></span>
                    </div>

                    <button type="submit" className="auth-button">Ingresar</button>
                </form>

            </div>
        </section>
    );
}

export default LoginAdmin;