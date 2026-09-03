import React,{useState,useEffect} from "react";
import './FormDatos.scss';

import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';

import icoArrow from '../../../assets/img/ico_arrow_white_large.png';

import {useAuthContext} from '../../../context/authContext';

import { useNavigate } from "react-router-dom";
import ErrorForm from './../../ultil/ErrorForm/ErrorForm';

const LOCAL_STORAGE_KEY = 'form_datos_cache';

const FormDatos = ({telefono}) => {

    const { token } = useAuthContext();
    let navigate = useNavigate();

    const validationSchema = Yup.object().shape({
        fdnombre: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(3,'Ingrese un telefono valido por favor.'),
        fdapellidos: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(3,'Ingrese un telefono valido por favor.'),
        fdapellidos: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(3,'Ingrese un telefono valido por favor.'),
        fddni: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .max(8,'Ingrese un telefono valido por favor.')
                        .min(8,'Ingrese un telefono valido por favor.'),
        fdcorreo: Yup.string().required('ingrese un correo valido').email().matches(/^(?!.*@[^,]*,)/),
        fdclave: Yup.string()
                        .required()
                        .matches(/^(?=.*[a-z])/,"Incluir mayúsculas y minúsculas.")
                        .matches(/^(?=.*[A-Z])/,"Incluir mayúsculas y minúsculas.")
                        .matches(/^(?=.*[0-9])/,"Incluir números.")
                        .matches(/^(?=.*[!@#\$%\^&\*])/,"Incluir símbolos.")
    });
    
    const [bodyFields,setBodyFields] = useState({
        fdnombre:'',
        fdapellidos:'',
        fddni:'',
        fdcorreo:'',
        fdclave:'',
        fdtelefono:telefono
    });

    const handleFieldChange = (e) => {
        setBodyFields({
            ...bodyFields,
            [e.target.name]:e.target.value
        })
        setErrorData();
    }

    const getInitialValues = () => {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Error al parsear localStorage", e);
            }
        }
        return {
            fdnombre: '',
            fdapellidos: '',
            fddni: '',
            fdcorreo: '',
            fdclave: '',
            fdtelefono: telefono || ''
        };
    };

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        mode: "all",
        resolver: yupResolver(validationSchema),
        defaultValues: getInitialValues()
    });

    const formValues = watch();

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formValues));
    }, [formValues]);

    const [errorData,setErrorData] = useState();
    const [formRegLoad,setFormRegLoad] = useState(false);

    const sendData = (data) => {
        setFormRegLoad(true);
        axios.post('http://localhost:8443/api-af/v1/register/user',
            {
                email: data.fdcorreo,
                password: data.fdclave,
                documentNumber: data.fddni,
                name: data.fdnombre,
                lastname: data.fdapellidos,
                phoneNumber: data.fdtelefono
            },
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        ).then((resp) => {
            localStorage.setItem('inf', JSON.stringify({
                name: data.fdnombre,
                psw: data.fdclave,
                email: data.fdcorreo
            }));
            localStorage.removeItem(LOCAL_STORAGE_KEY);

            window.localStorage.setItem('regfrm',1);
            window.localStorage.setItem('valfact',0);

            navigate("/registro/perfil");
            setFormRegLoad(false);
            setErrorData();
        }).catch((error) => {
            console.log('error al enviar la data', error);
            setFormRegLoad(false);
            if (error.response && error.response.status === 409) {
                setErrorData(error.response.data.message);
            }
        });
    };
    

    const onSubmitHandler = (data) => {
        sendData(data)
    };

    useEffect(()=>{
        setBodyFields({
            ...bodyFields,
            fdtelefono: telefono
        })
    },[])

    return (

        <form className={'formPaper regDatosForm'} onSubmit={handleSubmit(onSubmitHandler)}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField 
                            variant="filled" 
                            id="fdnombre" 
                            label={'¿Cuál es tu nombre?'}
                            name="fdnombre" 
                            value={bodyFields ? bodyFields.fdnombre : ''}
                            error={errors.fdnombre ? true : false}
                            {...register("fdnombre")} 
                            onChange={handleFieldChange}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            variant="filled" 
                            id="fdapellidos" 
                            label={'¿Cuál es tu apellido?'}
                            name="fdapellidos" 
                            value={bodyFields ? bodyFields.fdapellidos : ''}
                            error={errors.fdapellidos ? true : false}
                            {...register("fdapellidos")}
                            onChange={handleFieldChange}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField 
                            variant="filled"
                            id="fdcorreo" 
                            label={'Correo'}
                            name="fdcorreo" 
                            value={bodyFields ? bodyFields.fdcorreo : ''}
                            error={errors.fdcorreo ? true : false}
                            {...register("fdcorreo")}
                            onChange={handleFieldChange}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField 
                            variant="filled"
                            id="fdtelefono" 
                            label={'Teléfono'}
                            name="fdtelefono" 
                            value={bodyFields ? bodyFields.fdtelefono : ''}
                            error={errors.fdtelefono ? true : false}
                            {...register("fdtelefono")}
                            onChange={handleFieldChange}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            type={'number'}
                            variant="filled"
                            id="fddni" 
                            label={'Documento de identidad:'}
                            name="fddni" 
                            value={bodyFields ? bodyFields.fddni : ''}
                            error={errors.fddni ? true : false}
                            {...register("fddni")}
                            onChange={handleFieldChange}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            variant="filled"
                            id="fdclave" 
                            name="fdclave" 
                            label={'Contraseña:'}
                            type="password"
                            value={bodyFields ? bodyFields.fdclave : ''}
                            error={errors.fdclave ? true : false}
                            {...register("fdclave")}
                            onChange={handleFieldChange}
                        />
                    </div>
                    {errors.fdclave &&
                        
                            <div className="regDatosClaveValid">
                                {errors.fdclave?.message ==='Deben tener al menos ocho caracteres.' && <p>(*) Deben tener al menos ocho caracteres</p>}
                                {errors.fdclave?.message ==='Incluir mayúsculas y minúsculas.' && <p>(*) Incluir mayúsculas y minúsculas</p>}
                                {errors.fdclave?.message ==='Incluir números.' && <p>(*) Incluir números</p>}
                                {errors.fdclave?.message ==='Incluir símbolos.' && <p>(*) Incluir símbolos</p>}
                            </div>
                        
                    }
                </Grid>

                {errorData &&
                    <Grid item xs={12} sm={12} md={12}>
                        <ErrorForm text={errorData} />
                    </Grid>
                }

                <Grid item xs={12}>
                    <div className="textFieldBtn">
                        <button type={'submit'} className={formRegLoad ? 'btnPrimary btnIcon btnIconRight btnDisabled':'btnPrimary btnIcon btnIconRight'}>
                            <span>
                                Siguiente
                                <img src={icoArrow} alt="" />
                            </span>
                        </button>
                    </div>
                </Grid>
            </Grid>

        </form>
    )
};

export default FormDatos;
