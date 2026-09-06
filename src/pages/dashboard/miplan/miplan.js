import React, { useEffect, useState } from "react";
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import { useAuthContext } from './../../../context/authContext';
import { Cascada, Bloque, BarraAnimada, motion, alToque } from './../../../components/ultil/Motion/Motion';
import './miplan.scss';
import { API_URL } from '../../../config';

const baseUrl = `${API_URL}`;

/* Como se llama en castellano cada beneficio que devuelve el plan. El servidor
   los manda en ingles y en plural indistinto ("lunch", "snacks"): sin esta
   tabla la pantalla le ensenaria al cliente el nombre interno del sistema. */
const NOMBRES = {
  lunch:     { uno: 'almuerzo',  varios: 'almuerzos',  ico: 'plato' },
  dinner:    { uno: 'cena',      varios: 'cenas',      ico: 'plato' },
  breakfast: { uno: 'desayuno',  varios: 'desayunos',  ico: 'taza'  },
  snacks:    { uno: 'snack',     varios: 'snacks',     ico: 'snack' },
  drinks:    { uno: 'refresco',  varios: 'refrescos',  ico: 'vaso'  },
};

const Ico = ({ n }) => {
  const c = { className: 'afInc__ic', viewBox: '0 0 24 24', fill: 'none',
              stroke: 'currentColor', strokeWidth: 1.7,
              strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (n === 'taza')  return <svg {...c}><path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h1.8a2.6 2.6 0 0 1 0 5.2H16"/></svg>;
  if (n === 'vaso')  return <svg {...c}><path d="M6.4 4h11.2l-1.3 15.2a1.8 1.8 0 0 1-1.8 1.6H9.5a1.8 1.8 0 0 1-1.8-1.6z"/><path d="M6.9 9.6h10.2"/></svg>;
  if (n === 'snack') return <svg {...c}><path d="M5 9.5h14l-1.2 9.1a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7z"/><path d="M8.6 9.5V7a3.4 3.4 0 0 1 6.8 0v2.5"/></svg>;
  if (n === 'moto')  return <svg {...c}><path d="M3 7.4h8.4v7.2H3z"/><path d="M11.4 10.2h3.5l2.7 3.1v1.3h-6.2z"/><circle cx="6.6" cy="17.4" r="1.9"/><circle cx="16.4" cy="17.4" r="1.9"/></svg>;
  /* Plato visto desde arriba. El circulo dentro de otro circulo se leia como
     una diana, no como comida. */
  return <svg {...c}><circle cx="12" cy="12" r="8.4"/><path d="M8.3 12.8a3.7 3.7 0 0 1 7.4 0"/></svg>;
};

/** Dias de lunes a viernes entre dos fechas, incluyendo ambas. */
const habilesEntre = (desde, hasta) => {
  if (!desde || !hasta || hasta.isBefore(desde)) return 0;
  let n = 0;
  const cursor = desde.clone().startOf('day');
  const fin = hasta.clone().startOf('day');
  while (cursor.isSameOrBefore(fin)) {
    if (cursor.isoWeekday() <= 5) n += 1;
    cursor.add(1, 'day');
  }
  return n;
};

/**
 * El anillo del plan. Se vacia conforme se consume: el cliente entiende de un
 * vistazo cuanto le queda sin leer una sola cifra.
 */
const Anillo = ({ restantes, total, unidad }) => {
  const R = 54;
  const C = 2 * Math.PI * R;
  const frac = total ? Math.max(restantes, 0) / total : 0;
  return (
    <div className="afAnillo">
      <svg viewBox="0 0 132 132" aria-hidden="true">
        <circle cx="66" cy="66" r={R} fill="none" strokeWidth="13"
                stroke="rgba(255,255,255,.13)" />
        <motion.circle
          cx="66" cy="66" r={R} fill="none" strokeWidth="13" strokeLinecap="round"
          stroke="var(--af-mint)" transform="rotate(-90 66 66)"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - frac) }}
          transition={{ duration: 1.1, ease: [0.16, 0.84, 0.44, 1], delay: 0.2 }}
        />
      </svg>
      <span className="afAnillo__txt">
        <b>{Math.max(restantes, 0)}</b>
        <small>de {total} {unidad}</small>
      </span>
    </div>
  );
};

/**
 * Pantalla "Mi plan".
 *
 * Es la pantalla donde el cliente comprueba que el mes que pago vale la pena,
 * asi que responde en este orden: cuanto me queda, que compre exactamente,
 * voy al ritmo correcto y cuanto me ahorre. Antes solo tenia una barra y un
 * numero, y los beneficios del plan —los almuerzos, los snacks, los
 * refrescos— viajaban en la respuesta sin que nadie los mostrara.
 */
const MiPlanPage = () => {

  const { token } = useAuthContext();
  const navigate = useNavigate();

  const [plan, setPlan] = useState();
  const [facturas, setFacturas] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const cabecera = { headers: { Authorization: `Bearer ${token}` } };

    axios.get(baseUrl + 'dashboard/plan', cabecera)
      .then((r) => setPlan(r.data.data))
      .catch((e) => console.log(e))
      .finally(() => setListo(true));

    axios.get(baseUrl + 'invoice/list', cabecera)
      .then((r) => setFacturas(Array.isArray(r.data.data) ? r.data.data : []))
      .catch((e) => console.log(e));
  }, [token]);

  const total = plan?.consumption?.orders?.total ?? 0;
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const restantes = Math.max(total - usados, 0);
  const creditos = plan?.credits?.orders?.total;

  const hoy = moment().startOf('day');
  const inicia = plan?.initDate ? moment(plan.initDate).startOf('day') : null;
  const vence = plan?.expirationDate ? moment(plan.expirationDate).startOf('day') : null;
  const diasRestantes = vence ? vence.diff(hoy, 'days') : null;
  const pocos = restantes <= 3 || (diasRestantes !== null && diasRestantes <= 5);

  /* Lo que compro, dicho con sus cifras. principalBenefits son los platos,
     extraBenefits lo que los acompana y additional lo que anadio al pagar. */
  const incluye = [];
  if (plan) {
    const c = plan.consumption || {};
    [...(c.principalBenefits || []), ...(c.extraBenefits || []), ...(c.additional || [])]
      .forEach((clave) => {
        const n = NOMBRES[clave];
        if (!n || incluye.some((i) => i.clave === clave)) return;
        incluye.push({
          clave,
          texto: `${total} ${total === 1 ? n.uno : n.varios}`,
          ico: n.ico,
        });
      });
  }

  /* Ritmo. El plan corre por dos relojes a la vez —los envios y los dias— y el
     cliente solo suele mirar uno. Aqui se compara cuantos habiles han pasado
     con cuantos almuerzos uso: es la unica forma de avisarle a tiempo de que
     va a perder envios pagados. */
  const habilesTotales = habilesEntre(inicia, vence);
  const habilesPasados = habilesEntre(inicia, hoy.isBefore(vence || hoy) ? hoy : vence);
  const esperados = habilesTotales
    ? Math.min(total, Math.round((total * habilesPasados) / habilesTotales))
    : null;
  // Desde manana: hoy ya no se puede pedir, la ventana cerro anoche.
  const habilesQuedan = habilesEntre(hoy.clone().add(1, 'day'), vence);
  const noAlcanza = vence && restantes > habilesQuedan;
  const atraso = esperados !== null ? esperados - usados : 0;

  /* Ahorro. Sale de los descuentos que ya figuran en sus comprobantes: es una
     cifra verificable, no una estimacion de marketing. */
  const ahorro = facturas.reduce((suma, f) => (
    suma + (f.details || []).filter((l) => Number(l.value) < 0)
      .reduce((s, l) => s + Math.abs(Number(l.value)), 0)
  ), 0);

  const ultima = [...facturas]
    .sort((a, b) => moment(b.emissionDate).valueOf() - moment(a.emissionDate).valueOf())[0];
  const lineasPlan = (ultima?.details || []).filter((l) => /^Plan/i.test(l.name || ''));
  const bruto = lineasPlan.reduce((s, l) => s + Number(l.value), 0);
  const dcto = (ultima?.details || []).filter((l) => Number(l.value) < 0)
    .reduce((s, l) => s + Math.abs(Number(l.value)), 0);
  const porUnidad = total && bruto ? (bruto - dcto) / total : null;
  const porUnidadLista = total && bruto ? bruto / total : null;

  if (!listo) {
    return (
      <LayoutDasboard claseStyle={false}>
        <div className="afPanel">
          <Skeleton variant="text" width="55%" height={40} />
          <Skeleton variant="rounded" height={188} sx={{ borderRadius: '22px', mt: 2 }} />
          <Skeleton variant="rounded" height={130} sx={{ borderRadius: '20px', mt: 2 }} />
        </div>
      </LayoutDasboard>
    );
  }

  return (
    <LayoutDasboard claseStyle={false}>
      <Cascada className="afPanel">

        <Bloque><h1 className="afPanel__titular">Mi plan</h1></Bloque>

        {plan ?
          <>
            {/* La unica pieza oscura de la app. Esta pantalla es el recibo de un
                mes pagado: merece pesar distinto al resto del panel. */}
            <Bloque>
              <div className="afHero">
                <div className="afHero__txt">
                  <p className="afHero__et">Tu plan</p>
                  <p className="afHero__nombre">{plan.planName}</p>
                  {vence &&
                    <p className="afHero__vig">
                      Hasta el <b>{vence.format('D [de] MMM')}</b>
                      {diasRestantes >= 0 && ` · ${diasRestantes} días`}
                    </p>
                  }
                </div>
                <Anillo restantes={restantes} total={total}
                        unidad={total === 1 ? 'almuerzo' : 'almuerzos'} />
              </div>
            </Bloque>

            {/* Los 20 envios, uno por uno. Un numero se olvida; ver la fila
                completa de lo que compro es lo que hace tangible el mes. */}
            {total > 0 && total <= 40 &&
              <Bloque>
                <div className="afCard">
                  <div className="afCard__head">
                    <span className="afCard__title">Tus {total} envíos</span>
                    <span className="afCard__label">{usados} usados</span>
                  </div>

                  <div className="afTira">
                    {Array.from({ length: total }, (_, i) => (
                      <motion.span
                        key={i}
                        className={`afTira__u${i < usados ? ' afTira__u--usado' : ''}${
                          esperados !== null && i === esperados - 1 && esperados > usados
                            ? ' afTira__u--meta' : ''}`}
                        initial={{ opacity: 0, scale: .6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + i * 0.012, duration: .3 }}
                      />
                    ))}
                  </div>

                  {esperados !== null &&
                    <p className={`afRitmo${atraso > 2 || noAlcanza ? ' afRitmo--ojo' : ''}`}>
                      {noAlcanza
                        ? `Quedan ${habilesQuedan} días hábiles y ${restantes} envíos: si no cambias el ritmo, ${restantes - habilesQuedan} se van a vencer sin usar.`
                        : atraso > 2
                          ? `Vas ${atraso} envíos por detrás del ritmo del plan. Todavía te alcanza el tiempo para usarlos todos.`
                          : 'Vas al día con tu plan. Te alcanza el tiempo de sobra.'}
                    </p>
                  }
                </div>
              </Bloque>
            }

            {incluye.length > 0 &&
              <Bloque>
                <div className="afCard">
                  <div className="afCard__head">
                    <span className="afCard__title">Lo que incluye</span>
                  </div>
                  <div className="afInc">
                    {incluye.map((i) => (
                      <span className="afInc__it" key={i.clave}>
                        <Ico n={i.ico} />
                        {i.texto}
                      </span>
                    ))}
                    <span className="afInc__it afInc__it--libre">
                      <Ico n="moto" />
                      Delivery incluido
                    </span>
                  </div>
                </div>
              </Bloque>
            }

            {ahorro > 0 &&
              <Bloque>
                <div className="afCard afAhorro">
                  <div className="afCard__head">
                    <span className="afCard__title">Lo que te ahorraste</span>
                  </div>
                  <p className="afAhorro__n">S/ {ahorro.toFixed(2)}</p>
                  {porUnidad !== null &&
                    <p className="afAhorro__d">
                      Cada almuerzo te sale <b>S/ {porUnidad.toFixed(2)}</b> en vez
                      de S/ {porUnidadLista.toFixed(2)} sueltos.
                    </p>
                  }
                  <p className="afAhorro__f">Según los descuentos de tus comprobantes.</p>
                </div>
              </Bloque>
            }

            {inicia && vence &&
              <Bloque>
                <div className="afCard">
                  <div className="afCard__head">
                    <span className="afCard__title">Vigencia</span>
                    <span className="afCard__label">
                      {diasRestantes >= 0 ? `${diasRestantes} días` : 'Vencido'}
                    </span>
                  </div>
                  <BarraAnimada
                    className={`afBarra afBarra--${pocos ? 'bajo' : 'ok'}`}
                    porcentaje={Math.min(
                      Math.max((hoy.diff(inicia, 'days') / Math.max(vence.diff(inicia, 'days'), 1)) * 100, 0),
                      100
                    )}
                  />
                  <div className="afFila">
                    <span>{inicia.format('D MMM')}</span>
                    <span>{vence.format('D MMM')}</span>
                  </div>
                </div>
              </Bloque>
            }

            {creditos > 0 &&
              <Bloque>
                <div className="afCard afCredito">
                  <p className="afCredito__t">Tienes otro plan esperando</p>
                  <p className="afCredito__d">
                    {creditos} envíos más. Empiezan solos cuando termines el plan actual,
                    sin que tengas que hacer nada.
                  </p>
                </div>
              </Bloque>
            }

            <Bloque>
              <motion.button
                type="button"
                className={`afBtn${pocos ? ' afBtn--mint' : ''}`}
                onClick={() => navigate('/planes')}
                {...alToque}
              >
                {pocos ? 'Renovar mi plan' : 'Ver otros planes'}
              </motion.button>
            </Bloque>
          </>
        :
          <Bloque>
            <div className="afCard afSinPlan">
              <p className="afSinPlan__t">No tienes un plan activo</p>
              <p className="afSinPlan__d">Elige uno y empieza a recibir tus almuerzos esta semana.</p>
              <motion.button type="button" className="afBtn afBtn--mint"
                onClick={() => navigate('/planes')} {...alToque}>
                Ver planes
              </motion.button>
            </div>
          </Bloque>
        }

        <Bloque>
          <div className="afCard">
            <div className="afCard__head">
              <span className="afCard__title">Tus compras</span>
              <span className="afCard__label">{facturas.length}</span>
            </div>

            {facturas.length > 0 ?
              facturas.map((f) => (
                <div className="afSrow" key={f.id}>
                  <span>{f.emissionDate ? moment(f.emissionDate).format('D MMM YYYY') : '—'}</span>
                  <b>S/ {Number(f.totalPrice ?? 0).toFixed(2)}</b>
                </div>
              ))
            :
              <p className="afMenu__nota afMenu__nota--suelta">
                Aquí aparecerán tus compras cuando tengas la primera.
              </p>
            }
          </div>
        </Bloque>

      </Cascada>
    </LayoutDasboard>
  );
};

export default MiPlanPage;
