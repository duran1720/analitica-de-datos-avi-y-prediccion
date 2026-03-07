import {Link} from 'react-router-dom'
import { useAuth } from "./context/AuthContext";
import Swal from 'sweetalert2'
import { useNavigate } from "react-router-dom";
import { useState } from 'react';
import PerfilPopup from './PerfilPopup';

function Nav(){

    const { logout, foto, nombre, email } = useAuth();
    const navigate = useNavigate();

    const [mostrarPerfil, setMostrarPerfil] = useState(false);

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
                    <Link to="/bienvenidatest">Test</Link>
                    <Link to="/programas">Programas</Link>
                    <Link to="/misreportes">Reportes</Link>
                    <Link to="/mapa">Mapa</Link>


                    <button
                        onClick={() => setMostrarPerfil(true)}
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            border: "2px solid #7b2cbf",
                            padding: "0",
                            cursor: "pointer",
                            overflow: "hidden",
                            background: "transparent"
                        }}
                        >
                        <img
                        src={foto || "/placeholder.svg"}
                        alt="Perfil"
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover"
                        }}
                    />
                        </button>

                    {mostrarPerfil && (
                    <PerfilPopup
                        usuario={{
                            nombre_completo: nombre,
                            email: email,
                            foto: foto
                        }}
                        onClose={() => setMostrarPerfil(false)}
                        onLogout={salir}
                    />
                )}
                    
                </div>    
            </nav>
        </div>
    )
}



export default Nav