import React, { useState } from "react";
import Dialog from '@mui/material/Dialog';

import './EliminarCuenta.scss';

/**
 * Pedir que se elimine la cuenta.
 *
 * Google Play lo exige a toda app donde la gente crea una cuenta: tiene que
 * poder pedirlo desde el app, sin buscar un correo en otra parte. La
 * eliminacion la hace atencion a mano —antes hay que ver que pasa con un plan
 * vigente y sus almuerzos pendientes—, asi que el boton abre el WhatsApp de
 * atencion con el pedido ya escrito. Llega desde el numero del cliente, que
 * es como se le identifica.
 */
const WHATSAPP = '51955797697';
const MENSAJE = 'Hola, quiero eliminar mi cuenta de Allpa Food y mis datos personales.';

const EliminarCuenta = () => {
  const [abierto, setAbierto] = useState(false);

  const pedir = () => {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAJE)}`, '_blank');
    setAbierto(false);
  };

  return (
    <>
      <button type="button" className="afEliminarCuenta" onClick={() => setAbierto(true)}>
        Eliminar mi cuenta
      </button>

      <Dialog open={abierto} onClose={() => setAbierto(false)}>
        <div className="afEliminarCuentaDlg">
          <h3>¿Eliminar tu cuenta?</h3>
          <p>
            Borramos tu cuenta y tus datos personales: nombre, celular, direcciones
            y perfil. Guardamos solo lo que la ley nos pide conservar, como los
            comprobantes de pago.
          </p>
          <p>
            Te escribimos por WhatsApp para confirmarlo. Si tienes un plan vigente,
            vemos contigo qué pasa con tus almuerzos pendientes.
          </p>
          <div className="afEliminarCuentaDlg__acciones">
            <button type="button" className="afBtn afBtn--fantasma"
              onClick={() => setAbierto(false)}>Quedarme</button>
            <button type="button" className="afBtn" onClick={pedir}>Pedir la eliminación</button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default EliminarCuenta;
