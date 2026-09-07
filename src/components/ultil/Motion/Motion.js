import React, { useEffect, useState } from "react";
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

/**
 * Numero que cuenta hasta su valor al aparecer.
 *
 * Una cifra que sube se lee como una medicion; la misma cifra quieta se lee
 * como una etiqueta. Es la diferencia entre un panel y un formulario.
 */
export const Contador = ({ valor, decimales = 0, duracion = 950, retraso = 0 }) => {
  const objetivo = Number(valor) || 0;
  const [n, setN] = useState(sinMovimiento ? objetivo : 0);

  useEffect(() => {
    if (sinMovimiento) { setN(objetivo); return; }

    let cuadro;
    let inicio = null;
    const paso = (t) => {
      if (inicio === null) inicio = t;
      const transcurrido = t - inicio - retraso;
      if (transcurrido < 0) { cuadro = requestAnimationFrame(paso); return; }
      const p = Math.min(transcurrido / duracion, 1);
      // Arranca rapido y frena al final, como un marcador que se detiene.
      setN(objetivo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo, duracion, retraso]);

  return <>{n.toLocaleString('es-PE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}</>;
};

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
