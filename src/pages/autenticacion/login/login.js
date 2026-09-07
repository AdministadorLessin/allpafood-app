import React,{ useState, useEffect } from "react";
import './login.scss';

import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import axios from 'axios';
import {useAuthContext} from '../../../context/authContext';
import { useNavigate, Link } from "react-router-dom";
import MarcoAuth from './../../../components/auth/Marco/MarcoAuth';
import { motion, alToque } from './../../../components/ultil/Motion/Motion';
import { API_URL } from '../../../config';

const IcoError = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.6v5M12 16.2v.2"/></svg>
);

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
  // Sin esto el boton no daba ninguna senal entre el toque y la respuesta, y
  // el cliente lo pulsaba tres veces creyendo que no habia pasado nada.
  const [enviando,setEnviando] = useState(false);

  const sendData = () =>{
    setEnviando(true);
    setErrorAxios(false);
    axios.post(`${API_URL}auth/login`,
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
          setEnviando(false);
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
    <MarcoAuth>
      <h1 className="afAuth__titular">
        <span className="t1">Hola de nuevo,</span>
        entra a tu plan
      </h1>
      <p className="afAuth__bajada">
        Aquí ves tus almuerzos de la semana, tu plan y tus entregas.
      </p>

      <form onSubmit={handleSubmit(onSubmitHandler)}
            className={enviando ? 'afAuth__ocupado' : undefined}>
        <div className="afCampo">
          <TextField 
            label="Correo" 
            variant="filled"
            id="lfcorreo" 
            name="lfcorreo" 
            type="email"
            autoComplete="email"
            value={bodyFields ? bodyFields.lfcorreo : ''}
            error={errors.lfcorreo ? true : false}
            {...register("lfcorreo", { onChange: handleFieldChange })}
          />
        </div>
        <div className="afCampo">
          <TextField 
            label="Contraseña" 
            variant="filled"
            id="lfpassword" 
            name="lfpassword" 
            type={'password'}
            autoComplete="current-password"
            value={bodyFields ? bodyFields.lfpassword : ''}
            error={errors.lfpassword ? true : false}
            {...register("lfpassword", { onChange: handleFieldChange })}
          />
        </div>

        {errorAxios &&
          <div className="afAuth__error">
            <IcoError />
            El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.
          </div>
        }

        <div className="afLogin__opts">
          <FormGroup>
            <FormControlLabel control={<Checkbox size="small" />} label="Recordarme 30 días" />
          </FormGroup>
          {/* Este enlace no llevaba a ninguna parte (href="#") y el cliente que
              olvidaba su clave terminaba escribiendo por WhatsApp. Mientras no
              exista la pantalla de recuperacion, al menos dice la verdad. */}
          <a href="https://wa.me/51999999999?text=Olvid%C3%A9%20mi%20contrase%C3%B1a%20de%20Allpa%20Food"
             target="_blank" rel="noreferrer">
            Olvidé mi contraseña
          </a>
        </div>

        <motion.button type="submit" className="afBtn afBtn--mint"
          disabled={enviando} {...alToque}>
          {enviando ? 'Entrando…' : 'Ingresar'}
        </motion.button>
      </form>

      {/* No existia ninguna puerta de ingreso a registro: quien llegaba aqui
          sin cuenta se quedaba encerrado en esta pantalla. */}
      <p className="afAuth__pie">
        ¿Es tu primera vez? <Link to="/registro">Crea tu cuenta</Link>
      </p>
    </MarcoAuth>
  )
};

export default LoginPage;
