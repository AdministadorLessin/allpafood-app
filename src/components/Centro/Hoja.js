// La hoja: sube desde abajo sobre la pantalla, que queda desenfocada y
// oscurecida. La usan el centro de avisos y la lectura de "Para ti".
//
// Va en el body, fuera del arbol de la pantalla: dentro, cualquier contenedor
// animado (el panel entra con un transform) la dejaria fija respecto a el y no
// respecto a la ventana.
//
// Se cierra de cuatro maneras: tirando del asa hacia abajo, tocando afuera,
// con Escape o con el boton que ponga quien la usa.

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useIsPresent, useReducedMotion } from 'motion/react';

import { resorte } from '../../movimiento';
import './Hoja.scss';

/* Mientras la hoja baja, su contenido se queda como estaba: lo que cambie en
   ese momento (volver al indice, quitar una tarjeta) no se ve a media salida. */
function Quieto({ children }) {
  const presente = useIsPresent();
  const ultimo = useRef(children);
  if (presente) ultimo.current = children;
  return ultimo.current;
}

export default function Hoja({ abierta, alCerrar, etiqueta, clase = '', cabecera = null, children }) {
  const quieto = useReducedMotion();
  const arrastre = useDragControls();
  const caja = useRef(null);

  /* Con la hoja abierta, el fondo no se mueve. */
  useEffect(() => {
    if (!abierta) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [abierta]);

  useEffect(() => {
    if (!abierta) return undefined;
    const alaTecla = (e) => { if (e.key === 'Escape') alCerrar(); };
    window.addEventListener('keydown', alaTecla);
    /* El foco entra a la hoja: quien usa teclado o lector no se queda atras. */
    if (caja.current) caja.current.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', alaTecla);
  }, [abierta]); // eslint-disable-line react-hooks/exhaustive-deps

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {abierta &&
        <>
          {/* El desenfoque es fijo: lo unico que se anima es la opacidad. */}
          <motion.div
            key="velo"
            className="nHoja__velo"
            onClick={alCerrar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: quieto ? 0 : 0.28 }}
          />
          <motion.section
            key="hoja"
            ref={caja}
            tabIndex={-1}
            className={`nHoja ${clase}`}
            role="dialog"
            aria-modal="true"
            aria-label={etiqueta}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={quieto ? { duration: 0 } : resorte.suave}
            drag="y"
            dragControls={arrastre}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.9 }}
            /* Se cierra por donde iba el gesto, no por donde quedo el dedo:
               un tiron corto pero rapido tambien cierra. */
            onDragEnd={(e, info) => {
              if (info.offset.y > 110 || info.velocity.y > 520) alCerrar();
            }}
          >
            {/* Solo se arrastra desde arriba: el contenido tiene que poder
                desplazarse con el dedo sin que la hoja se vaya. */}
            <div className="nHoja__agarre" onPointerDown={(e) => arrastre.start(e)}>
              <span className="nHoja__asa" aria-hidden="true" />
              <Quieto>{cabecera}</Quieto>
            </div>
            <div className="nHoja__cuerpo"><Quieto>{children}</Quieto></div>
          </motion.section>
        </>
      }
    </AnimatePresence>,
    document.body
  );
}
