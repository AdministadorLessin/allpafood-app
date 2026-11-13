import React,{useEffect,useState} from "react";
import './Personales.scss';
import '../campos.scss';

import axios from 'axios';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { useAuthContext } from './../../../../context/authContext';
import { API_URL } from '../../../../config';

/**
 * Nombre y apellidos. Lo usa la hoja "Tus datos" de Yo (enHoja) y, en la web,
 * la ventana de "Mi cuenta". El guardado es el de siempre:
 * PUT profile/data/personal.
 */
const ProfileChangePerson = ({closeModal,data,updatePerson,enHoja,children}) => {

    const [loadingForm,setLoadingForm] = useState(false);
    const [fallo,setFallo] = useState(false);
    const { token } = useAuthContext();

    const [bodyForm,setBodyForm] = useState({
        fpnombres: data?.name || '',
        fpapellos: data?.lastname || '',
        fpcorreo: data?.email || '',
    });

    const validationSchema = Yup.object().shape({
        fpnombres:Yup.string().min(2).max(150).required(),
        fpapellos:Yup.string().min(2).max(150).required(),
    });

    const {
            register,
            handleSubmit,
            formState: { errors },
        } = useForm({
            mode: "all",
            shouldUnregister: true,
            resolver: yupResolver(validationSchema),
            defaultValues: { fpnombres: data?.name || '', fpapellos: data?.lastname || '' },
        });

    const updateDataPrivacity = (dataTmp) =>{
        setLoadingForm(true);
        setFallo(false);
        axios.put(`${API_URL}profile/data/personal`,
            {
                name: dataTmp.fpnombres,
                lastname: dataTmp.fpapellos,
                gender: data.gender,
                /* Antes se mandaba siempre image:null y una fecha fija: cambiar
                   el nombre borraba el avatar. Se manda lo que ya tiene, igual
                   que al cambiar de avatar. */
                registerDate: data.registeDate ? data.registeDate : '2025-04-04',
                image: (data.image ?? null)
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }
            ).then(()=>{
                closeModal();
                updatePerson();
                setLoadingForm(false);
            }).catch((errr)=>{
                console.log(errr);
                setFallo(true);
                setLoadingForm(false);
            })
    }

    const onSubmit = async (dataForm) => {
        updateDataPrivacity(dataForm)
    }

    const handleChangeFields = (e) =>{
        setBodyForm({
            ...bodyForm,
            [e.target.name]:e.target.value
        })
    }

    useEffect(()=>{
        setBodyForm({
            fpnombres:data?.name || '',
            fpapellos:data?.lastname || '',
            fpcorreo:data?.email || '',
        })
    },[]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={`profEditBox${enHoja ? ' profEditBox--hoja' : ''}`}>
            <div className="title"><h3>Cambiar datos</h3></div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate
                className={`cuF${loadingForm ? ' is-guardando' : ''}`}>
                <label className="cuF__campo" htmlFor="fpnombres">
                    <span className="cuF__et">Nombre</span>
                    <input className="cuF__in" id="fpnombres" type="text" autoComplete="given-name"
                        aria-invalid={errors.fpnombres ? 'true' : undefined}
                        {...register("fpnombres", { onChange: handleChangeFields })}
                        value={bodyForm.fpnombres} />
                    {errors.fpnombres && <span className="cuF__error" role="alert">Escribe tu nombre.</span>}
                </label>
                <label className="cuF__campo" htmlFor="fpapellos">
                    <span className="cuF__et">Apellidos</span>
                    <input className="cuF__in" id="fpapellos" type="text" autoComplete="family-name"
                        aria-invalid={errors.fpapellos ? 'true' : undefined}
                        {...register("fpapellos", { onChange: handleChangeFields })}
                        value={bodyForm.fpapellos} />
                    {errors.fpapellos && <span className="cuF__error" role="alert">Escribe tus apellidos.</span>}
                </label>
                {bodyForm.fpcorreo &&
                    <label className="cuF__campo" htmlFor="fpcorreo">
                        <span className="cuF__et">Correo</span>
                        <input className="cuF__in" id="fpcorreo" type="email" value={bodyForm.fpcorreo} readOnly disabled />
                    </label>}

                {fallo && <p className="cuF__aviso" role="alert">No pudimos guardar tus datos. Inténtalo de nuevo.</p>}

                {children}

                <button type="submit" className="cuF__guardar" disabled={loadingForm}>
                    {loadingForm ? 'Guardando…' : 'Guardar'}
                </button>
            </form>
        </div>
    )
};

export default ProfileChangePerson;
