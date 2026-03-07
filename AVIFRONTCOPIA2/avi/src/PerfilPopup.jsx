import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./Perfil.css";


function PerfilPopup( {onClose }) {
    const navigate = useNavigate();
    const { logout, nombre, email, foto} = useAuth();

    function irAEditar() {
        navigate("/editar-perfil");
        onClose();
    }


    function salir() {
        logout();
        navigate("/");
    }


    return (
    <div className="perfil-overlay">
        <div className="perfil-popup">
            <div className="perfil-header">
                <span>{email}</span>
                <button className="closepopup" onClick={onClose}>✕</button>
            </div>


            <div className="perfil-body">
                <div className="avatar">
                    <img
                            src={foto || "/placeholder.svg"} // muestra la foto del usuario o placeholder
                            alt={`Perfil de ${nombre || "Aspirante"}`}
                            style={{
                                width: "80%",
                                height: "80%",
                                objectFit: "cover",
                                borderRadius: "50%", // para que sea redonda
                            }}/>
                </div>
                <h2>¡Hola, {nombre || "Aspirante"}!</h2>


                <button className="btn-editar" onClick={irAEditar}>
                Editar Perfil
                </button>
            </div>


            <div className="perfil-footer">
                <button className="btn-logout-popup" onClick={salir}>
                Cerrar Sesión
                </button>
            </div>
        </div>
    </div>
    );
}


export default PerfilPopup;