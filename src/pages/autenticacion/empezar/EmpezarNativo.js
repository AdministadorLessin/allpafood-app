import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

import MarcoAuth, { Accion } from './../../../components/auth/Marco/MarcoAuth';
import platoFoto from '../../../assets/img/plan-plato.jpg';
import { vibrar } from '../../../nativo';
import { resorte } from '../../../movimiento';
import './EmpezarNativo.scss';

/**
 * Las tres primeras pantallas del registro, dentro del app.
 *
 * Es la misma logica de empezar.js —los datos, las llamadas y lo que se
 * guarda para el registro vienen de alli— con pantallas de app: el boton
 * principal fijo abajo, al alcance del pulgar; cada paso entra deslizandose
 * (lo hace el marco, MarcoAuth); y el plan en una tarjeta que dice que llega
 * cada dia. En la web siguen las pantallas de siempre.
 */

/* Lo que trae cada plan, en palabras del cliente. El servidor lo manda como
   principalBenefits y extraBenefits; antes la pantalla solo decia "20
   comidas" y nadie sabia si eso incluia el snack o el refresco. */
const QUE_TRAE = {
  breakfast: { txt: 'Desayuno' },
  lunch: { txt: 'Almuerzo' },
  dinner: { txt: 'Cena' },
  snacks: { txt: 'Snack de media tarde' },
  drinks: { txt: 'Refresco' },
};
const ORDEN = ['breakfast', 'lunch', 'snacks', 'dinner', 'drinks'];

const queTrae = (plan) => {
  const b = plan?.benefits || {};
  const todo = [...(b.principalBenefits || []), ...(b.extraBenefits || [])];
  return ORDEN.filter((k) => todo.includes(k)).map((k) => ({ clave: k, ...QUE_TRAE[k] }));
};

/* La meta, como etiqueta del plan recomendado. */
const PARA = { LOSE: 'Para bajar de peso', IMPROVE: 'Para mantenerte', GAIN: 'Para ganar masa' };

const Ico = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const D = {
  check: 'M5 12l5 5 9-10',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  sigue: 'M9 6l6 6-6 6',
};

const sinTildes = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* Una opcion de la lista: solo la elegida va enmarcada. */
const Opcion = ({ elegida, titulo, detalle, alElegir }) => (
  <button type="button" role="radio" aria-checked={elegida}
    className={`rg__opcion${elegida ? ' is-on' : ''}`} onClick={alElegir}>
    <span>
      <b>{titulo}</b>
      {detalle && <small>{detalle}</small>}
    </span>
    <span className="rg__marca" aria-hidden="true"><Ico d={D.check} strokeWidth="3.2" /></span>
  </button>
);

export default function EmpezarNativo(p) {
  const { paso, setPaso } = p;
  const quieto = useReducedMotion();
  const [busca, setBusca] = useState('');

  const ir = (n) => setPaso(n);

  /* Al elegir distrito, la respuesta ("si llegamos") queda debajo de la lista
     y del boton fijo: se sube sola a la vista. */
  const refSi = useRef(null);
  useEffect(() => {
    if (refSi.current) refSi.current.scrollIntoView({ block: 'nearest', behavior: quieto ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.distrito]);

  /* ------------------------------------------------------ fuera de zona */
  if (p.fuera) {
    return (
      <MarcoAuth fase="empezar" paso={0} clave="fuera" orden={1.5}
                 volver={() => { p.setFuera(false); p.setDistrito(''); }}>
        <h1 className="afAuth__titular">Todavía no, pero queremos llegar</h1>
        <p className="afAuth__bajada">
          Por ahora repartimos en {p.distritos.length} distritos de Lima y el tuyo no
          está entre ellos. Escríbenos y te avisamos apenas abramos tu zona.
        </p>
        <Accion>
          <a className="afBtn"
             href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent('Hola, quiero Allpa Food en mi distrito')}`}
             target="_blank" rel="noreferrer">
            Avísenme cuando lleguen
          </a>
        </Accion>
      </MarcoAuth>
    );
  }

  const volver = paso > 0 ? () => ir(paso - 1) : undefined;

  /* ------------------------------------------------------ 1 · la zona */
  if (paso === 0) {
    const filtro = sinTildes(busca.trim());
    const lista = p.distritos.filter((d) => !filtro || sinTildes(d).includes(filtro));
    const elegido = p.distrito && p.distrito !== 'otro';

    return (
      <MarcoAuth fase="empezar" paso={0} volver={volver}>
        <h1 className="afAuth__titular">¿A dónde te llevamos?</h1>
        <p className="afAuth__bajada">Revisa si llegamos a tu zona antes de pedirte un solo dato.</p>

        <label className="rg__campo empN__busca">
          <span>Tu distrito</span>
          <div>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
                   placeholder="Busca tu distrito" autoComplete="off" />
          </div>
        </label>

        <div className="rg__pildoras empN__chips">
          {lista.map((d) => (
            <button type="button" key={d} aria-pressed={p.distrito === d}
              className={`rg__pildora${p.distrito === d ? ' is-on' : ''}`}
              onClick={() => { vibrar.toque(); p.setDistrito(d); }}>
              {d}
            </button>
          ))}
          <button type="button" aria-pressed={p.distrito === 'otro'}
            className={`rg__pildora${p.distrito === 'otro' ? ' is-on' : ''}`}
            onClick={() => { vibrar.toque(); p.setDistrito('otro'); }}>Otro distrito</button>
        </div>
        {lista.length === 0 &&
          <p className="rg__nota">No está en la lista. Toca "Otro distrito" y te avisamos cuando lleguemos.</p>}

        {elegido && (
          <motion.div className="rg__si" key={p.distrito} role="status" ref={refSi}
            initial={{ y: quieto ? 0 : 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={resorte.entra}>
            <span><Ico d={D.check} strokeWidth="3.2" /></span>
            <span>
              <b>Sí llegamos a {p.distrito}</b>
              De lunes a viernes, entre las {p.reparto.desde} y la {p.reparto.hasta}
            </span>
          </motion.div>
        )}

        <Accion>
          <button type="button" className="afBtn" disabled={!p.distrito}
            onClick={() => (p.distrito === 'otro' ? p.setFuera(true) : ir(1))}>
            Continuar
          </button>
          <p className="afAuth__pie">¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
        </Accion>
      </MarcoAuth>
    );
  }

  /* ------------------------------------------------------ 2 · el objetivo */
  if (paso === 1) {
    return (
      <MarcoAuth fase="empezar" paso={1} volver={volver}>
        <h1 className="afAuth__titular">Tres preguntas y te decimos tu plan</h1>
        {/* Viene de marcar su direccion de visita: se le dice que ya la
            tenemos, para que entienda por que no se la pedimos. */}
        {p.direccionPrevia &&
          <p className="rg__suave">
            <b>Ya sabemos dónde llevártelo.</b>{' '}
            {[p.direccionPrevia.calle, p.direccionPrevia.distrito].filter(Boolean).join(' · ')}
          </p>}

        <p className="rg__q">¿Qué quieres lograr?</p>
        <div className="rg__opciones" role="radiogroup" aria-label="¿Qué quieres lograr?">
          {p.objetivos.map((o) => (
            <Opcion key={o.id} elegida={p.objetivo === o.id} titulo={o.titulo}
              detalle={p.objetivo === o.id ? o.lectura : null}
              alElegir={() => { vibrar.toque(); p.setObjetivo(o.id); }} />
          ))}
        </div>

        <p className="rg__q">Sexo de nacimiento</p>
        <div className="rg__pildoras rg__pildoras--dos" role="radiogroup" aria-label="Sexo de nacimiento">
          {[['F', 'Mujer'], ['M', 'Hombre']].map(([v, t]) => (
            <button type="button" key={v} role="radio" aria-checked={p.sexo === v}
              className={`rg__pildora${p.sexo === v ? ' is-on' : ''}`}
              onClick={() => { vibrar.toque(); p.setSexo(v); }}>{t}</button>
          ))}
        </div>

        <p className="rg__q">Tus medidas</p>
        <div className="rg__tres">
          {[
            ['edad', 'Edad', '30', p.edad, p.setEdad],
            ['peso', 'Peso (kg)', '65', p.peso, p.setPeso],
            ['talla', 'Talla (cm)', '165', p.talla, p.setTalla],
          ].map(([id, txt, ej, val, set]) => (
            <label className="rg__campo" key={id}>
              <span>{txt}</span>
              <div>
                <input type="tel" inputMode="numeric" maxLength={3} value={val}
                       onChange={(e) => set(e.target.value.replace(/\D/g, ''))} placeholder={ej} />
              </div>
            </label>
          ))}
        </div>
        <p className="rg__nota">Con esto la cocina calcula tus porciones. Nadie más lo ve.</p>

        {p.error && <div className="afAuth__error" role="alert">{p.error}</div>}

        <Accion>
          <button type="button" className="afBtn"
            disabled={!p.completo || p.cargando} onClick={p.verMiPlan}>
            {p.cargando ? 'Un momento…' : <>Ver mi plan <Ico d={D.flecha} strokeWidth="2.4" /></>}
          </button>
        </Accion>
      </MarcoAuth>
    );
  }

  /* ------------------------------------------------------ 3 · el plan */
  const plan = p.plan;
  /* Sin planes que mostrar (el servidor respondio vacio): antes la pantalla
     quedaba en blanco y sin salida. */
  if (!plan) {
    return (
      <MarcoAuth fase="empezar" paso={2} volver={volver}>
        <h1 className="afAuth__titular">No pudimos traer tu plan</h1>
        <p className="afAuth__bajada">
          Puede ser la conexión. Vuelve un paso y toca "Ver mi plan" otra vez.
        </p>
        <Accion>
          <button type="button" className="afBtn" onClick={volver}>Volver a intentar</button>
        </Accion>
      </MarcoAuth>
    );
  }
  const trae = queTrae(plan);
  const resumen = (pl) => {
    const t = queTrae(pl).filter((x) => x.clave !== 'drinks').map((x) => x.txt);
    return t.length > 1 ? `${t.slice(0, -1).join(', ')} y ${t[t.length - 1].toLowerCase()}` : t[0] || '';
  };

  return (
    <MarcoAuth fase="empezar" paso={2} volver={volver}>
      <h1 className="afAuth__titular">Este es tu plan</h1>

      {/* La tarjeta del plan: la foto de fondo, desenfocada y oscura (un
          desenfoque fijo sobre la imagen, no en vivo), y el precio encima. */}
      <motion.section className="empN__plan" key={plan.id}
        initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <img className="empN__planFoto" src={platoFoto} alt="" />
        <span className="empN__planVelo" aria-hidden="true" />
        <div className="empN__planTxt">
          <span className="empN__etq">
            {p.esRecomendado ? (PARA[p.objetivoElegido?.id] || 'Tu plan recomendado') : 'Otra opción para ti'}
          </span>
          <b className="empN__planNom">{plan.description}</b>
          <div className="empN__precio"><b>S/ {p.porComida.toFixed(2)}</b><span>por comida</span></div>
          <span className="empN__total">
            20 días de entrega en 45 días ·{' '}
            {plan.previousPrice ? <s>S/ {Number(plan.previousPrice).toFixed(0)}</s> : null}{' '}
            <b>S/ {Number(plan.price).toFixed(0)}</b>
          </span>
          <div className="empN__trae">
            {trae.map((x) => <span key={x.clave}>{x.txt}</span>)}
            <span>Tres opciones cada día</span>
          </div>
        </div>
      </motion.section>

      {p.alternativas.length > 0 && (
        <>
          <p className="rg__q">Otros planes</p>
          <div className="empN__otros">
            {p.alternativas.map((o) => (
              <button type="button" key={o.id} className="empN__otro" onClick={() => { vibrar.toque(); p.setMirando(o.id); }}>
                <span className="empN__otroTxt">
                  <b>{o.description}{o.id === p.recomendado && <em>Recomendado</em>}</b>
                  <small>{resumen(o)}</small>
                </span>
                <span className="empN__otroPrecio">
                  <b>S/ {o.porComida.toFixed(2)} por comida</b>
                  <small>{o.diferencia > 0 ? `+ S/ ${o.diferencia}` : `− S/ ${Math.abs(o.diferencia)}`}</small>
                </span>
                <Ico d={D.sigue} strokeWidth="2.4" />
              </button>
            ))}
          </div>
        </>
      )}

      {p.semana.length > 0 && (
        <>
          <p className="rg__q">La semana que viene</p>
          <p className="empN__semana">{p.semana.join(' · ')}</p>
        </>
      )}

      <p className="rg__suave">
        Incluye <b>Allpa+</b>: 20% en certificaciones, 15% en terapia física,
        10% en gimnasios y +100 cursos gratis. Y orientación nutricional sin costo.
      </p>

      <Accion>
        <button type="button" className="afBtn" onClick={p.continuar}>
          Lo quiero · S/ {Number(plan.price).toFixed(0)}
        </button>
      </Accion>
    </MarcoAuth>
  );
}
