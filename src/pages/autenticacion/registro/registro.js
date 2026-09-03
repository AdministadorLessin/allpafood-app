import React,{useState,useEffect} from "react";
import './registro.scss';
import TextField from '@mui/material/TextField';

import logoAllpafood2 from '../../../assets/img/logo_allpafood.png';

import icoUser from '../../../assets/img/ico_usuario_white.svg';
import icoFacebook from '../../../assets/img/ico_facebook.svg';
import icoGoogle from '../../../assets/img/ico_google.svg';

import DoDisturbIcon from '@mui/icons-material/DoDisturb';


import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';

import {useAuthContext} from '../../../context/authContext';

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"
import LayoutTransition from './../../../components/LayoutTransition/LayoutTransition';
import FormDatos from './../../../components/auth/FormDatos/FormDatos';
import Backdrop from './../../../components/ultil/Backdrop/Backdrop';
import RegistroSidebar from './../../../components/Registro/Sidebar/Sidebar';

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
        // console.log('token show',token);
        updateFormStep();
    },[])

    const handleNextStep = () => {
        //setStepItem(stepItem + 1);
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
        axios.post('http://localhost:8443/api-af/v1/auth/send-code',{phoneNumber:phoneVerify })
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

                if(err.status === 409){
                    setErrorSendCode(err.response.data);
                }else if(!err.response){
                    setErrorSendCode({ data: { message: 'No pudimos conectarnos. Revisa tu internet e intentalo de nuevo.' } });
                }else{
                    setErrorSendCode({ data: { message: 'No pudimos enviar el codigo. Intentalo de nuevo en un momento.' } });
                }
            })
        
    };

    const [errorVerifyCode,setErrorVerifyCode] = useState();
    const sendCode = () =>{
        setLoadingVal(true)
        axios.post('http://localhost:8443/api-af/v1/register/verify-code',
            {
                code:codeVerify
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            })
            .then((resp)=>{
                setTimeout(() => {
                    setLoadingVal(false)
                    //setStepItem(2);  
                    updateFormStep(2);
                }, 1000);
            }).catch((err)=>{
                setLoadingVal(false);
                // Antes solo contemplaba el 500: si el codigo era incorrecto
                // (400) no se mostraba absolutamente nada.
                if(err.response){
                    setErrorVerifyCode(err.response);
                }else{
                    setErrorVerifyCode({ data: { message: 'No pudimos conectarnos. Revisa tu internet e intentalo de nuevo.' } });
                }
            })
    }


    return (
        <LayoutTransition keytst={'123123asdaasdasdadda'}>
            <Backdrop/>
            <main className="inlineFlex registerPage">
                <RegistroSidebar />

                <div className="registerPageResp">
                    <img src={logoAllpafood2} alt="" />
                </div>
                
                <div className='regCont'>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={stepItem === 0 ? stepItem : "empty"}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={'regVerify'}
                        >
                            { stepItem === 0 ?
                                <div className={loadingValid ?'inlineBlock  disableForms' :'inlineBlock '}>
                                    <div className="title">
                                        <h2>Estas a unos pasos de registrarte</h2>
                                        <p>Te damos la bienvenida a <strong>Allpafood</strong>. Ingresa y conoce <br />nuestros planes de comida</p>
                                    </div>

                                    <form className={'inlineFlex textfieldVerify'} onSubmit={handleSubmit(onSubmitHandler)}>
                                        <p>¿Cuál es tu teléfono?</p>
                                        <TextField 
                                            id="outlined-basic" 
                                            name="fValidNumber" 
                                            type='number' 
                                            placeholder={'Ejem: 963 987 654'}
                                            error={errors.fValidNumber ? true : false}
                                            {...register("fValidNumber")} 
                                            onChange={handleChangeNumber} 
                                            value={numberVerify} 
                                            variant="outlined"
                                            
                                        />
                                        {errors.fValidNumber && (
                                            <div className="verifyPhoneError">
                                                <DoDisturbIcon />
                                                {errors.fValidNumber.message}
                                            </div>
                                        )}
                                        {errorSendCode &&
                                            <div className="verifyPhoneError">
                                                <DoDisturbIcon />
                                                {errorSendCode?.data?.message || 'No pudimos enviar el codigo. Intentalo de nuevo.'}
                                            </div>
                                        }
                                        <small>Envíaremos un código de verificación a tu número celular para validar que eres tu.</small>
                                        <button href="#" type={'submit'}  className="btnPrimary btnIcon">
                                            <span>
                                                <img src={icoUser} alt="" />
                                                Enviar mensaje
                                            </span>
                                        </button>
                                    </form>
                        
                                    {false &&
                                        <div className="inlineFlex regSocial">
                                            <div className="inlineFlex regSocialDiv">
                                                <span></span>
                                            </div>
                                            <a href="#" className="btnPrimary btnIcon btnIconRight btnFb">
                                                <span>
                                                    Continuar con
                                                    <img src={icoFacebook} alt="" />
                                                </span>
                                            </a>
                                            <a href="http://api.allpafood.com:8080/api-af/v1/oauth2/authorization/google" className="btnPrimary btnIcon btnIconRight btnGoogle">
                                                <span>
                                                    Continuar con
                                                    <img src={icoGoogle} alt="" />
                                                </span>
                                            </a>
                                        </div>
                                    }

                                </div>

                            :stepItem === 1 ?
                                <div className={loadingValid ?'inlineBlock  disableForms' :'inlineBlock'}>
                                    <div className="title" onClick={()=>setLoadingVal(false)}>
                                        <h2>Valide su codigo por favor.</h2>
                                        <p>El codigo es valido por 15 minutos. si no le llego puede <div className={'backStep'} onClick={()=>updateFormStep(0)}>volver a enviarlo</div></p>
                                    </div>

                                    <div className={'inlineFlex textfieldVerify'} >
                                        <p>Ingrese el codigo de verificación por favor</p>
                                        <TextField 
                                            id="outlined-basic" 
                                            name="fValidCode" 
                                            type='number' 
                                            onChange={handleChangeCode} 
                                            value={codeVerify} 
                                            variant="outlined"
                                        />
                                        
                                        {errorVerifyCode &&
                                            <div className="verifyPhoneError">
                                                <DoDisturbIcon />
                                                {errorVerifyCode?.data?.message || 'El codigo no es valido. Revisalo e intentalo de nuevo.'}
                                            </div>
                                        }
                                        <button onClick={sendCode} className="btnPrimary btnIcon">
                                            <span>
                                                <img src={icoUser} alt="" />
                                                Verificar
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            :
                                <div className="inlineBlock regVerify regDatos">
                                    <div className="title">
                                        <h2>Ya confirmamos su teléfono</h2>
                                        <p>Necesitamos algunos datos para continuar y personalizar tu plan de comidas.</p>
                                    </div>
                                    <FormDatos telefono={numberVerify ? numberVerify : null} />
                                </div>
                                
                            }
                        </motion.div>
                    </AnimatePresence >
                </div>
            </main>
        </LayoutTransition >
    )
};

export default RegistroPage;
