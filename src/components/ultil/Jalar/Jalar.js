import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { vibrar } from '../../../nativo';
import './Jalar.scss';

/**
 * Jalar para actualizar. Con la pantalla arriba del todo, arrastrar hacia
 * abajo baja una ruedita; al soltarla pasado el tope, la pantalla vuelve a
 * pedir sus datos. Es el gesto que todos hacen para ver si su pedido ya
 * salio.
 *
 * `alSoltar` puede devolver una promesa; si no, la ruedita gira un momento.
 */
const TOPE = 64;

export default function Jalar({ alSoltar }) {
  const [tiro, setTiro] = useState(0);
  const [cargando, setCargando] = useState(false);
  const y0 = useRef(null);
  const actual = useRef(0);
  const ocupado = useRef(false);

  useEffect(() => {
    const ini = (e) => { y0.current = (window.scrollY <= 0 && !ocupado.current) ? e.touches[0].clientY : null; };
    const mov = (e) => {
      if (y0.current === null) return;
      const d = e.touches[0].clientY - y0.current;
      actual.current = d > 0 && window.scrollY <= 0 ? Math.min(d * 0.5, 96) : 0;
      setTiro(actual.current);
    };
    const fin = () => {
      if (y0.current === null) return;
      y0.current = null;
      const llego = actual.current >= TOPE;
      actual.current = 0;
      setTiro(0);
      if (!llego) return;
      ocupado.current = true;
      setCargando(true);
      vibrar.toque();
      const espera = new Promise((r) => setTimeout(r, 700));
      Promise.all([Promise.resolve().then(alSoltar).catch(() => {}), espera])
        .finally(() => { ocupado.current = false; setCargando(false); });
    };
    window.addEventListener('touchstart', ini, { passive: true });
    window.addEventListener('touchmove', mov, { passive: true });
    window.addEventListener('touchend', fin, { passive: true });
    window.addEventListener('touchcancel', fin, { passive: true });
    return () => {
      window.removeEventListener('touchstart', ini);
      window.removeEventListener('touchmove', mov);
      window.removeEventListener('touchend', fin);
      window.removeEventListener('touchcancel', fin);
    };
  }, [alSoltar]);

  const visible = cargando || tiro > 4;
  const avance = Math.min(tiro / TOPE, 1);
  /* Va colgada del body, no dentro de la pantalla: asi no ocupa sitio ni
     hereda los estilos de quien la usa. */
  return createPortal(
    <motion.div className="afJalar" aria-hidden={!cargando} role={cargando ? 'status' : undefined}
      initial={false}
      animate={{ y: cargando ? 62 : tiro, opacity: visible ? 1 : 0, scale: cargando ? 1 : 0.6 + avance * 0.4 }}
      transition={tiro > 0 && !cargando ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}>
      <svg viewBox="0 0 24 24" className={cargando ? 'is-gira' : ''} style={cargando ? undefined : { transform: `rotate(${avance * 270}deg)` }}>
        <circle cx="12" cy="12" r="8.500" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round"
          strokeDasharray={`${(cargando ? 0.7 : avance * 0.85) * 53.4} 53.4`} />
      </svg>
      {cargando && <span className="afJalar__txt">Actualizando</span>}
    </motion.div>,
    document.body
  );
}
