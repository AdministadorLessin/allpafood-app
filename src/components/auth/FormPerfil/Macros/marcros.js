import React,{ useState } from "react";
import './macros.scss';

import icoProte from '../../../../assets/img/ico_prote.png';
import icoCarbo from '../../../../assets/img/ico_carbo.png';
import icoGrasas from '../../../../assets/img/ico_grasas.png';

import icoCalorias from '../../../../assets/img/ico_cal.png';
import SemiChart from './../../../dashboard/ObjetivosCalc/SemiChart';
import CircleChart from './../../../dashboard/ObjetivosCalc/CircleChart';

import Skeleton from '@mui/material/Skeleton';
import BlockAnimate from './../../../ultil/BlockAnimate/BlockAnimate';

const FpMacros = ({macrosLoad,dataNeedDay}) => {


    return (
        <ul className={'inlineFlex loadMacrosList'}>

            <li className={'kcalBox'}>
                <div className="graphic">
                    <SemiChart
                        percent={macrosLoad.kcal ? 100 : 0} 
                        heightChart={150}
                    />
                    <img src={icoCalorias} />
                </div>
                <BlockAnimate
                    claseStyle={'inlineBlock'}
                    stateParam={macrosLoad.kcal}
                    unicId={'loadMacrosKcalLoadTxt'}
                >
                    {macrosLoad.kcal ?
                        <div className="txt">
                            <h5>Calorías</h5>
                            <p>{(dataNeedDay.bmr).toFixed(1)}<small>Kcal</small></p>
                        </div>
                    :
                        <div className="txt">
                            <h5><Skeleton variant="text" sx={{ fontSize: '1rem',width:'62.92px' }} /></h5>
                            <p><Skeleton variant="text" sx={{ fontSize: '1rem',width:'62.92px' }} /></p>
                        </div>
                    }
                </BlockAnimate>
            </li>

            <li className={'macroGraphBox proteinBox'}>
                <div className="graphic">
                    <CircleChart 
                        data={{
                                colors:['#44DF86','#44DF86'],
                                height:90,
                                border:'55%',
                                percent: macrosLoad.protein ? 100 : 0
                            }}
                    />
                    <img src={icoProte} />
                </div>
                <BlockAnimate
                    claseStyle={'inlineBlock'}
                    stateParam={macrosLoad.protein}
                    unicId={'loadMacrosProteinLoadTxt'}
                >
                    {macrosLoad.protein ?
                        <div className="txt">
                            <h5>Proteínas</h5>
                            <p>{(dataNeedDay.macros.protein).toFixed(1)} <small>gr</small></p>
                        </div>
                    :
                        <div className="txt">
                            <h5><Skeleton variant="text" sx={{ fontSize: '1rem',width:'60.59px' }} /></h5>
                            <p><Skeleton variant="text" sx={{ fontSize: '1rem',width:'60.59px' }} /></p>
                        </div>
                    }
                </BlockAnimate>
            </li>

            <li className={'macroGraphBox carbsBox'}>
                <div className="graphic">
                    <CircleChart 
                        data={{
                            colors:['#45C3DF','#45C3DF'],
                            height:90,
                            border:'55%',
                            percent: macrosLoad.carbs ? 100 : 0
                        }}
                    />
                    <img src={icoCarbo} />
                </div>
                <BlockAnimate
                    claseStyle={'inlineBlock'}
                    stateParam={macrosLoad.carbs}
                    unicId={'loadMacrosCarbsinLoadTxt'}
                >
                    {macrosLoad.carbs ?
                        <div className="txt">
                            <h5>Carbs.</h5>
                            <p>{(dataNeedDay.macros.carbs).toFixed(1)} <small>gr</small></p>
                        </div>
                    :
                        <div className="txt">
                            <h5><Skeleton variant="text" sx={{ fontSize: '1rem',width:'49px' }} /></h5>
                            <p><Skeleton variant="text" sx={{ fontSize: '1rem',width:'49px' }} /></p>
                        </div>
                    }
                </BlockAnimate>
            </li>

            <li className={'macroGraphBox fatBox'}>
                <div className="graphic">
                    <CircleChart 
                        data={{
                            colors:['#4588DF','#4588DF'],
                            height:90,
                            border:'55%',
                            percent: macrosLoad.grasas ? 100 : 0
                        }}
                    />
                    <img src={icoGrasas} />
                </div>
                <BlockAnimate
                    claseStyle={'inlineBlock'}
                    stateParam={macrosLoad.grasas}
                    unicId={'loadMacrosCarbsinLoadTxt'}
                >
                    {macrosLoad.grasas ?
                        <div className="txt">
                            <h5>Grasas</h5>
                            <p>{dataNeedDay.macros.fat} <small>gr</small></p>
                        </div>
                    :
                        <div className="txt">
                            <h5><Skeleton variant="text" sx={{ fontSize: '1rem',width:'46.13px' }} /></h5>
                            <p><Skeleton variant="text" sx={{ fontSize: '1rem',width:'46.13px' }} /></p>
                        </div>
                    }
                </BlockAnimate>
            </li>

        </ul>
    )
};

export default FpMacros;
