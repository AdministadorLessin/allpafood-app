import React,{useEffect,useState} from "react";
import Grid from '@mui/material/Grid';
import './Privacidad.scss';
import TextField from '@mui/material/TextField';

import axios from 'axios';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthContext } from './../../../../context/authContext';

const ProfileChangePrivacity = ({iconImg,data,closeModal,updatePrivacity}) => {

    const [loadingForm,setLoadingForm] = useState(false);
    const { token } = useAuthContext();

    const validationSchema = Yup.object().shape({
        fpdni:Yup.string().min(2, "Deben tener al menos ocho caracteres.").max(150).required(),
        fpwhatsapp:Yup.string().min(2, "Deben tener al menos ocho caracteres.").max(150).required()
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


    const [bodyForm,setBodyForm] = useState({
        fpdni:'',
        fpwhatsapp:'',
        fpfecnac:'',
        fpdir:'',
    });

    const handleChangeFields = (e) =>{
        setBodyForm({
            ...bodyForm,
            [e.target.name]:e.target.value
        })
    }


    const updateDataPrivacity = (dataTmp) =>{
        setLoadingForm(true);
        axios.put('https://api.allpafood.com/dev/api-af/v1/profile/data/privacy',
            {
                documentNumber: dataTmp.fpdni,
                phoneNumber: dataTmp.fpwhatsapp,
                bornDate:bodyForm.fpfecnac,
                address:bodyForm.fpdir
            },
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }
            ).then((resp)=>{
                //console.log(resp);
                updatePrivacity();
                closeModal();
                setLoadingForm(false);
            }).catch((errr)=>{
                console.log(errr);
                setLoadingForm(false);
            })

    }

    const onSubmitUpt = async (data) => {
        console.log(data);
        updateDataPrivacity(data);
    }


    useEffect(()=>{
        setBodyForm({
            fpdni:data.documentNumber,
            fpwhatsapp:data.phoneNumber,
            fpfecnac:data.bornDate,
            fpdir:data.address,
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
            <form onSubmit={handleSubmit(onSubmitUpt)} className={loadingForm ? 'inlineBlock disableForm':'inlineBlock'}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpdni" 
                                name="fpdni"
                                type={'number'}
                                label={'DNI:'}
                                variant="filled" 
                                error={errors.fpdni ? true : false}
                                {...register("fpdni")} 
                                onChange={handleChangeFields} 
                                value={bodyForm.fpdni} 
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpwhatsapp" 
                                name="fpwhatsapp"
                                type={'number'}
                                label={'Whatsapp:'}
                                variant="filled" 
                                error={errors.fpwhatsapp ? true : false}
                                {...register("fpwhatsapp")} 
                                onChange={handleChangeFields} 
                                value={bodyForm.fpwhatsapp} 
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpfecnac" 
                                name="fpfecnac"
                                type={'text'}
                                label={'Fecha de nacimiento:'}
                                variant="filled" 
                                error={errors.fpfecnac ? true : false}
                                //{...register("fpfecnac")} 
                                //onChange={handleChangeFields} 
                                value={bodyForm.fpfecnac} 
                                disabled
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg2">
                            <TextField
                                id="fpdir" 
                                name="fpdir"
                                type={'text'}
                                label={'Direccion:'}
                                variant="filled" 
                                error={errors.fpdir ? true : false}
                                //{...register("fpdir")} 
                                //onChange={handleChangeFields} 
                                value={bodyForm.fpdir} 
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

export default ProfileChangePrivacity;
