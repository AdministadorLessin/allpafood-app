import React,{useState,useEffect} from "react";
import './registro.scss';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';

import {useAuthContext} from '../../../context/authContext';

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"
import MarcoAuth from './../../../components/auth/Marco/MarcoAuth';
import { Bloque, alToque } from './../../../components/ultil/Motion/Motion';
import FormDatos from './../../../components/auth/FormDatos/FormDatos';
import { API_URL } from '../../../config';

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

    const handleChangeNumber = (e) =>setNumberVerify(e.target.value);
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
    } = useForm({
        mode: "all",
        shouldUnregister: true,
        resolver: yupResolver(validationSchema),
    });

    
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

                // Dos fallos encadenados hacian que el cliente NUNCA viera el
                // motivo real. Uno: axios 1.7 no expone err.status —eso llego
                // en la 1.8—, asi que la rama del 409 no entraba nunca. Dos:
                // el cuerpo del 409 es {message}, y se leia como
                // {data:{message}}, asi que tampoco se habria visto.
                // Resultado: "no pudimos enviar el codigo" tapando mensajes
                // utiles como "este numero esta pendiente de verificacion".
                if (!err.response) {
                    setErrorSendCode('No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.');
                } else if (err.response.status === 409 && err.response.data?.message) {
                    setErrorSendCode(err.response.data.message);
                } else {
                    setErrorSendCode('No pudimos enviar el código. Inténtalo de nuevo en un momento.');
                }
            })
        
    };

    const [errorVerifyCode,setErrorVerifyCode] = useState();
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
                if (!err.response) {
                    setErrorVerifyCode('No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.');
                } else {
                    setErrorVerifyCode(err.response.data?.message
                        || 'El código no es válido. Revísalo e inténtalo de nuevo.');
                }
            })
    }

    const paso = Number(stepItem) || 0;

    return (
        <MarcoAuth
            fase="cuenta"
            paso={paso}
            volver={paso === 1 ? () => updateFormStep(0) : undefined}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={paso}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className={loadingValid ? 'afAuth__ocupado' : undefined}>

                    { paso === 0 ?
                        <>
                            <h1 className="afAuth__titular">
                                <span className="t1">Empecemos por</span>
                                tu número
                            </h1>
                            <p className="afAuth__bajada">
                                Te mandamos un código por WhatsApp para confirmar que eres tú.
                                Es lo único que necesitas para empezar.
                            </p>

                            <form onSubmit={handleSubmit(onSubmitHandler)}>
                                <div className="afCampo afCampo--grande">
                                    <TextField 
                                        id="fValidNumber"
                                        name="fValidNumber" 
                                        type='number'
                                        inputMode="numeric"
                                        autoComplete="tel-national"
                                        placeholder={'963 987 654'}
                                        error={errors.fValidNumber ? true : false}
                                        {...register("fValidNumber")} 
                                        onChange={handleChangeNumber} 
                                        value={numberVerify} 
                                        variant="outlined"
                                    />
                                </div>

                                {errors.fValidNumber &&
                                    <div className="afAuth__error">
                                        <IcoError />
                                        Escribe tus 9 dígitos, sin el código de país.
                                    </div>
                                }
                                {errorSendCode &&
                                    <div className="afAuth__error">
                                        <IcoError />
                                        {errorSendCode}
                                    </div>
                                }

                                <motion.button type="submit" className="afBtn afBtn--mint" {...alToque}>
                                    {loadingValid ? 'Enviando…' : 'Enviarme el código'}
                                </motion.button>
                            </form>

                            <p className="afAuth__pie">
                                ¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link>
                            </p>
                        </>

                    : paso === 1 ?
                        <>
                            <h1 className="afAuth__titular">
                                <span className="t1">Te llegó un código a</span>
                                {numberVerify ? `+51 ${numberVerify}` : 'tu WhatsApp'}
                            </h1>
                            <p className="afAuth__bajada">
                                Vale por 15 minutos. Escríbelo aquí y seguimos.
                            </p>

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

                            {errorVerifyCode &&
                                <div className="afAuth__error">
                                    <IcoError />
                                    {errorVerifyCode}
                                </div>
                            }

                            <motion.button type="button" onClick={sendCode}
                                className="afBtn afBtn--mint" {...alToque}>
                                {loadingValid ? 'Verificando…' : 'Verificar'}
                            </motion.button>

                            <p className="afAuth__pie">
                                ¿No te llegó? <button type="button" onClick={()=>updateFormStep(0)}>Reenviar el código</button>
                            </p>
                        </>

                    :
                        <>
                            <h1 className="afAuth__titular">
                                <span className="t1">Número confirmado.</span>
                                Ahora, tus datos
                            </h1>
                            <p className="afAuth__bajada">
                                Con esto creamos tu cuenta y podemos emitir tus comprobantes.
                            </p>
                            <FormDatos telefono={numberVerify ? numberVerify : null} />
                        </>
                    }

                    </div>
                </motion.div>
            </AnimatePresence>
        </MarcoAuth>
    )
};

export default RegistroPage;
