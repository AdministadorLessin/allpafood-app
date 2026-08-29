import React,{useEffect,useState} from "react";
import './ObjetivosCalc.scss';

import CircleChart from './CircleChart';
import SemiChart from './SemiChart';

import icoProte from '../../../assets/img/ico_prote.png';
import icoCarbo from '../../../assets/img/ico_carbo.png';
import icoGrasas from '../../../assets/img/ico_grasas.png';

import icoCalorias from '../../../assets/img/ico_cal.png';


const ObjetivosCalc = ({data}) => {

    const [objList,setObjList] = useState();
    const [calcList,setCalcList]  = useState();
    
    useEffect(()=>{
        setObjList(JSON.parse(localStorage.getItem('needBrm')));
        setCalcList(data)
    },[data])

    return (
        <div className="inlineFlex dashCalcObject">
            <div className="inlineFlex semiChart">
                <div className="semiChartBox">
                    <SemiChart percent={calcList && objList ? ((calcList.calorias/objList.bmr)*100).toFixed(1) : 5} heightChart={220} />
                    <img src={icoCalorias} />
                </div>
                <div className="txt">
                    <small>Calorías</small>
                    <p><strong>{ calcList ? (calcList.calorias).toFixed(0):'--'}</strong>/{objList && (objList.bmr).toFixed(0)}</p>
                </div>
            </div>
            <div className="inlineFlex doChartList">
                <div className="inlineFlex doChartItem">
                    <div className="chartRadial">
                        <CircleChart 
                            data={{
                                colors:['#44DF86','#44DF86'],
                                border:'45%',
                                height:90,
                                percent:calcList && objList ? ((calcList.proteinas/objList.macros.protein)*100).toFixed(1) : 5
                            }}
                        />
                        <img src={icoProte} />
                    </div>
                    <div className="txt">
                        <small>Prot.</small>
                        <p><strong>{ calcList ? calcList.proteinas:'--'} </strong>/{objList && objList.macros.protein} <b>gr</b></p>
                    </div>
                </div>
                <div className="inlineFlex doChartItem">
                    <div className="chartRadial">
                        <CircleChart 
                            data={{
                                colors:['#45C3DF','#45C3DF'],
                                border:'45%',
                                height:90,
                                percent:calcList && objList ? ((calcList.carbo/objList.macros.carbs)*100).toFixed(1) : 5
                            }}
                        />
                        <img src={icoCarbo} />
                    </div>
                    <div className="txt">
                        <small>Carb.</small>
                        <p><strong>{ calcList ? calcList.carbo:'--'}</strong>/{objList && objList.macros.carbs} <b>gr</b></p>
                    </div>
                </div>
                <div className="inlineFlex doChartItem">
                    <div className="chartRadial">
                        <CircleChart 
                            data={{
                                colors:['#4588DF','#4588DF'],
                                border:'45%',
                                height:90,
                                percent:calcList && objList ? ((calcList.grasas/objList.macros.fat)*100).toFixed(1) : 5
                            }}
                        />
                        <img src={icoGrasas} />
                    </div>
                    <div className="txt">
                        <small>Grasas</small>
                        <p><strong>{ calcList ? calcList.grasas:'--'}</strong>/{objList && objList.macros.fat} <b>gr</b></p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default ObjetivosCalc;
