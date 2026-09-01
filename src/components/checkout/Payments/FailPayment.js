import React from "react";
import Modal from '@mui/material/Modal';
import './FailPayment.scss';
import CreditCardOffIcon from '@mui/icons-material/CreditCardOff';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import CloudOffIcon from '@mui/icons-material/CloudOff';

// serverFail distingue un problema NUESTRO (5xx, red caida) de un rechazo real.
// Decirle al cliente que su tarjeta fue rechazada cuando el error es del
// servidor lo hace abandonar la compra creyendo que el problema es suyo.
const CheckoutPaymentFail = ({handleOpenMp,handleCloseMp,openMp,paymentMethod,serverFail}) => {

    const renderServerFail = () => (
        <div className="inlineFlex checkoutPaymentFailBox">
            <CloudOffIcon />
            <h3>Tuvimos un problema de nuestro lado</h3>
            <p>
                <strong>No se realizó ningún cobro.</strong> El error fue nuestro, no de tu
                medio de pago.
            </p>
            <ul>
                <li>Vuelve a intentarlo en unos minutos.</li>
                <li>Si sigue pasando, escríbenos y lo resolvemos contigo.</li>
            </ul>
            <button onClick={handleCloseMp} className="btnPrimary">
                Volver a intentar
            </button>
        </div>
    );

    const renderCardFail = () => (
        <div className="inlineFlex checkoutPaymentFailBox">
            <CreditCardOffIcon />
            <h3>¡Ups! No procesamos su pago.</h3>
            <p>Esto puede suceder por:</p>
            <ul>
                <li>Datos incorrectos.</li>
                <li>Saldo insuficiente.</li>
                <li>Problemas de conexión.</li>
            </ul>
            <button onClick={handleCloseMp} className="btnPrimary">
                Volver
            </button>
        </div>
    );

    const renderYapeFail = () => (
        <div className="checkoutPaymentFailBox">
            <ReportGmailerrorredIcon />
            <h3>¡Ups! No procesamos el Yape.</h3>
            <p>Esto puede suceder por:</p>
            <ul>
                <li>Datos incorrectos.</li>
                <li>Saldo insuficiente.</li>
                <li>Problemas de conexión.</li>
                <li>Código de seguridad expirado.</li>
            </ul>
            <button onClick={handleCloseMp} className="btnPrimary">
                Volver
            </button>
        </div>
    );

    return (
        <Modal
            open={openMp}
            onClose={handleCloseMp}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <div className="inlineFlex checkoutPaymentFail">
                {serverFail
                    ? renderServerFail()
                    : paymentMethod
                        ? renderCardFail()
                        : renderYapeFail()}
            </div>
        </Modal>
    )
};

export default CheckoutPaymentFail;
