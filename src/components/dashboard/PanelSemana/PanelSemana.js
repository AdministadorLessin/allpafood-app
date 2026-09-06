import React from "react";
import { useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

import './PanelSemana.scss';
import { motion, alToque } from './../../ultil/Motion/Motion';
import { semanaDelCliente, TEXTO_ESTADO } from '../StatusBanner/estadoPlan';

const IcoSemana = () => (
  <svg className="afIc" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="4.5" width="17" height="16" rx="3.2"/>
    <path d="M3.5 9.5h17M8 2.6v3.8M16 2.6v3.8"/><path d="m9 14.6 2 2 4-4"/>
  </svg>
);

/**
 * La semana de un vistazo. Reemplaza los circulos sin significado del
 * programador: cada dia dice en que estado esta, y los que se pueden elegir
 * llevan al menu.
 */
const PanelSemana = ({ ordenes, cargando, ahora }) => {
  const navigate = useNavigate();

  if (cargando) {
    return (
      <div className="afCard afSemana">
        <Skeleton variant="text" width="45%" height={20} />
        <Skeleton variant="rounded" height={68} sx={{ borderRadius: '14px', marginTop: '10px' }} />
      </div>
    );
  }

  const dias = semanaDelCliente(ordenes, ahora);
  const listos = dias.filter((d) => ['entregado', 'enRuta', 'listo'].includes(d.estado)).length;

  return (
    <div className="afCard afSemana">
      <div className="afCard__head">
        <span className="afCard__title"><IcoSemana /> Tu semana</span>
        <span className="afCard__label">{listos} de {dias.length} listos</span>
      </div>

      <div className="afSemana__dias">
        {dias.map((d) => (
          <motion.button
            type="button"
            key={d.fecha.format('YYYY-MM-DD')}
            className={`afDia afDia--${d.estado}`}
            onClick={() => d.estado === 'elegir' && navigate('/menu')}
            disabled={d.estado !== 'elegir'}
            {...(d.estado === 'elegir' ? alToque : {})}
          >
            <span className="afDia__n">{d.etiqueta}</span>
            <span className="afDia__d">{d.numero}</span>
            <span className="afDia__s">{TEXTO_ESTADO[d.estado]}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PanelSemana;
