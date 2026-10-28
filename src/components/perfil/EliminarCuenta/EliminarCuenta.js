import React, { useState } from "react";
import axios from 'axios';
import Dialog from '@mui/material/Dialog';

import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import './EliminarCuenta.scss';

/**
 * Pedir que se elimine la cuenta.
 *
 * Google y Apple exigen que se pueda pedir desde el app, sin escribir por
 * WhatsApp ni por correo: Apple rechaza el app si eliminar la cuenta obliga a
 * salir de el. El pedido queda registrado en el servidor y atencion lo procesa
 * a mano —antes hay que ver que pasa con un plan vigente y sus almuerzos
 * pendientes—. WhatsApp queda solo como salida si el pedido no se pudo
 * enviar.
 */
const WHATSAPP = '51955797697';
const MENSAJE = 'Hola, quiero eliminar mi cuenta de Allpa Food y mis datos personales.';

const fechaCorta = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
};

const EliminarCuenta = () => {
  const { token } = useAuthContext();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState('pregunta');   // pregunta | enviando | hecho | error
  const [pedidoEl, setPedidoEl] = useState('');

  const cabeceras = { headers: { Authorization: `Bearer ${token}` } };

  /* Al abrir, si ya lo pidio antes se le dice eso en vez de ofrecerlo otra
     vez. Si la consulta falla, se le muestra la pregunta normal. */
  const abrir = () => {
    setAbierto(true);
    setEstado('pregunta');
    axios.get(`${API_URL}account/deletion`, cabeceras)
      .then((r) => {
        if (r.data?.requested) { setPedidoEl(r.data.requestedAt || ''); setEstado('hecho'); }
      })
      .catch(() => {});
  };

  const pedir = () => {
    setEstado('enviando');
    axios.post(`${API_URL}account/deletion`, {}, cabeceras)
      .then((r) => { setPedidoEl(r.data?.requestedAt || ''); setEstado('hecho'); })
      .catch(() => setEstado('error'));
  };

  return (
    <>
      <button type="button" className="afEliminarCuenta" onClick={abrir}>
        Eliminar mi cuenta
      </button>

      <Dialog open={abierto} onClose={() => setAbierto(false)}>
        <div className="afEliminarCuentaDlg">
          {estado === 'hecho' ? (
            <>
              <h3>Recibimos tu pedido</h3>
              <p>
                {pedidoEl ? `Lo pediste el ${fechaCorta(pedidoEl)}. ` : ''}
                Atención va a eliminar tu cuenta y tus datos personales, y te
                confirma por WhatsApp cuando esté hecho.
              </p>
              <p>
                Si tienes un plan vigente, antes vemos contigo qué pasa con tus
                almuerzos pendientes.
              </p>
              <div className="afEliminarCuentaDlg__acciones">
                <button type="button" className="afBtn" onClick={() => setAbierto(false)}>Entendido</button>
              </div>
            </>
          ) : (
            <>
              <h3>¿Eliminar tu cuenta?</h3>
              <p>
                Borramos tu cuenta y tus datos personales: nombre, celular, direcciones
                y perfil. Guardamos solo lo que la ley nos pide conservar, como los
                comprobantes de pago.
              </p>
              <p>
                Si tienes un plan vigente, vemos contigo qué pasa con tus almuerzos
                pendientes antes de eliminarla.
              </p>
              {estado === 'error' &&
                <p className="afEliminarCuentaDlg__error">
                  No pudimos enviar tu pedido. Inténtalo de nuevo o{' '}
                  <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAJE)}`}
                     target="_blank" rel="noreferrer">escríbenos por WhatsApp</a>.
                </p>
              }
              <div className="afEliminarCuentaDlg__acciones">
                <button type="button" className="afBtn afBtn--fantasma"
                  onClick={() => setAbierto(false)}>Quedarme</button>
                <button type="button" className="afBtn" onClick={pedir} disabled={estado === 'enviando'}>
                  {estado === 'enviando' ? 'Enviando…' : 'Eliminar mi cuenta'}
                </button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default EliminarCuenta;
