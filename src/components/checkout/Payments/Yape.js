import React,{ useState, useRef, useEffect } from "react";
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import TextField from '@mui/material/TextField';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// import required modules
import { EffectFade, Autoplay, Pagination, Navigation } from 'swiper/modules';

import yapeImg1 from '../../../assets/img/payment_yape_1.png';
import yapeImg2 from '../../../assets/img/payment_yape_2.png';
import yapeImg3 from '../../../assets/img/payment_yape_3.png';
import yapeImg4 from '../../../assets/img/payment_yape_4.png';
import yapeImg5 from '../../../assets/img/payment_yape_5.png';
import yapeImg6 from '../../../assets/img/payment_yape_6.png';
import yapeImg7 from '../../../assets/img/payment_yape_7.png';

import './Yape.scss';
import CheckoutPaymentFail from './FailPayment';
import { useAuthContext } from './../../../context/authContext';

const CheckoutPaymentYape = ({yapeSubmitForm,handleOpenMp,handleCloseMp,openMp,loadYape,serverFail,correoGuardado,errorCorreo}) => {

    const [yapeFormFields,setYapeFormFields] = useState({
        ynumero:'',
        yotp:'',
        ydni:'',
        ycorreo: correoGuardado || ''
    });

    const validationSchema = Yup.object().shape({
        /* El correo tampoco se pide al registrarse, y sin el la pasarela
           rechazaba el cobro entero: exige un correo para el pagador. Ademas
           es a donde va la boleta. */
        ycorreo: Yup.string()
                        .required('Ingresa tu correo para la boleta.')
                        .email('Escribe un correo válido.'),
        /* El DNI ya no se pide al registrarse —ahora el cliente entra solo con
           su telefono—, pero la boleta lo necesita, asi que se pide aqui. */
        ydni: Yup.string()
                        .required('Ingresa tu DNI para la boleta.')
                        .matches(/^[0-9]{8}$/,'El DNI tiene 8 dígitos.'),
        ynumero: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(9,'Ingrese un telefono valido por favor.')
                        .max(9,'Ingrese un telefono valido por favor.'),
        yotp: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(6,'Ingrese un telefono valido por favor.')
                        .max(6,'Ingrese un telefono valido por favor.'),
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

    const changeFields = (events) =>{
        setYapeFormFields({
            ...yapeFormFields,
            [events.target.name]:events.target.value
        })
    }



    return (
        <form className={'inlineFlex'} onSubmit={handleSubmit(yapeSubmitForm)}>
            <div className="inlineFlex yapeFormContent">
                <div className="inlineFlex yapeFormBox">
                    <Grid container spacing={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12} md={12}>
                                <div className="textFieldCheck">
                                    <p>Correo</p>
                                    <TextField
                                        id="ycorreo"
                                        name="ycorreo"
                                        type={'email'}
                                        variant="outlined"
                                        placeholder="Para enviarte tu boleta"
                                        error={errors.ycorreo || errorCorreo ? true : false}
                                        helperText={errors.ycorreo?.message || errorCorreo}
                                        {...register("ycorreo", { onChange: changeFields })}
                                        value={yapeFormFields.ycorreo}
                                    />
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={12} md={12}>
                                <div className="textFieldCheck">
                                    <p>DNI</p>
                                    <TextField
                                        id="ydni"
                                        name="ydni"
                                        type={'text'}
                                        variant="outlined"
                                        error={errors.ydni ? true : false}
                                        helperText={errors.ydni?.message}
                                        {...register("ydni", { onChange: changeFields })}
                                        value={yapeFormFields.ydni}
                                    />
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={12} md={8}>
                                <div className="textFieldCheck">
                                    <p>Numero</p>
                                    <TextField
                                        id="ynumero" 
                                        name="ynumero"
                                        type={'text'}
                                        variant="outlined" 
                                        error={errors.ynumero ? true : false}
                                        {...register("ynumero", { onChange: changeFields })} 
                                        //onFocus={handleInputFocus}
                                        value={yapeFormFields.ynumero} 
                                    />
                                </div>
                            </Grid>
                            <Grid item xs={12} sm={12} md={4}>
                                <div className="textFieldCheck">
                                    <p>Codigo de seguridad</p>
                                    <TextField
                                        id="yotp" 
                                        name="yotp"
                                        type={'text'}
                                        variant="outlined" 
                                        error={errors.yotp ? true : false}
                                        {...register("yotp", { onChange: changeFields })} 
                                        //onFocus={handleInputFocus}
                                        value={yapeFormFields.yotp} 
                                    />
                                </div>
                            </Grid>

                            {loadYape ?
                                <Grid item xs={12} sm={12} md={12}>
                                    <button type={'submit'} className="btnPrimary  btnPayment">
                                        <CircularProgress size={20} color={'white'} />
                                    </button>
                                </Grid>
                            :
                                <Grid item xs={12} sm={12} md={12}>
                                    <button type={'submit'} className="btnPrimary  btnPayment">
                                        <span>
                                            Pagar
                                        </span>
                                    </button>
                                </Grid>
                            }
                        </Grid>
                    </Grid>
                </div>
                
                <div className="inlineFlex yapeFormSwiper">
                    <Swiper
                        spaceBetween={30}
                        centeredSlides={true}
                        //effect={'fade'}
                        autoplay={{
                        delay: 2500,
                        disableOnInteraction: false,
                        }}
                        pagination={{
                        clickable: true,
                        }}
                        navigation={true}
                        modules={[EffectFade,Autoplay, Pagination, Navigation]}
                        className="yapeSwiper"
                    >
                        <SwiperSlide className={'yapeSwiperItem'}>
                            <img src={yapeImg1} alt="" />
                        </SwiperSlide>
                        <SwiperSlide className={'yapeSwiperItem'}>
                            <img src={yapeImg2} alt="" />
                        </SwiperSlide>
                        <SwiperSlide className={'yapeSwiperItem'}>
                            <img src={yapeImg3} alt="" />
                        </SwiperSlide>
                        <SwiperSlide className={'yapeSwiperItem'}>
                            <img src={yapeImg4} alt="" />
                        </SwiperSlide>
                        <SwiperSlide className={'yapeSwiperItem'}>
                            <img src={yapeImg5} alt="" />
                        </SwiperSlide>
                        <SwiperSlide className={'yapeSwiperItem'}>
                            <img src={yapeImg6} alt="" />
                        </SwiperSlide>
                        <SwiperSlide className={'yapeSwiperItem'}>
                            <img src={yapeImg7} alt="" />
                        </SwiperSlide>
                    </Swiper>
                </div>
            </div>

            <CheckoutPaymentFail 
                handleOpenMp={handleOpenMp}
                handleCloseMp={handleCloseMp}
                openMp={openMp}
                paymentMethod={false}
                serverFail={serverFail}
            />
            
        </form>
    )
};

export default CheckoutPaymentYape;
