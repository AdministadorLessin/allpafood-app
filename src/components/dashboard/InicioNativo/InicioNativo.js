import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/es';
import Skeleton from '@mui/material/Skeleton';

import './InicioNativo.scss';
import PedidoDeHoy, { REPARTO } from '../PedidoDeHoy/PedidoDeHoy';
import StatusBanner from '../StatusBanner/StatusBanner';
import ActivarAvisos from '../ActivarAvisos/ActivarAvisos';
import Tarjetas from '../Tarjetas/Tarjetas';
import { useCentro } from '../../Centro/CentroContext';
import { vibrar } from '../../../nativo';
import {
  semanaDelCliente, primerDiaElegible, tiempoRestante, HORA_LIMITE_TEXTO,
} from '../StatusBanner/estadoPlan';

/**
 * El inicio dentro del app, con el mismo lenguaje del registro: el saludo
 * grande con su avatar, el pedido de hoy, y la semana como lo principal.
 *
 * La semana es donde el cliente decide: cada dia se toca y abajo se explica
 * que pasa ese dia y que puede hacer. Antes la tira solo llevaba a /menu desde
 * los dias por elegir, y nadie entendia que los dias se podian tocar.
 *
 * En la web el inicio sigue siendo el de siempre (home/index.js).
 */

const Ico = ({ d, w = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const OLLA = ['M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z', 'M2 10h20', 'M9 6c0-1 1-2 3-2s3 1 3 2'];
const MOTO = ['M6 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M9 17h6l-3-8h3M6 14l3-5'];
const CHECK = 'M5 12l5 5 9-10';
const PLATO = ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'];
const MAS = 'M12 5v14M5 12h14';
const RELOJ = ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'];
const CAMPANA = ['M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7', 'M10 20a2 2 0 0 0 4 0'];
const FLECHA = 'M5 12h14M13 6l6 6-6 6';
const AVISO = ['M12 9v4M12 17h.01', 'M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'];

/* Como se ve cada dia en la tira. */
const TILE = {
  entregado:   { clase: 'hecho',  marca: '✓' },
  listo:       { clase: 'hecho',  marca: 'Listo' },
  hoy:         { clase: 'hoy',    marca: 'Llega' },
  enRuta:      { clase: 'hoy',    marca: 'En ruta' },
  elegir:      { clase: 'elegir', marca: '+ Elegir' },
  noEntregado: { clase: 'falla',  marca: 'No llegó' },
  reprogramado:{ clase: 'apagado', marca: 'Sin envío' },
  cerrado:     { clase: 'apagado', marca: 'Cerrado' },
  pasado:      { clase: 'apagado', marca: '—' },
};

const platosDe = (orden) =>
  (orden?.items || []).map((i) => i?.menu?.name).filter(Boolean).join(' · ');

const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* La olla que hierve mientras la cocina arma el pedido, y la moto cuando ya
   salio. Solo se mueven transform y opacity: el telefono lo anima sin volver
   a pintar, y no le quita fluidez al scroll. */
const OllaCocinando = () => (
  <svg className="inN__anim" viewBox="0 0 72 72" role="img" aria-label="Tu almuerzo se está cocinando">
    <g className="inN__vapor inN__vapor--1"><path d="M27 22c-3-3.5 3-6 0-10" /></g>
    <g className="inN__vapor inN__vapor--2"><path d="M36 20c-3-3.5 3-6 0-10" /></g>
    <g className="inN__vapor inN__vapor--3"><path d="M45 22c-3-3.5 3-6 0-10" /></g>
    <g className="inN__tapa">
      <path className="inN__tapaLinea" d="M17 31.5h38" />
      <circle className="inN__tapaPomo" cx="36" cy="27.5" r="2.6" />
    </g>
    <path className="inN__olla" d="M15 35h42v12a10 10 0 0 1-10 10H25a10 10 0 0 1-10-10z" />
    <path className="inN__asa" d="M15 39h-4M57 39h4" />
    <g className="inN__llama inN__llama--1"><path d="M30 67c-2.5 0-4-2-3-4.5l3-4.5 3 4.5c1 2.5-.5 4.5-3 4.5z" /></g>
    <g className="inN__llama inN__llama--2"><path d="M42 67c-2.5 0-4-2-3-4.5l3-4.5 3 4.5c1 2.5-.5 4.5-3 4.5z" /></g>
  </svg>
);

const MotoEnCamino = () => (
  <svg className="inN__anim" viewBox="0 0 72 72" role="img" aria-label="Tu almuerzo va en camino">
    <g className="inN__viento">
      <path d="M4 30h12M8 38h10M2 46h12" />
    </g>
    <g className="inN__moto">
      <circle className="inN__rueda" cx="24" cy="50" r="7" />
      <circle className="inN__rueda" cx="54" cy="50" r="7" />
      <path className="inN__cuadro" d="M24 50l8-14h12l6 14M38 36l-4-8h-6M44 36h8l4 6" />
      <rect className="inN__caja" x="22" y="24" width="14" height="12" rx="3" />
    </g>
  </svg>
);

/** El pedido de hoy, compacto. Los casos dificiles (retraso, no entregado,
    cancelado, ya entregado) siguen en PedidoDeHoy, que ya los explica bien. */
function HoyNativo({ ordenes, aviso }) {
  const hoy = moment().format('YYYY-MM-DD');
  const pedido = (ordenes || []).find((o) => moment(o.date).format('YYYY-MM-DD') === hoy);
  if (!pedido) return null;

  const [hDesde, mDesde] = REPARTO.desde.split(':').map(Number);
  const yaSalio = moment().isSameOrAfter(moment().hour(hDesde).minute(mDesde).second(0));
  const crudo = pedido.status || 'P';
  const estado = crudo === 'P' && yaSalio ? 'I' : crudo;
  const ahoraHoras = moment().hour() + moment().minute() / 60;
  const delicado = estado === 'F' || estado === 'X' || estado === 'C' || !!aviso
    || ahoraHoras > REPARTO.horaCierre - REPARTO.margenGracia;
  if (delicado) return <PedidoDeHoy ordenes={ordenes} aviso={aviso} />;

  const items = (pedido.items || []).map((i) => i?.menu?.name).filter(Boolean);
  const indice = estado === 'I' ? 1 : 0;
  const pasos = ['Preparando', 'En camino', 'Entregado'];

  return (
    <section className="inN__hoy">
      <span className="inN__hoyBrillo" aria-hidden="true" />
      <div className="inN__hoyCab">
        <span className="inN__hoyEt">TU PEDIDO DE HOY</span>
        <span className="inN__hoyEstado"><i />{estado === 'I' ? 'En camino' : 'En preparación'}</span>
      </div>
      <div className="inN__hoyCuerpo">
        <h2 className="inN__hoyH">Llega antes de la <em>{REPARTO.hasta}</em></h2>
        {estado === 'I' ? <MotoEnCamino /> : <OllaCocinando />}
      </div>
      {items.length > 0 &&
        <div className="inN__hoyPlato">
          <span className="inN__cuad inN__cuad--menta"><Ico d={PLATO} /></span>
          <span>
            <b>{items[0]}</b>
            {items.length > 1 && <small>Con {items.slice(1).join(', ').toLowerCase()}</small>}
          </span>
        </div>}
      <div className="inN__ruta" aria-hidden="true">
        {[OLLA, MOTO, CHECK].map((d, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className={`inN__rutaLinea${i <= indice ? ' is-on' : ''}`} />}
            <span className={`inN__rutaPunto${i <= indice ? ' is-on' : ''}`}><Ico d={d} w={2.4} /></span>
          </React.Fragment>
        ))}
      </div>
      <div className="inN__rutaTxt">
        {pasos.map((p, i) => <span key={p} className={i === indice ? 'is-on' : undefined}>{p}</span>)}
      </div>
    </section>
  );
}

/** Lo que se explica debajo de la tira para el dia tocado. */
function detalleDelDia(d, ahora) {
  const nombre = mayuscula(d.fecha.format('dddd D'));
  const platos = platosDe(d.orden);
  switch (d.estado) {
    case 'elegir': {
      const restan = tiempoRestante(ahora);
      const cierraHoy = restan && d.fecha.isSame(primerDiaElegible(ahora), 'day')
        && d.fecha.isSame(ahora.clone().add(1, 'day'), 'day');
      return {
        tipo: 'elegir', ico: MAS,
        titulo: `${nombre} · sin plato todavía`,
        texto: 'Elige entre los platos del menú de ese día.',
        plazo: cierraHoy
          ? `Te quedan ${restan.horas} h ${restan.minutos} min para elegirlo`
          : `Se elige hasta las ${HORA_LIMITE_TEXTO} del día anterior`,
        urgente: !!cierraHoy,
      };
    }
    case 'hoy':
      return { tipo: 'hoy', ico: MOTO, titulo: `Hoy · llega antes de la ${REPARTO.hasta}`, texto: platos || 'Tu almuerzo de hoy.' };
    case 'enRuta':
      return { tipo: 'hoy', ico: MOTO, titulo: 'Hoy · en camino', texto: platos || 'Tu almuerzo ya salió.' };
    case 'listo':
      return { tipo: 'listo', ico: CHECK, titulo: `${nombre} · listo`, texto: platos || 'Plato elegido.',
        nota: `Te llega entre las ${REPARTO.desde} y la ${REPARTO.hasta}.` };
    case 'entregado':
      return { tipo: 'listo', ico: CHECK, titulo: `${nombre} · entregado`, texto: platos || 'Este día ya te llegó tu almuerzo.' };
    case 'noEntregado':
      return { tipo: 'falla', ico: AVISO, titulo: `${nombre} · no pudimos entregarte`,
        texto: d.orden?.deliveryNote || 'Si crees que fue un error nuestro, escríbenos.' };
    case 'reprogramado':
      return { tipo: 'apagado', ico: CHECK, titulo: `${nombre} · no recibes`, texto: 'Tu envío volvió a tu saldo. Puedes usarlo otro día.' };
    case 'cerrado':
      return { tipo: 'apagado', ico: RELOJ, titulo: `${nombre} · cerrado`, texto: `La elección de este día cerró a las ${HORA_LIMITE_TEXTO} del día anterior.` };
    default:
      return { tipo: 'apagado', ico: RELOJ, titulo: `${nombre} · sin pedido`, texto: 'Este día no tuviste almuerzo.' };
  }
}

function SemanaNativa({ ordenes }) {
  const navigate = useNavigate();
  const ahora = moment();
  const dias = semanaDelCliente(ordenes, ahora);
  const listos = dias.filter((d) => ['entregado', 'enRuta', 'listo', 'hoy'].includes(d.estado)).length;

  const inicial = (() => {
    const e = dias.findIndex((d) => d.estado === 'elegir');
    if (e >= 0) return e;
    return dias.findIndex((d) => d.fecha.isSame(ahora, 'day'));
  })();
  const [sel, setSel] = useState(inicial);
  const d = sel >= 0 ? dias[sel] : null;
  const det = d ? detalleDelDia(d, ahora) : null;

  return (
    <section className="inN__card inN__semana">
      <div className="inN__cardCab">
        <h3>Tu semana</h3>
        <span><b>{listos}</b> de {dias.length} días listos</span>
      </div>
      <p className="inN__ayuda">Toca un día para ver o elegir tu plato.</p>

      <div className="inN__dias">
        {dias.map((x, i) => {
          const t = TILE[x.estado] || TILE.pasado;
          const esHoy = x.fecha.isSame(ahora, 'day');
          return (
            <button type="button" key={x.fecha.format('YYYY-MM-DD')}
              className={`inN__dia inN__dia--${t.clase}${sel === i ? ' is-sel' : ''}`}
              aria-pressed={sel === i}
              onClick={() => { vibrar.toque(); setSel(i); }}>
              <span className="inN__diaN">{esHoy ? 'HOY' : x.fecha.format('ddd').replace('.', '').toUpperCase()}</span>
              <b>{x.numero}</b>
              <span className="inN__diaM">{t.marca}</span>
            </button>
          );
        })}
      </div>

      {det &&
        <div className={`inN__det inN__det--${det.tipo}`} key={sel}>
          <div className="inN__detFila">
            <span className={`inN__cuad inN__cuad--${det.tipo}`}><Ico d={det.ico} w={2.3} /></span>
            <span className="inN__detTxt">
              <b>{det.titulo}</b>
              <small>{det.texto}</small>
              {det.nota && <small>{det.nota}</small>}
            </span>
          </div>
          {det.tipo === 'elegir' &&
            <>
              <p className={`inN__plazo${det.urgente ? ' is-urgente' : ''}`}><Ico d={RELOJ} w={2.2} />{det.plazo}</p>
              <button type="button" className="inN__btn"
                onClick={() => { vibrar.toque(); navigate('/menu', { state: { dia: d.fecha.format('YYYY-MM-DD') } }); }}>
                Elegir mi plato del {d.fecha.format('dddd')}
                <Ico d={FLECHA} w={2.4} />
              </button>
              <Link className="inN__btnLink" to="/menu">Ver toda mi semana</Link>
            </>}
          {det.tipo === 'listo' && d.estado === 'listo' &&
            <Link className="inN__btnLink" to="/menu">Cambiar en Mi menú</Link>}
        </div>}

      <div className="inN__leyenda" aria-hidden="true">
        <span><i className="is-hecho" />Listo</span>
        <span><i className="is-hoy" />Hoy</span>
        <span><i className="is-elegir" />Por elegir</span>
      </div>
    </section>
  );
}

export default function InicioNativo({ perfil, plan, ordenes, aviso, metricas, objetivo, cargando, estado }) {
  const { abrir, sinLeer } = useCentro();
  const nombre = perfil?.name?.split(' ')[0];
  const imagen = perfil?.image;

  const total = plan?.consumption?.orders?.total ?? 0;
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const restantes = Math.max(total - usados, 0);
  const pct = total ? Math.min(Math.round((usados / total) * 100), 100) : 0;

  const hoy = moment().format('YYYY-MM-DD');
  const ordenHoy = (ordenes || []).find((o) => moment(o.date).format('YYYY-MM-DD') === hoy);
  const kcal = Math.round(metricas?.calorias ?? 0);
  const meta = objetivo?.bmr ? Math.round(objetivo.bmr) : null;
  const conCalorias = !!(ordenHoy && meta && kcal > 0);
  const circ = 2 * Math.PI * 30;

  return (
    <div className="inN">
      <span className="inN__brillo inN__brillo--menta" aria-hidden="true" />
      <span className="inN__brillo inN__brillo--cielo" aria-hidden="true" />

      <header className="inN__cab">
        <Link to="/perfil" className="inN__ava" aria-label="Mi cuenta">
          {imagen !== undefined && imagen !== null && imagen !== ''
            ? <img src={`assets/img/avatars/avatar_${imagen}.jpg`} alt="" />
            : <span>{(nombre || '?').charAt(0).toUpperCase()}</span>}
        </Link>
        <div className="inN__saludo">
          <p>{mayuscula(moment().format('dddd D [de] MMMM'))}</p>
          {nombre
            ? <h1>Hola, <em>{nombre}</em></h1>
            : <Skeleton variant="text" width={150} height={36} />}
        </div>
        <button type="button" className="inN__campana" aria-label="Avisos" onClick={() => abrir()}>
          <Ico d={CAMPANA} />
          {sinLeer > 0 && <i />}
        </button>
      </header>

      <HoyNativo ordenes={ordenes} aviso={aviso} />

      {/* Sin plan, o por renovar: ese aviso es lo unico que importa. */}
      {estado?.tono === 'dark' &&
        <StatusBanner plan={plan} ordenes={ordenes} creditos={plan && plan.credits} cargando={cargando} />}

      {cargando && <Skeleton variant="rounded" height={210} sx={{ borderRadius: '28px', mt: 2 }} />}

      {plan && !cargando &&
        <>
          <SemanaNativa ordenes={ordenes} />

          <div className={`inN__par${conCalorias ? '' : ' inN__par--solo'}`}>
            <Link to="/mi-plan" className="inN__card inN__plan">
              <span className="inN__chip inN__chip--menta">{plan.planName}</span>
              <b className="inN__num">{restantes}</b>
              <span className="inN__pie">{restantes === 1 ? 'envío disponible' : 'envíos disponibles'}</span>
              <span className="inN__barra"><i style={{ width: `${pct}%` }} /></span>
              {plan.expirationDate &&
                <span className="inN__pie inN__pie--chico">Vence {moment(plan.expirationDate).format('D MMM')}</span>}
            </Link>
            {conCalorias &&
              <div className="inN__card inN__kcal">
                <span className="inN__chip inN__chip--crema">Hoy comes</span>
                <span className="inN__anillo">
                  <svg viewBox="0 0 74 74" role="img" aria-label={`${kcal} de ${meta} calorías`}>
                    <circle cx="37" cy="37" r="30" />
                    <circle cx="37" cy="37" r="30" className="is-on"
                      strokeDasharray={`${Math.min(kcal / meta, 1) * circ} ${circ}`} transform="rotate(-90 37 37)" />
                  </svg>
                  <b>{kcal}</b>
                </span>
                <span className="inN__pie">de {meta} kcal</span>
              </div>}
          </div>

          <ActivarAvisos />
          <Tarjetas lugar="inicio" titulo="Para ti" />
        </>}
    </div>
  );
}
