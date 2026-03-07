import { useAuth } from "./context/AuthContext";
import NavAdmin from "./NavAdmin"
import Nav from "./Nav"
import {Link} from 'react-router-dom'
import Sidebar from "./Sidebar";
import AdminLayout from "./AdminLayout";


function Navbar({children}){
    
    const {rol, id} = useAuth();

    console.log(rol)
    console.log(id)

        if(rol === "admin"){
            return (
            <AdminLayout>
                {children}
            </AdminLayout>
            )
        } 
        
        if (rol === "aspirante"){
            return <Nav></Nav>
        }

    return(

        <div>
            <nav>
                <Link to="/">Inicio 
                    <img src="/logoAVI.png" alt="AVI Logo" className="logo-img" style={{height:"50px", width: "auto"}}></img>
                </Link>


                <div className="nav-right">
                    <Link to="/login" className='btn-nav btn-login'>Login</Link>
                    <Link to="/registro" className='btn-nav btn-register'>Registro</Link>
                </div>
            </nav>
        </div>
        

    )

}


export default Navbar