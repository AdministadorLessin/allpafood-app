import React,{useState,useEffect} from "react";
import './FormDatos.scss';

import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';
import { mensajeError } from '../../ultil/mensajeError';


import {useAuthContext} from '../../../context/authContext';

import { useNavigate } from "react-router-dom";
import ErrorForm from './../../ultil/ErrorForm/ErrorForm';
import { Link } from 'react-router-dom';
import { motion, alToque } from './../../ultil/Motion/Motion';
import { API_URL } from '../../../config';
import { useVerClave } from '../../ultil/VerClave';
import { Accion } from '../Marco/MarcoAuth';

const LOCAL_STORAGE_KEY = 'form_datos_cache';

const FormDatos = ({telefono}) => {
    const verClave = useVerClave();

    const { token } = useAuthContext();
    let navigate = useNavigate();

    const validationSchema = Yup.object().shape({
        /* Los mensajes decian "Ingrese un telefono valido por favor." en el
           nombre y en el apellido: era el mismo texto copiado en todos los
           campos del formulario. */
        fdnombre: Yup.string()
                        .required('Escribe tu nombre.')
                        .min(3,'Escribe tu nombre completo.'),
        fdapellidos: Yup.string()
                        .required('Escribe tus apellidos.')
                        .min(3,'Escribe tus apellidos completos.'),
        /* Ni correo ni documento: el celular ya verificado es la identidad, y
           el documento se pide al pagar, que es donde Yape lo exige. Pedir
           doce datos antes de mostrar un precio es donde se caia la mitad de
           la gente que nunca compraba. */
        /* Ocho caracteres con una letra y un numero. Pedir ademas mayuscula y
           simbolo no protegia nada que no protegiera esto, y si dejaba gente
           trabada en el formulario sin entender por que. */
        fdclave: Yup.string()
                        .required()
                        .min(8,"Al menos ocho caracteres.")
                        .matches(/^(?=.*[a-zA-Z])/,"Incluir al menos una letra.")
                        .matches(/^(?=.*[0-9])/,"Incluir al menos un número.")
    });
    
    const [bodyFields,setBodyFields] = useState({
        fdnombre:'',
        fdapellidos:'',
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

    /**
     * Manda al servidor lo que la persona respondio antes de registrarse.
     *
     * Viene de /empezar, guardado en el navegador. Si no esta —porque entro
     * directo al registro— no se manda nada y el perfil se completa despues.
     *
     * La edad se convierte en fecha de nacimiento porque es lo que guarda el
     * perfil y lo que usa el calculo de calorias. Se toma el primero de enero
     * del ano correspondiente: la precision al dia no cambia ningun macro.
     */
    const guardarCuestionario = () => {
        let previo = null;
        try { previo = JSON.parse(window.localStorage.getItem('preregistro')); } catch (e) { previo = null; }
        if (!previo || !previo.objetivo) return Promise.resolve();

        const edad = parseInt(previo.edad, 10);
        const nacimiento = Number.isFinite(edad)
            ? `${new Date().getFullYear() - edad}-01-01`
            : null;

        return axios.put(`${API_URL}register/questionnaire`,
            {
                bornDate: nacimiento,
                district: previo.distrito || null,
                information: {
                    gender: previo.sexo,
                    nutritionalObjective: previo.objetivo,
                    height: parseFloat(previo.talla),
                    weight: parseFloat(previo.peso),
                    sugar: true,
                    trainingDays: 0,
                    trainingHours: 0,
                    trainingLevel: 'M',
                    routine: 'C',
                    strengthTraining: false,
                    alimentsRestrictions: ''
                }
            },
            { headers: { Authorization: `Bearer ${token}` } }
        ).catch((e) => {
            // No bloquea la compra: el perfil se puede completar despues.
            console.log('cuestionario', e);
        });
    };

    const sendData = (data) => {
        setFormRegLoad(true);
        axios.post(`${API_URL}register/user`,
            {
                password: data.fdclave,
                name: data.fdnombre,
                lastname: data.fdapellidos,
                phoneNumber: data.fdtelefono
            },
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        ).then(() => {
            /* La contrasena ya no se guarda en el navegador. Antes viajaba en
               claro dentro de 'inf', junto al nombre y el correo. */
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            window.localStorage.setItem('regfrm',1);
            window.localStorage.setItem('valfact',0);

            guardarCuestionario()
                .finally(() => {
                    /* Derecho a elegir su plan. La direccion se pide despues
                       de pagar, en su propia pantalla. */
                    navigate("/planes");
                    setFormRegLoad(false);
                    setErrorData();
                });
        }).catch((error) => {
            console.log('error al enviar la data', error);
            setFormRegLoad(false);
            if (error.response && error.response.status === 409) {
                setErrorData(mensajeError(error, 'No pudimos guardar tus datos. Inténtalo de nuevo.'));
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

        <form id="afFormDatos" className="afDatos" onSubmit={handleSubmit(onSubmitHandler)}>
            <Grid container spacing={2}>
                {/* El nombre va en la boleta y es como saluda el panel. */}
                <Grid item xs={12} sm={12} md={6}>
                    <div className="afCampo">
                        <TextField
                            variant="filled"
                            id="fdnombre"
                            name="fdnombre"
                            label={'Nombre:'}
                            value={bodyFields ? bodyFields.fdnombre : ''}
                            error={errors.fdnombre ? true : false}
                            helperText={errors.fdnombre?.message}
                            {...register("fdnombre", { onChange: handleFieldChange })}
                        />
                    </div>
                </Grid>

                <Grid item xs={12} sm={12} md={6}>
                    <div className="afCampo">
                        <TextField
                            variant="filled"
                            id="fdapellidos"
                            name="fdapellidos"
                            label={'Apellidos:'}
                            value={bodyFields ? bodyFields.fdapellidos : ''}
                            error={errors.fdapellidos ? true : false}
                            helperText={errors.fdapellidos?.message}
                            {...register("fdapellidos", { onChange: handleFieldChange })}
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
                            type={verClave.type}
                            InputProps={verClave.InputProps}
                            value={bodyFields ? bodyFields.fdclave : ''}
                            error={errors.fdclave ? true : false}
                            {...register("fdclave", { onChange: handleFieldChange })}
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

                {/* Si el choque es por el correo, lo que esa persona necesita
                    no es otro intento: ya tiene cuenta y hay que llevarla a
                    iniciar sesion. Es el caso mas comun y el que hoy termina
                    en WhatsApp. */}
                {errorData &&
                    <Grid item xs={12} sm={12} md={12}>
                        <ErrorForm text={errorData} />
                        {/^ya existe una cuenta/i.test(errorData) &&
                            <p className="afAuth__pie">
                                <Link to="/ingresar">Ir a iniciar sesión</Link>
                            </p>
                        }
                    </Grid>
                }

                <Grid item xs={12}>
                    <Accion>
                        <motion.button type="submit" form="afFormDatos" className="afBtn afBtn--mint"
                            disabled={formRegLoad} {...alToque}>
                            {formRegLoad ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
                        </motion.button>
                    </Accion>
                </Grid>
            </Grid>

        </form>
    )
};

export default FormDatos;
