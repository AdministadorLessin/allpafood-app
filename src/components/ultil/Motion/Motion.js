import React from "react";
import * as motion from "motion/react-client";

/**
 * Movimiento compartido del panel.
 *
 * Criterio: la animacion sirve para explicar el orden en que hay que leer la
 * pantalla, no para decorar. Por eso todo entra de abajo hacia arriba, en
 * cascada y una sola vez. Nada se mueve solo despues de eso.
 *
 * Se respeta prefers-reduced-motion: quien lo tenga activado ve la pantalla
 * quieta, sin perder informacion.
 */

const sinMovimiento =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const listaEnCascada = {
  oculto: {},
  visible: { transition: { staggerChildren: sinMovimiento ? 0 : 0.055, delayChildren: 0.04 } },
};

export const bloque = {
  oculto: sinMovimiento ? { opacity: 1 } : { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: sinMovimiento ? 0 : 0.42, ease: [0.16, 0.84, 0.44, 1] },
  },
};

/** Contenedor que hace entrar a sus hijos en cascada. */
export const Cascada = ({ children, className }) => (
  <motion.div
    className={className}
    variants={listaEnCascada}
    initial="oculto"
    animate="visible"
  >
    {children}
  </motion.div>
);

/** Un bloque de la cascada. */
export const Bloque = ({ children, className }) => (
  <motion.div className={className} variants={bloque}>
    {children}
  </motion.div>
);

/** Boton o tarjeta que responde al toque. En movil el hover no existe. */
export const alToque = sinMovimiento
  ? {}
  : { whileTap: { scale: 0.97 }, transition: { type: 'spring', stiffness: 400, damping: 26 } };

/** Barra de progreso que crece desde cero al aparecer. */
export const BarraAnimada = ({ porcentaje, className }) => (
  <div className={className}>
    <motion.i
      initial={{ width: 0 }}
      animate={{ width: `${porcentaje}%` }}
      transition={{ duration: sinMovimiento ? 0 : 0.9, ease: [0.16, 0.84, 0.44, 1], delay: 0.15 }}
    />
  </div>
);

export { motion };
