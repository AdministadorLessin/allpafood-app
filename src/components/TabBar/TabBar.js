import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { vibrar, esNativo } from '../../nativo';
import { useCentro } from '../Centro/CentroContext';
import { resorte } from '../../movimiento';
import RodrigoCara from '../ultil/RodrigoCara/RodrigoCara';
import './TabBar.scss';

/**
 * Las cinco secciones, siempre a la vista. La pildora menta viaja de una
 * pestaña a la otra y se estira en el camino: es lo que le dice al dedo que
 * el app respondio.
 *
 * Los avisos ya no viven aqui: se abren con la campana del Inicio.
 */
const TABS = [
  { a: '/',          texto: 'Inicio',    icono: 'home' },
  { a: '/menu',      texto: 'Menú',      icono: 'menu' },
  { a: '/progreso',  texto: 'Progreso',  icono: 'progreso' },
  { a: '/bienestar', texto: 'Bienestar', icono: 'bienestar' },
  { a: '/perfil',    texto: 'Yo',        icono: 'user' },
];
const HIJAS = {
  '/mi-plan': '/perfil', '/facturacion': '/perfil', '/ubicaciones': '/perfil', '/planes': '/perfil',
  '/invita': '/perfil', '/preguntas-frecuentes': '/perfil', '/cambiar-clave': '/perfil',
  '/salud-y-bienestar': '/bienestar', '/beneficios': '/bienestar',
};
const TRAZOS = {
  home: ['M3 10.5 12 3l9 7.5', 'M5.5 9.6V20.5h13V9.6', 'M9.6 20.5V15h4.8v5.5'],
  menu: ['M5 3.5v6a2.5 2.5 0 0 0 5 0v-6', 'M7.5 3.5v17', 'M17 20.500v-7.500', 'M17 13c-2 0-3-1.800-3-4.800S15.200 3.500 17 3.500z'],
  progreso: ['M5 20.500v-6', 'M12 20.500V4', 'M19 20.500v-10'],
  bienestar: ['M12 20.500c-4.500-2.800-8-6-8-10.200A4.300 4.300 0 0 1 12 8a4.300 4.300 0 0 1 8 2.300c0 4.200-3.500 7.400-8 10.200z'],
  user: ['M12 11.600a3.600 3.600 0 1 0 0-7.200 3.600 3.600 0 0 0 0 7.200z', 'M4.600 20.400c0-3.700 3.400-5.600 7.400-5.600s7.400 1.900 7.400 5.600'],
};
const Icono = ({ nombre }) => (
  <svg className="afTab__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {TRAZOS[nombre].map((d) => <path key={d} d={d} />)}
  </svg>
);

/* Rodrigo, siempre a la mano: solo su icono, flotando apenas sobre la barra
   para no tapar la pantalla. No sale en el Menu: ahi abajo va el aviso de
   "Deshacer" y se taparian. */
function PastillaRodrigo() {
  const quieto = useReducedMotion();
  /* Al bajar por la pantalla se esconde para no tapar lo que se lee; al subir
     (o arriba del todo) vuelve. */
  const [escondido, setEscondido] = useState(false);
  useEffect(() => {
    let antes = window.scrollY;
    const alMover = () => {
      const y = window.scrollY;
      if (Math.abs(y - antes) < 12) return;
      setEscondido(y > antes && y > 80);
      antes = y;
    };
    window.addEventListener('scroll', alMover, { passive: true });
    return () => window.removeEventListener('scroll', alMover);
  }, []);
  return (
    <motion.div className="afRodrigo"
      initial={quieto ? false : { opacity: 0, scale: 0.6, y: 24 }}
      animate={escondido ? { opacity: 0, scale: 0.7, y: 30 } : { opacity: 1, scale: 1, y: 0 }}
      transition={quieto ? { duration: 0 } : resorte.entra}
      style={{ pointerEvents: escondido ? 'none' : 'auto' }}
      whileTap={{ scale: 0.9 }}>
      <NavLink to="/rodrigo" tabIndex={escondido ? -1 : 0} onClick={() => vibrar.toque()} aria-label="Hablar con Rodrigo, tu asistente">
        <motion.span style={{ display: 'block' }} animate={quieto ? {} : { y: [0, -4, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}>
          <RodrigoCara size={54} />
        </motion.span>
      </NavLink>
    </motion.div>
  );
}

/* Donde quedo la pildora la ultima vez. Cada pantalla monta su propia barra,
   asi que la nueva arranca desde aqui y viaja a su pestaña. */
let ultima = null;

const TabBar = () => {
  const { pathname } = useLocation();
  const quieto = useReducedMotion();
  /* Las pantallas que cuelgan de una pestaña la dejan marcada: Mi plan o
     Mis pagos siguen siendo "Yo". */
  const madre = Object.keys(HIJAS).find((r) => pathname.startsWith(r));
  const ruta = madre ? HIJAS[madre] : pathname;
  const activa = TABS.findIndex((t) => (t.a === '/' ? ruta === '/' : ruta.startsWith(t.a)));
  const cajas = useRef([]);
  const desde = useRef(ultima);
  const [caja, setCaja] = useState(null);
  const { abrir, sinLeer } = useCentro();

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
  <>
  {/* En la web no hay campana en el Inicio: los avisos se abren desde aqui. */}
  {!esNativo &&
    <button type="button" className="afCampana" onClick={() => abrir()}
      aria-label={sinLeer > 0 ? `Avisos y ayuda, ${sinLeer} sin leer` : 'Avisos y ayuda'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 9.500a6 6 0 1 0-12 0c0 4.200-1.300 5.600-1.900 6.200a.800.800 0 0 0 .600 1.300h14.600a.800.800 0 0 0 .600-1.300c-.600-.600-1.900-2-1.900-6.200z" /><path d="M10.200 20.100a2.100 2.100 0 0 0 3.600 0" />
      </svg>
      {sinLeer > 0 && <i>{sinLeer}</i>}
    </button>}
  {/* Rodrigo, siempre a la mano. No sale en el Menu: ahi abajo va el aviso
      de "Deshacer" y se taparian. */}
  {activa >= 0 && TABS[activa].a !== '/menu' && <PastillaRodrigo />}
  <nav className="afTabs" aria-label="Navegación principal">
    {caja &&
      <motion.span
        className="afTabs__pildora"
        aria-hidden="true"
        initial={viaja ? { x: de.x, width: de.w } : false}
        animate={viaja ? { x: caja.x, width: [de.w, estirada, caja.w] } : { x: caja.x, width: caja.w }}
        transition={{ x: resorte.toque, width: { duration: 0.42, times: [0, 0.4, 1], ease: [0.2, 0.8, 0.2, 1] } }}
      />}
    {TABS.map((t, i) => (
      <NavLink
        key={t.a}
        to={t.a}
        end={t.a === '/'}
        ref={(el) => { cajas.current[i] = el; }}
        onClick={() => vibrar.toque()}
        className={i === activa ? 'afTab afTab--on' : 'afTab'}
      >
        <motion.span className="afTab__caja" whileTap={{ scale: 0.9 }} transition={resorte.toque}>
          <Icono nombre={t.icono} />
          <span className="afTab__txt">{t.texto}</span>
        </motion.span>
      </NavLink>
    ))}
  </nav>
  </>
  );
};

export default TabBar;
