import React,{useState} from 'react';
import './FormPerfil.scss';
import icoArrow from '../../../assets/img/ico_arrow_white_large.png';

import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useEffect } from 'react';

const FormPerfilStep1 = ({stepForm,setStepForm,data,setData}) => {

    const [optionSex,setOptionSex] = useState(false);
    const [optionObjetivo,setOptionObjetivo] = useState(false);
    const [validForm,setValidForm] = useState(false);

    const changeSex = (option) =>{
        setOptionSex(option);
    }

    const changeObjetivo = (option) =>{
        setOptionObjetivo(option);
    }

    const nextForm = () =>{
        if(optionSex && optionObjetivo ){
            setValidForm(false);
            if(data && data.information){
                setData(prevState =>({
                    ...prevState,
                    information:{
                        ...prevState.information,
                        gender:optionSex,
                        nutritionalObjective:optionObjetivo
                    }
                }))
            }else{
                setData(prevState =>({
                    ...prevState,
                    information:{
                        gender:optionSex,
                        nutritionalObjective:optionObjetivo
                    }
                }))
            }
            setStepForm(stepForm + 1);
        }else{
            setValidForm(true);
        }
    }

    useEffect(()=>{
        if(data && data.information && data.information.gender ){
            setOptionSex(data.information.gender);
            setOptionObjetivo(data.information.nutritionalObjective);
        }
    },[])

    return (
        <div className="regStepResp">
            <div className="inlineBlock regSexField">
                <div className="rsrTitle" >
                    <span>¿Cual es tu sexo de nacimiento?</span>
                </div>
                <div className="regSexBox">
                    <span className={optionSex === 'M' ? 'active':null} onClick={()=>changeSex('M')} >
                        <MaleIcon />
                        Masculino
                    </span>
                    <span className={optionSex === 'F' ? 'active':null} onClick={()=>changeSex('F')} >
                        <FemaleIcon />
                        Femenino
                    </span>
                </div>
                {validForm && !optionSex &&
                    <div className="regErrorField">
                        <p> <ErrorOutlineIcon /> Seleccione el sexo por favor.</p>
                    </div>
                }
            </div>
            <div className="inlineBlock regObjField">
                <div className="rsrTitle">
                    <span>Tu objetivo nutricional es...</span>
                </div>
                <div className="inlineFlex regObjList">
                    <div className={optionObjetivo === 'LOSE' ? 'regObjItem regObjItemAct' : 'regObjItem'} onClick={()=>changeObjetivo('LOSE')} >
                        <div className="checkBox">
                            <TrendingDownIcon />
                        </div>
                        <div className="txt">
                            <h4>Bajar de peso</h4>
                            <p>Menos calorías de las que gastas, sin pasar hambre</p>
                        </div>
                    </div>
                    <div className={optionObjetivo === 'IMPROVE' ? 'regObjItem regObjItemAct' : 'regObjItem'} onClick={()=>changeObjetivo('IMPROVE')} >
                        <div className="checkBox">
                            <FavoriteIcon />
                        </div>
                        <div className="txt">
                            <h4>Mejorar mi salud</h4>
                            <p>Mantener tu peso y comer mejor cada día</p>
                        </div>
                    </div>
                    <div className={optionObjetivo === 'GAIN' ? 'regObjItem regObjItemAct' : 'regObjItem'} onClick={()=>changeObjetivo('GAIN')} >
                        <div className="checkBox">
                            <TrendingUpIcon />
                        </div>
                        <div className="txt">
                            <h4>Subir de peso</h4>
                            <p>Más calorías y proteína, para ganar masa</p>
                        </div>
                    </div>
                </div>
                {validForm && !optionObjetivo &&
                    <div className="regErrorField">
                        <p><ErrorOutlineIcon /> Seleccine un objetivo por favor.</p>
                    </div>
                }
            </div>

            <div className="inlineFlex btnBox btnBoxLeft">
                <div className="btnPrimary btnIcon btnIconRight" onClick={nextForm}>
                    <span>
                        Siguiente
                        <img src={icoArrow} alt="" />
                    </span>
                </div>
            </div>
        </div>
    )
};

export default FormPerfilStep1;
