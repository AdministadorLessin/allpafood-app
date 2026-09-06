import React,{useEffect,useState} from "react";
import Grid from '@mui/material/Grid';
import './Password.scss';

import axios from 'axios';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuthContext } from './../../../../context/authContext';
import { API_URL } from '../../../../config';


const ProfileChangePassword = ({iconImg,closeModal}) => {

    const [loadingForm,setLoadingForm] = useState(false);
    const { token } = useAuthContext();

    const validationSchema = Yup.object().shape({
        oldPassword: Yup.string().min(8, "Deben tener al menos ocho caracteres.").required(),
        password: Yup.string().min(8, "Deben tener al menos ocho caracteres.").required()
            .matches(/^(?=.*[a-z])/,"Incluir mayúsculas y minúsculas.")
            .matches(/^(?=.*[A-Z])/,"Incluir mayúsculas y minúsculas.")
            .matches(/^(?=.*[0-9])/,"Incluir números.")
            .matches(/^(?=.*[!@#\$%\^&\*])/,"Incluir símbolos."),
        passwordConfirm: Yup
            .string()
            .required('Las contraseñas no coinciden.')
            .oneOf([Yup.ref('password'), null], 'Passwords must match'),
    });

    const {
            register,
            handleSubmit,
            formState,
            formState: { errors },
            reset
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
            ).then((resp)=>{
                console.log(resp)
                //updatePrivacity();
                closeModal();
                setLoadingForm(false);
            }).catch((errr)=>{
                //console.log('--->',errr);
                setLoadingForm(false);
                if(errr.status === 409){
                    setRespErr({
                        status:true,
                        data:errr.response.data.message
                    });
                }else{
                    setRespErr({
                        status:false,
                        data:null
                    });
                }
                
            })

    }

    const onSubmit = async (data) => {
        console.log(data)
        updateDataPrivacity(data);
    }

    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
  
    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };

    useEffect(()=>{
    },[])


    return (
        <div className="profEditBox">
            <div className="title">
                <div className="ico">
                    {iconImg &&
                        <img src={iconImg} alt="" />
                    }
                </div>
                <h3>Cambiar contraseña</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={loadingForm ? 'inlineBlock disableForm':'inlineBlock'}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={12} md={12}>

                        <div className="textFieldPassword">
                            <FormControl sx={{width: '100%'}} variant="filled">
                                <InputLabel htmlFor="standard-adornment-password111">Contraseña Actual</InputLabel>
                                <Input
                                    id="standard-adornment-password111"
                                    type={showPassword ? 'text' : 'password'}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                    {...register("oldPassword")}
                                    error={errors.oldPassword ? true : false}
                                />
                            </FormControl>
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>

                        <div className="textFieldPassword">
                            <FormControl sx={{width: '100%'}} variant="filled">
                                <InputLabel htmlFor="standard-adornment-password">Nueva Contraseña</InputLabel>
                                <Input
                                    id="standard-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                    {...register("password")}
                                    error={errors.password ? true : false}
                                />
                            </FormControl>
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldPassword">
                            <FormControl sx={{width: '100%'}} variant="filled">
                                <InputLabel htmlFor="standard-adornment-password">Confirmar contraseña</InputLabel>
                                <Input
                                    id="standard-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                    {...register("passwordConfirm")}
                                    error={errors.passwordConfirm ? true : false}
                                />
                            </FormControl>
                        </div>
                    </Grid>

                    {respErr.status &&
                        <Grid item xs={12} sm={12} md={12}>
                            <Alert severity="error">{respErr.data}</Alert>
                        </Grid>
                    }

                    {!formState.isValid &&
                        <Grid item xs={12} sm={12} md={12}>
                            <div className="formDateValid">
                                {errors.password?.message ==='Deben tener al menos ocho caracteres.' && <p>(*) Deben tener al menos ocho caracteres</p>}
                                {errors.password?.message ==='Incluir mayúsculas y minúsculas.' && <p>(*) Incluir mayúsculas y minúsculas</p>}
                                {errors.password?.message ==='Incluir números.' && <p>(*) Incluir números</p>}
                                {errors.password?.message ==='Incluir símbolos.' && <p>(*) Incluir símbolos</p>}
                                {errors.passwordConfirm?.message && <p>(*) Las contraseñas no coinciden.</p>}
                            </div>
                        </Grid>
                    }
                    <Grid item xs={12} sm={12} md={12}>
                        <div className="inlineFlex formRow formRowBtn">
                            {loadingForm ?
                                <div  className='btnPrimary'>
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

export default ProfileChangePassword;
