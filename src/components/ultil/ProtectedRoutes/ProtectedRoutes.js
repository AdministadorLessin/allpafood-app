
import { Navigate, Outlet } from 'react-router-dom';

import React,{useState,useEffect} from "react"
import axios from 'axios';

import { useNavigate } from "react-router-dom";
import { API_URL } from '../../../config';



const ProtectedRoutes = ({
        redirectPath = '/ingresar'
    }) => {

    let navigate = useNavigate();

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

    return <Outlet />
};

export default ProtectedRoutes;
