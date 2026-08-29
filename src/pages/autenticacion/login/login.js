import React,{ useState, useEffect } from "react";
import './login.scss';

import logoAllpafood from '../../../assets/img/logo_allpafood.png';
import icoFacebook from '../../../assets/img/ico_facebook.svg';
import icoGoogle from '../../../assets/img/ico_google.svg';

import TextField from '@mui/material/TextField';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import Alert from '@mui/material/Alert';

import axios from 'axios';
import {useAuthContext} from '../../../context/authContext';
import { useNavigate } from "react-router-dom";
import Backdrop from './../../../components/ultil/Backdrop/Backdrop';

const LoginPage = (props) => {
  
  let navigate = useNavigate();
  const { handleUpdateToken, removeLocalstorage } = useAuthContext();

  const [bodyFields,setBodyFields] = useState({
    lfcorreo:'',
    lfpassword:''
  });
      
  const validationSchema = Yup.object().shape({

    lfcorreo: Yup.string().required('ingrese un correo valido').email().matches(/^(?!.*@[^,]*,)/),
    lfpassword: Yup.string()
    .required('Ingrese un telefono valido por favor.')
    .min(3,'Ingrese un telefono valido por favor.')
  });

  const handleFieldChange = (e) => {
    setBodyFields({
        ...bodyFields,
        [e.target.name]:e.target.value
    })
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
      mode: "all",
      shouldUnregister: true,
      resolver: yupResolver(validationSchema),
  });

  const [errorAxios,setErrorAxios] = useState(false);
  const sendData = () =>{
    axios.post('https://api.allpafood.com/dev/api-af/v1/auth/login',
        {
          username:bodyFields.lfcorreo,
          password:bodyFields.lfpassword
        }).then((resp)=>{
          if(resp.status === 200){

            let userDate = resp.data.data;

            userDate.log = bodyFields.lfcorreo;
            handleUpdateToken(resp.data.data.token,userDate);
            
            navigate('/')
          }
          
        }).catch((error) =>{
          console.log(error)
          setErrorAxios(true)
        })
  }
  
  const onSubmitHandler = (data) => {
    sendData(data)
  };

  useEffect(()=>{
    removeLocalstorage();
  },[])


  return (
    <main className="inlineFlex loginPageCont">
      <Backdrop />

      <div className="inlineFlex loginPage">
        <div className="loginLeft">
          <div className="inlineFlex loginBox">
            <figure>
              <img src={logoAllpafood} alt="" />
            </figure>
            <form onSubmit={handleSubmit(onSubmitHandler)}>
              <div className="loginTextField loginTextFieldUser">
                <TextField 
                  label="Correo:" 
                  variant="filled"
                  id="lfcorreo" 
                  name="lfcorreo" 
                  value={bodyFields ? bodyFields.lfcorreo : ''}
                  error={errors.lfcorreo ? true : false}
                  {...register("lfcorreo")} 
                  onChange={handleFieldChange}
                />
              </div>
              <div className="loginTextField loginTextFieldClave">
                <TextField 
                  label="Clave" 
                  variant="filled"
                  id="lfpassword" 
                  name="lfpassword" 
                  type={'password'}
                  value={bodyFields ? bodyFields.lfpassword : ''}
                  error={errors.lfpassword ? true : false}
                  {...register("lfpassword")} 
                  onChange={handleFieldChange}
                />
              </div>
              {errorAxios &&
                <Alert className="inlineFlex loginErrors" severity="error">Verifique sus credenciales por favor.</Alert>
              }
              <div className="inlineFlex loginLinks">
                <FormGroup>
                  <FormControlLabel control={<Checkbox />} label="Recordar por 30 dias" />
                </FormGroup>
                <a href="#">Recuperar contraseña</a>
              </div>
              <div className="inlineFlex loginBtn">
                <button type={'submit'} className="btnPrimary">
                  Ingresar
                </button>
              </div>
            </form>
            {false &&
            <div className="inlineBlock loginExternal">
              <a href="#" className="btnPrimary btnIcon btnLogFb">
                <span>
                  <img src={icoFacebook} alt="" />
                  Ingresar con facebook
                </span>
              </a>
              <a href="#" className="btnPrimary btnIcon btnLogGoogle">
                <span>
                  <img src={icoGoogle} alt="" />
                  Ingresar con google
                </span>
              </a>
            </div>
            }
          </div>
        </div>

        <div className="loginRight"></div>
      </div>

    </main>
  )
};

export default LoginPage;
