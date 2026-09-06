import React,{useState,useEffect} from "react";
import './FormDatos.scss';

import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';


import {useAuthContext} from '../../../context/authContext';

import { useNavigate } from "react-router-dom";
import ErrorForm from './../../ultil/ErrorForm/ErrorForm';
import { motion, alToque } from './../../ultil/Motion/Motion';
import { API_URL } from '../../../config';

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

    const claveEscrita = formValues.fdclave || '';
    const reglasClave = [
        { txt: 'Al menos 8 caracteres',   ok: claveEscrita.length >= 8 },
        { txt: 'Mayúsculas y minúsculas', ok: /[a-z]/.test(claveEscrita) && /[A-Z]/.test(claveEscrita) },
        { txt: 'Un número',               ok: /[0-9]/.test(claveEscrita) },
        { txt: 'Un símbolo (!@#$…)',      ok: /[!@#$%^&*]/.test(claveEscrita) },
    ];

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formValues));
    }, [formValues]);

    const [errorData,setErrorData] = useState();
    const [formRegLoad,setFormRegLoad] = useState(false);

    const sendData = (data) => {
        setFormRegLoad(true);
        axios.post(`${API_URL}register/user`,
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

        <form className="afDatos" onSubmit={handleSubmit(onSubmitHandler)}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="afCampo">
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
                    <div className="afCampo">
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
                    <div className="afCampo">
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
                    <div className="afCampo">
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
                    <div className="afCampo">
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
                    <div className="afCampo">
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
                    {/* Las cuatro reglas siempre a la vista y marcandose solas.
                        Antes Yup mostraba una cada vez, asi que el cliente
                        corregia una y descubria la siguiente: cuatro intentos
                        para adivinar una contrasena valida. */}
                    <ul className="afClave">
                        {reglasClave.map((r) => (
                            <li className={r.ok ? 'afClave--ok' : undefined} key={r.txt}>
                                <span />{r.txt}
                            </li>
                        ))}
                    </ul>
                </Grid>

                {errorData &&
                    <Grid item xs={12} sm={12} md={12}>
                        <ErrorForm text={errorData} />
                    </Grid>
                }

                <Grid item xs={12}>
                    <motion.button type="submit" className="afBtn afBtn--mint"
                        disabled={formRegLoad} {...alToque}>
                        {formRegLoad ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
                    </motion.button>
                </Grid>
            </Grid>

        </form>
    )
};

export default FormDatos;
