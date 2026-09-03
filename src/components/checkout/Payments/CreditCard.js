import React,{useState} from "react";
import Grid from '@mui/material/Grid';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { getPaymentMethods } from '@mercadopago/sdk-react';

import { 
        initMercadoPago, 
        CardNumber,
        ExpirationDate,
        SecurityCode,
        createCardToken
    } from '@mercadopago/sdk-react';

import axios from 'axios';

import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthContext } from './../../../context/authContext';
import CheckoutPaymentFail from './FailPayment';
import { useEffect } from "react";

const CheckoutPaymentCard = ({paymentMetod,handleOpen,setShowLoaderPayment}) => {

    // La llave publica sale del entorno para poder probar en sandbox sin tocar
    // el codigo. Si la variable no existe cae en la de produccion, que es el
    // comportamiento de siempre.
    // OJO: en staging hay que definir REACT_APP_MP_PUBLIC_KEY con la llave TEST-,
    // porque sin ella el navegador cobra tarjetas reales.
    initMercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY || 'APP_USR-fa1bc33e-3d56-4b37-b674-a6f65864ba86');
    const { token,cartItems, cartAdicionales, planInfo } = useAuthContext();

    // Direccion de facturacion: la que el cliente ya registro como entrega.
    // Antes iba quemada como 'dir test' en todas las facturas con tarjeta.
    const invoiceAddress = {
        address: planInfo?.profile?.address || planInfo?.profile?.descriptionAddress || '',
        description: planInfo?.profile?.descriptionAddress || planInfo?.profile?.district || '',
    };

    const [openMp, setOpenMp] = useState(false);
    const [serverFail, setServerFail] = useState(false);
    const handleOpenMp = () => {
        setOpenMp(true);
    };

    const handleCloseMp = () => {
        setOpenMp(false);
    };

    const [loadForm,setLoadForm] = useState(false);
    const cardToken = async (data) => {
        setLoadForm(true)
        const response = await createCardToken({
            cardholderName: data.ccnombres,
            identificationType: 'DNI',
            identificationNumber: data.ccdni,
        })

        const paymentMethods = await getPaymentMethods({ bin: response.first_six_digits });
        
        const adicionalesList = []
        if(cartAdicionales && cartAdicionales.length > 0){
            cartAdicionales.map((item,index)=>{
                adicionalesList.push(item.id);
            })
        }
        
        if(paymentMethods && paymentMethods.results.length){
            axios.post('https://api.allpafood.com/dev/api-af/v1/invoice/create',{
                complementsId: adicionalesList,
                // El backend hace dto.additional().stream() sin comprobar null:
                // si este campo no viaja, revienta con NullPointerException (500)
                // y el cliente ve "tarjeta rechazada". Mandarlo vacio lo evita.
                additional: (cartAdicionales || []).map((item) => item.type),
                planId: parseFloat(cartItems[0].id),
                paymentMethodType: paymentMetod,
                paymentMethodId: paymentMethods.results[0].id,
                paymentToken: response.id,
                invoiceAddress
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }).then((resp)=>{
                //handleOpen(true);
                setShowLoaderPayment(true);
                // No se restaura el boton: el pago ya paso y LoaderPayment tarda
                // 7 segundos en llevar al dashboard. Si el boton vuelve, un segundo
                // clic en esa ventana dispara otro invoice/create que responde 409
                // "Usted cuenta con un plan vigente", y la pantalla se lo muestra
                // al cliente como "no procesamos tu pago" justo despues de cobrarle.
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
                console.log('card==>',errr);
                // Un 5xx o una caida de red no son un rechazo de la tarjeta.
                // Decirle al cliente que su tarjeta fallo cuando el problema es
                // nuestro lo hace abandonar la compra sin motivo.
                const status = errr?.response?.status;
                setServerFail(!status || status >= 500);
                setOpenMp(true);
                setLoadForm(false)
            })
        }

    }

    const [yapeFormFields,setYapeFormFields] = useState({
        ccnombres:'',
        ccdni:''
    });

    const validationSchema = Yup.object().shape({
        ccnombres: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(2,'Ingrese un telefono valido por favor.')
                        .max(250,'Ingrese un telefono valido por favor.'),
        ccdni: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(8,'Ingrese un telefono valido por favor.')
                        .max(9,'Ingrese un telefono valido por favor.'),
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

    const yapeSubmitForm = (dataaa) =>{
        cardToken(dataaa)
    }


    return (
        <form onSubmit={handleSubmit(yapeSubmitForm)}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={8}>
                    <div className="textFieldCheck">
                        <p>Nombres</p>
                        <TextField
                            id="ccnombres" 
                            name="ccnombres"
                            type={'text'}
                            variant="outlined" 
                            error={errors.ccnombres ? true : false}
                            {...register("ccnombres")} 
                            onChange={changeFields} 
                            //onFocus={handleInputFocus}
                            value={yapeFormFields.ccnombres} 
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                    <div className="textFieldCheck">
                        <p>DNI</p>
                        <TextField
                            id="ccdni" 
                            name="ccdni"
                            type={'text'}
                            variant="outlined" 
                            error={errors.ccdni ? true : false}
                            {...register("ccdni")} 
                            onChange={changeFields} 
                            //onFocus={handleInputFocus}
                            value={yapeFormFields.ccdni} 
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={8}>
                    <div className="textFieldCheck">
                        <p>Numero de tarjeta</p>
                        <CardNumber />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                    <div className="textFieldCheck">
                        <p>Codigo de seguridad</p>
                        <SecurityCode />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <div className="textFieldCheck">
                        <p>Fecha de expiracion</p>
                        <ExpirationDate />
                    </div>
                </Grid>
                
                {loadForm ?

                    <Grid item xs={12} sm={12} md={12}>
                        <div  className="btnPrimary btnPayment">
                            <CircularProgress size={20} color={'white'}/>
                        </div>
                    </Grid>
                :
                    <Grid item xs={12} sm={12} md={12}>
                        <button type={'submit'} className="btnPrimary btnPayment">
                            <span>
                                Pagar
                            </span>
                        </button>
                    </Grid>
                }
            </Grid>

            <CheckoutPaymentFail 
                handleOpenMp={handleOpenMp} 
                handleCloseMp={handleCloseMp}
                openMp={openMp}
                paymentMethod={true}
                serverFail={serverFail}
            />
        </form>
    )
};

export default CheckoutPaymentCard;
