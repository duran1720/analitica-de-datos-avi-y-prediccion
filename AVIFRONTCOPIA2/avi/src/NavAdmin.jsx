import {Link} from 'react-router-dom'
import { useAuth } from "./context/AuthContext";
import Swal from 'sweetalert2'
import { useNavigate } from "react-router-dom";


function NavAdmin(){

    const {logout} = useAuth();
    const navigate = useNavigate();

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

    return(
        <div>
            <nav>

                <Link to="/">Inicio 
                    <img src="/logoAVI.png" alt="AVI Logo" className="logo-img" style={{height:"50px", width: "auto"}}></img>
                </Link>

                <div className='nav-left'>
                    <Link to="/estadisticas">Estadisticas</Link>
                    <Link to="/registroadmin">Registrar Admin</Link>
                    <Link to="/listaraspirantes">Gestionar Aspirantes</Link>
                    <Link to="/listaradmins">Gestionar Admins</Link>
                    <button className='btn-nav btn-logout' onClick={salir}>Cerrar Sesion</button>

                </div>
                    
            </nav>
        </div>
    )
}



export default NavAdmin