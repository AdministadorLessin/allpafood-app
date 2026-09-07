import React,{useState,useEffect} from "react";
import Modal from '@mui/material/Modal';

import './checkout.scss';

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';

import Grid from '@mui/material/Grid';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';


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
import { Contador } from './../../../components/ultil/Motion/Motion';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";


import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import { useRef } from 'react';


import SecurityIcon from '@mui/icons-material/Security';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import SchoolIcon from '@mui/icons-material/School';

import {useAuthContext} from '../../../context/authContext';

import { useNavigate } from "react-router-dom";
import PagoListo from './../../../components/checkout/PagoListo/PagoListo';
import CheckoutPaymentYape from './../../../components/checkout/Payments/Yape';
import CheckoutPaymentCard from './../../../components/checkout/Payments/CreditCard';

// Adicionales Icos
import icoCheckEntrada from '../../../assets/img/ico_check_entrada.png';
import icoCheckProteina from '../../../assets/img/ico_check_proteina.png';
import icoCheckSnack from '../../../assets/img/ico_check_snack.png';
import icoCheckFruta from '../../../assets/img/ico_check_fruta.png';
import icoCheckDesayuno from '../../../assets/img/ico_check_desayuno.png';
import { API_URL } from '../../../config';

// Clave de idempotencia del pago. Debe ser ESTABLE durante todo el intento de
// compra: es lo que impide que un reintento o un doble clic se cobre dos veces.
// Antes se generaba un uuid nuevo en cada envio (con faker, ademas una
// dependencia de desarrollo), lo que anulaba esa proteccion.
const newRequestId = () =>
  (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : `af-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;


/* Que es cada adicional y para que sirve.

   Las cinco tarjetas decian solo su nombre y su precio, asi que las cinco se
   leian igual y ninguna daba una razon para tocarla. El argumento va por tipo
   y no por id, que es lo estable. */
const IcoCab = ({ n }) => {
    const c = { className: 'afIcoCab', viewBox: '0 0 24 24', fill: 'none',
                stroke: 'currentColor', strokeWidth: 1.8,
                strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (n === 'bolsa')  return <svg {...c}><path d="M5.4 8.4h13.2l-1.1 10.4a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z"/><path d="M9 8.4V6.6a3 3 0 0 1 6 0v1.8"/></svg>;
    if (n === 'chispa') return <svg {...c}><path d="M12 3.6v4M12 16.4v4M4.8 12h4M15.2 12h4M7 7l2.6 2.6M14.4 14.4 17 17M17 7l-2.6 2.6M9.6 14.4 7 17"/></svg>;
    if (n === 'tarjeta')return <svg {...c}><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M3 10h18M6.6 14.4h3"/></svg>;
    return <svg {...c}><path d="M6 3.4h12v17.2l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8.6h6M9 12.4h6"/></svg>;
};

/* Los cuatro macros con la misma iconografia que la pantalla del calculo:
   llama, espiga, gota y mancuerna. Antes eran PNG de colores planos, de otra
   epoca del diseno. */
const IcoMacro = ({ n }) => {
    const c = { className: 'afIcoMacro', viewBox: '0 0 24 24', fill: 'none',
                stroke: 'currentColor', strokeWidth: 1.9,
                strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (n === 'kcal') return <svg {...c}><path d="M12 20.8a5.4 5.4 0 0 0 5.4-5.4c0-3.5-3-5.6-3-8.6 0 0-2 1.5-2 3.5 0 1.2-1 2-1.8 1.3-1.3-1.1-1.7-2.7-1.7-4.2 0 0-2.3 3-2.3 8a5.4 5.4 0 0 0 5.4 5.4z"/></svg>;
    if (n === 'carb') return <svg {...c}><path d="M12 20.6V8.4"/><path d="M12 8.4c0-2 1.5-3.6 3.4-3.6 0 2-1.5 3.6-3.4 3.6zM12 8.4C12 6.4 10.5 4.8 8.6 4.8c0 2 1.5 3.6 3.4 3.6zM12 14c0-2 1.5-3.6 3.4-3.6 0 2-1.5 3.6-3.4 3.6zM12 14c0-2-1.5-3.6-3.4-3.6 0 2 1.5 3.6 3.4 3.6z"/></svg>;
    if (n === 'gras') return <svg {...c}><path d="M12 3.6s5.2 5.5 5.2 9.1a5.2 5.2 0 1 1-10.4 0C6.8 9.1 12 3.6 12 3.6z"/></svg>;
    return <svg {...c}><path d="M6.8 8.2v7.6M4.2 9.8v4.4M17.2 8.2v7.6M19.8 9.8v4.4M6.8 12h10.4"/></svg>;
};

const ADICIONAL = {
    breakfast:     { arg: 'Resuelve la primera comida del día',        tono: 'sol'   },
    snacks:        { arg: 'Para la media mañana, sin salir a comprar', tono: 'menta' },
    fruits:        { arg: 'Fruta de estación, ya lavada y cortada',    tono: 'coral' },
    starters:      { arg: 'Ensalada o sopa antes del plato',           tono: 'menta' },
    doubleprotein: { arg: 'Porción doble en tus 20 almuerzos',         tono: 'tinta' },
};

const IcoAd = ({ tipo }) => {
    const c = { className: 'afAd__ic', viewBox: '0 0 24 24', fill: 'none',
                stroke: 'currentColor', strokeWidth: 1.7,
                strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (tipo === 'breakfast') return <svg {...c}><path d="M4.5 8.5h11v5.2a5.5 5.5 0 0 1-11 0z"/><path d="M15.5 9.8h2a2.6 2.6 0 0 1 0 5.2h-2"/><path d="M7 5.2v-1.6M10.5 5.2v-1.6M14 5.2v-1.6M3.5 20.4h13"/></svg>;
    if (tipo === 'snacks')    return <svg {...c}><path d="M5.2 9.6h13.6l-1.2 9a2 2 0 0 1-2 1.7H8.4a2 2 0 0 1-2-1.7z"/><path d="M8.8 9.6V7a3.2 3.2 0 0 1 6.4 0v2.6"/></svg>;
    if (tipo === 'fruits')    return <svg {...c}><path d="M12 8.4c2.6-2.4 7.2-1 7.2 4 0 4.2-3 8-5 8-1 0-1.4-.6-2.2-.6s-1.2.6-2.2.6c-2 0-5-3.8-5-8 0-5 4.6-6.4 7.2-4z"/><path d="M12 8.4V5.6c0-1.2 1-2.2 2.4-2.2"/></svg>;
    if (tipo === 'starters')  return <svg {...c}><path d="M3.4 11.4h17.2a8.6 8.6 0 0 1-8.6 7.4 8.6 8.6 0 0 1-8.6-7.4z"/><path d="M9 8.2c0-1.4 1.4-1.6 1.4-3M13 8.2c0-1.4 1.4-1.6 1.4-3"/></svg>;
    return <svg {...c}><path d="M6.8 8.2v7.6M4.2 9.8v4.4M17.2 8.2v7.6M19.8 9.8v4.4M6.8 12h10.4"/></svg>;
};

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

        axios.post(`${API_URL}subscriptions/payments/secure/tokens/mercadopago/yape`,{
            phone: data.ynumero,
            otp: data.yotp,
            requestId: requestIdRef.current
        },
        {
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{
            axios.post(`${API_URL}invoice/create`,
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
        <LayoutDasboard claseStyle={'afCheckout'}>
            {/* La pantalla no decia en ningun momento donde estaba el cliente:
                abria con "Resumen de compra:" y ya. */}
            <h1 className="afCheckout__titular">
                <span className="t1">Último paso,</span>
                confirma y paga
            </h1>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={8}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <CardPaper
                                data={
                                    {
                                        titulo:'Lo que llevas',
                                        ico:<IcoCab n="bolsa" />,
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
                                                                            <p><IcoMacro n="kcal" /> Calorías</p>
                                                                            <p>{Math.round(carloriasRed+item.properties[0]?.value)}/{Math.round(metricasCal.bmr)}</p>
                                                                        </div>
                                                                        <div className="line">
                                                                            
                                                                            <span style={{width:''+(((carloriasRed+item.properties[0]?.value)/metricasCal.bmr)*100).toFixed(0)+'%'}}></span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="inlineBlock lineItem">
                                                                        <div className="liTxt">
                                                                            <p><IcoMacro n="carb" /> Carbohidratos</p>
                                                                            <p>{Math.round(carboRed+item.properties[1]?.value)}/{Math.round(metricasCal.macros.carbs)}</p>
                                                                        </div>
                                                                        <div className="line">
                                                                            <span style={{width:''+(((carboRed+item.properties[1]?.value)/metricasCal.macros.carbs)*100).toFixed(0)+'%'}}></span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="inlineBlock lineItem">
                                                                        <div className="liTxt">
                                                                            <p><IcoMacro n="gras" /> Grasas</p>
                                                                            <p>{Math.round(grasasRed+item.properties[2]?.value)}/{Math.round(metricasCal.macros.fat)}</p>
                                                                        </div>
                                                                        <div className="line">
                                                                            <span style={{width:''+(((grasasRed+item.properties[2]?.value)/metricasCal.macros.fat)*100).toFixed(0)+'%'}}></span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="inlineBlock lineItem">
                                                                        <div className="liTxt">
                                                                            <p><IcoMacro n="prot" /> Proteína</p>
                                                                            <p>{Math.round(proteinasRed+item.properties[3]?.value)}/{Math.round(metricasCal.macros.protein)}</p>
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
                                                            <p>Antes: <strong>S/ {Number(item.previousPrice).toFixed(2)}</strong></p>
                                                            <h6>S/ {Number(item.price).toFixed(2)}</h6>
                                                            
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
                                        titulo:'Hazlo más completo',
                                        ico:<IcoCab n="chispa" />,
                                        className:false
                                    }
                                }
                            >

                                {/* Riel horizontal en vez de lista: se desliza con el
                                    pulgar y cada tarjeta se ve entera. Como cinco
                                    filas grises apiladas, nadie llegaba al final. */}
                                <div className="afAdRiel">
                                    {aditionalList.map((item)=>{
                                        const puesto = cartAdicionales.some((x)=>x.id === item.id);
                                        const info = ADICIONAL[item.type] || {};
                                        const unidades = Math.round(item.monthlyPrice / item.unitPrice);
                                        const ahorro = item.prevPrice - item.price;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                className={'afAd afAd--' + (info.tono || 'menta') + (puesto ? ' afAd--puesto' : '')}
                                                whileTap={{ scale: .97 }}
                                                onClick={()=> puesto ? deleteItemAdToCart(item) : addItemAdToCart(item)}
                                            >
                                                <span className="afAd__marco"><IcoAd tipo={item.type} /></span>

                                                <h4 className="afAd__nombre">{item.name}</h4>
                                                <p className="afAd__arg">{info.arg}</p>

                                                <p className="afAd__unid">{unidades} al mes · S/ {item.unitPrice} c/u</p>

                                                <div className="afAd__precio">
                                                    <b>S/ {item.monthlyPrice}</b>
                                                    {ahorro > 0 && <em>S/ {item.prevPrice}</em>}
                                                </div>

                                                <span className="afAd__btn">
                                                    {puesto ?
                                                        <>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                                 strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="m5 12.5 4.5 4.5L19 7.5"/>
                                                            </svg>
                                                            Agregado
                                                        </>
                                                    :
                                                        <>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                                 strokeWidth="2.6" strokeLinecap="round">
                                                                <path d="M12 5.5v13M5.5 12h13"/>
                                                            </svg>
                                                            Agregar
                                                        </>
                                                    }
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </CardPaper>
                        </Grid>
                        <Grid item xs={12}>
                            <CardPaper
                                data={
                                    {
                                        titulo:'¿Cómo prefieres pagar?',
                                        ico:<IcoCab n="tarjeta" />,
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
                                        titulo:'Tu pago',
                                        ico:<IcoCab n="recibo" />,
                                        className:false
                                    }
                                }
                            >
                                {/* El total deja de ser la ultima fila de una tabla y
                                    pasa a ser el titular de la tarjeta: es la cifra
                                    por la que el cliente esta en esta pantalla. Las
                                    demas lineas son su desglose. */}
                                <div className="afTotal">
                                    <span className="afTotal__et">Total a pagar</span>
                                    <p className="afTotal__n">
                                        <em>S/</em>
                                        <Contador valor={totalPayment + totalPaymentAd} decimales={2} />
                                    </p>
                                    {((subTotalPayment + subTotalPaymentAd) - (totalPayment + totalPaymentAd)) > 0 &&
                                        <span className="afTotal__ahorro">
                                            Ahorras S/ {((subTotalPayment + subTotalPaymentAd) - (totalPayment + totalPaymentAd)).toFixed(2)}
                                        </span>
                                    }
                                </div>

                                <div className="coTotalPayment">
                                    <ul>
                                        <li>
                                            <span>Precio de lista</span>
                                            <span>S/ {(subTotalPayment + subTotalPaymentAd).toFixed(2)}</span>
                                        </li>
                                        <li className={'relevand'}>
                                            <span>Descuento</span>
                                            <span>&minus; S/ {((subTotalPayment + subTotalPaymentAd) -(totalPayment + totalPaymentAd)).toFixed(2)}</span>
                                        </li>
                                        <li>
                                            <span>Delivery</span>
                                            <span>Gratis</span>
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
                <PagoListo
                    total={totalPayment + totalPaymentAd}
                    plan={cartItems[0]?.description}
                    adicionales={cartAdicionales.length}
                />
            )}
        </LayoutDasboard>
    )
};

export default CheckoutPage;
