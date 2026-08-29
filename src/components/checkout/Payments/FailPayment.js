import React from "react";
import Modal from '@mui/material/Modal';
import './FailPayment.scss';
import CreditCardOffIcon from '@mui/icons-material/CreditCardOff';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';

const CheckoutPaymentFail = ({handleOpenMp,handleCloseMp,openMp,paymentMethod}) => {
    return (
        <Modal
            open={openMp}
            onClose={handleCloseMp}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <div className="inlineFlex checkoutPaymentFail">
                {paymentMethod ?
                    <div className="inlineFlex checkoutPaymentFailBox">
                        <CreditCardOffIcon />
                        <h3>¡Ups! No procesamos su pago.</h3>
                        <p>
                            Esto puede suceder por:
                        </p>
                        <ul>
                            <li>
                                Datos incorrectos.
                            </li>
                            <li>
                                Saldo insuficiente.
                            </li>
                            <li>
                                Problemas de conexion.
                            </li>
                        </ul>
                        <button onClick={handleCloseMp} className="btnPrimary">
                            Volver
                        </button>
                    </div>
                :
                    <div className="checkoutPaymentFailBox">
                        <ReportGmailerrorredIcon />
                        <h3>¡Ups! No procesamos el Yape. </h3>
                        <p>
                            Esto puede suceder por:
                        </p>
                        <ul>
                            <li>
                                Datos incorrectos.
                            </li>
                            <li>
                                Saldo insuficiente.
                            </li>
                            <li>
                                Problemas de conexion.
                            </li>
                            <li>
                                Codigo de seguriadad expirado
                            </li>
                        </ul>
                        <button onClick={handleCloseMp} className="btnPrimary">
                            Volver
                        </button>
                    </div>
                }


            </div>
        </Modal>
    )
};

export default CheckoutPaymentFail;
