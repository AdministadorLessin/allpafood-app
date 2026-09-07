import React from "react";

import './PanelNecesidades.scss';
import { motion, Contador } from './../../ultil/Motion/Motion';

/* Cuantas calorias aporta un gramo de cada macro. Es la conversion estandar
   y es lo que permite repartir el dia entre los tres: sin ella, los gramos
   son tres numeros sueltos que no suman nada. */
const KCAL_POR_GRAMO = { protein: 4, carbs: 4, fat: 9 };

const MACROS = [
  { clave: 'protein', et: 'Proteína', color: 'var(--af-accent)' },
  { clave: 'carbs',   et: 'Carbos',   color: '#6FD79B' },
  { clave: 'fat',     et: 'Grasas',   color: '#E0A93F' },
];

/**
 * Lo que el cliente necesita al dia.
 *
 * Antes eran cuatro casillas grises con un numero cada una: cuatro datos sin
 * relacion entre si. Los macros no son cuatro cosas sueltas —son el reparto
 * de un mismo dia—, asi que aqui las calorias son el titular y los tres
 * macros el reparto de esa cifra, con el ancho real de su aporte.
 */
const PanelNecesidades = ({ datos }) => {

  const kcal = Number(datos?.bmr) || 0;
  const m = datos?.macros;
  if (!kcal || !m) return null;

  const filas = MACROS.map((x) => {
    const gramos = Number(m[x.clave]) || 0;
    return { ...x, gramos, kcal: gramos * KCAL_POR_GRAMO[x.clave] };
  });

  const sumaKcal = filas.reduce((s, f) => s + f.kcal, 0) || 1;
  const conParte = filas.map((f) => ({ ...f, parte: (f.kcal / sumaKcal) * 100 }));

  return (
    <div className="afNutri">

      <div className="afNutri__hero">
        <div className="afNutri__cifra">
          <b><Contador valor={kcal} /></b>
          <span>kcal al día</span>
        </div>
        <span className="afNutri__sello">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
               strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
          Tu cálculo
        </span>
      </div>

      {/* Una sola barra repartida: se ve de un vistazo que la mayor parte del
          dia son carbohidratos. Tres barras separadas no dicen eso. */}
      <div className="afNutri__barra">
        {conParte.map((f, i) => (
          <motion.i
            key={f.clave}
            style={{ background: f.color }}
            initial={{ width: 0 }}
            animate={{ width: `${f.parte}%` }}
            transition={{ duration: .8, ease: [0.16, 0.84, 0.44, 1], delay: .2 + i * .12 }}
          />
        ))}
      </div>

      <div className="afNutri__leyenda">
        {conParte.map((f, i) => (
          <div className="afNutri__fila" key={f.clave}>
            <span className="afNutri__punto" style={{ background: f.color }} />
            <span className="afNutri__et">{f.et}</span>
            <b className="afNutri__g"><Contador valor={f.gramos} retraso={150 + i * 90} /> g</b>
            <span className="afNutri__pc">{Math.round(f.parte)}%</span>
          </div>
        ))}
      </div>

      <p className="afNutri__pie">
        Salió de tu peso, tu altura, tu edad y cuánto te mueves.
      </p>
    </div>
  );
};

export default PanelNecesidades;
