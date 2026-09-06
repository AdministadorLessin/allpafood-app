import React from "react";
import moment from 'moment';

import { Cascada, Bloque, BarraAnimada, motion, alToque } from './../../components/ultil/Motion/Motion';
import { planBase } from './datosEjemplo';
import './../dashboard/miplan/miplan.scss';

/**
 * SOLO DESARROLLO. Maqueta de "Mi plan" con datos de ejemplo, para revisarla
 * sin sesion. La pantalla real vive en src/pages/dashboard/miplan.
 */

const Vista = ({ plan, facturas }) => {
  const total = plan?.consumption?.orders?.total ?? 0;
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const restantes = Math.max(total - usados, 0);
  const creditos = plan?.credits?.orders?.total;
  const vence = plan?.expirationDate ? moment(plan.expirationDate) : null;
  const dias = vence ? vence.diff(moment().startOf('day'), 'days') : null;
  const pocos = restantes <= 3 || (dias !== null && dias <= 5);

  return (
    <Cascada>
      <Bloque><h1 className="afPanel__titular">Mi plan</h1></Bloque>

      {plan ?
        <>
          <Bloque>
            <div className="afCard afPlanHero">
              <p className="afPlanHero__nombre">{plan.planName}</p>
              <div className="afPlanHero__cifra">
                <span className="afPlanHero__n">{restantes}</span>
                <span className="afPlanHero__u">{restantes === 1 ? 'envío disponible' : 'envíos disponibles'}</span>
              </div>
              <BarraAnimada className={`afBarra afBarra--${pocos ? 'bajo' : 'ok'}`}
                porcentaje={total ? Math.round((usados / total) * 100) : 0} />
              <div className="afFila"><span>Usados</span><span><b>{usados}</b> de {total}</span></div>
              {vence &&
                <p className="afPlanHero__vence">
                  Vence el <b>{vence.format('D [de] MMMM')}</b>{dias >= 0 && ` · quedan ${dias} días`}
                </p>}
            </div>
          </Bloque>

          {creditos > 0 &&
            <Bloque>
              <div className="afCard afCredito">
                <p className="afCredito__t">Tienes otro plan esperando</p>
                <p className="afCredito__d">
                  {creditos} envíos más. Empiezan solos cuando termines el plan actual,
                  sin que tengas que hacer nada.
                </p>
              </div>
            </Bloque>}

          <Bloque>
            <motion.button type="button" className={`afBtn${pocos ? ' afBtn--mint' : ''}`} {...alToque}>
              {pocos ? 'Renovar mi plan' : 'Ver otros planes'}
            </motion.button>
          </Bloque>
        </>
      :
        <Bloque>
          <div className="afCard afSinPlan">
            <p className="afSinPlan__t">No tienes un plan activo</p>
            <p className="afSinPlan__d">Elige uno y empieza a recibir tus almuerzos esta semana.</p>
            <motion.button type="button" className="afBtn afBtn--mint" {...alToque}>Ver planes</motion.button>
          </div>
        </Bloque>}

      <Bloque>
        <div className="afCard">
          <div className="afCard__head">
            <span className="afCard__title">Tus compras</span>
            <span className="afCard__label">{facturas.length}</span>
          </div>
          {facturas.length > 0 ?
            facturas.map((f) => (
              <div className="afSrow" key={f.id}>
                <span>{moment(f.emissionDate).format('D MMM YYYY')}</span>
                <b>S/ {f.totalPrice.toFixed(2)}</b>
              </div>
            ))
          :
            <p className="afMenu__nota afMenu__nota--suelta">
              Aquí aparecerán tus compras cuando tengas la primera.
            </p>}
        </div>
      </Bloque>
    </Cascada>
  );
};

const FACTURAS = [
  { id: 1327, emissionDate: moment().subtract(3, 'days').format('YYYY-MM-DD'), totalPrice: 669 },
  { id: 1326, emissionDate: moment().subtract(34, 'days').format('YYYY-MM-DD'), totalPrice: 419 },
];

const conCreditos = {
  ...planBase,
  credits: { orders: { total: 20, consumed: 0 }, additional: ['breakfast'] },
};
const porAcabarse = {
  ...planBase,
  expirationDate: moment().add(4, 'days').format('YYYY-MM-DD'),
  consumption: { ...planBase.consumption, orders: { total: 20, consumed: 17 } },
};

const MiPlanVista = [
  { nombre: 'Mi plan · al día', Comp: () => <Vista plan={planBase} facturas={FACTURAS} /> },
  { nombre: 'Mi plan · con créditos', Comp: () => <Vista plan={conCreditos} facturas={FACTURAS} /> },
  { nombre: 'Mi plan · por acabarse', Comp: () => <Vista plan={porAcabarse} facturas={FACTURAS} /> },
  { nombre: 'Mi plan · sin plan', Comp: () => <Vista plan={null} facturas={[]} /> },
];

export default MiPlanVista;
