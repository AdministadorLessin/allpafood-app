/**
 * Los resortes del app. Uno solo por tipo de gesto, para que todo se mueva
 * con el mismo caracter: nada lineal, nada que rebote de mas.
 */
export const resorte = {
  /* Lo que responde al dedo: botones, la pildora de la barra. */
  toque: { type: 'spring', stiffness: 520, damping: 34, mass: 0.9 },
  /* Lo que entra en pantalla: burbujas, tarjetas, hojas. */
  entra: { type: 'spring', stiffness: 380, damping: 32 },
  /* Lo grande y lento: una hoja que sube, una pantalla que llega. */
  suave: { type: 'spring', stiffness: 220, damping: 28 },
};

/* Una lista cuyos hijos entran uno tras otro. */
export const cascada = (cada = 0.05, espera = 0) => ({
  oculto: {},
  visible: { transition: { staggerChildren: cada, delayChildren: espera } },
});
export const sube = {
  oculto: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: resorte.entra },
};
