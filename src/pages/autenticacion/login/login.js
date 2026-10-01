import React,{ useState, useEffect } from "react";
import './login.scss';

import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';

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
import { useVerClave } from '../../../components/ultil/VerClave';

const IcoError = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.6v5M12 16.2v.2"/></svg>
);

const LoginPage = (props) => {

  const verClave = useVerClave();  
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

/* El celular vale con 9 digitos, o con el 51 delante, o tal como lo tenga
   guardado quien lo dio de alta. Antes solo se aceptaban 9: los motorizados
   estan cargados con 10 y 11 digitos, asi que el formulario ni siquiera los
   dejaba apretar "entrar". */
const pareceCelular = (digitos) =>
  (digitos.length === 9 && digitos.startsWith('9'))
  || (digitos.length === 10 && digitos.startsWith('9'))
  || (digitos.length === 11 && digitos.startsWith('51'));

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
          return pareceCelular(v.replace(/\D/g, ''));
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
            if (userDate.role === 'DELIVERY') {
              navigate('/motorizado');
            } else if (userDate.mustChangePassword) {
              /* Entro con la clave que le pusimos en la carga masiva: elige la
                 suya antes de ver nada. */
              navigate('/cambiar-clave');
            } else {
              navigate('/');
            }
          }
          
        }).catch((error) =>{
          console.log(error)
          setEnviando(false);
          /* El servidor distingue "clave incorrecta" de "cuenta sin verificar",
             y aqui se mostraba siempre lo mismo: "revisa tu contraseña". Quien
             tenia la cuenta sin verificar volvia a escribir la clave una y otra
             vez —nunca iba a entrar asi— y terminaba escribiendo a soporte
             convencido de que la plataforma estaba caida. */
          setErrorAxios(error?.response?.data?.message || true);
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

      {/* Se llega aqui desde una sesion vencida. Sin este aviso, el cliente
          cree que el app lo boto y vuelve a escribir por WhatsApp. */}
      {typeof window !== 'undefined' && window.location.search.includes('sesion=vencida') &&
        <div className="afAuth__aviso">
          Por seguridad cerramos tu sesión. Vuelve a entrar con tu celular y tu contraseña.
        </div>
      }

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
            type={verClave.type}
            InputProps={verClave.InputProps}
            autoComplete="current-password"
            value={bodyFields ? bodyFields.lfpassword : ''}
            error={errors.lfpassword ? true : false}
            {...register("lfpassword", { onChange: handleFieldChange })}
          />
        </div>

        {errorAxios &&
          <div className="afAuth__error">
            <IcoError />
            {typeof errorAxios === 'string'
              ? errorAxios
              : 'Los datos no coinciden. Revisa tu correo o celular y tu contraseña.'}
          </div>
        }

        <div className="afLogin__opts">
          <FormGroup>
            {/* Era una casilla sin estado ni efecto: la sesion dura 30 dias
                siempre, marcara lo que marcara. Peor aun, quien la dejaba sin
                marcar creia que por eso lo sacaba el sistema. Ahora lo dice. */}
            <span className="afLogin__dura">Tu sesión dura 30 días</span>
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
        ¿Es tu primera vez? <Link to="/empezar">Ver mi plan</Link>
      </p>
    </MarcoAuth>
  )
};

export default LoginPage;
