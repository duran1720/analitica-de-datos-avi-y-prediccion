import {createContext, useContext}from 'react';
import { useState } from 'react';

//crear contexto
const AuthContext = createContext();

//children va a ser todo lo que este dentro del Auth
export const AuthPro = ({children})=>{

    const [token, setToken] = useState(null);
    const [nombre, setNombre] = useState("");
    const [rol, setRol] = useState(null);
    const [email, setEmail] = useState("");
    const [id, setId] = useState(null)

    const [foto, setFoto] = useState(null);
    
    const guardarFoto = (url) => {
        setFoto(url)
    };


    const guardarId = (idUsuario) => {
        setId(idUsuario);
    };

    const guardarToken=(tk /*recibir token login*/)=>{
        setToken(tk)
    }

    const guardarNombre=(name)=>{
        setNombre(name)
    }

    const guardarRol=(rol)=>{
        setRol(rol)
    }

    const guardarEmail = (correo) => {
        setEmail(correo);
    };

    const logout=()=>{
        setToken(null);
        setNombre("");
        setRol(null);
        setId(null)
        setFoto(null);
        setEmail("");
    }

    return(
        <AuthContext.Provider value={{
            token,
            guardarToken,
            nombre,
            guardarNombre,
            email,
            guardarEmail,
            rol,
            guardarRol,
            id,
            guardarId,
            logout,
            foto,        
            guardarFoto, 
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = ()=>{
    return useContext(AuthContext);
}