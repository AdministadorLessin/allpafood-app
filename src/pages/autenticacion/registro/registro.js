import React,{useState,useEffect} from "react";
import './registro.scss';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';
import { mensajeError } from '../../../components/ultil/mensajeError';

import {useAuthContext} from '../../../context/authContext';

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"
import MarcoAuth, { Accion } from './../../../components/auth/Marco/MarcoAuth';
import { Bloque, alToque } from './../../../components/ultil/Motion/Motion';
import FormDatos from './../../../components/auth/FormDatos/FormDatos';
import { API_URL } from '../../../config';
import { esNativo } from '../../../nativo';

const IcoError = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.6v5M12 16.2v.2"/></svg>
);

const RegistroPage = (props) => {

    const { token, handleUpdateToken } = useAuthContext();

    const [stepItem,setStepItem] = useState(0);

    const updateFormStep = (stepItem) =>{
        const stepLs = window?.localStorage?.getItem('valfact');
        if(stepItem){
            setStepItem(stepItem)
        }else{
            if(stepLs){
                setStepItem(stepLs)
            }else{
                window.localStorage.setItem('regfrm',0);
                window.localStorage.setItem('valfact',0);
            }
        }
        
    }

    useEffect(()=>{
        updateFormStep();
    },[])

    const handleNextStep = () => {
        updateFormStep( stepItem + 1 );
    }


    // Form #1
    const [loadingValid,setLoadingVal] = useState(false);
    const [numberVerify,setNumberVerify] = useState('');
    const [codeVerify,setCodeVerify] = useState('');

    /* El numero como venga: con +51, con espacios, o copiado de un contacto.
       Antes se guardaba tal cual y el esquema exigia 9 digitos exactos, asi
       que escribirlo con el 51 delante lo dejaba en 11 y el formulario se
       negaba a enviar: la peticion no salia del navegador y el cliente se
       quedaba esperando un codigo que nunca se mando. Es el mismo arreglo que
       ya tiene "olvide mi contrasena". */
    const soloDigitos = (valor) => {
        const digitos = (valor || '').replace(/\D/g, '');
        if (digitos.length >= 11 && digitos.startsWith('51')) return digitos.slice(2, 11);
        return digitos.slice(0, 9);
    };

    const handleChangeNumber = (e) => {
        const limpio = soloDigitos(e.target.value);
        setNumberVerify(limpio);
        /* react-hook-form guarda lo que venga en el evento, asi que hay que
           decirle explicitamente el valor ya limpio: si no, valida los 11
           digitos que se escribieron y marca error sobre un campo que en
           pantalla muestra 9. */
        setValue('fValidNumber', limpio, { shouldValidate: true });
    };
    const handleChangeCode = (e) =>setCodeVerify(e.target.value);

    const validationSchema = Yup.object().shape({
        fValidNumber: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .max(9,'Ingrese un telefono valido por favor.')
                        .min(9,'Ingrese un telefono valido por favor.')
    });
    
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm({
        mode: "all",
        shouldUnregister: true,
        resolver: yupResolver(validationSchema),
    });

    
    /* Ojo con el patron de los campos: el onChange propio va DENTRO de
       register, no como prop aparte despues del spread. Puesto aparte, pisa el
       onChange que devuelve register y react-hook-form deja de enterarse de lo
       que el cliente escribe: la validacion falla siempre, aunque el campo se
       vea lleno en pantalla. */
    const [errorSendCode, setErrorSendCode] = useState();
    const onSubmitHandler = (data) => {
        
        setLoadingVal(true);

        const phoneVerify = '51' + numberVerify;
        axios.post(`${API_URL}auth/send-code`,{phoneNumber:phoneVerify })
            .then((resp)=>{
                handleUpdateToken(resp.data.data.token,resp.data.data);
                setTimeout(() => {
                    handleNextStep();
                    setLoadingVal(false);    
                }, 1000);
            }).catch((err)=>{
                console.log('error',err)
                // El loader se libera SIEMPRE. Antes solo ocurria dentro del
                // if del 409: con un 500, un timeout o la red caida, el boton
                // quedaba girando para siempre y el registro moria ahi.
                setLoadingVal(false);

                // Tres fallos encadenados hacian que el cliente NUNCA viera el
                // motivo real. Uno: axios 1.7 no expone err.status —eso llego
                // en la 1.8—, asi que la rama del 409 no entraba nunca. Dos:
                // el loader no se liberaba fuera del 409. Tres: este endpoint
                // devuelve el mensaje envuelto en {data:{message}}, y leerlo
                // como {message} sacaba en pantalla la etiqueta "Conflict".
                setErrorSendCode(mensajeError(
                    err, 'No pudimos enviar el código. Inténtalo de nuevo en un momento.'));
            })
        
    };

    const [errorVerifyCode,setErrorVerifyCode] = useState();

    /* Reenviar el codigo sin salir de esta pantalla ni volver a escribir el
       numero. Antes este boton solo retrocedia de paso, y el servidor rechazaba
       el segundo pedido mientras el codigo anterior siguiera vigente: quien no
       recibia el mensaje se quedaba sin ninguna salida durante diez minutos.
       Ojo con el token: al reenviar, el servidor borra el usuario a medio
       verificar y crea otro, asi que devuelve un token nuevo. Si no se guarda,
       "Verificar" seguiria usando el viejo, que ya apunta a un usuario que no
       existe. */
    const [reenviando,setReenviando] = useState(false);
    const [avisoReenvio,setAvisoReenvio] = useState('');
    const [esperaReenvio,setEsperaReenvio] = useState(0);

    useEffect(()=>{
        if(esperaReenvio <= 0) return undefined;
        const t = setTimeout(()=> setEsperaReenvio(esperaReenvio - 1), 1000);
        return ()=> clearTimeout(t);
    },[esperaReenvio]);

    const reenviarCodigo = () =>{
        if(reenviando || esperaReenvio > 0) return;
        setReenviando(true);
        setAvisoReenvio('');
        setErrorVerifyCode();

        axios.post(`${API_URL}auth/send-code`,{ phoneNumber: '51' + numberVerify })
            .then((resp)=>{
                handleUpdateToken(resp.data.data.token, resp.data.data);
                setReenviando(false);
                setEsperaReenvio(60);
                setAvisoReenvio('Listo, te mandamos otro código.');
            }).catch((err)=>{
                setReenviando(false);
                // Tambien se espera tras un fallo: si el servidor pide esperar,
                // insistir de inmediato solo repite el mismo rechazo.
                setEsperaReenvio(60);
                setErrorVerifyCode(mensajeError(
                    err, 'No pudimos reenviar el código. Inténtalo en un momento.'));
            });
    };
    const sendCode = () =>{
        setLoadingVal(true)
        axios.post(`${API_URL}register/verify-code`,
            {
                code:codeVerify
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            })
            .then((resp)=>{
                setTimeout(() => {
                    setLoadingVal(false)
                    updateFormStep(2);
                }, 1000);
            }).catch((err)=>{
                setLoadingVal(false);
                // Antes solo contemplaba el 500: si el codigo era incorrecto
                // (400) no se mostraba absolutamente nada.
                setErrorVerifyCode(mensajeError(
                    err, 'El código no es válido. Revísalo e inténtalo de nuevo.'));
            })
    }

    const paso = Number(stepItem) || 0;

    /* El codigo en el app: seis cajas y un solo campo invisible encima. Asi
       el telefono puede rellenarlo desde el mensaje y pegar funciona, que con
       seis campos sueltos no pasa. Solo cambia como se ve: el valor es el
       mismo codeVerify de siempre. */
    const alEscribirCodigo = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        handleChangeCode(e);
    };
    const numeroBonito = numberVerify
        ? `+51 ${numberVerify.replace(/(\d{3})(?=\d)/g, '$1 ')}`
        : '';

    const cuerpo = (
        <div className={loadingValid ? 'afAuth__ocupado' : undefined}>

        { paso === 0 ?
            <>
                {esNativo ?
                    <h1 className="afAuth__titular">Tu número y listo</h1>
                :
                    <h1 className="afAuth__titular">
                        <span className="t1">Empecemos por</span>
                        tu número
                    </h1>
                }
                <p className="afAuth__bajada">
                    Te mandamos un código por WhatsApp para confirmar que eres tú.
                    Es lo único que necesitas para empezar.
                </p>

                <form id="afFormNumero" onSubmit={handleSubmit(onSubmitHandler)}>
                    <div className="afCampo afCampo--grande">
                        <TextField 
                            id="fValidNumber"
                            name="fValidNumber" 
                            /* 'tel' y no 'number': el campo numerico
                               acepta signos y notacion cientifica, y
                               en algunos telefonos se come lo pegado
                               desde los contactos. */
                            type='tel'
                            inputMode="numeric"
                            autoComplete="tel-national"
                            /* En el app, la etiqueta encima, un ejemplo
                               de como se escribe y el +51 a la vista. */
                            label={esNativo ? 'Celular' : undefined}
                            placeholder={esNativo ? '987 654 321' : '963 987 654'}
                            InputProps={esNativo ? { startAdornment: <span className="afNat__prefijo">+51</span> } : undefined}
                            error={errors.fValidNumber ? true : false}
                            {...register("fValidNumber", { onChange: handleChangeNumber })}
                            value={numberVerify} 
                            variant="outlined"
                        />
                    </div>

                    {errors.fValidNumber &&
                        <div className="afAuth__error">
                            <IcoError />
                            Son los 9 dígitos de tu celular. El +51 lo ponemos nosotros.
                        </div>
                    }
                    {errorSendCode &&
                        <div className="afAuth__error">
                            <IcoError />
                            {errorSendCode}
                        </div>
                    }

                </form>

                <Accion>
                    <motion.button type="submit" form="afFormNumero"
                        className="afBtn afBtn--mint" {...alToque}>
                        {loadingValid ? 'Enviando…' : 'Enviarme el código'}
                    </motion.button>

                    <p className="afAuth__pie">
                        ¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link>
                    </p>
                </Accion>
            </>

        : paso === 1 ?
            <>
                {esNativo ?
                    <>
                        <h1 className="afAuth__titular">Te llegó un código</h1>
                        <p className="afAuth__bajada">
                            Lo enviamos {numeroBonito ? `al ${numeroBonito}` : 'a tu WhatsApp'}. Vale por 10 minutos.
                        </p>
                    </>
                :
                    <>
                        <h1 className="afAuth__titular">
                            <span className="t1">Te llegó un código a</span>
                            {numberVerify ? `+51 ${numberVerify}` : 'tu WhatsApp'}
                        </h1>
                        <p className="afAuth__bajada">
                            Vale por 10 minutos. Escríbelo aquí y seguimos.
                        </p>
                    </>
                }

                {esNativo ?
                    <label className="rg__codigo">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <span key={i} aria-hidden="true"
                                  className={i === Math.min(String(codeVerify).length, 5) ? 'is-aqui' : undefined}>
                                {String(codeVerify)[i] || ''}
                            </span>
                        ))}
                        <input
                            id="fValidCode"
                            name="fValidCode"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            autoFocus
                            aria-label="Código de 6 dígitos"
                            onChange={alEscribirCodigo}
                            value={codeVerify}
                        />
                    </label>
                :
                    <div className="afCampo afCampo--grande">
                        <TextField 
                            id="fValidCode"
                            name="fValidCode" 
                            type='number'
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            onChange={handleChangeCode} 
                            value={codeVerify} 
                            variant="outlined"
                        />
                    </div>
                }

                {errorVerifyCode &&
                    <div className="afAuth__error">
                        <IcoError />
                        {errorVerifyCode}
                    </div>
                }

                {/* En el app, reenviar va junto al codigo y no en el pie:
                    abajo queda un solo boton. */}
                {esNativo &&
                    <p className="rg__reenviar">
                        {avisoReenvio ? `${avisoReenvio} ` : '¿No te llegó? '}
                        <button type="button" onClick={reenviarCodigo}
                                disabled={reenviando || esperaReenvio > 0}>
                            {reenviando ? 'Reenviando…'
                                : esperaReenvio > 0 ? `Reenviar en ${esperaReenvio} s`
                                : 'Reenviar el código'}
                        </button>
                    </p>
                }

                <Accion>
                    <motion.button type="button" onClick={sendCode}
                        className="afBtn afBtn--mint" {...alToque}>
                        {loadingValid ? 'Verificando…' : 'Verificar'}
                    </motion.button>

                    {!esNativo &&
                        <p className="afAuth__pie">
                            {avisoReenvio ? `${avisoReenvio} ` : '¿No te llegó? '}
                            <button type="button" onClick={reenviarCodigo}
                                    disabled={reenviando || esperaReenvio > 0}>
                                {reenviando ? 'Reenviando…'
                                    : esperaReenvio > 0 ? `Reenviar en ${esperaReenvio}s`
                                    : 'Reenviar el código'}
                            </button>
                        </p>
                    }
                </Accion>
            </>

        :
            <>
                {esNativo ?
                    <h1 className="afAuth__titular">Número confirmado. Ahora, tus datos</h1>
                :
                    <h1 className="afAuth__titular">
                        <span className="t1">Número confirmado.</span>
                        Ahora, tus datos
                    </h1>
                }
                <p className="afAuth__bajada">
                    Con esto creamos tu cuenta y podemos emitir tus comprobantes.
                </p>
                <FormDatos telefono={numberVerify ? numberVerify : null} />
            </>
        }

        </div>
    );

    return (
        <MarcoAuth
            fase="cuenta"
            paso={paso}
            volver={paso === 1 ? () => updateFormStep(0) : undefined}
            /* Con el numero ya confirmado la cuenta esta a medio crear: volver
               desde "tus datos" dejaria al cliente en una pantalla que ya no
               le sirve. */
            sinVolver={paso === 2}
        >
            {/* En el app el cambio de paso lo anima el marco: el nuevo entra
                desde la derecha y el anterior sale a la izquierda. */}
            {esNativo ? cuerpo :
                <AnimatePresence mode="wait">
                    <motion.div
                        key={paso}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {cuerpo}
                    </motion.div>
                </AnimatePresence>
            }
        </MarcoAuth>
    )
};

export default RegistroPage;
