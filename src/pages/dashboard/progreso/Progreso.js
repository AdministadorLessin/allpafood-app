import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import { Link } from 'react-router-dom';
import { animate, AnimatePresence, motion, useReducedMotion } from 'motion/react';

import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import Isotipo from '../../../components/ultil/Isotipo';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
import { cascada, sube, resorte } from '../../../movimiento';
import { leerMeta } from '../../../meta';
import './Progreso.scss';

/**
 * Progreso: como va el cliente, en numeros. Nada que elegir aqui.
 *
 * Todo sale de datos reales: sus pedidos de la semana (cada plato trae
 * calorias y macros), la meta que calculo al registrarse y su plan. El peso
 * lo anota el cliente y, por ahora, se guarda en su telefono.
 */
const valor = (it, nombre) => {
  const p = (it?.menu?.properties || []).find((x) => String(x.name || '').toLowerCase().startsWith(nombre));
  return Number(p?.value) || 0;
};
const sumar = (orden) => (orden?.items || []).reduce((s, it) => ({
  kcal: s.kcal + valor(it, 'calor'), prot: s.prot + valor(it, 'prote'),
  carbo: s.carbo + valor(it, 'carbo'), grasa: s.grasa + valor(it, 'grasa'),
}), { kcal: 0, prot: 0, carbo: 0, grasa: 0 });

const MEDIDAS = [
  { k: 'prot', nombre: 'Proteína', unidad: 'g', color: 'var(--n-proteina)', meta: 'proteinas' },
  { k: 'kcal', nombre: 'Calorías', unidad: '', color: 'var(--n-tinta)', meta: 'bmr' },
  { k: 'carbo', nombre: 'Carbos', unidad: 'g', color: 'var(--n-carbo)', meta: 'carbo' },
  { k: 'grasa', nombre: 'Grasas', unidad: 'g', color: 'var(--n-grasa)', meta: 'grasas' },
];
const miles = (n) => Math.round(n).toLocaleString('es-PE');

function Cuenta({ hasta, decimales = 0 }) {
  const ref = useRef(null);
  const quieto = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return undefined;
    const pinta = (v) => { if (ref.current) ref.current.textContent = decimales ? v.toFixed(decimales) : miles(v); };
    if (quieto) { pinta(hasta); return undefined; }
    const c = animate(0, hasta, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], onUpdate: pinta });
    return () => c.stop();
  }, [hasta, quieto, decimales]);
  return <span ref={ref}>0</span>;
}

const Dato = ({ nombre, tono, children, pie }) => (
  <div className={`prg__dato${tono ? ` prg__dato--${tono}` : ''}`}>
    <span>{nombre}</span><b>{children}</b><small>{pie}</small>
  </div>
);

/* --- El peso, anotado por el cliente y guardado en su telefono --- */
const leerPesos = () => {
  try { const p = JSON.parse(localStorage.getItem('af_peso') || '[]'); return Array.isArray(p) ? p : []; } catch (e) { return []; }
};
function Peso({ delServidor, metaPeso }) {
  const [locales, setPesos] = useState(leerPesos);
  /* Si el servidor trae el historial, manda el; lo anotado hoy en el
     telefono se suma encima. */
  const pesos = delServidor?.length
    ? [...delServidor.filter((p) => !locales.some((l) => l.f === p.f)), ...locales].sort((a, b) => (a.f < b.f ? -1 : 1))
    : locales;
  const [anotando, setAnotando] = useState(false);
  const [texto, setTexto] = useState('');
  const hoy = moment().format('YYYY-MM-DD');
  const ultimo = pesos[pesos.length - 1];
  const primero = pesos[0];
  const cambio = pesos.length > 1 ? ultimo.kg - primero.kg : 0;

  const guardar = (e) => {
    e.preventDefault();
    const kg = Number(String(texto).replace(',', '.'));
    if (!(kg >= 30 && kg <= 250)) return;
    vibrar.exito();
    const nuevos = [...locales.filter((p) => p.f !== hoy), { f: hoy, kg: Math.round(kg * 10) / 10 }].slice(-60);
    setPesos(nuevos);
    try { localStorage.setItem('af_peso', JSON.stringify(nuevos)); } catch (err) { /* sin espacio */ }
    setAnotando(false); setTexto('');
  };

  /* La linea: de izquierda a derecha, con un poco de aire arriba y abajo. */
  const W = 300; const H = 110;
  const min = Math.min(...pesos.map((p) => p.kg), metaPeso || Infinity) - 0.6;
  const max = Math.max(...pesos.map((p) => p.kg)) + 0.6;
  const punto = (p, i) => [pesos.length > 1 ? 8 + (i / (pesos.length - 1)) * (W - 16) : W / 2, H - 10 - ((p.kg - min) / (max - min || 1)) * (H - 24)];
  const pts = pesos.map(punto);
  const yMeta = metaPeso ? H - 10 - ((metaPeso - min) / (max - min || 1)) * (H - 24) : null;
  const linea = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  return (
    <motion.section className="prg__card" variants={sube}>
      <div className="prg__cardCab">
        <h2>Tu peso</h2>
        {pesos.length > 1 &&
          <span className={`prg__sello${cambio > 0 ? ' prg__sello--neutro' : ''}`}>{cambio === 0 ? 'IGUAL' : `${cambio > 0 ? '+' : '−'}${Math.abs(cambio).toFixed(1)} KG`}</span>}
      </div>

      {pesos.length === 0 &&
        <p className="prg__p">Anota tu peso de vez en cuando y aquí verás cómo cambia. Una vez por semana, a la misma hora, es suficiente.</p>}

      {pesos.length > 0 &&
        <div className="prg__pesoHoy">
          <b><Cuenta hasta={ultimo.kg} decimales={1} /></b><em>kg</em>
          <small>{ultimo.f === hoy ? 'hoy' : moment(ultimo.f).format('D [de] MMMM')}</small>
        </div>}

      {pesos.length > 1 &&
        <>
          <svg className="prg__linea" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tu peso pasó de ${primero.kg} a ${ultimo.kg} kilos`}>
            <defs><linearGradient id="prgArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3CFB9F" stopOpacity=".45" /><stop offset="1" stopColor="#3CFB9F" stopOpacity="0" /></linearGradient></defs>
            {yMeta !== null && <>
              <line x1="0" x2={W} y1={yMeta} y2={yMeta} stroke="#F2553D" strokeWidth="1.5" strokeDasharray="4 5" />
              <text x="4" y={yMeta - 6} fontSize="11" fontWeight="600" fill="#B8321E">Meta {metaPeso} kg</text>
            </>}
            <motion.path d={`${linea} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`} fill="url(#prgArea)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
            <motion.path d={linea} fill="none" stroke="#16211B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }} />
            <motion.circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="6" fill="#3CFB9F" stroke="#16211B" strokeWidth="3"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...resorte.toque, delay: 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          </svg>
          <div className="prg__lineaPie"><span>{moment(primero.f).format('D MMM')}</span><span>{ultimo.f === hoy ? 'Hoy' : moment(ultimo.f).format('D MMM')}</span></div>
        </>}

      <AnimatePresence initial={false} mode="wait">
        {anotando
          ? <motion.form key="f" className="prg__anotar" onSubmit={guardar} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <label htmlFor="prgPeso">Tu peso de hoy, en kilos</label>
              <div>
                <input id="prgPeso" type="text" inputMode="decimal" autoComplete="off" autoFocus placeholder="68.4"
                  value={texto} onChange={(e) => setTexto(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 5))} />
                <button type="submit" disabled={!(Number(String(texto).replace(',', '.')) >= 30)}>Guardar</button>
              </div>
            </motion.form>
          : <motion.button key="b" type="button" className="prg__btn" whileTap={{ scale: 0.97 }} transition={resorte.toque}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { vibrar.toque(); setAnotando(true); }}>
              {pesos.some((p) => p.f === hoy) ? 'Corregir mi peso de hoy' : 'Registrar mi peso de hoy'}
            </motion.button>}
      </AnimatePresence>
    </motion.section>
  );
}

export default function ProgresoPage() {
  const { token } = useAuthContext();
  const [ordenes, setOrdenes] = useState(null);
  const [meta, setMeta] = useState(null);
  const [plan, setPlan] = useState(null);
  const [medida, setMedida] = useState(0);
  /* Racha, total de almuerzos, favoritos y peso guardado: solo si el servidor
     ya los entrega. Si no, esas partes no se pintan. */
  const [hist, setHist] = useState(null);

  useEffect(() => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(`${API_URL}dashboard/orders`, cab).then((r) => setOrdenes(r.data?.data || [])).catch(() => setOrdenes([]));
    axios.get(`${API_URL}dashboard/plan`, cab).then((r) => setPlan(r.data?.data || null)).catch(() => {});
    axios.get(`${API_URL}progreso/historial`, cab).then((r) => {
      const h = r.data?.data;
      if (h && !Array.isArray(h) && typeof h === 'object') setHist(h);
    }).catch(() => {});
    axios.get(`${API_URL}plan/user/need-day`, cab).then((r) => {
      /* Hay clientes con la meta vacia: ahi simplemente no se compara. */
      setMeta(leerMeta(r.data?.data?.needDay));
    }).catch(() => {});
  }, [token]);

  const lunes = moment().startOf('isoWeek');
  const semana = [0, 1, 2, 3, 4].map((i) => {
    const fecha = lunes.clone().add(i, 'days');
    const orden = (ordenes || []).find((o) => moment(o.date).isSame(fecha, 'day'));
    return { fecha, orden, totales: sumar(orden), nombre: fecha.format('ddd').replace('.', '') };
  });
  const con = semana.filter((d) => d.orden);
  const prom = (k) => (con.length ? con.reduce((s, d) => s + d.totales[k], 0) / con.length : 0);
  const cargando = ordenes === null;

  const total = plan?.consumption?.orders?.total ?? 0;
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const dias = plan?.expirationDate ? Math.max(moment(plan.expirationDate).startOf('day').diff(moment().startOf('day'), 'days'), 0) : null;

  const m = MEDIDAS[medida];
  const tope = Math.max(...semana.map((d) => d.totales[m.k]), 1);
  const suma = con.reduce((s, d) => s + d.totales[m.k], 0);
  const metaDia = meta?.[m.meta];
  const pctKcal = meta?.bmr ? Math.min(prom('kcal') / meta.bmr, 1) : 0;
  const circ = 2 * Math.PI * 52;

  const pesos = hist?.pesos?.length > 1 ? hist.pesos : null;
  const bajo = pesos ? pesos[0].kg - pesos[pesos.length - 1].kg : 0;
  const pesoHoy = pesos ? pesos[pesos.length - 1].kg : null;
  const falta = pesoHoy !== null && hist?.metaPeso ? pesoHoy - hist.metaPeso : null;

  const titular = cargando ? ['Tu semana', 'en números']
    : pesos && bajo >= 0.1 ? ['Bajaste', `${bajo.toFixed(1)} kilos`]
    : con.length >= 5 ? ['Semana', 'completa']
    : con.length === 0 ? ['Aún sin', 'almuerzos']
    : ['Llevas', con.length === 1 ? '1 almuerzo' : `${con.length} almuerzos`];
  const bajada = pesos && bajo >= 0.1
    ? ['VAS BIEN', falta > 0 ? `Te faltan ${falta.toFixed(1)} kg para tu meta` : 'Llegaste a tu meta']
    : [con.length >= 4 ? 'VAS BIEN' : 'ESTA SEMANA', con.length >= 5 ? 'Tienes almuerzo los cinco días' : `${con.length} de 5 días con almuerzo`];

  return (
    <LayoutDasboard claseStyle="nCaja">
      <motion.div className="nPant prg" variants={cascada(0.06)} initial="oculto" animate="visible">
        <span className="prg__menta" aria-hidden="true" />

        <motion.header variants={sube}>
          <span className="prg__sobre"><Isotipo size={18} />Mi progreso · semana del {lunes.format('D [de] MMMM')}</span>
          <h1>{titular[0]}<br />{titular[1]}</h1>
          {!cargando &&
            <p className="prg__bajada">
              <span className="prg__sello prg__sello--tinta">{bajada[0]}</span>
              {bajada[1]}
            </p>}
        </motion.header>

        {hist
          ? <>
              <motion.div className="prg__datos" variants={sube}>
                <Dato nombre="Peso hoy" pie="kilos">{pesoHoy !== null ? <Cuenta hasta={pesoHoy} decimales={1} /> : '—'}</Dato>
                <Dato nombre="Tu meta" tono="menta" pie="kilos">{hist.metaPeso ? Number(hist.metaPeso).toFixed(1) : '—'}</Dato>
                <Dato nombre="Promedio" tono="tinta" pie="kcal por almuerzo"><Cuenta hasta={prom('kcal')} /></Dato>
              </motion.div>
              <motion.div className="prg__datos" variants={sube}>
                <Dato nombre="Racha" tono="menta" pie={hist.semanasSeguidas === 1 ? 'semana seguida' : 'semanas seguidas'}><Cuenta hasta={hist.semanasSeguidas || 0} /></Dato>
                <Dato nombre="Almuerzos" pie="desde que empezaste"><Cuenta hasta={hist.almuerzos || 0} /></Dato>
                <Dato nombre="Proteína" pie="promedio por almuerzo"><Cuenta hasta={prom('prot')} /> g</Dato>
              </motion.div>
            </>
          : <>
              <motion.div className="prg__datos" variants={sube}>
                <Dato nombre="Calorías" pie="promedio por almuerzo"><Cuenta hasta={prom('kcal')} /></Dato>
                <Dato nombre="Proteína" tono="menta" pie="promedio por almuerzo"><Cuenta hasta={prom('prot')} /> g</Dato>
                <Dato nombre="Tu meta" tono="tinta" pie="kcal al día">{meta ? <Cuenta hasta={meta.bmr} /> : '—'}</Dato>
              </motion.div>
              <motion.div className="prg__datos" variants={sube}>
                <Dato nombre="Entregas" tono="menta" pie="por usar en tu plan"><Cuenta hasta={Math.max(total - usados, 0)} /></Dato>
                <Dato nombre="Usaste" pie={total ? `de ${total} entregas` : 'entregas'}><Cuenta hasta={usados} /></Dato>
                <Dato nombre="Tu plan" pie={dias === null ? 'sin fecha' : dias === 1 ? 'día para usarlo' : 'días para usarlo'}>{dias === null ? '—' : <Cuenta hasta={dias} />}</Dato>
              </motion.div>
            </>}

        {/* El peso va primero cuando ya hay historial: es el titular. */}
        {hist && <Peso delServidor={hist.pesos} metaPeso={hist.metaPeso} />}

        {/* La semana, dia por dia, con la medida que elija */}
        <motion.section className="prg__card" variants={sube}>
          <div className="prg__cardCab"><h2>Tu semana</h2><span>almuerzo de cada día</span></div>
          <div className="prg__medidas" role="radiogroup" aria-label="Qué medir">
            {MEDIDAS.map((x, i) => (
              <button type="button" key={x.k} role="radio" aria-checked={medida === i} className={medida === i ? 'is-on' : ''}
                onClick={() => { vibrar.toque(); setMedida(i); }}>
                {medida === i && <motion.span layoutId="prgMedida" className="prg__medidaFondo" transition={resorte.toque} />}
                <span>{x.nombre}</span>
              </button>
            ))}
          </div>
          <div className="prg__barras">
            {semana.map((d, i) => {
              const v = d.totales[m.k];
              return (
                <div key={d.nombre} className={d.fecha.isSame(moment(), 'day') ? 'is-hoy' : ''}>
                  <span className="prg__barra">
                    <motion.i style={{ background: m.color }} initial={false} animate={{ height: `${d.orden ? Math.max((v / tope) * 100, 6) : 0}%` }}
                      transition={{ ...resorte.suave, delay: i * 0.04 }} />
                  </span>
                  <b>{d.orden ? `${miles(v)}${m.unidad ? ` ${m.unidad}` : ''}` : '—'}</b>
                  <small>{d.nombre.charAt(0).toUpperCase() + d.nombre.slice(1)}</small>
                </div>
              );
            })}
          </div>
          {con.length > 0 &&
            <p className="prg__p">Llevas <b>{miles(suma)}{m.unidad ? ` ${m.unidad}` : ' kcal'}</b> en {con.length === 1 ? 'un almuerzo' : `${con.length} almuerzos`}.
              {metaDia ? <> Tu meta de cada día es {miles(metaDia)}{m.unidad ? ` ${m.unidad}` : ' kcal'}, contando todas tus comidas.</> : null}</p>}
          {!cargando && con.length < 5 && <Link to="/menu" className="prg__enlace">Elegir los días que faltan</Link>}
        </motion.section>

        {/* Lo que cubre el almuerzo frente a la meta del dia */}
        {con.length > 0 && meta &&
          <motion.section className="prg__card" variants={sube}>
            <div className="prg__cardCab"><h2>Tu almuerzo y tu meta</h2></div>
            <div className="prg__kcal">
              <span className="prg__anillo">
                <svg viewBox="0 0 120 120" role="img" aria-label={`${Math.round(prom('kcal'))} de ${Math.round(meta.bmr)} calorías`}>
                  <circle cx="60" cy="60" r="52" />
                  <motion.circle cx="60" cy="60" r="52" className="is-on" transform="rotate(-90 60 60)" strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pctKcal) }} transition={{ ...resorte.suave, delay: 0.2 }} />
                </svg>
                <span><b><Cuenta hasta={pctKcal * 100} /></b>%</span>
              </span>
              <p>Tu almuerzo cubre el <b>{Math.round(pctKcal * 100)}%</b> de las {miles(meta.bmr)} kcal que necesitas al día. El resto va en tu desayuno, tu cena y lo que piques.</p>
            </div>
          </motion.section>}

        {!hist && <Peso />}

        {hist?.favoritos?.length > 0 &&
          <motion.section className="prg__card" variants={sube}>
            <div className="prg__cardCab prg__cardCab--izq"><h2>Tus favoritos</h2><span className="prg__sello prg__sello--coral">TOP {hist.favoritos.length}</span></div>
            <ol className="prg__favs">
              {hist.favoritos.map((f, i) => (
                <motion.li key={f.nombre} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...resorte.entra, delay: i * 0.07 }}>
                  <b className={i === 0 ? 'is-uno' : ''}>{i + 1}</b>
                  <span><strong>{f.nombre}</strong><small>Lo pediste {f.veces} {f.veces === 1 ? 'vez' : 'veces'}</small></span>
                </motion.li>
              ))}
            </ol>
          </motion.section>}
      </motion.div>
    </LayoutDasboard>
  );
}
