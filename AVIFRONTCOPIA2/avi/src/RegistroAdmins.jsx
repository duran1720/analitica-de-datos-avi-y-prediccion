import Swal from 'sweetalert2'
import { useState } from "react";

function RegistroAdmins() {

    const REGISTROADMINS_API = import.meta.env.VITE_API_REGISTROADMINS


  const [idADMIN, setId] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");

  async function registrarAspirante(event) {
        event.preventDefault();

        const idEntero = parseInt(idADMIN)

        const respuesta = await fetch(`${REGISTROADMINS_API}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({idADMIN: idEntero, nombre, email, password }),
        });

        if (respuesta.ok){

          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            text: "Nuevo administrador registrado",
            confirmButtonColor: "#39a900",
          })

        }else{

          Swal.fire({
            icon: "error",
            title: "Error en el registro",
            confirmButtonColor: "#39a900",
          })

        }
  }


  return (
    <>   
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Registrar nuevos Admins</h1>
          </div>

          <form className="auth-form" onSubmit={registrarAspirante}>
            <div className="form-group">
              <label htmlFor="identificacion">Número de Identificación *</label>
              <input type="text" id="identificacion" name="identificacion" required onChange={(event)=> setId(event.target.value)}/>
            </div>

            <div className="form-group">
              <label htmlFor="nombreCompleto">Nombre Completo *</label>
              <input type="text" id="nombreCompleto" name="nombreCompleto" required onChange={(event)=> setNombre(event.target.value)}/>
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo Electrónico *</label>
              <input type="email" id="correo" name="correo" required onChange={(event)=> setEmail(event.target.value)}/>
            </div>


            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input type="password" id="password" name="password" required onChange={(event)=> setPass(event.target.value)}/>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required />
            </div>

            <button type="submit" className="auth-button">Registrar</button>
          </form>

          
        </div>
      </section>
    </>
  );
};

export default RegistroAdmins;