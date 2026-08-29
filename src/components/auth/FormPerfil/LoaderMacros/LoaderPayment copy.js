import React,{useState} from "react";
import './LoadPayment.scss';

import { TypeAnimation } from 'react-type-animation';
import IcoIsotipoSvg from './../../../ultil/iconSvg/icoIsotipoSvg';

import { useNavigate } from "react-router-dom";

const LoaderPayment = ({handleClose}) => {

    let navigate = useNavigate();

    const [hideAnimCard,setHideAnimCard] = useState(false);
    

    return (
        <div className={hideAnimCard ? 'loaderPaymentCont': 'loaderPaymentCont loaderPaymentConttHide'}>
            <div className={'inlineFlex loaderPaymentBox loaderPaymentBoxHide'}>
                <IcoIsotipoSvg />
            </div>

            <div className="loaderPaymentLetter">
                <h1>
                    <TypeAnimation
                        sequence={[
                            '.....',
                            500,
                            ()=>{
                                setHideAnimCard(true)
                            },
                            '¡Genial, el pago a sido exitoso!'
                        ]}
                        cursor={false}
                        speed={60}
                        repeat={0}
                    />
                </h1>
                <h3>
                    <TypeAnimation
                        style={{ whiteSpace: 'pre-line', height: '195px', display: 'block' }}
                        sequence={[
                            2900,
                            `Estamos agregando todos los
                            beneficios correspondientes.`,
                            ()=>{
                                const timerPayment2 = setTimeout(() => {
                                    handleClose();
                                    navigate("/");
                                }, 1000);

                                return () => {
                                    clearInterval(timerPayment2);
                                };
                            }
                        ]}
                        cursor={false}
                        speed={60}
                        repeat={0}
                    />
                </h3>

            </div>

        </div>
    )
};

export default LoaderPayment;
