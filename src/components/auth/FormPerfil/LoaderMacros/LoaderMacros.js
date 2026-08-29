import React,{useState,useEffect} from "react";
import './LoaderMacros.scss';
import IcoIsotipoSvg from './../../../ultil/iconSvg/icoIsotipoSvg';

import { useNavigate } from "react-router-dom";
import { TypeAnimation } from 'react-type-animation';
import FpMacros from './../Macros/marcros';
import { useAuthContext } from "context/authContext";

const LoaderMacros = () => {

    const [dataNeedDay,setDataNeedDay] = useState(JSON.parse(window.localStorage.getItem('needBrm')));

    const {planInfo,removeLocalstorage} = useAuthContext();

    const [macrosLoad,setMacrosLoad] = useState({
        kcal:false,
        protein:false,
        carbs:false,
        grasas:false
    });
    
    let navigate = useNavigate();

    const [hideAnimCard,setHideAnimCard] = useState(false);
    const [showContent,setShowContent] = useState(false);

    useEffect(()=>{
        removeLocalstorage();
    },[])

    return (

        <div className={showContent ? 'loaderMacrosCont': 'loaderMacrosCont loaderMacrosContHide'}>
            

            <div className={hideAnimCard ? 'inlineFlex loaderMacrosBox loaderMacrosBoxHide' : 'inlineFlex loaderMacrosBox'}>
                <IcoIsotipoSvg />
            </div>
            
            <div className={hideAnimCard ? 'loadMacrosItem loadMacrosItemHide' : 'loadMacrosItem'}>
                <TypeAnimation
                    sequence={[
                        '.....',
                        500,
                        ()=>{
                            setShowContent(true)
                        },
                        'Estamos calculando sus calorias.',
                        ()=>{
                            setMacrosLoad({
                                kcal:true,
                                protein:false,
                                carbs:false,
                                grasas:false
                            });
                        },
                        1000,
                        'Estamos calculando sus proteínas.',
                        ()=>{
                            setMacrosLoad({
                                kcal:true,
                                protein:true,
                                carbs:false,
                                grasas:false
                            });
                        },
                        1500,
                        'Estamos calculando sus carboidratos.',
                        ()=>{
                            setMacrosLoad({
                                kcal:true,
                                protein:true,
                                carbs:true,
                                grasas:false
                            });
                        },
                        1500,
                        'Estamos calculando sus grasas.',
                        ()=>{
                            setMacrosLoad({
                                kcal:true,
                                protein:true,
                                carbs:true,
                                grasas:true
                            });
                        },
                        1000,
                        'Bien, estamos casi listos.',
                        ()=>{
                            
                            const timer = setTimeout(() => {
                                setHideAnimCard(true)
                            }, 1000);
                            const timer2 = setTimeout(() => {
                                if(planInfo.planActive){
                                    navigate("/");
                                }else{
                                    navigate("/planes");
                                }

                            }, 1500);

                            return () => {
                                clearInterval(timer);
                                clearInterval(timer2);
                            };
                        }
                    ]}
                    wrapper="h4"
                    speed={50}
                    repeat={0}
                />

                {dataNeedDay &&
                    <FpMacros macrosLoad={macrosLoad} dataNeedDay={dataNeedDay} />
                }
            </div>

        </div>
    )
};

export default LoaderMacros;
