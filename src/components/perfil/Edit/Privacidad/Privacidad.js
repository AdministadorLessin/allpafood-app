import React,{useEffect,useState} from "react";
import './Privacidad.scss';
import '../campos.scss';
import moment from 'moment';

import axios from 'axios';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { useAuthContext } from './../../../../context/authContext';
import { API_URL } from '../../../../config';

/**
 * Documento y celular. El guardado es el de siempre: PUT profile/data/privacy
 * (el nacimiento y la direccion viajan tal como llegaron).
 */
const ProfileChangePrivacity = ({data,closeModal,updatePrivacity,enHoja,children}) => {

    const [loadingForm,setLoadingForm] = useState(false);
    const [fallo,setFallo] = useState(false);
    const { token } = useAuthContext();

    const validationSchema = Yup.object().shape({
        fpdni:Yup.string().min(2).max(150).required(),
        fpwhatsapp:Yup.string().min(2).max(150).required()
    });

    const {
            register,
            handleSubmit,
            formState: { errors },
        } = useForm({
            mode: "all",
            shouldUnregister: true,
            resolver: yupResolver(validationSchema),
            defaultValues: { fpdni: data?.documentNumber || '', fpwhatsapp: data?.phoneNumber || '' },
        });

    const [bodyForm,setBodyForm] = useState({
        fpdni: data?.documentNumber || '',
        fpwhatsapp: data?.phoneNumber || '',
        fpfecnac: data?.bornDate,
        fpdir: data?.address,
    });

    const handleChangeFields = (e) =>{
        setBodyForm({
            ...bodyForm,
            [e.target.name]:e.target.value
        })
    }

    const updateDataPrivacity = (dataTmp) =>{
        setLoadingForm(true);
        setFallo(false);
        axios.put(`${API_URL}profile/data/privacy`,
            {
                documentNumber: dataTmp.fpdni,
                phoneNumber: dataTmp.fpwhatsapp,
                bornDate:bodyForm.fpfecnac,
                address:bodyForm.fpdir
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }
            ).then(()=>{
                updatePrivacity();
                closeModal();
                setLoadingForm(false);
            }).catch((errr)=>{
                console.log(errr);
                setFallo(true);
                setLoadingForm(false);
            })
    }

    const onSubmitUpt = async (datos) => {
        updateDataPrivacity(datos);
    }

    useEffect(()=>{
        setBodyForm({
            fpdni:data?.documentNumber || '',
            fpwhatsapp:data?.phoneNumber || '',
            fpfecnac:data?.bornDate,
            fpdir:data?.address,
        })
    },[]) // eslint-disable-line react-hooks/exhaustive-deps

    const nacimiento = (() => {
        const m = moment(bodyForm.fpfecnac, ['YYYY-MM-DD', moment.ISO_8601], true);
        return m.isValid() ? m.format('D [de] MMMM [de] YYYY') : '';
    })();

    return (
        <div className={`profEditBox${enHoja ? ' profEditBox--hoja' : ''}`}>
            <div className="title"><h3>Cambiar datos</h3></div>
            <form onSubmit={handleSubmit(onSubmitUpt)} noValidate
                className={`cuF${loadingForm ? ' is-guardando' : ''}`}>
                <label className="cuF__campo" htmlFor="fpdni">
                    <span className="cuF__et">Documento</span>
                    <input className="cuF__in" id="fpdni" type="text" inputMode="numeric" autoComplete="off"
                        aria-invalid={errors.fpdni ? 'true' : undefined}
                        {...register("fpdni", { onChange: handleChangeFields })}
                        value={bodyForm.fpdni} />
                    {errors.fpdni && <span className="cuF__error" role="alert">Escribe tu número de documento.</span>}
                </label>
                <label className="cuF__campo" htmlFor="fpwhatsapp">
                    <span className="cuF__et">Celular (WhatsApp)</span>
                    <input className="cuF__in" id="fpwhatsapp" type="text" inputMode="tel" autoComplete="tel"
                        aria-invalid={errors.fpwhatsapp ? 'true' : undefined}
                        {...register("fpwhatsapp", { onChange: handleChangeFields })}
                        value={bodyForm.fpwhatsapp} />
                    {errors.fpwhatsapp && <span className="cuF__error" role="alert">Escribe tu celular.</span>}
                </label>
                {nacimiento &&
                    <label className="cuF__campo" htmlFor="fpfecnac">
                        <span className="cuF__et">Nacimiento</span>
                        <input className="cuF__in" id="fpfecnac" type="text" value={nacimiento} readOnly disabled />
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

export default ProfileChangePrivacity;
