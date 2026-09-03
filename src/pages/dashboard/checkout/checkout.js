import React,{useState,useEffect} from "react";
import Modal from '@mui/material/Modal';

import './checkout.scss';

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';

import Grid from '@mui/material/Grid';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

import icoMenu from '../../../assets/img/icon_notify.svg';
import iconPayment from '../../../assets/img/ico_checkout_payment.png';
import iconTotal from '../../../assets/img/ico_checkout_total.png';

import CloseIcon from '@mui/icons-material/Close';

import 'react-credit-cards-2/dist/es/styles-compiled.css';

import icoVisa from '../../../assets/img/ico_payment_visa.svg';
import icoAmericanExpress from '../../../assets/img/ico_payment_americanexpress.svg';
import icoMasterCard from '../../../assets/img/ico_payment_mastercard.svg';
import icoDiner from '../../../assets/img/ico_payment_diner.svg';

import icoYape from '../../../assets/img/ico_payment_yape.png';

import axios from 'axios';

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import icoProte from '../../../assets/img/ico_prote.png';
import icoCarbo from '../../../assets/img/ico_carbo.png';
import icoGrasas from '../../../assets/img/ico_grasas.png';
import icoCalorias from '../../../assets/img/ico_cal.png';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import { useRef } from 'react';


import SecurityIcon from '@mui/icons-material/Security';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import SchoolIcon from '@mui/icons-material/School';

import {useAuthContext} from '../../../context/authContext';

import { useNavigate } from "react-router-dom";
import LoaderPayment from './../../../components/auth/FormPerfil/LoaderMacros/LoaderPayment';
import CheckoutPaymentYape from './../../../components/checkout/Payments/Yape';
import CheckoutPaymentCard from './../../../components/checkout/Payments/CreditCard';

// Adicionales Icos
import icoCheckEntrada from '../../../assets/img/ico_check_entrada.png';
import icoCheckProteina from '../../../assets/img/ico_check_proteina.png';
import icoCheckSnack from '../../../assets/img/ico_check_snack.png';
import icoCheckFruta from '../../../assets/img/ico_check_fruta.png';
import icoCheckDesayuno from '../../../assets/img/ico_check_desayuno.png';

// Clave de idempotencia del pago. Debe ser ESTABLE durante todo el intento de
// compra: es lo que impide que un reintento o un doble clic se cobre dos veces.
// Antes se generaba un uuid nuevo en cada envio (con faker, ademas una
// dependencia de desarrollo), lo que anulaba esa proteccion.
const newRequestId = () =>
  (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : `af-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;


const CheckoutPage = (props) => {

    let navigate = useNavigate();

    const aditionalList = [      
        {
            id:'ad01',
            name:'Desayunos',
            type: "breakfast",
            unitPrice: 12.5,
            monthlyPrice: 250.0,
            amount:1,
            price: 250.0,
            prevPrice: 260.0,
            properties:[
                {
                    name:'calorias',
                    value:0,
                },
                {
                    name: 'carbo',
                    value: 0,
                },
                {
                    name: 'grasas',
                    value: 0,
                },
                {
                    name: 'proteinas',
                    value: 0,
                }
            ]
        },
        {
            id:'ad02',
            name:'Snacks',
            type: "snacks",
            unitPrice: 4.5,
            monthlyPrice: 89.9,
            amount: 1,
            price: 89.9,
            prevPrice: 100.0,
            properties:[
                {
                    name:'calorias',
                    value:0,
                },
                {
                    name: 'carbo',
                    value: 0,
                },
                {
                    name: 'grasas',
                    value: 0,
                },
                {
                    name: 'proteinas',
                    value: 0,
                }
            ]
        },
        {
            id:'ad03',
            name:'Frutas',
            type: "fruits",
            unitPrice: 1.75,
            monthlyPrice: 35.0,
            amount:1,
            price: 35.0,
            prevPrice: 45.0,
            properties:[
                {
                    name:'calorias',
                    value:0,
                },
                {
                    name: 'carbo',
                    value: 0,
                },
                {
                    name: 'grasas',
                    value: 0,
                },
                {
                    name: 'proteinas',
                    value: 0,
                }
            ]
        },
        {
            id:'ad04',
            name:'Entrada',
            type: "starters",
            unitPrice: 6.0,
            monthlyPrice: 120.0,
            amount:1,
            price: 120.0,
            prevPrice: 130.0,
            properties:[
                {
                    name:'calorias',
                    value:0,
                },
                {
                    name: 'carbo',
                    value: 0,
                },
                {
                    name: 'grasas',
                    value: 0,
                },
                {
                    name: 'proteinas',
                    value: 0,
                }
            ]
        },
        {
            id:'ad05',
            name:'Doble Proteina',
            type: "doubleprotein",
            unitPrice: 6.0,
            monthlyPrice: 120.0,
            amount:1,
            price: 120.0,
            prevPrice: 130.0,
            properties:[
                {
                    name:'calorias',
                    value:0,
                },
                {
                    name: 'carbo',
                    value: 0,
                },
                {
                    name: 'grasas',
                    value: 0,
                },
                {
                    name: 'proteinas',
                    value: 0,
                }
            ]
        }
    ];

    const { token,cartItems, cartAdicionales, planInfo, addItemAdToCart, deleteItemAdToCart, emptyCart, removeLocalstorage } = useAuthContext();

    // Se crea una sola vez por montaje del checkout y sobrevive a los reintentos.
    const requestIdRef = useRef(newRequestId());

    // Direccion de facturacion: la que el cliente ya registro como entrega.
    // Antes iba quemada como 'av test' en todas las facturas.
    const invoiceAddress = {
        address: planInfo?.profile?.address || planInfo?.profile?.descriptionAddress || '',
        description: planInfo?.profile?.descriptionAddress || planInfo?.profile?.district || '',
    };

    const [paymentMetod,setPaymentMetod] = useState();

    const changePayment = (payment) => {
        setPaymentMetod(payment);
    }

    const validationSchema = Yup.object().shape({
        number: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(13,'Ingrese un telefono valido por favor.')
                        .max(20,'Ingrese un telefono valido por favor.'),
        expiry: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(3,'Ingrese un telefono valido por favor.')
                        .max(15,'Ingrese un telefono valido por favor.'),
        cvc: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(3,'Ingrese un telefono valido por favor.')
                        .max(3,'Ingrese un telefono valido por favor.'),
        name: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.')
                        .max(150,'Ingrese un telefono valido por favor.'),
        email: Yup.string().required('ingrese un correo valido').email().matches(/^(?!.*@[^,]*,)/),
        direccion: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.')
                        .max(250,'Ingrese un telefono valido por favor.'),
        dirdes: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.')
                        .max(250,'Ingrese un telefono valido por favor.'),
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


    // Modal
    const [showLoaderPayment, setShowLoaderPayment] = useState(false);

    // NOTA: aqui vivia un onSubmitHandler que mandaba un paymentToken falso
    // (faker) y paymentMethodId 'yape' quemado. Se pasaba como prop
    // cardSubmitForm, pero CheckoutPaymentCard nunca la recibia: era codigo
    // muerto. El cobro con tarjeta lo hace CreditCard.js con el token real
    // del SDK de MercadoPago.

    const [openMp, setOpenMp] = useState(false);
    const [serverFail, setServerFail] = useState(false);
    const handleOpenMp = () => {
        setOpenMp(true);
    };

    const handleCloseMp = () => {
        setOpenMp(false);
    };

    const [loadYape,setLoadYape] = useState(false);
    const onSubmitHandlerYape = (data) =>{

        const aditionalsTmp = cartAdicionales.map(item => item.type);

        setLoadYape(true);
        const adicionalesList = []
        if(cartAdicionales && cartAdicionales.length > 0){
            cartAdicionales.map((item,index)=>{
                adicionalesList.push(item.id);
            })
        }

        axios.post('https://api.allpafood.com/dev/api-af/v1/subscriptions/payments/secure/tokens/mercadopago/yape',{
            phone: data.ynumero,
            otp: data.yotp,
            requestId: requestIdRef.current
        },
        {
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{
            axios.post('https://api.allpafood.com/dev/api-af/v1/invoice/create',
                {
                    //complementsId: adicionalesList,
                    additional: aditionalsTmp,
                    planId: parseFloat(cartItems[0].id),
                    paymentMethodType: paymentMetod,
                    paymentMethodId: 'yape',
                    paymentToken: resp.data.data.token,
                    invoiceAddress
                },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }).then((resp)=>{
                //handleOpen();
                // Scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                setShowLoaderPayment(true);
                // Mismo caso que en la tarjeta: si el boton de Yape vuelve durante
                // los 7 segundos de LoaderPayment, un segundo envio recibe 409 y el
                // cliente ve "no procesamos tu pago" con el cobro ya hecho.
                
                const planInfoT=  JSON.parse(window.localStorage.getItem('inf'))
                const baseUrl = 'https://admin-landing.allpafood.com/';
                const emailBody = {
                    "nombres": planInfoT?.profile?.name,
                    "correo": planInfoT?.log,
                    "_wpcf7_unit_tag": "b7d1857"
                };
                
                const form = new FormData();
                for (const field in emailBody) {
                    form.append(field, emailBody[field]);
                }

                axios.post(baseUrl+ 'wp-json/contact-form-7/v1/contact-forms/55/feedback',form).then((resp)=>{
                    console.log('correo enviado',resp);
                }).catch((error)=>{
                    console.log(error);
                })

            }).catch((errr)=>{
                const status = errr?.response?.status;
                setServerFail(!status || status >= 500);
                setOpenMp(true);
                setLoadYape(false);
            })
            
        }).catch((errr)=>{
            // Antes esto solo apagaba el spinner: el cliente ingresaba su OTP,
            // tocaba pagar y no pasaba nada visible.
            console.log('yape token ==>', errr);
            const status = errr?.response?.status;
            setServerFail(!status || status >= 500);
            setOpenMp(true);
            setLoadYape(false);
        })
    }

    const totalPayment = cartItems.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.price);
            return totalTemp;
    },0);

    const subTotalPayment = cartItems.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.previousPrice);
            return totalTemp;
    },0);


    const totalPaymentAd = cartAdicionales.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.price);
            return totalTemp;
    },0);

    const subTotalPaymentAd = cartAdicionales.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.prevPrice);
            return totalTemp;
    },0);

    const carloriasRed = cartAdicionales.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.properties[0].value);
            return totalTemp;
    },0);

    const carboRed = cartAdicionales.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.properties[1].value);
            return totalTemp;
    },0);

    const grasasRed = cartAdicionales.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.properties[2].value);
            return totalTemp;
    },0);

    const proteinasRed = cartAdicionales.reduce(
        (previous,current) => {
            const totalTemp = previous + parseFloat(current.properties[3].value);
            return totalTemp;
    },0);

    // Limpiar carrito
    const checkEmptyCart = () =>{
        emptyCart();
        navigate('/planes')
    }

    const [metricasCal,setMetricasCal] = useState();
    
    useEffect(()=>{
        setMetricasCal(JSON.parse(window.localStorage.getItem('needBrm')));
        if(cartItems && cartItems.length){
            
        }else{
            navigate('/planes')
        }
        removeLocalstorage();
    },[])

    return (
        <LayoutDasboard claseStyle={false}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={8}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <CardPaper
                                data={
                                    {
                                        titulo:'Resumen de compra:',
                                        ico:icoMenu,
                                        className:false
                                    }
                                }
                            >
                                {cartItems && cartItems.length > 0 &&
                                    <div className="inlineFlex coResumenBox">
                                        {cartItems.map((item,index)=>{
                                            return (
                                                <div className="inlineFlex coResumenItem">
                                                    <div 
                                                        className="inlineFlex coResumenItemEmpty"
                                                        onClick={()=>checkEmptyCart()}
                                                    >
                                                        <DeleteOutlinedIcon/>
                                                    </div>
                                                    <div className="inlineFlex coResumenItemBox">
                                                        <div className="txt">
                                                            <small>Plan:</small>
                                                            <h3>{item.description}</h3>
                                                            {true && metricasCal &&
                                                                <div 
                                                                    className="inlineFlex criLinesBox"
                                                                >
                                                                    <div className="inlineBlock lineItem">
                                                                        <div className="liTxt">
                                                                            <p><img src={icoCalorias} alt="" /> Calorías</p>
                                                                            {carloriasRed} - {(metricasCal.bmr).toFixed(2)}
                                                                            <p>{carloriasRed+item.properties[0]?.value}/{(metricasCal.bmr).toFixed(2)}</p>
                                                                        </div>
                                                                        <div className="line">
                                                                            
                                                                            <span style={{width:''+(((carloriasRed+item.properties[0]?.value)/metricasCal.bmr)*100).toFixed(0)+'%'}}></span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="inlineBlock lineItem">
                                                                        <div className="liTxt">
                                                                            <p><img src={icoCarbo} alt="" /> Carbohidratos</p>
                                                                            <p>{carboRed+item.properties[1]?.value}/{metricasCal.macros.carbs}</p>
                                                                        </div>
                                                                        <div className="line">
                                                                            <span style={{width:''+(((carboRed+item.properties[1]?.value)/metricasCal.macros.carbs)*100).toFixed(0)+'%'}}></span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="inlineBlock lineItem">
                                                                        <div className="liTxt">
                                                                            <p><img src={icoGrasas} alt="" /> Grasas</p>
                                                                            <p>{grasasRed+item.properties[2]?.value}/{metricasCal.macros.fat}</p>
                                                                        </div>
                                                                        <div className="line">
                                                                            <span style={{width:''+(((grasasRed+item.properties[2]?.value)/metricasCal.macros.fat)*100).toFixed(0)+'%'}}></span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="inlineBlock lineItem">
                                                                        <div className="liTxt">
                                                                            <p><img src={icoProte} alt="" /> Proteinas</p>
                                                                            <p>{proteinasRed+item.properties[3]?.value}/{metricasCal.macros.protein}</p>
                                                                        </div>
                                                                        <div className="line">
                                                                            <span style={{width:''+(((proteinasRed+item.properties[3]?.value)/metricasCal.macros.protein)*100).toFixed(0)+'%'}}></span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                }
                                                        </div>

                                                        <div className="contain">
                                                            {item.descriptionList && item.descriptionList.length &&
                                                                <ul className={'list'}>
                                                                {item.descriptionList.map((descItem)=>(
                                                                    <li>{descItem}</li>
                                                                ))}
                                                                </ul>
                                                            }
                                                        </div>

                                                        <div className="price">
                                                            <p>Antes: <strong>S/.{item.previousPrice}</strong></p>
                                                            <h6>S/. {item.price}</h6>
                                                            
                                                        </div>
                                                    </div>

                                                    {cartAdicionales && cartAdicionales.length > 0 &&
                                                    <div className="coResumenAdicionales">
                                                        <h5>Adicionales</h5>
                                                        {cartAdicionales.map((itemSub,indexSub)=>{
                                                            return (
                                                                <div className="coResumenAdicionalesItem">
                                                                    <div className="coaiClose" onClick={()=>deleteItemAdToCart(itemSub)}>
                                                                        <CloseIcon />
                                                                    </div>

                                                                    {
                                                                        /*
                                                                            icoCheckEntrada
                                                                            icoCheckProteina
                                                                            icoCheckSnack
                                                                            icoCheckFruta
                                                                            icoCheckDesayuno
                                                                        */
                                                                    }
                                                                    <figure>
                                                                        {itemSub.name === 'Desayunos' &&
                                                                            <img src={icoCheckDesayuno} alt="" />
                                                                        }
                                                                        {itemSub.name === 'Snacks' &&
                                                                            <img src={icoCheckSnack} alt="" />
                                                                        }
                                                                        {itemSub.name === 'Frutas' &&
                                                                            <img src={icoCheckFruta} alt="" />
                                                                        }
                                                                        {itemSub.name === 'Entrada' &&
                                                                            <img src={icoCheckEntrada} alt="" />
                                                                        }
                                                                        {itemSub.name === 'Doble Proteina' &&
                                                                            <img src={icoCheckProteina} alt="" />
                                                                        }
                                                                    </figure>
                                                                    <h6>{itemSub.name}</h6>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    }
                                                </div>
                                            )
                                        })}
                                    </div>
                                }
                            </CardPaper>
                        </Grid>
                        <Grid item xs={12}>
                            <CardPaper
                                data={
                                    {
                                        titulo:'Puedes agregar a tu plan:',
                                        ico:icoMenu,
                                        className:false
                                    }
                                }
                            >

                                <div className="inlineFlex coAditionalList">
                                    {aditionalList.length && aditionalList.length > 0 && aditionalList.map((item)=>(
                                        <div className="coAditionalItem">
                                            {false &&
                                                <figure></figure>
                                            }
                                            <div className={'price'}>S/. {item. monthlyPrice}</div>
                                            <div className="txt">
                                                <h4>{item.name}</h4>
                                                <small>Por unidad: <b>S/. {item.unitPrice}</b></small>
                                                <div 
                                                    className="btnPrimary"
                                                    onClick={()=>addItemAdToCart(item)}
                                                >Agregar</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardPaper>
                        </Grid>
                        <Grid item xs={12}>
                            <CardPaper
                                data={
                                    {
                                        titulo:'Métodos de pago:',
                                        ico:iconPayment,
                                        className:'cCheckoutMetodos'
                                    }
                                }
                            >
                                <div className="inlineFlex ccPaymentList">
                                    <div className={paymentMetod === 'card' ? 'inlineFlex ccPaymentItem ccPaymentItemAct ' : 'inlineFlex ccPaymentItem'} onClick={()=>changePayment('card')}>
                                        <div className="inlineFlex ccPaymentItemBox">
                                            <div className="circle"></div>
                                            <div className="txt">
                                                <h4>Tarjeta de crédito  o debito</h4>
                                            </div>
                                            <div className="logos">
                                                <div className="logosItem">
                                                    <img src={icoVisa} />
                                                </div>
                                                <div className="logosItem">
                                                    <img src={icoAmericanExpress} />
                                                </div>
                                                <div className="logosItem">
                                                    <img src={icoMasterCard} />
                                                </div>
                                                <div className="logosItem">
                                                    <img src={icoDiner} />
                                                </div>
                                            </div>
                                        </div>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={paymentMetod}
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -10, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >

                                                {paymentMetod === 'card' &&
                                                    <div className="inlineFlex ccPaymentForm ccPaymentFormTarjet">
                                                        <CheckoutPaymentCard 
                                                            paymentMetod={paymentMetod} 
                                                            //handleOpen={handleOpen} 
                                                            setShowLoaderPayment={setShowLoaderPayment} 
                                                        />
                                                    </div>
                                                }

                                            </motion.div>
                                        </AnimatePresence >
                                    </div>
                                    <div className={paymentMetod === 'yape' ? 'inlineFlex ccPaymentItem ccPaymentItemAct ' : 'inlineFlex ccPaymentItem'} onClick={()=>changePayment('yape')}>
                                        <div className="inlineFlex ccPaymentItemBox">
                                            <div className="circle"></div>
                                            <div className="txt">
                                                <h4>Yape</h4>
                                            </div>
                                            <div className="logos">
                                                <div className="logosItem">
                                                    <img src={icoYape} />
                                                </div>
                                            </div>
                                        </div>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={paymentMetod}
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -10, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={'inlineFlex'}
                                            >
                                                {paymentMetod === 'yape' &&
                                                    <div className="inlineFlex ccPaymentForm ccPaymentFormTarjet">

                                                        <CheckoutPaymentYape 
                                                            yapeSubmitForm={onSubmitHandlerYape}
                                                            handleOpenMp={handleOpenMp} 
                                                            handleCloseMp={handleCloseMp}
                                                            openMp={openMp}
                                                            serverFail={serverFail}
                                                            loadYape={loadYape}
                                                            paymentMethod={false}
                                                        />
                                                    </div>
                                                }
                                            </motion.div>
                                        </AnimatePresence >
                                    </div>
                                </div>
                            </CardPaper>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <CardPaper
                                data={
                                    {
                                        titulo:'Total:',
                                        ico: iconTotal,
                                        className:false
                                    }
                                }
                            >
                                <div className="coTotalPayment">
                                    <ul>
                                        <li>
                                            <span>Delivery</span>
                                            <span>Gratis</span>
                                        </li>
                                        <li>
                                            <span>Sub Total</span>
                                            <span>S/.{subTotalPayment + subTotalPaymentAd}</span>
                                        </li>
                                        <li className={'relevand'}>
                                            <span>Descuento</span>
                                            <span>S/.{((subTotalPayment + subTotalPaymentAd) -(totalPayment + totalPaymentAd)).toFixed(2)}</span>
                                        </li>
                                        <li>
                                            <span>Total</span>
                                            <span>S/.{(totalPayment + totalPaymentAd)}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="coTotalInfo">
                                    <ul>
                                        <li>
                                            <SecurityIcon />
                                            <p>Compra 100% segura</p>
                                        </li>
                                        <li>
                                            <FavoriteIcon />
                                            <p>Salud y bienestar</p>
                                        </li>
                                        <li>
                                            <ChatBubbleIcon />
                                            <p>Chat nutricional</p>
                                        </li>
                                        <li>
                                            <SchoolIcon />
                                            <p>Plataforma educativa gratis.</p>
                                        </li>
                                    </ul>
                                </div>
                            </CardPaper>
                        </Grid>


                    </Grid>
                </Grid>
            </Grid>
            
            {showLoaderPayment && (
                <LoaderPayment />
            )}
        </LayoutDasboard>
    )
};

export default CheckoutPage;
