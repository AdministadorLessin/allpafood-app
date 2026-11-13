import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { API_URL } from '../../config';
import { vibrar } from '../../nativo';
import { cascada, sube, resorte } from '../../movimiento';
import Isotipo from '../../components/ultil/Isotipo';
import { REPARTO } from '../../components/dashboard/PedidoDeHoy/PedidoDeHoy';
import {
  avatarDeVisita, guardarAvatarDeVisita, direccionDeVisita, entrarDeVisita,
} from '../../visita';
import { codigoGuardado, invitadoPor, guardarCodigo, olvidarCodigo, limpiarCodigo } from '../../referido';

import './Visita.scss';

/**
 * El app por dentro para quien todavia no es cliente.
 *
 * Son las mismas pantallas del cliente (Inicio y Yo) con datos de ejemplo y
 * el menu real de la semana que viene, que el servidor ya publica sin pedir
 * cuenta. Nada de lo que se toca aqui crea un pedido. "Quiero mi plan" lleva
 * al registro de siempre (/empezar), que no cambia.
 */

const I = {
  ojo: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  yo: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'],
  pin: ['M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  plan: ['M2 8a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z', 'M2 10h20M6 15h4'],
  recibo: ['M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z', 'M10 8h4M10 12h4'],
  regalo: ['M5 9h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', 'M2 9h20M12 9v12M12 9C10 9 7 8 7 6s3-3 5 3zM12 9c2 0 5-1 5-3s-3-3-5 3z'],
  chat: 'M21 12a8 8 0 0 1-12 7l-5 1 1-4.5A8 8 0 1 1 21 12z',
  candado: ['M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  ir: 'M9 6l6 6-6 6',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12l5 5 9-10',
  plato: ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'],
  casa: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  calendario: ['M6 5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z', 'M3 10h18M8 3v4M16 3v4'],
  barras: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  corazon: 'M12 21C6 17 3 13.5 3 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 9 2.5C21 13.5 18 17 12 21z',
};
const Ico = ({ d, w = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);

const WHATSAPP = '51955797697';
const AVATARES = [...Array(24)].map((_, i) => i);
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const prop = (menu, nombre) => menu?.properties?.find((p) => p.name === nombre)?.value ?? 0;
const sinPunto = (t) => String(t).replace(/\.$/, '');
/* "1:30 p.m." sin el "p.m.": en la etiqueta no cabe y no hace falta. */
const HASTA = String(REPARTO.hasta).replace(/\s*[ap]\.?\s?m\.?$/i, '');

/** El lunes a viernes de la semana que viene, igual que en /empezar. */
const semanaQueViene = () => {
  const hoy = moment();
  const dia = hoy.isoWeekday();
  const lunes = hoy.clone().add(8 - dia, 'days').startOf('day');
  return [...Array(5)].map((_, i) => lunes.clone().add(i, 'days'));
};
const estaSemana = () => {
  const lunes = moment().startOf('isoWeek');
  return [...Array(5)].map((_, i) => lunes.clone().add(i, 'days'));
};

/* ------------------------------------------------------------------- Marco */
const TABS = [
  { a: '/visita', fin: true, texto: 'Inicio', ico: I.casa },
  { a: '/visita/cuenta', texto: 'Yo', ico: I.yo },
  { a: '/empezar', texto: 'Mi plan', ico: I.plan },
];
/* Donde quedo la pildora la ultima vez. Cada pantalla monta su propia barra,
   asi que la nueva arranca desde aqui y viaja a su pestaña (igual que en la
   barra del app). */
let ultima = null;

function Barra() {
  const { pathname } = useLocation();
  const quieto = useReducedMotion();
  const activa = TABS.findIndex((t) => (t.fin ? pathname === t.a || pathname === `${t.a}/` : pathname.startsWith(t.a)));
  const cajas = useRef([]);
  const desde = useRef(ultima);
  const [caja, setCaja] = useState(null);

  useLayoutEffect(() => {
    const el = cajas.current[activa];
    if (!el) { setCaja(null); return undefined; }
    const medir = () => {
      const c = { x: el.offsetLeft, w: el.offsetWidth };
      setCaja(c);
      ultima = c;
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [activa]);

  const de = desde.current;
  const viaja = caja && de && !quieto && de.x !== caja.x;
  /* En el camino cubre un poco mas que el tramo: se estira y se recoge. */
  const estirada = viaja ? Math.max(de.w, caja.w) + Math.abs(caja.x - de.x) * 0.3 : 0;

  return (
    <nav className="visN__tabs" aria-label="Secciones">
      {caja &&
        <motion.span
          className="visN__pildora"
          aria-hidden="true"
          initial={viaja ? { x: de.x, width: de.w } : false}
          animate={viaja ? { x: caja.x, width: [de.w, estirada, caja.w] } : { x: caja.x, width: caja.w }}
          transition={{ x: resorte.toque, width: { duration: 0.42, times: [0, 0.4, 1], ease: [0.2, 0.8, 0.2, 1] } }}
        />}
      {TABS.map((t, i) => (
        <NavLink
          key={t.a} to={t.a} end={t.fin}
          ref={(el) => { cajas.current[i] = el; }}
          onClick={() => vibrar.toque()}
          aria-label={t.texto}
          className={i === activa ? 'visN__tab is-on' : 'visN__tab'}
        >
          <motion.span className="visN__tabCaja" whileTap={{ scale: 0.9 }} transition={resorte.toque}>
            <Ico d={t.ico} />
            <span className="visN__tabTxt">{t.texto}</span>
          </motion.span>
        </NavLink>
      ))}
    </nav>
  );
}

/** El boton de comprar y la barra de abajo, que acompanan todas las pantallas. */
const Marco = ({ children, alto = 400 }) => {
  const navigate = useNavigate();
  const quieto = useReducedMotion();
  /* Quien ya tiene cuenta no tiene nada que hacer de visita. */
  let conSesion = false;
  try { conSesion = !!window.localStorage.getItem('aftkn'); } catch (e) { /* nada */ }
  useEffect(() => { if (!conSesion) entrarDeVisita(); }, [conSesion]);
  if (conSesion) return <Navigate to="/" replace />;

  return (
    <main className="nPant visN">
      <span className="nMenta" style={{ height: alto }} aria-hidden="true" />
      <motion.div className="visN__col" variants={cascada(quieto ? 0 : 0.06)} initial="oculto" animate="visible">
        {children}
      </motion.div>
      {/* En el body, para que ningun contenedor animado lo mueva. */}
      {createPortal(
        <div className="visN__pie">
          <div className="visN__pieCol">
            <motion.button type="button" className="visN__comprar"
              whileTap={quieto ? undefined : { scale: 0.97 }} transition={resorte.toque}
              onClick={() => { vibrar.toque(); navigate('/empezar'); }}>
              Quiero mi plan <Ico d={I.flecha} w={2.4} />
            </motion.button>
            <Barra />
          </div>
        </div>, document.body)}
    </main>
  );
};

const Cabecera = ({ texto }) => (
  <motion.div className="visN__cab" variants={sube}>
    <span className="visN__fecha"><Isotipo size={20} />{texto}</span>
    <Link to="/ingresar" className="visN__ingresar">Ingresar</Link>
  </motion.div>
);

const AvisoVisita = () => (
  <motion.p className="visN__aviso" variants={sube}>
    <Ico d={I.ojo} /><span><b>Estás de visita.</b> Lo que ves es un ejemplo.</span>
  </motion.p>
);

/** La foto del plato si el menu la trae; si no, el cuadro menta de siempre. */
const Foto = ({ menu, clase }) => (
  menu?.imageUrl
    ? <img className={clase} src={menu.imageUrl} alt="" loading="lazy" />
    : <span className={`${clase} is-vacia`}><Ico d={I.plato} w={1.8} /></span>
);

/* ------------------------------------------------------------------ Inicio */
export function VisitaInicio() {
  const navigate = useNavigate();
  const quieto = useReducedMotion();
  const [dias, setDias] = useState(semanaQueViene);
  const [esProxima, setEsProxima] = useState(true);
  const [menu, setMenu] = useState(null);       // { 'YYYY-MM-DD': [platos] }
  const [sel, setSel] = useState(0);
  const [elegidos, setElegidos] = useState({});

  useEffect(() => {
    const f = (d) => d.format('YYYY-MM-DD');
    const traer = (semana) =>
      axios.get(`${API_URL}public/menu/schedule?startDate=${f(semana[0])}&endDate=${f(semana[4])}`)
        .then((r) => {
          const porDia = {};
          (r.data?.data ?? []).forEach((d) => {
            const almuerzos = (d.menuTypeGroups || []).find((g) => g.type === 'lunch')?.menuTypes ?? [];
            if (d.localDate) porDia[d.localDate] = almuerzos.map((m) => m.menu).filter((m) => m?.name);
          });
          return porDia;
        });
    const conPlatos = (porDia) => Object.values(porDia).some((p) => p.length);

    /* La semana que viene es lo que compraria. Pero cocina la publica hacia
       el final de la semana: mientras no este, se muestra la de ahora, que
       sirve igual para ver como se elige. */
    traer(dias)
      .then((proxima) => {
        if (conPlatos(proxima)) return setMenu(proxima);
        const actual = estaSemana();
        return traer(actual).then((ahora) => {
          setDias(actual);
          setEsProxima(false);
          setMenu(ahora);
        });
      })
      .catch(() => setMenu({}));
    // Una sola vez: la semana no cambia mientras se mira.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clave = dias[sel].format('YYYY-MM-DD');
  const platos = menu?.[clave] ?? [];
  const listos = Object.keys(elegidos).length;
  const ejemplo = menu ? Object.values(menu).find((p) => p.length)?.[0] : null;

  return (
    <Marco alto={400}>
      <Cabecera texto={mayuscula(moment().format('dddd D [de] MMMM'))} />
      <motion.h1 className="visN__h" variants={sube}>Así se come<br />con Allpa</motion.h1>

      <AvisoVisita />

      {codigoGuardado() &&
        <motion.p className="visN__invitado" variants={sube}>
          <em>REGALO</em>
          <span>
            <b>{invitadoPor() ? `${invitadoPor()} te invitó.` : 'Tienes un código de invitación.'}</b>{' '}
            2 entregas de regalo en tu primer plan.
          </span>
        </motion.p>}

      <motion.section className="visN__card" variants={sube}>
        <div className="visN__cardCab">
          <span className="visN__et">ASÍ SIGUES TU ALMUERZO</span>
          <span className="visN__chip">Llega antes de la {HASTA}</span>
        </div>
        {ejemplo &&
          <div className="visN__hoy">
            <Foto menu={ejemplo} clase="visN__hoyFoto" />
            <span>
              <b>{sinPunto(ejemplo.name)}</b>
              <small>Con el refresco del día</small>
            </span>
          </div>}
        <div className="visN__pasos" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i}>
              <motion.i initial={quieto ? false : { scaleX: 0 }} animate={{ scaleX: i <= 1 ? 1 : 0 }}
                transition={quieto ? { duration: 0 } : { ...resorte.suave, delay: 0.35 + i * 0.12 }} />
            </span>
          ))}
        </div>
        <div className="visN__pasosTxt">
          <span>Cocinando</span><span className="is-on">En camino</span><span>Entregado</span>
        </div>
        <p className="visN__cardNota">Con tu plan, aquí ves cada día cómo va tu pedido y te llega un aviso cuando sale.</p>
      </motion.section>

      <motion.div className="visN__sec" variants={sube}>
        <b>Prueba elegir tu semana</b>
        <span>{listos} de 5</span>
      </motion.div>
      <motion.p className="visN__ayuda" variants={sube}>
        Es el menú real de {esProxima ? 'la próxima semana' : 'esta semana'}. Toca un plato, como lo haría un cliente. No se guarda ningún pedido.
      </motion.p>

      <motion.div className="visN__dias" variants={sube}>
        {dias.map((x, i) => {
          const k = x.format('YYYY-MM-DD');
          const listo = elegidos[k] !== undefined;
          return (
            <button type="button" key={k}
              className={`visN__dia${sel === i ? ' is-sel' : ''}${listo ? ' is-listo' : ''}`}
              aria-pressed={sel === i}
              aria-label={`${x.format('dddd D')}, ${listo ? 'listo' : 'por elegir'}`}
              onClick={() => { vibrar.toque(); setSel(i); }}>
              <small>{x.format('ddd').replace('.', '').toUpperCase()}</small>
              <b>
                {sel === i &&
                  <motion.i layoutId="visDia" transition={quieto ? { duration: 0 } : resorte.toque} />}
                <span>{x.format('D')}</span>
              </b>
              <em>{listo ? 'Listo' : 'Elegir'}</em>
            </button>
          );
        })}
      </motion.div>

      <motion.div className="visN__platos" variants={sube} role="radiogroup" aria-label={`Platos del ${dias[sel].format('dddd')}`}>
        {menu === null && <p className="visN__vacio">Trayendo el menú…</p>}
        {menu !== null && platos.length === 0 &&
          <p className="visN__vacio">El menú de este día todavía no está publicado.</p>}
        {platos.map((m, i) => {
          const on = elegidos[clave] === i;
          const kcal = prop(m, 'calorias');
          const prot = prop(m, 'proteinas');
          const datos = [kcal > 0 && `${Math.round(kcal)} kcal`, prot > 0 && `${Math.round(prot)} g de proteína`].filter(Boolean);
          return (
            <motion.button type="button" key={`${clave}-${m.id ?? m.name}`} role="radio" aria-checked={on}
              className={`visN__plato${on ? ' is-on' : ''}`}
              whileTap={quieto ? undefined : { scale: 0.985 }} transition={resorte.toque}
              onClick={() => { vibrar.toque(); setElegidos((e) => ({ ...e, [clave]: i })); }}>
              <Foto menu={m} clase="visN__platoFoto" />
              <span className="visN__platoTxt">
                <b>{sinPunto(m.name)}</b>
                <small>{datos.length ? datos.join(' · ') : 'Almuerzo · viene con tu refresco'}</small>
              </span>
              <span className="visN__radio">
                <AnimatePresence>
                  {on &&
                    <motion.span key="ok"
                      initial={quieto ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }} transition={quieto ? { duration: 0 } : resorte.toque}>
                      <Ico d={I.check} w={3.2} />
                    </motion.span>}
                </AnimatePresence>
              </span>
            </motion.button>
          );
        })}
      </motion.div>
      <motion.p className="visN__nota" variants={sube}>
        {listos >= 5 ? 'Armaste tu semana completa. Con tu plan, esto es lo que te llegaría.'
          : listos > 0 ? 'Así de fácil. Sigue con los otros días: de visita no se guarda ningún pedido.'
          : 'Es una prueba: de visita no se guarda ningún pedido.'}
      </motion.p>

      <motion.button type="button" className="visN__plan" variants={sube}
        whileTap={quieto ? undefined : { scale: 0.98 }}
        onClick={() => { vibrar.toque(); navigate('/empezar'); }}>
        <span className="visN__et">TU PLAN</span>
        <b>Tres preguntas y te decimos cuál te conviene</b>
        <span className="visN__planPie">Y cuánto cuesta por comida<Ico d={I.flecha} w={2.4} /></span>
      </motion.button>
    </Marco>
  );
}

/* ---------------------------------------------------------------------- Yo */
const Fila = ({ ico, titulo, sub, a, href, candado }) => {
  const dentro = (
    <>
      <span className="visN__filaIco"><Ico d={ico} /></span>
      <span className="visN__filaTxt"><b>{titulo}</b>{sub && <small>{sub}</small>}</span>
      {candado
        ? <span className="visN__candado"><Ico d={I.candado} w={2.6} />Con tu plan</span>
        : <span className="visN__ir"><Ico d={I.ir} w={2.4} /></span>}
    </>
  );
  if (a) return <Link className="visN__fila" to={a} onClick={() => vibrar.toque()}>{dentro}</Link>;
  if (href) return <a className="visN__fila" href={href} target="_blank" rel="noreferrer">{dentro}</a>;
  return <div className="visN__fila is-cerrada">{dentro}</div>;
};

/** El codigo de un amigo, escrito antes de tener cuenta. Se revisa contra el
    servidor solo para saber de quien es; si le vale o no se decide al pagar. */
function CodigoDeVisita() {
  const [codigo, setCodigo] = useState(codigoGuardado());
  const [nombre, setNombre] = useState(invitadoPor());
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [revisando, setRevisando] = useState(false);

  const aplicar = () => {
    const limpio = limpiarCodigo(texto);
    if (!limpio) return setError('Escribe el código que te pasaron.');
    setRevisando(true);
    setError('');
    axios.get(`${API_URL}public/referidos/${encodeURIComponent(limpio)}`)
      .then((r) => {
        const d = r.data?.data ?? {};
        if (!d.valido) return setError('Ese código no existe. Revísalo con quien te invitó.');
        guardarCodigo(d.codigo || limpio, d.nombre);
        setCodigo(d.codigo || limpio);
        setNombre(d.nombre || '');
        setAbierto(false);
        vibrar.exito();
      })
      .catch(() => setError('No pudimos revisar el código. Inténtalo de nuevo.'))
      .finally(() => setRevisando(false));
  };

  if (codigo) {
    return (
      <div className="visN__fila is-cerrada">
        <span className="visN__filaIco visN__filaIco--menta"><Ico d={I.regalo} /></span>
        <span className="visN__filaTxt">
          <b>{codigo}</b>
          <small>{nombre ? `${nombre} te invitó · ` : ''}2 entregas de regalo al comprar</small>
        </span>
        <button type="button" className="visN__quitar"
                onClick={() => { olvidarCodigo(); setCodigo(''); setNombre(''); setTexto(''); }}>Quitar</button>
      </div>
    );
  }
  if (!abierto) {
    return (
      <button type="button" className="visN__fila" onClick={() => { vibrar.toque(); setAbierto(true); }}>
        <span className="visN__filaIco"><Ico d={I.regalo} /></span>
        <span className="visN__filaTxt"><b>Tengo un código de invitación</b><small>Gana 2 entregas en tu primer plan</small></span>
        <span className="visN__ir"><Ico d={I.ir} w={2.4} /></span>
      </button>
    );
  }
  return (
    <div className="visN__codigo">
      <label htmlFor="codigoVisita">Código de invitación</label>
      <div>
        <input id="codigoVisita" value={texto} placeholder="Ej. DIANA947" maxLength={16}
               autoCapitalize="characters" autoCorrect="off" autoComplete="off"
               onChange={(e) => { setTexto(e.target.value.toUpperCase()); setError(''); }} />
        <button type="button" disabled={revisando} onClick={aplicar}>{revisando ? 'Revisando…' : 'Aplicar'}</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function VisitaCuenta() {
  const [avatar, setAvatar] = useState(avatarDeVisita());
  const dir = direccionDeVisita();
  const elegir = (n) => { vibrar.toque(); guardarAvatarDeVisita(n); setAvatar(String(n)); };

  return (
    <Marco alto={420}>
      <Cabecera texto="Yo" />

      <motion.div className="visN__ficha" variants={sube}>
        <span className="visN__ava">
          {avatar !== null
            ? <img src={`/assets/img/avatars/avatar_${avatar}.jpg`} alt="Tu avatar" />
            : <Ico d={I.yo} />}
        </span>
        <div>
          <h1>Invitado</h1>
          <span>Aquí irá tu nombre y tu celular</span>
        </div>
      </motion.div>

      <motion.p className="visN__avaEt" variants={sube}>Elige tu avatar. Lo guardamos para ti.</motion.p>
      <motion.div className="visN__avatares" variants={sube} role="radiogroup" aria-label="Avatares">
        {AVATARES.map((n) => {
          const on = String(n) === String(avatar);
          return (
            <button type="button" key={n} role="radio" aria-checked={on} aria-label={`Avatar ${n + 1}`}
              className={on ? 'is-on' : ''} onClick={() => elegir(n)}>
              <img src={`/assets/img/avatars/avatar_${n}.jpg`} alt="" loading="lazy" />
            </button>
          );
        })}
      </motion.div>

      <AvisoVisita />

      <motion.p className="visN__grupo" variants={sube}>PUEDES PROBAR YA</motion.p>
      <motion.nav className="visN__lista" variants={sube} aria-label="Puedes probar ya">
        <Fila ico={I.pin} titulo="Mis direcciones" a="/visita/direccion"
              sub={dir?.calle ? `${dir.calle}${dir.enCobertura ? ' · sí llegamos' : ''}` : 'Marca tu casa u oficina y mira si llegamos'} />
        <Fila ico={I.recibo} titulo="Descubrir mi plan" a="/empezar"
              sub="Tres preguntas y te decimos cuál y cuánto" />
        <CodigoDeVisita />
        <Fila ico={I.chat} titulo="Escríbenos" sub="Por WhatsApp" href={`https://wa.me/${WHATSAPP}`} />
      </motion.nav>

      <motion.p className="visN__grupo" variants={sube}>SE ABRE CON TU PLAN</motion.p>
      <motion.nav className="visN__lista" variants={sube} aria-label="Se abre con tu plan">
        <Fila ico={I.calendario} titulo="Mi menú de cada semana" sub="Eliges tu plato con un toque" candado />
        <Fila ico={I.barras} titulo="Mi progreso" sub="Tus calorías y tu proteína" candado />
        <Fila ico={I.corazon} titulo="Bienestar y Allpa+" sub="Lecturas y descuentos" candado />
        <Fila ico={I.regalo} titulo="Invita y gana entregas" sub="Una entrega por cada amigo que compre" candado />
      </motion.nav>
    </Marco>
  );
}
