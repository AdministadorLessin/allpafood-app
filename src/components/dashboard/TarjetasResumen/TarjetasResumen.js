import React from "react";
import moment from 'moment';
import 'moment/locale/es';
import Skeleton from '@mui/material/Skeleton';

import './TarjetasResumen.scss';
import { BarraAnimada } from './../../ultil/Motion/Motion';

const Ico = ({ d }) => (
  <svg className="afIc" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const barra = (parte, total) => {
  if (!total) return 0;
  return Math.min(Math.round((parte / total) * 100), 100);
};

/**
 * Tarjeta del plan. Crema, porque en el sistema nuevo cada color dice algo.
 * Sustituye la de 190px de alto que repetia el nombre del plan en 40px y
 * prometia "45 dias calendario" que no eran ciertos.
 */
export const TarjetaPlan = ({ plan, cargando }) => {
  if (cargando) return <div className="afCard afPlan"><Skeleton variant="text" width="60%" /><Skeleton variant="rounded" height={30} /></div>;
  if (!plan) return null;

  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const total = plan?.consumption?.orders?.total ?? 0;
  const creditos = plan?.credits?.orders?.total;
  const quedanPocos = total > 0 && (total - usados) <= 3;

  return (
    <div className="afCard afPlan">
      <div className="afCard__head">
        <span className="afCard__title">
          <Ico d="M2.5 8a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-13a3 3 0 0 1-3-3zM2.5 10h19M6.5 15h4" />
          {plan.planName}
        </span>
        <span className={`afPlan__chip${quedanPocos ? ' afPlan__chip--bajo' : ''}`}>
          {plan.expirationDate ? `Vence ${moment(plan.expirationDate).format('D MMM')}` : ''}
        </span>
      </div>

      <BarraAnimada
        className={`afBarra afBarra--${quedanPocos ? 'bajo' : 'ok'}`}
        porcentaje={barra(usados, total)}
      />
      <div className="afFila">
        <span>Envíos usados</span>
        <span><b>{usados}</b> de {total}</span>
      </div>

      {creditos > 0 &&
        <p className="afPlan__creditos">
          Tienes {creditos} envíos esperando de otro plan. Empiezan solos cuando termines este.
        </p>
      }
    </div>
  );
};

/**
 * Que come hoy y como va su objetivo. Antes eran cuatro barras en cero
 * ocupando el segundo lugar de la pantalla; ahora es una linea, y solo dice
 * algo cuando hay algo que decir.
 */
export const TarjetaHoy = ({ ordenes, metricas, objetivo, cargando }) => {
  if (cargando) return null;

  const hoy = moment().format('YYYY-MM-DD');
  const ordenHoy = (ordenes || []).find((o) => moment(o.date).format('YYYY-MM-DD') === hoy);

  const platos = ordenHoy?.items
    ?.map((i) => i?.menu?.name)
    .filter(Boolean)
    .join(' · ');

  const kcal = metricas?.calorias ?? 0;
  const meta = objetivo?.bmr ? Math.round(objetivo.bmr) : null;

  return (
    <div className="afCard afHoy">
      <div className="afCard__head">
        <span className="afCard__title">
          <Ico d="M12.4 2.8s.6 3.4-1.4 5.4c-1 1-2.6-.4-2.6-.4S6.6 9.4 6.6 12a5.4 5.4 0 0 0 10.8 0c0-4.4-5-9.2-5-9.2Z" />
          Hoy comes
        </span>
      </div>

      {platos && <p className="afHoy__plato">{platos}</p>}

      {/* Sin plato de hoy no hay nada que medir: mostrar una barra en cero es
          repetir "no hay datos" con mas tinta. */}
      {meta && platos ?
        <>
          <div className="afFila afFila--top">
            <span>Calorías</span>
            <span><b>{Math.round(kcal)}</b> / {meta}</span>
          </div>
          <BarraAnimada className="afBarra afBarra--sky" porcentaje={barra(kcal, meta)} />
        </>
      :
        <p className="afHoy__vacio">Cuando elijas tu almuerzo verás aquí cómo va tu día.</p>
      }
    </div>
  );
};
