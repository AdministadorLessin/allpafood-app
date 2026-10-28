import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import './AvisosCliente.scss';
import { useAuthContext } from '../../../context/authContext';
import { motion, alToque } from '../../ultil/Motion/Motion';
import IcoIsotipoSvg from '../../ultil/iconSvg/icoIsotipoSvg';
import IlustracionFeriado from './IlustracionFeriado';
import { API_URL } from '../../../config';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

/* La fecha del aviso, no la de hoy: si el cliente abre el app al dia
   siguiente, el aviso tiene que seguir diciendo de que dia hablaba. */
const fechaDelAviso = (valor) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor || ''));
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
  return { texto: `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`, dia: d.getDate() };
};

/**
 * Lo que operacion hizo en la cuenta del cliente y el cliente tiene que saber.
 *
 * Sale una vez al entrar al panel y al cerrarlo no vuelve a aparecer. Hay dos
 * caras: la normal —le devolvimos envios— y la de feriado, que avisa que ese
 * dia no hay reparto. Un dia sin comida no se puede anunciar con la misma
 * cara que un movimiento de saldo: el cliente tiene que reconocerlo antes de
 * leerlo, y ademas necesita salir de ahi directo a elegir otro dia.
 *
 * El tipo lo manda el servidor. Si viene vacio —porque el servidor todavia no
 * lo envia— se dibuja la cara normal, que es la que habia antes.
 */
const AvisosCliente = ({ oculto }) => {
  const { token } = useAuthContext();
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}avisos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setAvisos(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
      .catch(() => setAvisos([]));
  }, [token]);

  if (oculto || avisos.length === 0) return null;

  const cerrar = (destino) => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };
    avisos.forEach((a) => axios.post(`${API_URL}avisos/${a.id}/visto`, null, cab).catch(() => {}));
    setAvisos([]);
    if (destino) navigate(destino);
  };

  /* El feriado manda sobre cualquier otro aviso pendiente: es el unico que
     cambia lo que al cliente le va a pasar hoy. */
  const esFeriado = (a) => String(a.tipo || '').toLowerCase() === 'feriado';
  const principal = avisos.find(esFeriado) || avisos[0];
  const resto = avisos.filter((a) => a.id !== principal.id);
  const feriado = esFeriado(principal);
  const cuando = fechaDelAviso(principal.fecha);

  /* Fuera del arbol de la pagina: dentro, la barra de abajo quedaba encima de
     la ventana y tapaba los botones. */
  return createPortal(
    <div className={`afAviso${feriado ? ' afAviso--feriado' : ''}`} onClick={() => cerrar()}>
      <motion.div
        className="afAviso__caja"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 0.84, 0.44, 1] }}
      >
        <div className="afAviso__top">
          {feriado ? (
            <>
              <motion.div
                className="afAviso__escena"
                initial={{ opacity: 0, scale: .9, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: .08, duration: .5, ease: [0.16, 0.84, 0.44, 1] }}
              >
                <IlustracionFeriado dia={cuando.dia} />
              </motion.div>
              <span className="afAviso__chip">{cuando.texto}</span>
            </>
          ) : (
            <span className="afAviso__iso"><IcoIsotipoSvg /></span>
          )}

          <h2 className="afAviso__tit">{principal.titulo}</h2>
          <p className="afAviso__baja">{principal.mensaje}</p>
        </div>

        <div className="afAviso__cuerpo">
          {feriado &&
            <p className="afAviso__nota">
              <span className="afAviso__punto" />
              <span>Tu envío no se pierde. Queda en tu saldo y puedes usarlo el día que quieras.</span>
            </p>
          }

          {resto.map((a) => (
            <p className="afAviso__otro" key={a.id}>
              <b>{a.titulo}.</b> {a.mensaje}
            </p>
          ))}

          {feriado ? (
            <>
              <motion.button type="button" className="afAviso__btn" onClick={() => cerrar('/menu')} {...alToque}>
                Elegir otro día
              </motion.button>
              <button type="button" className="afAviso__btn afAviso__btn--suave" onClick={() => cerrar()}>
                Ahora no
              </button>
            </>
          ) : (
            <motion.button type="button" className="afAviso__btn" onClick={() => cerrar()} {...alToque}>
              Entendido
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default AvisosCliente;
