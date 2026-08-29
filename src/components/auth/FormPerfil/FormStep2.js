import React,{useState,useEffect} from "react";

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InputLabel from '@mui/material/InputLabel';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import InputAdornment from '@mui/material/InputAdornment';

const FormPerfilStep2 = ({stepForm,setStepForm,data,setData}) => {

    // Sex option
    const [cfEjercicios,setCfEjercicios] = useState();
    const [cfFueza,setCfFuerza] = useState();
    const [validForm,setValidForm] = useState(false);

    const changeCfEjercicio = (resp) =>{
        setCfEjercicios(resp);
    }

    const changeCfFuerza = (resp) =>{
        setCfFuerza(resp);
    }

    const [rutina, setRutina] = useState('');

    const handleChangeRutina = (event) => {
        setRutina(event.target.value);
        setBodyForm({
            ...bodyForm,
            [event.target.name]:event.target.value
        })

    };

    const validationSchema = Yup.object().shape({
        fsestatura: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        fspeso: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        fshorasejercicio: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        fsrutina: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        fsdiasejercicio: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
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


    const prevForm = () =>{
        //updateData(data);
        setStepForm(stepForm - 1);
    }

    const [bodyForm,setBodyForm] = useState({
        fsestatura:'',
        fspeso:'',
        fshorasejercicio:0,
        fsrutina:'',
        fsdiasejercicio:0
    });

    /*
    1.00 (sedentario) 
    1.35 (trabajo de escritorio normal)
    1.45 (entrenamiento 3 veces por semana + trabajo de escritorio normal)
    1.50 (entrenamiento 3 veces por semana + trabajo activo)
    1.55 (atleta y culturista (entrenamiento 5 veces por semana) + trabajo de escritorio normal)
    1.65 (atleta y culturista (entrenamiento 5 veces por semana) + trabajo activo)
    1.75 (atleta profesional (entrenamiento 5+ veces por semana))
    1.85 (atleta de resistencia)
    */

    const handleChangeFields = (e) =>{
        setBodyForm({
            ...bodyForm,
            [e.target.name]:e.target.value
        })
    }

    const updateData = (dataUpdate) =>{
        if(data && data.information){
            setData(prevState =>({
                ...prevState,
                information:{
                    ...prevState.information,
                    height:dataUpdate.fsestatura,
                    weight:dataUpdate.fspeso,
                    trainingDays:dataUpdate.fsdiasejercicio,
                    trainingHours:dataUpdate.fshorasejercicio,
                    trainingLevel:cfEjercicios,
                    routine:dataUpdate.fsrutina,
                    strengthTraining:cfFueza
                }
            }))
        }
    }

    const onSubmitHandler = (datsa) => {
        setValidForm(false);
        updateData(datsa);
        setStepForm(stepForm + 1);
    };

    useEffect(()=>{
        if(data){
            if(data.information){
                setBodyForm({
                    fsestatura:data.information.height,
                    fspeso:data.information.weight,
                    fshorasejercicio:data.information.trainingHours,
                    fsrutina:data.information.routine,
                    fsdiasejercicio:data.information.trainingDays
                })
                setCfEjercicios(data.information.trainingLevel);
                setCfFuerza(data.information.strengthTraining);
            }
        }
    },[])


    return (
        
        <form className={'regStepResp'} onSubmit={handleSubmit(onSubmitHandler)}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={12} md={3}>
                    <div className="textFieldReg2">
                        <TextField 
                            id="fsestatura" 
                            name="fsestatura"
                            type={'number'}
                            variant="filled" 
                            label={'¿Cuánto mides?'}
                            error={errors.fsestatura ? true : false}
                            {...register("fsestatura")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fsestatura} 
                            InputProps={{
                                endAdornment: bodyForm.fsestatura ? (
                                    <InputAdornment 
                                        position="end"
                                        className="uMedida"
                                    >
                                        cm
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={3}>
                    <div className="textFieldReg2">
                        <TextField
                            id="fspeso" 
                            name="fspeso"
                            type={'number'}
                            variant="filled" 
                            label={'¿Cuánto pesas?'}
                            error={errors.fspeso ? true : false}
                            {...register("fspeso")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fspeso} 
                            InputProps={{
                                endAdornment: bodyForm.fspeso ? (
                                    <InputAdornment 
                                        position="end"
                                        className="uMedida"
                                    >
                                        .kg
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className={errors.fsrutina ? "textFieldReg textFieldRegSelect" : "textFieldReg textFieldRegSelect textFieldRegSelectAct"}>
                        <FormControl fullWidth>
                            <InputLabel id="fsrutina">En tu rutina diaria normalmente:</InputLabel>
                            <Select
                                id="fsrutina" 
                                name="fsrutina"
                                variant="outlined" 
                                error={errors.fsrutina ? true : false}
                                {...register("fsrutina")} 
                                onChange={handleChangeRutina} 
                                value={bodyForm.fsrutina} 
                            >
                                <MenuItem value={'A'}>Sedentario</MenuItem>
                                <MenuItem value={'B'}>Trabajo de escritorio normal</MenuItem>
                                <MenuItem value={'C'}>Trabajo activo</MenuItem>
                                <MenuItem value={'D'}>Atleta y culturista</MenuItem>
                                <MenuItem value={'E'}>Atleta profesional</MenuItem>
                                <MenuItem value={'F'}>Atleta de resistencia</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </Grid>

                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            id="fsdiasejercicio" 
                            name="fsdiasejercicio"
                            type={'number'}
                            variant="filled" 
                            label={'¿Cuántos días a la semana te ejercitas?'}
                            error={errors.fsdiasejercicio ? true : false}
                            {...register("fsdiasejercicio")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fsdiasejercicio === 0 ? '' : bodyForm.fsdiasejercicio} 
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            id="fshorasejercicio" 
                            name="fshorasejercicio"
                            type={'number'}
                            label={'¿Cuántas horas al dia te ejercitas?'}
                            variant="filled" 
                            error={errors.fshorasejercicio ? true : false}
                            {...register("fshorasejercicio")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fshorasejercicio === 0 ? '': bodyForm.fshorasejercicio } 
                        />
                    </div>
                </Grid>
                {bodyForm.fsdiasejercicio > 0 &&
                    <Grid item xs={12} sm={12} md={6}>
                        <div className="textFieldReg">
                            <p>La intensidad de mi entrenamiento es:</p>
                            <div className="rsrIntensidad">
                                <span className={cfEjercicios === 'L' ? 'active':null} onClick={()=>changeCfEjercicio('L')}>Leve</span>
                                <span className={cfEjercicios === 'M' ? 'active':null} onClick={()=>changeCfEjercicio('M')}>Moderada</span>
                                <span className={cfEjercicios === 'F' ? 'active':null} onClick={()=>changeCfEjercicio('F')}>Fuerte</span>
                            </div>
                        </div>
                    </Grid>
                }
                {bodyForm.fsdiasejercicio > 0 &&
                    <Grid itemxs={12} sm={12} md={6}>
                        <div className="textFieldReg">
                            <p>¿Realizas entrenamiento de fuerza?</p>
                            <div className="rsrIntensidad">
                                <span className={cfFueza === true ? 'active':null} onClick={()=>changeCfFuerza(true)} >Si</span>
                                <span className={cfFueza === false ? 'active':null} onClick={()=>changeCfFuerza(false)}>No</span>
                            </div>
                        </div>
                    </Grid>
                }
                <Grid item xs={12}>
                    <div className="btnBox">
                        <a href="#" onClick={prevForm} className="btnPrimary btnIcon btnOutline">
                            <span>
                                <ArrowBackIosIcon />
                                Volver
                            </span>
                        </a>
                        <button type={'submit'} className="btnPrimary btnIcon btnIconRight">
                            <span>
                                Siguiente
                                <ArrowForwardIosIcon />
                            </span>
                        </button>
                    </div>
                </Grid>
            </Grid>
        </form>
    )
};

export default FormPerfilStep2;
