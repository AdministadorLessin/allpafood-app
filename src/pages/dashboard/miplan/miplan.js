import React, { useEffect, useState } from "react";
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

import { motion, useReducedMotion } from 'motion/react';

import Pantalla, { Tramo } from './../../../components/perfil/Pantalla/Pantalla';
import { useAuthContext } from './../../../context/authContext';
import { resorte } from '../../../movimiento';
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
  const c = { 'aria-hidden': true, viewBox: '0 0 24 24', fill: 'none',
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
  const quieto = useReducedMotion();

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

  const IR = <span className="cuP__filaIr" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>;

  if (!listo) {
    return (
      <Pantalla etiqueta="Mi plan" titulo="Tu plan" clase="mpl">
        <Skeleton variant="rounded" height={230} sx={{ borderRadius: '32px', mt: '20px' }} />
        <Skeleton variant="rounded" height={64} sx={{ borderRadius: '18px', mt: '14px' }} />
        <Skeleton variant="rounded" height={64} sx={{ borderRadius: '18px', mt: '10px' }} />
      </Pantalla>
    );
  }

  const pctVigencia = inicia && vence
    ? Math.min(Math.max(hoy.diff(inicia, 'days') / Math.max(vence.diff(inicia, 'days'), 1), 0), 1)
    : 0;
  const crece = (hasta, espera = 0.25) => ({
    initial: { scaleX: 0 }, animate: { scaleX: hasta },
    transition: quieto ? { duration: 0 } : { ...resorte.suave, delay: espera },
  });

  return (
    <Pantalla
      etiqueta="Mi plan"
      titulo={plan ? plan.planName : 'Sin plan activo'}
      bajada={plan
        ? (vence
            ? <>Hasta el <b>{vence.format('D [de] MMMM')}</b>{diasRestantes >= 0 ? ` · ${diasRestantes === 1 ? 'queda 1 día' : `quedan ${diasRestantes} días`}` : ' · vencido'}</>
            : null)
        : 'Elige uno y empieza a recibir tus almuerzos esta semana.'}
      clase="mpl">

      {plan ?
        <>
          {/* Cuanto queda: el numero grande, la barra y los envios uno por
              uno. Un numero se olvida; ver la fila completa de lo que compro
              es lo que hace tangible el mes. */}
          <Tramo as="section" className="cuP__papel" aria-label="Lo que te queda">
            <div className="mpl__quedan">
              <b>{restantes}</b>
              <span>{restantes === 1 ? 'entrega' : 'entregas'}<br />te {restantes === 1 ? 'queda' : 'quedan'}</span>
            </div>
            <span className="mpl__barra" role="img" aria-label={`Usaste ${usados} de ${total} entregas`}>
              <motion.i {...crece(total ? Math.min(restantes / total, 1) : 0)} />
            </span>
            <span className="mpl__nota">Usaste {usados} de {total}.</span>

            {total > 0 && total <= 40 &&
              <div className="mpl__tira" aria-hidden="true">
                {Array.from({ length: total }, (_, i) => (
                  <motion.span
                    key={i}
                    className={`mpl__u${i < usados ? ' is-usado' : ''}${
                      esperados !== null && i === esperados - 1 && esperados > usados
                        ? ' is-meta' : ''}`}
                    initial={quieto ? false : { opacity: 0, scale: .6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={quieto ? { duration: 0 } : { ...resorte.entra, delay: 0.25 + i * 0.012 }}
                  />
                ))}
              </div>
            }

            {esperados !== null &&
              <p className={`mpl__ritmo${noAlcanza ? ' is-ojo' : ''}`}>
                {noAlcanza
                  ? `Quedan ${habilesQuedan} días hábiles y ${restantes} envíos: si no cambias el ritmo, ${restantes - habilesQuedan} se van a vencer sin usar.`
                  : atraso > 2
                    ? `Vas ${atraso} envíos por detrás del ritmo del plan. Todavía te alcanza el tiempo para usarlos todos.`
                    : 'Vas al día con tu plan. Te alcanza el tiempo de sobra.'}
              </p>
            }

            <motion.button
              type="button"
              className={`cuP__btn mpl__renovar${pocos ? '' : ' cuP__btn--hundido'}`}
              onClick={() => navigate('/planes')}
              whileTap={{ scale: 0.97 }} transition={resorte.toque}
            >
              {pocos ? 'Renovar mi plan' : 'Ver otros planes'}
            </motion.button>
          </Tramo>

          {creditos > 0 &&
            <Tramo className="cuP__tinta mpl__credito">
              <b>Tienes otro plan esperando</b>
              <p>
                {creditos} envíos más. Empiezan solos cuando termines el plan actual,
                sin que tengas que hacer nada.
              </p>
            </Tramo>
          }

          {/* Allpa+ vive aqui: es un beneficio DEL plan, y este es el sitio
              donde el cliente viene a ver que le dio su plata. */}
          <Tramo>
            <p className="cuP__grupo">Con tu plan</p>
            <div className="cuP__lista">
              <button type="button" className="cuP__fila" onClick={() => navigate('/beneficios')}>
                <span className="cuP__filaIco" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z" />
                  </svg>
                </span>
                <span className="cuP__filaTxt">
                  <b>Allpa+ · Tus beneficios</b>
                  <small>Descuentos en salud, fitness, hogar y formación</small>
                </span>
                {IR}
              </button>
              {incluye.map((i) => (
                <div className="cuP__fila cuP__fila--quieta" key={i.clave}>
                  <span className="cuP__filaIco"><Ico n={i.ico} /></span>
                  <span className="cuP__filaTxt"><b>{i.texto}</b></span>
                </div>
              ))}
              {incluye.length > 0 &&
                <div className="cuP__fila cuP__fila--quieta">
                  <span className="cuP__filaIco"><Ico n="moto" /></span>
                  <span className="cuP__filaTxt"><b>Delivery incluido</b></span>
                </div>}
            </div>
          </Tramo>

          {ahorro > 0 &&
            <Tramo as="section" className="cuP__bloque">
              <h2>Lo que te ahorraste</h2>
              <p className="mpl__ahorro">S/ {ahorro.toFixed(2)}</p>
              {porUnidad !== null &&
                <p className="cuP__ayuda">
                  Cada almuerzo te sale <b>S/ {porUnidad.toFixed(2)}</b> en vez
                  de S/ {porUnidadLista.toFixed(2)} sueltos.
                </p>
              }
              <p className="cuP__ayuda">Según los descuentos de tus comprobantes.</p>
            </Tramo>
          }

          {inicia && vence &&
            <Tramo as="section" className="cuP__bloque">
              <h2>Vigencia</h2>
              <p className="cuP__ayuda">
                {diasRestantes >= 0
                  ? (diasRestantes === 1 ? 'Te queda 1 día.' : `Te quedan ${diasRestantes} días.`)
                  : 'Tu plan ya venció.'}
              </p>
              <span className="mpl__barra mpl__barra--tinta" aria-hidden="true">
                <motion.i {...crece(pctVigencia, 0.1)} />
              </span>
              <div className="mpl__fechas">
                <span>{inicia.format('D MMM').replace('.', '')}</span>
                <span>{vence.format('D MMM').replace('.', '')}</span>
              </div>
            </Tramo>
          }
        </>
      :
        <Tramo>
          <motion.button type="button" className="cuP__btn mpl__sinPlan"
            onClick={() => navigate('/planes')} whileTap={{ scale: 0.97 }} transition={resorte.toque}>
            Ver planes
          </motion.button>
        </Tramo>
      }

      <Tramo as="section" className="cuP__bloque">
        <h2>Tus compras</h2>
        {facturas.length > 0 ?
          <div className="cuP__lista mpl__compras">
            {facturas.map((f) => (
              <div className="cuP__fila cuP__fila--quieta" key={f.id}>
                <span className="cuP__filaTxt">
                  <b>{f.emissionDate ? moment(f.emissionDate).format('D [de] MMMM [de] YYYY') : '—'}</b>
                </span>
                <span className="cuP__filaValor">S/ {Number(f.totalPrice ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        :
          <p className="cuP__vacio">
            Aquí aparecerán tus compras cuando tengas la primera.
          </p>
        }
        {facturas.length > 0 &&
          <button type="button" className="cuP__enlace" onClick={() => navigate('/facturacion')}>Ver mis comprobantes</button>}
      </Tramo>

    </Pantalla>
  );
};

export default MiPlanPage;
