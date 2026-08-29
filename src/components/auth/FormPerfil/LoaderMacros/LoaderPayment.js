import React,{ useState, useEffect } from "react";
import './LoadPayment.scss';

import { TypeAnimation } from 'react-type-animation';
import IcoIsotipoSvg from './../../../ultil/iconSvg/icoIsotipoSvg';

import { useNavigate } from "react-router-dom";

const LoaderPayment = () => {

    const navigate = useNavigate();

    const [hideAnimCard, setHideAnimCard] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {

        const timer1 = setTimeout(() => {
            setHideAnimCard(true);
        }, 500);

        const timer2 = setTimeout(() => {
            setShowMessage(true);
        }, 2900);

        const timer3 = setTimeout(() => {
            navigate("/", {
                replace: true
            });
        }, 7000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };

    }, [navigate]);

    return (
        <div className={hideAnimCard ? 'loaderPaymentCont' : 'loaderPaymentCont loaderPaymentConttHide'}>

            <div className="inlineFlex loaderPaymentBox loaderPaymentBoxHide">
                <IcoIsotipoSvg />
            </div>

            <div className="loaderPaymentLetter">

                <h1>
                    <TypeAnimation
                        sequence={[
                            '.....',
                            500,
                            '¡Genial, el pago ha sido exitoso!'
                        ]}
                        cursor={false}
                        speed={60}
                        repeat={0}
                    />
                </h1>

                <h3>
                    {showMessage && (
                        <TypeAnimation
                            sequence={[
                                `Estamos agregando todos los
                                beneficios correspondientes.`
                            ]}
                            cursor={false}
                            speed={60}
                            repeat={0}
                            style={{
                                whiteSpace: 'pre-line',
                                display: 'block'
                            }}
                        />
                    )}
                </h3>

            </div>

        </div>
    );
};

export default LoaderPayment;

