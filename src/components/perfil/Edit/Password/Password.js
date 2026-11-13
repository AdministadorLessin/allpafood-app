import React,{useState} from "react";
import './Password.scss';
import '../campos.scss';

import axios from 'axios';
import { mensajeError } from '../../../ultil/mensajeError';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { useAuthContext } from './../../../../context/authContext';
import { API_URL } from '../../../../config';

const Ojo = ({ abierto }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        <circle cx="12" cy="12" r="3" />
        {!abierto && <path d="M4 4l16 16" />}
    </svg>
);

const ProfileChangePassword = ({closeModal,enHoja,children}) => {

    const [loadingForm,setLoadingForm] = useState(false);
    const { token } = useAuthContext();

    const validationSchema = Yup.object().shape({
        oldPassword: Yup.string().min(8, "Deben tener al menos ocho caracteres.").required(),
        /* Las mismas tres reglas que el registro y que la clave temporal: si
           aqui fueran mas duras, alguien podria entrar con una clave que
           despues no puede cambiar. */
        password: Yup.string().min(8, "Deben tener al menos ocho caracteres.").required()
            .matches(/^(?=.*[a-zA-Z])/,"Incluir al menos una letra.")
            .matches(/^(?=.*[0-9])/,"Incluir al menos un número."),
        passwordConfirm: Yup
            .string()
            .required('Las contraseñas no coinciden.')
            .oneOf([Yup.ref('password'), null], 'Passwords must match'),
    });

    const {
            register,
            handleSubmit,
            watch,
            formState: { errors },
        } = useForm({
            mode: "all",
            shouldUnregister: true,
            resolver: yupResolver(validationSchema),
        });

    const [respErr,setRespErr] = useState({
        status:false,
        data:null
    });

    const updateDataPrivacity = (dataTmp) =>{
        setLoadingForm(true);
        setRespErr({
            status:false,
            data:null
        });

        axios.put(`${API_URL}profile/data/authentication`,
            {
                password: dataTmp.oldPassword,
                newPassword: dataTmp.password
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }
            ).then(()=>{
                closeModal();
                setLoadingForm(false);
            }).catch((errr)=>{
                setLoadingForm(false);
                // Dos fallos encadenados: axios 1.7 no expone errr.status —eso
                // llego en la 1.8—, asi que esta rama no entraba NUNCA y el
                // else borraba el error; y el mensaje del servidor viene
                // envuelto, asi que aunque entrara mostraba "Conflict".
                // Cambiar la clave fallaba en silencio.
                setRespErr({
                    status: true,
                    data: mensajeError(errr, 'No pudimos cambiar tu contraseña. Inténtalo de nuevo.')
                });
            })
    }

    const onSubmit = async (data) => {
        updateDataPrivacity(data);
    }

    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    /* Las reglas a la vista, marcandose solas mientras escribe. */
    const nueva = watch('password') || '';
    const reglas = [
        { ok: nueva.length >= 8, txt: 'Al menos 8 caracteres' },
        { ok: /[a-zA-Z]/.test(nueva), txt: 'Una letra' },
        { ok: /[0-9]/.test(nueva), txt: 'Un número' },
    ];

    const campo = (id, nombre, etiqueta, auto, error) => (
        <label className="cuF__campo" htmlFor={id}>
            <span className="cuF__et">{etiqueta}</span>
            <span className="cuF__caja">
                <input className="cuF__in cuF__in--conOjo" id={id}
                    type={showPassword ? 'text' : 'password'} autoComplete={auto}
                    aria-invalid={errors[nombre] ? 'true' : undefined}
                    {...register(nombre)} />
                <button type="button" className="cuF__ojo" onClick={handleClickShowPassword}
                    aria-label={showPassword ? 'Ocultar las contraseñas' : 'Ver las contraseñas'}>
                    <Ojo abierto={showPassword} />
                </button>
            </span>
            {errors[nombre] && error && <span className="cuF__error" role="alert">{error}</span>}
        </label>
    );

    return (
        <div className={`profEditBox${enHoja ? ' profEditBox--hoja' : ''}`}>
            <div className="title"><h3>Cambiar contraseña</h3></div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate
                className={`cuF${loadingForm ? ' is-guardando' : ''}`}>

                {campo('clave-actual', 'oldPassword', 'Contraseña actual', 'current-password',
                    'Escribe tu contraseña actual (8 caracteres o más).')}
                {campo('clave-nueva', 'password', 'Nueva contraseña', 'new-password', null)}
                <ul className="cuF__reglas" aria-label="Tu nueva contraseña debe tener">
                    {reglas.map((r) => (
                        <li key={r.txt} className={r.ok ? 'is-ok' : undefined}><i aria-hidden="true" />{r.txt}</li>
                    ))}
                </ul>
                {campo('clave-repetida', 'passwordConfirm', 'Repite la nueva contraseña', 'new-password',
                    'Las contraseñas no coinciden.')}

                {respErr.status && <p className="cuF__aviso" role="alert">{respErr.data}</p>}

                {!enHoja &&
                    <p className="cuF__nota">
                        Se guarda cifrada: nadie puede verla, ni nosotros.
                    </p>}

                {children}

                <button type="submit" className="cuF__guardar" disabled={loadingForm}>
                    {loadingForm ? 'Guardando…' : 'Guardar'}
                </button>
            </form>
        </div>
    )
};

export default ProfileChangePassword;
