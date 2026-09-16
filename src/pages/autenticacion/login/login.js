import React,{ useState, useEffect } from "react";
import './login.scss';

import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import Recuperar from './Recuperar';

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
      
  /**
 * Deja el usuario como esta guardado en la base.
 *
 * Los telefonos se guardan con el 51 adelante, y nadie escribe su celular
 * asi: la busqueda es por igualdad exacta, de modo que "987654321" no
 * encontraba a nadie. El correo se deja tal cual, que la base no distingue
 * mayusculas.
 */
const normalizarUsuario = (valor) => {
  const v = (valor || '').trim();
  if (v.includes('@')) return v;
  const digitos = v.replace(/\D/g, '');
  if (digitos.length === 9 && digitos.startsWith('9')) return `51${digitos}`;
  return digitos || v;
};

const validationSchema = Yup.object().shape({

    /* Correo O celular. El servidor autentica por cualquiera de los dos desde
       siempre; era esta validacion la que obligaba al correo. Hay clientes que
       no quieren dar su correo, y otros que dieron uno equivocado al migrar:
       para ellos el celular es el unico dato que si es suyo. */
    lfcorreo: Yup.string()
      .required('Escribe tu celular.')
      .test('celular', 'Escribe tu celular de 9 dígitos.',
        (valor) => {
          const v = (valor || '').trim();
          if (v.includes('@')) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
          const digitos = v.replace(/\D/g, '');
          return (digitos.length === 9 && digitos.startsWith('9'))
              || (digitos.length === 11 && digitos.startsWith('519'));
        }),
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
  // 'entrar' o 'recuperar'. Misma ruta: quien olvido su clave no deberia
  // perder de vista donde estaba.
  const [modo,setModo] = useState('entrar');

  const sendData = () =>{
    setEnviando(true);
    setErrorAxios(false);
    axios.post(`${API_URL}auth/login`,
        {
          username: normalizarUsuario(bodyFields.lfcorreo),
          password:bodyFields.lfpassword
        }).then((resp)=>{
          if(resp.status === 200){

            let userDate = resp.data.data;

            userDate.log = normalizarUsuario(bodyFields.lfcorreo);
            handleUpdateToken(resp.data.data.token,userDate);

            /* Cada rol a su casa. Un motorizado no tiene plan, asi que al
               mandarlo a '/' el panel del cliente no encontraba ninguno y lo
               rebotaba a comprar uno: parecia que su cuenta no servia. */
            navigate(userDate.role === 'DELIVERY' ? '/motorizado' : '/')
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

      {modo === 'recuperar' ? (
        <Recuperar
          volver={() => setModo('entrar')}
          telefonoInicial={bodyFields ? bodyFields.lfcorreo : ''}
        />
      ) : (
      <form onSubmit={handleSubmit(onSubmitHandler)}
            className={enviando ? 'afAuth__ocupado' : undefined}>
        <div className="afCampo">
          <TextField 
            label="Celular" 
            variant="filled"
            id="lfcorreo" 
            name="lfcorreo" 
            type="text"
            inputMode="numeric"
            autoComplete="username"
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
            Los datos no coinciden. Revisa tu correo o celular y tu contraseña.
          </div>
        }

        <div className="afLogin__opts">
          <FormGroup>
            <FormControlLabel control={<Checkbox size="small" />} label="Recordarme 30 días" />
          </FormGroup>
          {/* Antes esto abria un chat de WhatsApp y alguien tenia que cambiar
              la clave a mano en la base. Ahora el cliente lo resuelve solo. */}
          <button type="button" className="afEnlace" onClick={() => setModo('recuperar')}>
            Olvidé mi contraseña
          </button>
        </div>

        <motion.button type="submit" className="afBtn afBtn--mint"
          disabled={enviando} {...alToque}>
          {enviando ? 'Entrando…' : 'Ingresar'}
        </motion.button>
      </form>
      )}

      {/* No existia ninguna puerta de ingreso a registro: quien llegaba aqui
          sin cuenta se quedaba encerrado en esta pantalla. */}
      <p className="afAuth__pie">
        ¿Es tu primera vez? <Link to="/registro">Crea tu cuenta</Link>
      </p>
    </MarcoAuth>
  )
};

export default LoginPage;
