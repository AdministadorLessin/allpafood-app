import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
import { cascada, sube, resorte } from '../../../movimiento';
import './Invita.scss';

/**
 * "Invita y come gratis": el codigo del cliente, lo que lleva ganado y la
 * escalera. Todo sale del servidor (GET /referidos); aqui solo se pinta y se
 * comparte.
 */

/* A donde manda el mensaje: una pagina de la web que muestra el codigo y lleva
   a la tienda del telefono que la abre (pages/invitacion). Un solo enlace
   para iPhone y Android. */
const enlaceDe = (codigo) => `https://app.allpafood.com/i/${codigo}`;

const Ico = ({ d, w = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const I = {
  atras: 'M15 6l-6 6 6 6',
  chat: 'M21 12a8 8 0 0 1-12 7l-5 1 1-4.5A8 8 0 1 1 21 12z',
  check: 'M5 12l5 5 9-10',
  copiar: ['M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', 'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2'],
};
const entregas = (n) => (Number(n) === 1 ? '1 entrega' : `${n} entregas`);
const amigos = (n) => (Number(n) === 1 ? '1 amigo' : `${n} amigos`);
/* 5 entregas es una semana de almuerzos: se dice asi, que se entiende mas. */
const premio = (n) => (n === 5 ? '1 semana gratis' : n === 10 ? '2 semanas gratis' : n === 20 ? '1 mes gratis' : entregas(n));

export default function InvitaPage() {
  const { token } = useAuthContext();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const quieto = useReducedMotion();

  useEffect(() => {
    axios.get(`${API_URL}referidos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        /* Sin codigo no hay nada que pintar: mejor el aviso de error que una
           pantalla llena de "undefined". */
        const d = r.data?.data;
        if (d && d.codigo) setDatos(d); else setError(true);
      })
      .catch(() => setError(true));
  }, [token]);

  const mensaje = datos
    ? `Te invito a Allpa Food: almuerzos saludables que te llegan a la oficina. Baja el app y, al pagar tu primer plan, pon mi código ${datos.codigo}: te regalan ${entregas(datos.regaloAmigo)}. ${enlaceDe(datos.codigo)}`
    : '';

  const compartir = () => {
    vibrar.toque();
    /* La hoja de compartir del telefono si existe; si no, WhatsApp directo. */
    if (navigator.share) {
      navigator.share({ text: mensaje }).catch(() => {});
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const copiar = () => {
    vibrar.toque();
    const listo = () => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(datos.codigo).then(listo).catch(() => {});
  };

  /* El primer escalon que todavia no alcanza: ahi va "Te falta N". */
  const siguiente = (datos?.escalera || []).find((e) => !e.logrado);
  const toque = quieto ? {} : { whileTap: { scale: 0.97 }, transition: resorte.toque };

  return (
    <LayoutDasboard claseStyle="nCaja">
      <motion.div className="nPant invN" variants={cascada(quieto ? 0 : 0.06)} initial="oculto" animate="visible">
        <span className="nMenta invN__menta" aria-hidden="true" />

        <motion.button type="button" className="invN__volver" aria-label="Volver" variants={sube}
          whileTap={quieto ? undefined : { scale: 0.9 }} onClick={() => navigate(-1)}>
          <Ico d={I.atras} w={2.4} />
        </motion.button>
        <motion.h1 className="invN__h" variants={sube}>Invita y<br />come gratis</motion.h1>
        <motion.p className="invN__bajada" variants={sube}>
          {datos
            ? `Tu amigo gana ${entregas(datos.regaloAmigo)} en su primer plan. Tú ganas ${entregas(datos.premioPorAmigo)} cada vez que uno compra.`
            : 'Comparte tu código. Cuando un amigo compra su primer plan, los dos ganan entregas.'}
        </motion.p>

        {error &&
          <motion.p className="invN__error" variants={sube} role="alert">
            <b>No pudimos traer tu código.</b> Vuelve a intentarlo en un momento.
          </motion.p>}

        {!datos && !error &&
          <motion.div className="invN__espera" variants={sube} aria-label="Trayendo tu código" role="status">
            <i /><i /><i />
          </motion.div>}

        {datos && <>
          <motion.section className="invN__codigo" variants={sube}>
            <span className="invN__et">TU CÓDIGO</span>
            <div className="invN__caja">
              {/* El codigo va siempre en una linea: mientras mas largo, mas chico
                  (puede tener hasta 11 letras, "CRISTINA947"). */}
              <b style={{ fontSize: datos.codigo.length > 9 ? 19 : datos.codigo.length > 7 ? 23 : 30,
                          letterSpacing: datos.codigo.length > 7 ? '.04em' : undefined, whiteSpace: 'nowrap' }}>{datos.codigo}</b>
              <motion.button type="button" onClick={copiar} {...toque}>
                <Ico d={copiado ? I.check : I.copiar} w={copiado ? 2.6 : 2} />{copiado ? 'Copiado' : 'Copiar'}
              </motion.button>
            </div>
            <motion.button type="button" className="invN__compartir" onClick={compartir} {...toque}>
              <Ico d={I.chat} />Compartir con un amigo
            </motion.button>
            <div className="invN__cifras">
              <div><b>{datos.amigos}</b><small>{Number(datos.amigos) === 1 ? 'amigo ya compró' : 'amigos ya compraron'}</small></div>
              <div><b>{datos.ganadas}</b><small>{Number(datos.ganadas) === 1 ? 'entrega ganada' : 'entregas ganadas'}</small></div>
            </div>
          </motion.section>

          {datos.porCobrar > 0 &&
            <motion.p className="invN__aviso" variants={sube}>
              <em>REGALO</em>
              <span>Tienes <b>{entregas(datos.porCobrar)}</b> esperándote. Se suman solas cuando compres tu próximo plan.</span>
            </motion.p>}

          <motion.div className="invN__sec" variants={sube}>
            <h2>Tu escalera</h2>
            <span>{datos.amigos} de 10 amigos</span>
          </motion.div>
          {!datos.faltan &&
            <motion.p className="invN__ayuda" variants={sube}>
              Llegaste arriba. Cada amigo más te sigue dando {entregas(datos.premioPorAmigo)}.
            </motion.p>}
          <motion.ol className="invN__lista" variants={sube}>
            {(datos.escalera || []).map((e) => (
              <li key={e.amigos} className={e.logrado ? 'is-ok' : ''}>
                <span className="invN__num">{e.logrado ? <Ico d={I.check} w={3} /> : e.amigos}</span>
                <span className="invN__txt"><b>{amigos(e.amigos)}</b><small>{premio(e.entregas)}</small></span>
                {e.logrado && <span className="invN__chip">Ganado</span>}
                {!e.logrado && e === siguiente && datos.faltan > 0 &&
                  <span className="invN__chip invN__chip--tinta">Te {Number(datos.faltan) === 1 ? 'falta' : 'faltan'} {datos.faltan}</span>}
              </li>
            ))}
          </motion.ol>

          {(datos.lista || []).length > 0 && <>
            <motion.div className="invN__sec" variants={sube}><h2>Tus invitados</h2></motion.div>
            <motion.div className="invN__lista" variants={sube}>
              {datos.lista.map((a, i) => (
                <div key={i} className="invN__amigo">
                  {a.avatar !== null && a.avatar !== undefined && a.avatar !== ''
                    ? <img src={`/assets/img/avatars/avatar_${a.avatar}.jpg`} alt="" />
                    : <span className="invN__inicial">{String(a.nombre || '?').charAt(0).toUpperCase()}</span>}
                  <span className="invN__txt"><b>{a.nombre}</b><small>Compró su plan</small></span>
                  <b className="invN__mas">+{entregas(a.entregas)}</b>
                </div>
              ))}
            </motion.div>
          </>}

          <motion.p className="invN__reglas" variants={sube}>
            Ganas cuando tu amigo paga su primer plan. Vale para amigos que nunca fueron clientes.
            Si no tienes un plan vigente, tus entregas te esperan en tu próxima compra.
          </motion.p>
        </>}
      </motion.div>
    </LayoutDasboard>
  );
}
