import React from "react";
import { useNavigate } from 'react-router-dom';

import './AccesosRapidos.scss';
import { motion, alToque } from './../../ultil/Motion/Motion';

const Ico = ({ n }) => {
  const c = { className: 'afAcceso__ic', viewBox: '0 0 24 24', fill: 'none',
              stroke: 'currentColor', strokeWidth: 1.7,
              strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (n === 'menu') return (
    <svg {...c}><rect x="3.5" y="4.5" width="17" height="16" rx="3.2"/>
      <path d="M3.5 9.5h17M8 2.6v3.8M16 2.6v3.8"/><path d="m9 14.6 2 2 4-4"/></svg>
  );
  if (n === 'pin') return (
    <svg {...c}><path d="M12 21.2s6.4-6.2 6.4-11a6.4 6.4 0 1 0-12.8 0c0 4.8 6.4 11 6.4 11Z"/>
      <circle cx="12" cy="10.1" r="2.4"/></svg>
  );
  return (
    <svg {...c}><rect x="2.5" y="5" width="19" height="14" rx="3.2"/>
      <path d="M2.5 10h19M6.5 15h4"/></svg>
  );
};

/**
 * Tres atajos a lo que el cliente hace de verdad. Antes solo se llegaba a
 * estas pantallas por el menu lateral, y a la de planes ni siquiera eso.
 */
const ACCESOS = [
  { a: '/menu',        texto: 'Elegir platos', icono: 'menu', tono: 'verde' },
  { a: '/mi-plan',     texto: 'Mi plan',       icono: 'plan', tono: 'azul' },
  { a: '/ubicaciones', texto: 'Direcciones',   icono: 'pin',  tono: 'coral' },
];

const AccesosRapidos = () => {
  const navigate = useNavigate();
  return (
    <div className="afAccesos">
      {ACCESOS.map((x) => (
        <motion.button key={x.a} type="button" className="afAcceso"
          onClick={() => navigate(x.a)} {...alToque}>
          <span className={`afAcceso__circulo afAcceso__circulo--${x.tono}`}><Ico n={x.icono} /></span>
          <span className="afAcceso__txt">{x.texto}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default AccesosRapidos;
