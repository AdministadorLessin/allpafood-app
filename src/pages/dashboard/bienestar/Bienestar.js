import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import Isotipo from '../../../components/ultil/Isotipo';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
import { cascada, sube, resorte } from '../../../movimiento';
import RodrigoCara from '../../../components/ultil/RodrigoCara/RodrigoCara';
import Lectura, { limpio, portada, minutos } from './Lectura';
import './Bienestar.scss';

/**
 * Bienestar: lo que el cliente gana por estar en Allpa mas alla del almuerzo.
 *
 * - Su semana: los cinco almuerzos, con los dias reales de sus pedidos.
 * - Rodrigo, su asistente, bien a la vista.
 * - Los habitos de hoy. "Almorzar con Allpa" se marca solo cuando llega el
 *   pedido; los otros los marca el cliente y se guardan en su telefono.
 * - Las lecturas y recetas del equipo. Hoy salen del blog; cuando se
 *   administren desde el panel solo cambia de donde se leen (LECTURAS).
 */
/* Van por nuestro servidor y no directo al blog: desde el iPhone el blog
   rechaza el origen capacitor:// y la seccion no aparecia. */
const LECTURAS = `${API_URL}public/lecturas/posts`;
const CATEGORIAS = `${API_URL}public/lecturas/categorias`;

const Ico = ({ d, w = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const I = {
  ir: 'M9 6l6 6-6 6',
  flecha: ['M5 12h14', 'M13 6l6 6-6 6'],
  check: 'M5 12l5 5 9-10',
  plato: ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 15.500a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7z'],
  agua: 'M12 3.500c3 3.700 5.500 6.700 5.500 10a5.500 5.500 0 0 1-11 0c0-3.300 2.500-6.300 5.500-10z',
  mover: ['M13 5.500a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3z', 'M7 21l3-6-1.500-4.500L12 8l3 3 3 1', 'M9.500 10.500 7 12v3', 'M13 15l2 2v4'],
  luna: 'M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z',
};

/* Los habitos que marca el cliente viven en su telefono, un registro por dia. */
const HOY = moment().format('YYYY-MM-DD');
const leerHabitos = () => {
  try { const g = JSON.parse(localStorage.getItem('af_habitos') || 'null'); return g?.dia === HOY ? g : { dia: HOY, agua: 0, mover: false, cena: false }; }
  catch (e) { return { dia: HOY, agua: 0, mover: false, cena: false }; }
};
const VASOS = 6;
/* Cada lectura llega desde la derecha, girando un poco, y se acomoda. */
const llega = {
  oculto: { opacity: 0, x: 44, rotate: 2.5 },
  visible: { opacity: 1, x: 0, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

function Habito({ icono, titulo, nota, hecho, alTocar, fijo, avance, cuenta }) {
  const Caja = fijo ? 'div' : 'button';
  const conAvance = typeof avance === 'number';
  const R = 13; const C = 2 * Math.PI * R;
  return (
    <Caja className="bie__habito" {...(fijo ? {} : { type: 'button', onClick: alTocar, 'aria-pressed': hecho })}>
      {/* El circulo del dibujo se llena desde abajo, como un vaso. */}
      <span className="bie__habitoIc" aria-hidden="true">
        {conAvance && <motion.i className="bie__lleno" initial={false} animate={{ height: `${avance * 100}%` }} transition={resorte.suave} />}
        <motion.span key={conAvance ? cuenta : 'fijo'} initial={conAvance ? { scale: 1.35, rotate: -12 } : false} animate={{ scale: 1, rotate: 0 }} transition={resorte.toque}>
          <Ico d={icono} />
        </motion.span>
      </span>
      <span className="bie__habitoTxt"><b>{titulo}</b><small>{nota}</small></span>
      <span className={`bie__marca${hecho ? ' is-on' : ''}${conAvance && !hecho ? ' bie__marca--anillo' : ''}`} aria-hidden="true">
        {conAvance && !hecho &&
          <svg viewBox="0 0 30 30">
            <circle cx="15" cy="15" r={R} className="bie__anilloFondo" />
            <motion.circle cx="15" cy="15" r={R} className="bie__anilloOn" transform="rotate(-90 15 15)" strokeDasharray={C}
              initial={false} animate={{ strokeDashoffset: C * (1 - avance) }} transition={resorte.suave} />
          </svg>}
        <AnimatePresence initial={false} mode="popLayout">
          {hecho
            ? <motion.span key="ok" initial={{ scale: 0.2, opacity: 0, rotate: -40 }} animate={{ scale: [0.2, 1.3, 1], opacity: 1, rotate: 0 }} exit={{ scale: 0.3, opacity: 0 }} transition={{ duration: 0.4 }}><Ico d={I.check} w={3.2} /></motion.span>
            : conAvance && cuenta > 0 &&
              <motion.b key={cuenta} className="bie__cuenta" initial={{ y: 8, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -8, opacity: 0 }} transition={resorte.toque}>{cuenta}</motion.b>}
        </AnimatePresence>
      </span>
    </Caja>
  );
}

export default function BienestarPage() {
  const { token } = useAuthContext();
  const [ordenes, setOrdenes] = useState(null);
  const [lecturas, setLecturas] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState(0);
  const [abierta, setAbierta] = useState(null);
  const [habitos, setHabitos] = useState(leerHabitos);

  useEffect(() => {
    axios.get(`${API_URL}dashboard/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setOrdenes(r.data?.data || [])).catch(() => setOrdenes([]));
    /* El servidor envuelve la respuesta en {code, message, data}. */
    const lista = (r) => (Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : []);
    axios.get(LECTURAS).then((r) => setLecturas(lista(r))).catch(() => setLecturas([]));
    axios.get(CATEGORIAS).then((r) => setCategorias(lista(r))).catch(() => {});
  }, [token]);

  const guardar = (cambio) => setHabitos((h) => {
    const n = { ...h, ...cambio };
    try { localStorage.setItem('af_habitos', JSON.stringify(n)); } catch (e) { /* sin espacio */ }
    return n;
  });

  /* --- Tu semana: lunes a viernes con tus pedidos de verdad --- */
  const lunes = moment().startOf('isoWeek');
  const semana = [0, 1, 2, 3, 4].map((i) => {
    const fecha = lunes.clone().add(i, 'days');
    const con = (ordenes || []).some((o) => moment(o.date).isSame(fecha, 'day'));
    return { fecha, con, nombre: fecha.format('ddd').replace('.', '') };
  });
  const van = semana.filter((d) => d.con).length;
  const faltan = semana.filter((d) => !d.con && d.fecha.isAfter(moment(), 'day')).map((d) => d.fecha.format('dddd'));
  const pedidoHoy = (ordenes || []).find((o) => moment(o.date).isSame(moment(), 'day'));
  const llego = pedidoHoy?.status === 'C';
  const hechos = [llego, habitos.agua >= VASOS, habitos.mover, habitos.cena].filter(Boolean).length;

  /* --- Lecturas --- */
  const nombreDe = (p) => categorias.find((c) => (p.categories || []).includes(c.id))?.name || 'Lectura';
  const usadas = useMemo(() => categorias.filter((c) => (lecturas || []).some((p) => (p.categories || []).includes(c.id))), [categorias, lecturas]);
  const lista = (lecturas || []).filter((p) => !filtro || (p.categories || []).includes(filtro));

  return (
    <LayoutDasboard claseStyle="nCaja">
      <motion.div className="nPant bie" variants={cascada(0.06)} initial="oculto" animate="visible">
        <span className="bie__menta" aria-hidden="true" />

        <motion.header variants={sube}>
          <span className="bie__sobre"><Isotipo size={18} />Bienestar</span>
          <h1>Come bien,<br />vive mejor</h1>
          <p className="bie__bajada">Tu semana, tus hábitos y algo nuevo para leer.</p>
        </motion.header>

        {/* Tu semana */}
        <motion.div variants={sube} whileTap={{ scale: 0.985 }} transition={resorte.toque}>
          <Link to="/menu" className="bie__reto" onClick={() => vibrar.toque()}>
            <span className="bie__et bie__et--claro">TU SEMANA</span>
            <b className="bie__retoTit">{van >= 5 ? 'Semana completa' : 'Cinco almuerzos esta semana'}</b>
            <span className="bie__retoDias" aria-hidden="true">
              {semana.map((d, i) => (
                <motion.i key={d.nombre} className={d.con ? 'is-on' : ''}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...resorte.entra, delay: 0.25 + i * 0.05 }}>
                  {d.nombre.charAt(0).toUpperCase() + d.nombre.slice(1)}
                </motion.i>
              ))}
            </span>
            <span className="bie__retoPie">
              <span>{ordenes === null ? 'Revisando tu semana…'
                : van >= 5 ? 'Tienes almuerzo los cinco días.'
                : faltan.length ? <>Vas <b>{van} de 5</b>. Todavía puedes pedir {faltan.join(' y ')}.</>
                : <>Esta semana fueron <b>{van} de 5</b>.</>}</span>
              <Ico d={I.flecha} w={2.4} />
            </span>
          </Link>
        </motion.div>

        {/* Rodrigo */}
        <motion.div variants={sube} whileTap={{ scale: 0.985 }} transition={resorte.toque}>
          <Link to="/rodrigo" className="bie__rodrigo" onClick={() => vibrar.toque()}>
            <RodrigoCara size={64} />
            <span className="bie__rodrigoTxt">
              <span className="bie__et">TU ASISTENTE</span>
              <b>Pregúntale a Rodrigo</b>
              <small>Qué te conviene pedir, cómo va tu entrega o cualquier duda de tu plan.</small>
            </span>
            <span className="bie__rodrigoIr" aria-hidden="true"><Ico d={I.flecha} w={2.4} /></span>
          </Link>
        </motion.div>

        {/* Habitos */}
        <motion.section variants={sube}>
          <div className="bie__sec"><h2>Hábitos de hoy</h2><span>{hechos} de 4</span></div>
          <div className="bie__habitos">
            <Habito fijo icono={I.plato} titulo="Almorzar con Allpa" hecho={llego}
              nota={llego ? 'Tu almuerzo de hoy ya llegó' : 'Se marca solo cuando llega tu pedido'} />
            <Habito icono={I.agua} titulo={`Tomar ${VASOS} vasos de agua`} hecho={habitos.agua >= VASOS}
              nota={habitos.agua >= VASOS ? 'Listo por hoy' : habitos.agua === 0 ? 'Toca cada vez que tomes uno' : `Vas ${habitos.agua} de ${VASOS}`}
              avance={Math.min(habitos.agua / VASOS, 1)} cuenta={habitos.agua}
              alTocar={() => {
                const n = habitos.agua >= VASOS ? 0 : habitos.agua + 1;
                if (n === VASOS) vibrar.exito(); else vibrar.toque();
                guardar({ agua: n });
              }} />
            <Habito icono={I.mover} titulo="Moverte 20 minutos" nota="Caminar también cuenta" hecho={habitos.mover}
              alTocar={() => { vibrar.toque(); guardar({ mover: !habitos.mover }); }} />
            <Habito icono={I.luna} titulo="Cenar ligero" nota="Antes de las 9 p.m." hecho={habitos.cena}
              alTocar={() => { vibrar.toque(); guardar({ cena: !habitos.cena }); }} />
          </div>
        </motion.section>

        {/* Lecturas y recetas */}
        {(lecturas === null || lecturas.length > 0) &&
          <motion.section variants={sube}>
            <div className="bie__sec"><h2>Para ti</h2>{lista.length > 0 && <span>{lista.length} {lista.length === 1 ? 'lectura' : 'lecturas'}</span>}</div>
            {usadas.length > 1 &&
              <div className="bie__chips" role="group" aria-label="Temas">
                {[{ id: 0, name: 'Todo' }, ...usadas].map((c) => (
                  <button type="button" key={c.id} aria-pressed={filtro === c.id} className={filtro === c.id ? 'is-on' : ''}
                    onClick={() => { vibrar.toque(); setFiltro(c.id); }}>{limpio(c.name)}</button>
                ))}
              </div>}

            {lecturas === null && <span className="bie__espera" aria-hidden="true" />}

            {/* Las lecturas van como las tarjetas del Inicio: una fila que se
                desliza con el dedo, cada una con su foto a todo el alto, el
                tema como sello y el titular encima. Llegan desde la derecha. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={filtro} className="bie__carril" variants={cascada(0.08, 0.05)} initial="oculto" animate="visible" exit={{ opacity: 0 }}>
                {lista.map((p, i) => (
                  <motion.button type="button" key={p.id} className="bie__lectura" variants={llega}
                    whileTap={{ scale: 0.97 }} transition={resorte.toque}
                    onClick={() => { vibrar.toque(); setAbierta(p); }}>
                    {portada(p)
                      ? <img src={portada(p)} alt="" loading={i > 1 ? 'lazy' : undefined} />
                      : <span className="bie__sinFoto" aria-hidden="true"><Isotipo size={44} /></span>}
                    <span className="bie__lecturaVelo" aria-hidden="true" />
                    <span className="bie__lecturaArriba">
                      <span className="bie__sello">{limpio(nombreDe(p))}</span>
                      <span className="bie__tiempo">{minutos(p)} min</span>
                    </span>
                    <span className="bie__lecturaBajo">
                      <b>{limpio(p.title?.rendered)}</b>
                      <span className="bie__lecturaPie"><small>{i === 0 && moment().diff(moment(p.date), 'days') <= 14 ? 'Nuevo' : 'Leer'}</small><i aria-hidden="true"><Ico d={I.flecha} w={2.4} /></i></span>
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.section>}

        <motion.div variants={sube}>
          <Link to="/beneficios" className="bie__allpa">
            <span><span className="bie__et">ALLPA+</span><b>Descuentos por ser cliente</b></span>
            <Ico d={I.ir} w={2.4} />
          </Link>
        </motion.div>
      </motion.div>

      <Lectura articulo={abierta} categoria={abierta ? limpio(nombreDe(abierta)) : ''} alCerrar={() => setAbierta(null)} />
    </LayoutDasboard>
  );
}
