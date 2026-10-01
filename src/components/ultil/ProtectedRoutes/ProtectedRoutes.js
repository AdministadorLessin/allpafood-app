
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import React,{useState,useEffect} from "react"
import axios from 'axios';

import { useNavigate } from "react-router-dom";
import { API_URL } from '../../../config';
import { cerrarSesionPorVencimiento } from '../sesion';
import { useAuthContext } from '../../../context/authContext';

/* Pantallas de plata. Al colaborador de una empresa no le corresponde ninguna:
   su almuerzo lo paga su empleador y no hay nada que comprar ni renovar. */
const PANTALLAS_DE_PAGO = ['/planes', '/checkout', '/facturacion', '/mi-plan'];



const ProtectedRoutes = ({
        redirectPath = '/ingresar'
    }) => {

    let navigate = useNavigate();
    const location = useLocation();
    const { esCorporativo } = useAuthContext();

    const [loadApp,setLoadApp] = useState(
        window.localStorage.getItem('aftkn')
    );

    const validateToken = () =>{
        if(loadApp){
            axios.get(`${API_URL}auth/validate-token`,
                {
                    headers: {"Authorization" : `Bearer ${loadApp}`} 
                }
            ).then((resp)=>{
                /* El servidor responde 200 aunque el token este vencido: lo
                   que dice si sirve o no es isValid. Tomar el 200 por bueno
                   dejaba al cliente dentro con la sesion muerta. */
                const valido = resp?.data?.data?.isValid ?? resp?.data?.isValid;
                if (valido === false) {
                    cerrarSesionPorVencimiento();
                    setLoadApp();
                    return;
                }
                setLoadApp(loadApp)
            }).catch((error)=>{
                setLoadApp()
            })
        }
    }

    useEffect(()=>{
        validateToken();
    },[]);

    if(!loadApp){
        
        return <Navigate to={redirectPath} replace />
    }

    /* Esconder el enlace no alcanza: la direccion se escribe a mano y ahi
       estaria el checkout. Se corta aqui y se le manda a lo suyo, elegir. */
    if (esCorporativo && PANTALLAS_DE_PAGO.includes(location.pathname)) {
        return <Navigate to="/menu" replace />;
    }

    return <Outlet />
};

export default ProtectedRoutes;
