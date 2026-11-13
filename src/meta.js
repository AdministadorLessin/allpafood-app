/**
 * La meta diaria del cliente, siempre con los mismos nombres.
 *
 * El servidor la guarda como { bmr, macros: { protein, carbs, fat } }; otras
 * partes del app la esperaban como { bmr, proteinas, carbo, grasas }. Con los
 * nombres cruzados, las barras de macros del Inicio salian vacias aunque el
 * dato existiera. Aqui se aceptan las dos formas.
 */
export const leerMeta = (cruda) => {
  if (!cruda) return null;
  let m = cruda;
  if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { return null; } }
  if (!m || !Number(m.bmr)) return null;
  const n = (v) => (Number(v) > 0 ? Number(v) : null);
  return {
    bmr: Number(m.bmr),
    proteinas: n(m.proteinas ?? m.macros?.protein),
    carbo: n(m.carbo ?? m.macros?.carbs),
    grasas: n(m.grasas ?? m.macros?.fat),
  };
};
