import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, useDragControls } from 'motion/react';

import { resorte } from '../../../movimiento';
import './Hoja.scss';

/**
 * La hoja: sube desde abajo sobre la pantalla, que queda oscurecida y
 * desenfocada detras. Se cierra arrastrandola hacia abajo, tocando fuera, con
 * Escape o con su boton de cerrar.
 *
 *   <Hoja abierta={ver} alCerrar={() => setVer(false)}
 *         etiqueta="MIS DATOS" titulo="Tus datos" bajada="..."
 *         pie={<button className="hoja__btn">Guardar</button>}>
 *     ...contenido (se desplaza si no cabe)...
 *   </Hoja>
 *
 * - Se pinta en document.body: las pantallas del panel entran con un
 *   transform, y un position:fixed dentro de una capa transformada se ancla a
 *   esa capa y no a la pantalla.
 * - El foco queda atrapado dentro mientras esta abierta y vuelve a donde
 *   estaba al cerrarla.
 * - Solo se arrastra desde la cabecera, para que el contenido se pueda
 *   desplazar con el dedo sin cerrar la hoja.
 * - textoCerrar={false} quita el "Cerrar" de abajo (cuando el pie ya lo trae).
 */
const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Panel({ alCerrar, etiqueta, titulo, bajada, children, pie, textoCerrar, clase }) {
  const quieto = useReducedMotion();
  const arrastre = useDragControls();
  const caja = useRef(null);
  const idTitulo = useId();

  /* Al abrir: el foco entra a la hoja y la pantalla de atras deja de
     desplazarse. Al cerrar, todo vuelve a como estaba. */
  useEffect(() => {
    const antes = document.activeElement;
    const desborde = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (caja.current) caja.current.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = desborde;
      if (antes && typeof antes.focus === 'function' && document.contains(antes)) antes.focus({ preventScroll: true });
    };
  }, []);

  const tecla = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); alCerrar(); return; }
    if (e.key !== 'Tab' || !caja.current) return;
    const lista = Array.from(caja.current.querySelectorAll(ENFOCABLES)).filter((el) => el.offsetParent !== null);
    if (lista.length === 0) { e.preventDefault(); return; }
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    const actual = document.activeElement;
    if (e.shiftKey && (actual === primero || actual === caja.current)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && actual === ultimo) { e.preventDefault(); primero.focus(); }
  };

  const soltar = (_, info) => {
    if (info.offset.y > 110 || info.velocity.y > 650) alCerrar();
  };

  return (
    <div className="hoja" onKeyDown={tecla}>
      {/* El desenfoque va puesto fijo en el velo; lo unico que se anima es su
          opacidad. */}
      <motion.div className="hoja__velo" onClick={alCerrar} aria-hidden="true"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: quieto ? 0.01 : 0.28, ease: [0.2, 0.8, 0.2, 1] }} />

      <motion.section
        ref={caja}
        className={`hoja__caja nPant${clase ? ` ${clase}` : ''}`}
        role="dialog" aria-modal="true" aria-labelledby={titulo ? idTitulo : undefined}
        aria-label={titulo ? undefined : (etiqueta || 'Hoja')}
        tabIndex={-1}
        initial={quieto ? { opacity: 0 } : { y: '100%' }}
        animate={quieto ? { opacity: 1 } : { y: 0 }}
        exit={quieto ? { opacity: 0 } : { y: '100%' }}
        transition={quieto ? { duration: 0.01 } : resorte.suave}
        drag={quieto ? false : 'y'}
        dragControls={arrastre}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={soltar}
      >
        <header className="hoja__cab" onPointerDown={(e) => { if (!quieto) arrastre.start(e); }}>
          <span className="hoja__asa" aria-hidden="true" />
          {etiqueta && <span className="hoja__et">{etiqueta}</span>}
          {titulo && <h1 className="hoja__titulo" id={idTitulo}>{titulo}</h1>}
          {bajada && <p className="hoja__bajada">{bajada}</p>}
        </header>

        <div className="hoja__cuerpo">{children}</div>

        {(pie || textoCerrar) &&
          <footer className="hoja__pie">
            {pie}
            {textoCerrar &&
              <button type="button" className="hoja__cerrar" onClick={alCerrar}>{textoCerrar}</button>}
          </footer>}
      </motion.section>
    </div>
  );
}

export default function Hoja({ abierta, alCerrar, textoCerrar = 'Cerrar', ...resto }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {abierta && <Panel key="hoja" alCerrar={alCerrar} textoCerrar={textoCerrar} {...resto} />}
    </AnimatePresence>,
    document.body
  );
}
