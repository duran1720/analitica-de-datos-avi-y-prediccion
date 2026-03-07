import { useState } from "react";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Swal from 'sweetalert2'

const Sidebar = () => {

  const navigate = useNavigate();

  function irestadisticas(){
    navigate("/estadisticas")
  }

  function irprogramas(){
    navigate("/listarprogramas")
  }

  function veraspirantes(){
    navigate("/listaraspirantes")
  }

  function veradmins(){
    navigate("/listaradmins")
  }

  function registroadmin(){
    navigate("/registroadmin")
  }

  
  function veraprendices(){
    navigate("/listaraprendices")
  }
  function verPrediccionIA(){
  navigate("/prediccion-aprendiz")
}

  const [estadisticas, setEstadisticas] = useState();
  const [programas, setProgramas] = useState()
  const [aspirante, setAspirante] = useState();
  const [gestionarAdmin, setGestionarAdmin] = useState();

 
  const [aprendiz, setAprendiz] = useState();

  const mostrarEstadisticas = () => {
    if (estadisticas) {
      return (
        <div>
          <button onClick={irestadisticas}>Ver estadísticas</button>
        </div>
      );
    }
  };

  const mostrarProgramas = () => {
    if (programas) {
      return (
        <div>
          <button onClick={irprogramas}>Ver programas</button>
        </div>
      );
    }
  };

  const mostrarAspirante = () => {
    if (aspirante) {
      return (
        <div>
          <button onClick={veraspirantes}>Ver aspirantes</button>
        </div>
      );
    }
  };

  const mostrarGestionarAdmin = () => {
    if (gestionarAdmin) {
      return (
        <div>
          <button onClick={veradmins}>Ver Administradores</button>
        </div>
      );
    }
  };

  
  const mostrarAprendices = () => {
  if (aprendiz) {
    return (
      <div>
        <button onClick={veraprendices}>Ver aprendices</button>

        <button onClick={verPrediccionIA}>
          Predicción IA
        </button>
      </div>
    );
  }
};

  const {logout} = useAuth();
  
  const salir = () => {
      Swal.fire({
          title: "¿Estás seguro?",
          text: "Se cerrará la sesión actual.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#39a900",
          cancelButtonColor: "#ca0e0e",
          confirmButtonText: "Sí, cerrar sesión",
          cancelButtonText: "Cancelar"
      }).then((result) => {
          if (result.isConfirmed) {
              logout();
              navigate("/");
          }
      });
  };

  return (
    <div className="sidebar">

    <h1 style={{color:"white"}}>      
      
      <img src="/logoAVI.png" alt="AVI Logo" className="logo-img sidebaravi" style={{height:"50px", width: "auto"}}></img>
      AVI
    </h1>

      <button onClick={() => setEstadisticas(!estadisticas)}>
        Estadísticas
      </button>
      {mostrarEstadisticas()}

      <hr />

      <button onClick={() => setProgramas(!programas)}>
        Programas
      </button>
      {mostrarProgramas()}

      <hr />

      <button onClick={() => setAspirante(!aspirante)}>
        Gestionar Aspirante
      </button>
      {mostrarAspirante()}

      <hr />

      
      <button onClick={() => setAprendiz(!aprendiz)}>
        Gestionar Aprendiz
      </button>
      {mostrarAprendices()}
      

      <hr />

      <button onClick={() => setGestionarAdmin(!gestionarAdmin)}>
        Gestionar Administrador
      </button>
      {mostrarGestionarAdmin()}

      <hr />

      <button className="logout-btn" onClick={salir}>Cerrar Sesión</button>

    </div>
  );
};

export default Sidebar;