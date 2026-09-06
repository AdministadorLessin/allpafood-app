import React from "react";
import moment from 'moment';
import Skeleton from '@mui/material/Skeleton';

import './PanelKpis.scss';
import { semanaDelCliente } from './../StatusBanner/estadoPlan';

const Ico = ({ n }) => {
  const c = { className: 'afKpi__ic', viewBox: '0 0 24 24', fill: 'none',
              stroke: 'currentColor', strokeWidth: 1.8,
              strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (n === 'caja') return (
    <svg {...c}><path d="M3.6 7.6 12 3.1l8.4 4.5v8.8L12 20.9l-8.4-4.5z"/>
      <path d="M3.6 7.6 12 12.1l8.4-4.5M12 12.1v8.8"/></svg>
  );
  if (n === 'reloj') return (
    <svg {...c}><circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.1 2"/></svg>
  );
  if (n === 'ahorro') return (
    <svg {...c}><path d="M12 3.2v17.6M15.8 6.6H10a2.7 2.7 0 0 0 0 5.4h4a2.7 2.7 0 0 1 0 5.4H8"/></svg>
  );
  return (
    <svg {...c}><path d="m9 12.5 2.2 2.2 4.3-4.6"/><circle cx="12" cy="12" r="8.6"/></svg>
  );
};

/**
 * Los tres numeros que responden "¿como voy?" sin tener que abrir nada.
 *
 * Se calculan con datos que el panel ya pide: no hay endpoint nuevo. El plan
 * da envios y vencimiento; los pedidos de la semana dan cuantos dias resolvio.
 */
const PanelKpis = ({ plan, ordenes, facturas, cargando, ahora }) => {

  if (cargando) {
    return (
      <div className="afKpis">
        {[0, 1, 2].map((i) => (
          <div className="afKpi" key={i}>
            <Skeleton variant="circular" width={30} height={30} />
            <Skeleton variant="text" width="60%" height={30} />
            <Skeleton variant="text" width="80%" height={12} />
          </div>
        ))}
      </div>
    );
  }

  if (!plan) return null;

  const total = plan?.consumption?.orders?.total ?? 0;
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const restantes = Math.max(total - usados, 0);

  const vence = plan?.expirationDate ? moment(plan.expirationDate) : null;
  const dias = vence
    ? Math.max(vence.startOf('day').diff((ahora || moment()).clone().startOf('day'), 'days'), 0)
    : null;

  const semana = semanaDelCliente(ordenes, ahora);
  const resueltos = semana.filter((d) => ['entregado', 'enRuta', 'listo'].includes(d.estado)).length;

  // Ahorro acumulado: la suma de todos los descuentos que ya se le aplicaron,
  // sacada del detalle de sus facturas. Es un numero real y verificable —el
  // mismo que aparece en cada comprobante—, no una estimacion.
  const ahorro = (facturas || []).reduce((suma, f) => {
    const lineas = f.detailsEntity || f.details || [];
    return suma + lineas
      .filter((l) => Number(l.value) < 0)
      .reduce((s, l) => s + Math.abs(Number(l.value)), 0);
  }, 0);

  const kpis = [
    { icono: 'caja',   tono: 'verde', valor: restantes,   pie: restantes === 1 ? 'envío disponible' : 'envíos disponibles' },
    { icono: 'ahorro', tono: 'coral', valor: `S/${Math.round(ahorro)}`, pie: 'ahorrado hasta hoy', destacado: ahorro > 0 },
    { icono: 'reloj',  tono: 'azul',  valor: dias ?? '—', pie: dias === 1 ? 'día de plan' : 'días de plan' },
  ];

  return (
    <div className="afKpis">
      {kpis.map((k) => (
        <div className={`afKpi afKpi--${k.tono}${k.destacado ? ' afKpi--destacado' : ''}`} key={k.pie}>
          <span className="afKpi__circulo"><Ico n={k.icono} /></span>
          <span className="afKpi__valor">{k.valor}</span>
          <span className="afKpi__pie">{k.pie}</span>
        </div>
      ))}
    </div>
  );
};

export default PanelKpis;
