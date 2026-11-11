import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
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

  useEffect(() => {
    axios.get(`${API_URL}referidos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setDatos(r.data?.data ?? null))
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

  const pct = datos ? Math.min(Math.round((datos.amigos / 10) * 100), 100) : 0;

  return (
    <LayoutDasboard claseStyle={false}>
      <div className="invN">
        <button type="button" className="invN__volver" aria-label="Volver" onClick={() => navigate(-1)}>
          <Ico d={I.atras} w={2.4} />
        </button>

        <h1 className="invN__h">Invita y <em>come gratis</em></h1>
        <p className="invN__bajada">
          {datos
            ? `Tu amigo gana ${entregas(datos.regaloAmigo)} en su primer plan. Tú ganas ${entregas(datos.premioPorAmigo)} cada vez que uno compra.`
            : 'Comparte tu código. Cuando un amigo compra su primer plan, los dos ganan entregas.'}
        </p>

        {error &&
          <p className="invN__error">No pudimos traer tu código. Vuelve a intentarlo en un momento.</p>}

        {!datos && !error && <Skeleton variant="rounded" height={250} sx={{ borderRadius: '28px', mt: 2.5 }} />}

        {datos && <>
          <section className="invN__codigo">
            <span className="invN__et">TU CÓDIGO</span>
            <div className="invN__caja">
              <b>{datos.codigo}</b>
              <button type="button" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
            </div>
            <button type="button" className="invN__compartir" onClick={compartir}>
              <Ico d={I.chat} w={2.2} />Compartir con un amigo
            </button>
            <div className="invN__cifras">
              <div><b>{datos.amigos}</b><small>{Number(datos.amigos) === 1 ? 'amigo ya compró' : 'amigos ya compraron'}</small></div>
              <div><b>{datos.ganadas}</b><small>{Number(datos.ganadas) === 1 ? 'entrega ganada' : 'entregas ganadas'}</small></div>
            </div>
          </section>

          {datos.porCobrar > 0 &&
            <p className="invN__aviso">
              Tienes <b>{entregas(datos.porCobrar)}</b> esperándote. Se suman solas cuando compres tu próximo plan.
            </p>}

          <section className="invN__card">
            <div className="invN__cardCab">
              <h2>Tu escalera</h2>
              <span><b>{datos.amigos}</b> de 10 amigos</span>
            </div>
            {datos.faltan
              ? <p className="invN__ayuda">Te {Number(datos.faltan) === 1 ? 'falta' : 'faltan'} <b>{amigos(datos.faltan)}</b> para ganar {premio(datos.premioSiguiente)}.</p>
              : <p className="invN__ayuda">Llegaste arriba. Cada amigo más te sigue dando {entregas(datos.premioPorAmigo)}.</p>}
            <div className="invN__barra" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
            <ol className="invN__pasos">
              {(datos.escalera || []).map((e) => (
                <li key={e.amigos} className={e.logrado ? 'is-ok' : ''}>
                  <span className="invN__num">{e.logrado ? <Ico d={I.check} w={3} /> : e.amigos}</span>
                  <span className="invN__pasoTxt"><b>{amigos(e.amigos)}</b><small>{premio(e.entregas)}</small></span>
                  {e.logrado && <span className="invN__chip">Ganado</span>}
                </li>
              ))}
            </ol>
          </section>

          {(datos.lista || []).length > 0 && <>
            <p className="invN__grupo">TUS INVITADOS</p>
            <section className="invN__lista">
              {datos.lista.map((a, i) => (
                <div key={i} className="invN__amigo">
                  {a.avatar !== null && a.avatar !== undefined && a.avatar !== ''
                    ? <img src={`/assets/img/avatars/avatar_${a.avatar}.jpg`} alt="" />
                    : <span className="invN__inicial">{String(a.nombre || '?').charAt(0).toUpperCase()}</span>}
                  <span className="invN__pasoTxt"><b>{a.nombre}</b><small>Compró su plan</small></span>
                  <span className="invN__chip">+{entregas(a.entregas)}</span>
                </div>
              ))}
            </section>
          </>}

          <p className="invN__reglas">
            Ganas cuando tu amigo paga su primer plan. Vale para amigos que nunca fueron clientes.
            Si no tienes un plan vigente, tus entregas te esperan en tu próxima compra.
          </p>
        </>}
      </div>
    </LayoutDasboard>
  );
}
