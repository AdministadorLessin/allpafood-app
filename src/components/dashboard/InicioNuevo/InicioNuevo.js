import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/es';
import { animate, motion, useReducedMotion } from 'motion/react';

import './InicioNuevo.scss';
import PedidoDeHoy, { REPARTO } from '../PedidoDeHoy/PedidoDeHoy';
import ActivarAvisos from '../ActivarAvisos/ActivarAvisos';
import Tarjetas from '../Tarjetas/Tarjetas';
import { useCentro } from '../../Centro/CentroContext';
import { vibrar } from '../../../nativo';
import { cascada, sube, resorte } from '../../../movimiento';
import Jalar from '../../ultil/Jalar/Jalar';
import { leerMeta } from '../../../meta';
import {
  semanaDelCliente, primerDiaElegible, tiempoRestante, HORA_LIMITE_TEXTO,
} from '../StatusBanner/estadoPlan';

/**
 * El Inicio del app con la identidad nueva.
 *
 * Arriba, en grande, lo unico que importa ahora (tu almuerzo va en camino, te
 * falta elegir tu jueves, te quedan 2 entregas). Debajo la semana, la tarjeta
 * de eso mismo con su boton, las calorias de hoy y tres accesos. Todo con los
 * datos que ya trae el panel: aqui no se inventa ninguno.
 */
const Ico = ({ d, w = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const CAMPANA = ['M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7', 'M10 20a2 2 0 0 0 4 0'];
const FLECHA = 'M5 12h14M13 6l6 6-6 6';
const IR = 'M9 6l6 6-6 6';
const RELOJ = ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'];
const PLATO = ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'];
const RAYO = 'M13 3 5 13.500h6L10 21l8-10.500h-6z';

const palabraSube = {
  oculto: { y: '110%' },
  visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const valor = (it, nombre) => {
  const p = (it?.menu?.properties || []).find((x) => String(x.name || '').toLowerCase().startsWith(nombre));
  return Number(p?.value) || 0;
};
const macrosDe = (orden) => (orden?.items || []).reduce((s, it) => ({
  kcal: s.kcal + valor(it, 'calor'), prot: s.prot + valor(it, 'prote'),
  carbo: s.carbo + valor(it, 'carbo'), grasa: s.grasa + valor(it, 'grasa'),
}), { kcal: 0, prot: 0, carbo: 0, grasa: 0 });

function Cuenta({ hasta }) {
  const ref = useRef(null);
  const quieto = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return undefined;
    const pinta = (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('es-PE'); };
    if (quieto) { pinta(hasta); return undefined; }
    const c = animate(0, hasta, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], onUpdate: pinta });
    return () => c.stop();
  }, [hasta, quieto]);
  return <span ref={ref}>0</span>;
}

const Tarjeta = ({ children, ...p }) => (
  <motion.section className="iniN__card" variants={sube} {...p}>{children}</motion.section>
);
const Boton = ({ a, estado, children }) => (
  <motion.div whileTap={{ scale: 0.97 }} transition={resorte.toque}>
    <Link to={a} state={estado} className="iniN__btn" onClick={() => vibrar.toque()}>{children}<Ico d={FLECHA} w={2.4} /></Link>
  </motion.div>
);

export default function InicioNuevo({ perfil, plan, ordenes, aviso, objetivo, cargando, alActualizar }) {
  const { abrir, sinLeer } = useCentro();
  const navigate = useNavigate();
  const ahora = moment();
  const nombre = perfil?.name?.split(' ')[0];
  const imagen = perfil?.image;

  const total = plan?.consumption?.orders?.total ?? 0;
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const restantes = Math.max(total - usados, 0);
  const sinPlan = !cargando && !plan;
  const porRenovar = !!plan && total > 0 && restantes <= 2;

  /* --- Hoy --- */
  const pedido = (ordenes || []).find((o) => moment(o.date).isSame(ahora, 'day'));
  const [hDesde, mDesde] = REPARTO.desde.split(':').map(Number);
  const yaSalio = ahora.isSameOrAfter(moment().hour(hDesde).minute(mDesde).second(0));
  const crudo = pedido?.status || 'P';
  const estadoHoy = !pedido ? null : (crudo === 'P' && yaSalio ? 'I' : crudo);
  const horas = ahora.hour() + ahora.minute() / 60;
  /* Retraso, no entregado, cancelado: los explica la tarjeta de siempre. */
  const delicado = !!pedido && (estadoHoy === 'F' || estadoHoy === 'X' || !!aviso
    || (estadoHoy !== 'C' && horas > REPARTO.horaCierre - REPARTO.margenGracia));
  const platos = (pedido?.items || []).map((i) => i?.menu?.name).filter(Boolean);
  const fotoHoy = (pedido?.items || []).map((i) => i?.menu?.imageUrl).find(Boolean) || null;
  const paso = estadoHoy === 'C' ? 2 : estadoHoy === 'I' ? 1 : 0;

  /* --- La semana y lo que falta elegir --- */
  const dias = semanaDelCliente(ordenes, ahora);
  const porElegir = plan ? dias.find((d) => d.estado === 'elegir') : null;
  const restan = tiempoRestante(ahora);
  const cierraHoy = !!(porElegir && restan && porElegir.fecha.isSame(primerDiaElegible(ahora), 'day')
    && porElegir.fecha.isSame(ahora.clone().add(1, 'day'), 'day'));

  /* --- El titular: lo mas urgente primero --- */
  /* Sin nada urgente, el titular acompaña: no repite el saludo de arriba. */
  let titular = ['Todo listo', 'por hoy'];
  /* Mientras llegan los datos no se afirma nada del dia. */
  if (cargando) titular = ['Preparando', 'tu día'];
  else if (sinPlan) titular = ['Empieza a', 'comer bien'];
  else if (pedido && !delicado && estadoHoy === 'I') titular = ['Tu almuerzo', 'va en camino'];
  else if (pedido && !delicado && estadoHoy === 'P') titular = ['Tu almuerzo', 'se está cocinando'];
  else if (porElegir) titular = ['Te falta elegir', `tu ${porElegir.fecha.format('dddd')}`];
  else if (porRenovar) titular = [restantes === 1 ? 'Te queda' : 'Te quedan', restantes === 1 ? '1 entrega' : `${restantes} entregas`];
  else if (pedido && estadoHoy === 'C') titular = ['Tu almuerzo', 'ya llegó'];
  else if (plan && !pedido) titular = ['Hoy no', 'tienes almuerzo'];

  /* --- Calorias de hoy: cuentan cuando el almuerzo ya llego --- */
  const delAlmuerzo = macrosDe(pedido);
  const comido = estadoHoy === 'C' ? delAlmuerzo : { kcal: 0, prot: 0, carbo: 0, grasa: 0 };
  const meta = leerMeta(objetivo);
  const pct = (v, m) => (m ? `${Math.min(v / m, 1) * 100}%` : '0%');

  return (
    <motion.div className="nPant iniN" variants={cascada(0.06)} initial="oculto" animate="visible">
      {alActualizar && <Jalar alSoltar={alActualizar} />}
      <span className="iniN__menta" aria-hidden="true" />

      <motion.header className="iniN__cab" variants={sube}>
        <Link to="/perfil" className="iniN__ava" aria-label="Mi cuenta">
          {imagen !== undefined && imagen !== null && imagen !== ''
            ? <img src={`assets/img/avatars/avatar_${imagen}.jpg`} alt="" />
            : <span>{nombre ? nombre.charAt(0).toUpperCase() : ''}</span>}
        </Link>
        {/* Quien eres y que dia es, en chico. El titular de abajo queda libre
            para decir una sola cosa: lo que pasa hoy con tu almuerzo. */}
        <span className="iniN__hola">
          <b>{nombre ? `Hola, ${nombre}` : 'Hola'}</b>
          <small>{mayuscula(ahora.format('dddd D [de] MMMM'))}</small>
        </span>
        <motion.button type="button" className="iniN__campana" whileTap={{ scale: 0.9 }}
          aria-label={sinLeer > 0 ? `Avisos, ${sinLeer} sin leer` : 'Avisos'} onClick={() => abrir()}>
          <Ico d={CAMPANA} />
          {sinLeer > 0 && <i />}
        </motion.button>
      </motion.header>

      {/* El titular entra palabra por palabra, de abajo hacia arriba. */}
      <motion.h1 className="iniN__titular" variants={cascada(0.05, 0.1)} aria-label={titular.join(' ')}>
        {titular.map((linea, i) => (
          <span key={linea} className="iniN__linea" aria-hidden="true">
            {linea.split(' ').map((palabra, j) => (
              <span key={`${i}-${j}`} className="iniN__corte"><motion.span variants={palabraSube}>{palabra}</motion.span></span>
            ))}
          </span>
        ))}
      </motion.h1>

      {plan &&
        <motion.div className="iniN__semana" variants={sube}>
          {dias.map((d) => {
            const esHoy = d.fecha.isSame(ahora, 'day');
            const conPlato = !!d.orden && d.estado !== 'reprogramado';
            return (
              <button type="button" key={d.fecha.format('YYYY-MM-DD')} className={`iniN__dia${esHoy ? ' is-hoy' : ''}`}
                aria-label={`${d.fecha.format('dddd D')}${conPlato ? ', con almuerzo' : d.estado === 'elegir' ? ', por elegir' : ''}`}
                onClick={() => { vibrar.toque(); navigate('/menu', { state: { dia: d.fecha.format('YYYY-MM-DD') } }); }}>
                <b>{d.numero}</b>
                <small>{esHoy ? 'Hoy' : mayuscula(d.fecha.format('ddd').replace('.', ''))}</small>
                {!esHoy && <i className={conPlato ? 'is-on' : d.estado === 'elegir' ? 'is-falta' : ''} />}
              </button>
            );
          })}
        </motion.div>}

      {/* Mientras llegan los datos: la silueta de lo que viene, no bloques
          grises cualquiera. */}
      {cargando &&
        <div className="iniN__espera" aria-hidden="true">
          <span className="iniN__esperaDias">{[0, 1, 2, 3, 4].map((i) => <i key={i} />)}</span>
          <span className="iniN__esperaCard"><i /><i /><i /></span>
          <span className="iniN__esperaCard iniN__esperaCard--baja"><i /><i /></span>
        </div>}

      {sinPlan &&
        <Tarjeta>
          <div className="iniN__cardCab"><span className="iniN__et">TU PRIMER PASO</span><span className="iniN__chip">Toma 1 minuto</span></div>
          <b className="iniN__h">Elige tu plan y empieza esta semana</b>
          <p className="iniN__p">Almuerzos recién cocinados, en tu casa u oficina, de lunes a viernes.</p>
          <Boton a="/planes">Ver los planes</Boton>
        </Tarjeta>}

      {pedido && delicado &&
        <motion.div variants={sube}><PedidoDeHoy ordenes={ordenes} aviso={aviso} /></motion.div>}

      {pedido && !delicado &&
        <Tarjeta>
          <div className="iniN__cardCab">
            <span className="iniN__et">TU ALMUERZO</span>
            <span className="iniN__chip">{estadoHoy === 'C' ? 'Entregado' : `Llega antes de la ${REPARTO.hasta}`}</span>
          </div>
          <div className="iniN__plato">
            {/* La foto del plato, si el menu la trae; si no, el dibujo. */}
            {fotoHoy
              ? <img className="iniN__platoFoto" src={fotoHoy} alt="" />
              : <span className="iniN__platoIc"><Ico d={PLATO} /></span>}
            <span>
              <b>{platos[0] || 'Tu almuerzo de hoy'}</b>
              {platos.length > 1 && <small>Con {platos.slice(1).join(', ').toLowerCase()}</small>}
            </span>
          </div>
          <div className="iniN__pasos" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i}><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: i <= paso ? 1 : 0 }} transition={{ ...resorte.suave, delay: 0.3 + i * 0.12 }} /></span>
            ))}
          </div>
          <div className="iniN__pasosTxt">
            {['Cocinando', 'En camino', 'Entregado'].map((t, i) => <span key={t} className={i === paso ? 'is-on' : ''}>{t}</span>)}
          </div>
        </Tarjeta>}

      {porElegir &&
        <Tarjeta>
          <div className="iniN__cardCab">
            <span className="iniN__et">{porElegir.fecha.isSame(ahora.clone().add(1, 'day'), 'day') ? 'MAÑANA' : porElegir.fecha.format('dddd D').toUpperCase()}</span>
            <span className={`iniN__chip${cierraHoy ? ' iniN__chip--coral' : ''}`}>{cierraHoy ? `Cierra hoy ${HORA_LIMITE_TEXTO}` : 'Sin plato todavía'}</span>
          </div>
          <b className="iniN__h">Elige tu almuerzo del {porElegir.fecha.format('dddd')}</b>
          <p className="iniN__p iniN__p--ic"><Ico d={RELOJ} w={2.2} />
            {cierraHoy ? `Te quedan ${restan.horas} h ${restan.minutos} min para elegir` : `Se elige hasta las ${HORA_LIMITE_TEXTO} del día anterior`}</p>
          <Boton a="/menu" estado={{ dia: porElegir.fecha.format('YYYY-MM-DD') }}>Elegir mi almuerzo</Boton>
        </Tarjeta>}

      {porRenovar &&
        <Tarjeta>
          <div className="iniN__cardCab">
            <span className="iniN__et">TU PLAN</span>
            {plan.expirationDate && <span className="iniN__chip iniN__chip--coral">Vence el {moment(plan.expirationDate).format('D MMM')}</span>}
          </div>
          <b className="iniN__h">Renueva y no te quedes sin almuerzo</b>
          <p className="iniN__p">Lo que te sobre se suma a tu plan nuevo.</p>
          <Boton a="/planes">Renovar mi plan</Boton>
        </Tarjeta>}

      {pedido && !delicado && delAlmuerzo.kcal > 0 &&
        <motion.div variants={sube} whileTap={{ scale: 0.985 }} transition={resorte.toque}>
          <Link to="/progreso" className="iniN__card iniN__kcal">
            <span className="iniN__cardCab"><span className="iniN__et">CALORÍAS DE HOY</span><span className="iniN__ir">Mi progreso <Ico d={IR} w={2.4} /></span></span>
            <span className="iniN__kcalNum">
              <b><Cuenta hasta={comido.kcal} /></b>
              {meta && <em>/ {Math.round(meta.bmr).toLocaleString('es-PE')}</em>}
            </span>
            <span className="iniN__macros">
              {[['Proteína', comido.prot, meta?.proteinas, 'var(--n-proteina)'], ['Carbos', comido.carbo, meta?.carbo, 'var(--n-carbo)'], ['Grasas', comido.grasa, meta?.grasas, 'var(--n-grasa)']].map(([n, v, m, c]) => (
                <span key={n}>
                  <span className="iniN__macroCab"><b>{n}</b><span>{Math.round(v)} g</span></span>
                  <span className="iniN__macroBarra" aria-hidden="true">
                    <motion.i style={{ background: c }} initial={{ width: '0%' }} animate={{ width: pct(v, m) }} transition={{ ...resorte.suave, delay: 0.4 }} />
                  </span>
                </span>
              ))}
            </span>
            <span className="iniN__kcalPie">
              <span className="iniN__pastilla"><Ico d={RAYO} w={2.2} />Tu almuerzo suma {Math.round(delAlmuerzo.kcal)} kcal</span>
              {delAlmuerzo.prot > 0 &&
                <span className="iniN__dato"><em>DATO</em>Trae {Math.round(delAlmuerzo.prot)} g de proteína</span>}
            </span>
          </Link>
        </motion.div>}

      {plan &&
        <motion.div className="iniN__tres" variants={sube}>
          <Link to="/mi-plan" className="iniN__mini iniN__mini--tinta">
            <span>Mi plan<Ico d={IR} w={2.4} /></span><b>{restantes}</b><small>{restantes === 1 ? 'entrega' : 'entregas'}</small>
          </Link>
          <Link to="/progreso" className="iniN__mini">
            <span>Progreso<Ico d={IR} w={2.4} /></span>
            <b>{dias.filter((d) => d.orden && d.estado !== 'reprogramado').length}/{dias.length}</b><small>almuerzos</small>
          </Link>
          <Link to="/invita" className="iniN__mini iniN__mini--menta">
            <span>Invita<Ico d={IR} w={2.4} /></span><b>Gana</b><small>1 entrega por amigo</small>
          </Link>
        </motion.div>}

      {plan &&
        <motion.div variants={sube} className="iniN__resto">
          <ActivarAvisos />
          <Tarjetas lugar="inicio" titulo="Para ti hoy" />
        </motion.div>}
    </motion.div>
  );
}
