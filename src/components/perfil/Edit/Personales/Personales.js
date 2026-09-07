import React,{useEffect,useState} from "react";
import Grid from '@mui/material/Grid';
import './Personales.scss';
import TextField from '@mui/material/TextField';

import axios from 'axios';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import CircularProgress from '@mui/material/CircularProgress';

import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';
import { useAuthContext } from './../../../../context/authContext';
import { API_URL } from '../../../../config';

const ProfileChangePerson = ({iconImg,closeModal,data,updatePerson}) => {

    const [loadingForm,setLoadingForm] = useState(false);
    const { token } = useAuthContext();

    const [bodyForm,setBodyForm] = useState({
        fpnombres:'',
        fpapellos:'',
        fpinscripcion:'',
        fpcorreo:'',
    });

    const validationSchema = Yup.object().shape({
        fpnombres:Yup.string().min(2, "Deben tener al menos ocho caracteres.").max(150).required(),
        fpapellos:Yup.string().min(2, "Deben tener al menos ocho caracteres.").max(150).required(),
    });


    const {
            register,
            handleSubmit,
            formState: { errors },
            reset
        } = useForm({
            mode: "all",
            shouldUnregister: true,
            resolver: yupResolver(validationSchema),
        });

    const updateDataPrivacity = (dataTmp) =>{
        setLoadingForm(true);
        axios.put(`${API_URL}profile/data/personal`,
            {
                name: dataTmp.fpnombres,
                lastname: dataTmp.fpapellos,
                gender: data.gender,
                registerDate: dataTmp.registerDate ? dataTmp.registerDate  : '2025-04-04',
                image: dataTmp.image ? dataTmp.image: null
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }
            ).then((resp)=>{
                //console.log(resp);
                //updatePrivacity();
                closeModal();
                updatePerson();
                setLoadingForm(false);
            }).catch((errr)=>{
                console.log(errr);
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
            fpnombres:data.name,
            fpapellos:data.lastname,
            fpinscripcion: data.registerDate ? data.registerDate : '2025-04-04',
            fpcorreo:data.email,
        })
    },[])


    return (
        <div className="profEditBox">
            <div className="title">
                <div className="ico">
                    {iconImg &&
                        <img src={iconImg} alt="" />
                    }
                </div>
                <h3>Cambiar datos</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={loadingForm ? 'inlineBlock disableForm':'inlineBlock'}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpnombres" 
                                name="fpnombres"
                                type={'text'}
                                label={'Nombres:'}
                                variant="filled" 
                                error={errors.fpnombres ? true : false}
                                {...register("fpnombres", { onChange: handleChangeFields })} 
                                value={bodyForm.fpnombres} 
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpapellos" 
                                name="fpapellos"
                                type={'text'}
                                label={'Apellidos:'}
                                variant="filled" 
                                error={errors.fpapellos ? true : false}
                                {...register("fpapellos", { onChange: handleChangeFields })} 
                                value={bodyForm.fpapellos} 
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpinscripcion" 
                                name="fpinscripcion"
                                type={'text'}
                                label={'Fecha de inscripcion:'}
                                variant="filled" 
                                error={errors.fpinscripcion ? true : false}
                                {...register("fpinscripcion", { onChange: handleChangeFields })} 
                                value={bodyForm.fpinscripcion} 
                                disabled
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpcorreo" 
                                name="fpcorreo"
                                type={'text'}
                                label={'Correo:'}
                                variant="filled" 
                                error={errors.fpcorreo ? true : false}
                                {...register("fpcorreo", { onChange: handleChangeFields })} 
                                value={bodyForm.fpcorreo} 
                                disabled
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <div className="inlineFlex formRow formRowBtn">
                            {loadingForm ?
                                <div  type='submit' className='btnPrimary'>
                                    Guardando cambios
                                    <CircularProgress size={18} color={'white'} />
                                    
                                </div>
                            :
                                <button  type='submit' className='btnPrimary'>
                                    Guardar cambios
                                    <SaveAsOutlinedIcon />
                                </button>
                            }
                        </div>
                    </Grid>
                </Grid>
            </form>
        </div>
    )
};

export default ProfileChangePerson;
