import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import MarcoAuth, { Accion } from './../../../components/auth/Marco/MarcoAuth';
import platoFoto from '../../../assets/img/ingreso-plato.jpg';
import './EmpezarNativo.scss';

/**
 * Las tres primeras pantallas del registro, dentro del app.
 *
 * Es la misma logica de empezar.js —los datos, las llamadas y lo que se
 * guarda para el registro vienen de alli— con pantallas de app: el boton
 * principal fijo abajo, al alcance del pulgar; cada paso entra deslizandose; y
 * el plan en una tarjeta que dice que llega cada dia. En la web siguen las
 * pantallas de siempre.
 */

/* Lo que trae cada plan, en palabras del cliente. El servidor lo manda como
   principalBenefits y extraBenefits; antes la pantalla solo decia "20
   comidas" y nadie sabia si eso incluia el snack o el refresco. */
const QUE_TRAE = {
  breakfast: { txt: 'Desayuno', clase: 'sol' },
  lunch: { txt: 'Almuerzo', clase: 'menta' },
  dinner: { txt: 'Cena', clase: 'cielo' },
  snacks: { txt: 'Snack de media tarde', clase: 'crema' },
  drinks: { txt: 'Refresco', clase: 'lila' },
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
  pin: ['M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z', 'M12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],
  lupa: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-3.5-3.5'],
  check: 'M5 12.5l4.5 4.5L19 7.5',
  moto: ['M3 7h11v9H3z', 'M14 10h4l3 3v3h-7', 'M7 15.7a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z', 'M17 15.7a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z'],
  flecha: 'M5 12h14M13 6l6 6-6 6',
  candado: ['M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  chispa: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
  cubiertos: D_CUBIERTOS(),
  regalo: ['M20 12v9H4v-9', 'M2 7h20v5H2z', 'M12 21V7', 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z', 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'],
  whatsapp: 'M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5z',
  LOSE: 'M12 22c4 0 7-2.8 7-7 0-4-3-6.5-4.5-9-.6 2.2-1.8 3.4-3 4-.2-2.6-1.5-5-3.5-7C8 6.5 5 9.5 5 15c0 4.2 3 7 7 7z',
  IMPROVE: 'M12 21s-7.5-4.6-9.2-9.3C1.6 8.4 3.8 5 7.2 5c2 0 3.6 1.2 4.8 3 1.2-1.8 2.8-3 4.8-3 3.4 0 5.6 3.4 4.4 6.7C19.5 16.4 12 21 12 21z',
  GAIN: 'M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11',
};
function D_CUBIERTOS() { return ['M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', 'M7 2v20', 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7']; }
const ICO_TRAE = {
  breakfast: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z',
  lunch: D_CUBIERTOS(),
  dinner: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
  snacks: ['M12 20.9c-3.5 0-7-3.3-7-8.2C5 8.5 7.7 6 10 6c1 0 1.6.4 2 .9.4-.5 1-.9 2-.9 2.3 0 5 2.5 5 6.7 0 4.9-3.5 8.2-7 8.2z', 'M12 6V3.5c0-.8.7-1.5 1.5-1.5'],
  drinks: ['M5 3h14l-1.5 17a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8z', 'M5.5 9h13'],
};

/* Cada paso entra desde el lado hacia donde se avanza: hacia adelante desde
   la derecha, al volver desde la izquierda. Solo se mueve y aparece, que es lo
   unico que el telefono anima sin recalcular la pantalla. */
const Paso = ({ id, dir, children }) => (
  <motion.div
    key={id}
    initial={{ x: dir * 36, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.3, ease: [0.2, 0.9, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

export default function EmpezarNativo(p) {
  const { paso, setPaso } = p;
  const [dir, setDir] = useState(1);
  const [busca, setBusca] = useState('');

  const ir = (n) => { setDir(n > paso ? 1 : -1); setPaso(n); };

  /* Abrir el registro siempre arriba: al pasar de paso con la pantalla
     bajada, el titular nuevo quedaba fuera de la vista. */
  useEffect(() => { window.scrollTo(0, 0); }, [paso, p.fuera]);

  /* ------------------------------------------------------ fuera de zona */
  if (p.fuera) {
    return (
      <MarcoAuth fase="empezar" paso={0} volver={() => { p.setFuera(false); p.setDistrito(''); }}>
        <Paso id="fuera" dir={1}>
          <div className="empN__ico"><Ico d={D.pin} /></div>
          <h1 className="empN__h">Todavía no, <em>pero queremos llegar</em></h1>
          <p className="empN__b">
            Por ahora repartimos en {p.distritos.length} distritos de Lima y el tuyo no
            está entre ellos. Escríbenos y te avisamos apenas abramos tu zona.
          </p>
        </Paso>
        <Accion>
          <a className="afBtn afBtn--mint empN__btnLink"
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
    const filtro = busca.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const lista = p.distritos.filter((d) =>
      !filtro || d.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(filtro));
    const elegido = p.distrito && p.distrito !== 'otro';

    return (
      <MarcoAuth fase="empezar" paso={0} volver={volver}>
        <Paso id="zona" dir={dir}>
          <div className="empN__ico"><Ico d={D.pin} /></div>
          <h1 className="empN__h">¿A dónde te <em>llevamos?</em></h1>
          <p className="empN__b">Revisa si llegamos a tu zona antes de pedirte un solo dato.</p>

          <label className="empN__busca">
            <Ico d={D.lupa} />
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
                   placeholder="Busca tu distrito" aria-label="Busca tu distrito" />
          </label>

          <div className="empN__chips">
            {lista.map((d) => (
              <button type="button" key={d}
                className={`empN__chip${p.distrito === d ? ' is-on' : ''}`}
                onClick={() => p.setDistrito(d)}>
                {p.distrito === d && <span className="empN__chipCheck"><Ico d={D.check} /></span>}
                {d}
              </button>
            ))}
            <button type="button"
              className={`empN__chip empN__chip--otro${p.distrito === 'otro' ? ' is-on' : ''}`}
              onClick={() => p.setDistrito('otro')}>Otro distrito</button>
          </div>
        </Paso>

        <Accion>
          {elegido && (
            <motion.div className="empN__vidrio" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, ease: [0.2, 0.9, 0.2, 1] }} key={p.distrito}>
              <span className="empN__cuad empN__cuad--menta"><Ico d={D.moto} /></span>
              <span>
                <b>Sí llegamos a {p.distrito}</b>
                <small>De lunes a viernes, entre las {p.reparto.desde} y la {p.reparto.hasta}</small>
              </span>
            </motion.div>
          )}
          <button type="button" className="afBtn afBtn--mint" disabled={!p.distrito}
            onClick={() => (p.distrito === 'otro' ? p.setFuera(true) : ir(1))}>
            Continuar
          </button>
          <p className="empN__pie">¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
        </Accion>
      </MarcoAuth>
    );
  }

  /* ------------------------------------------------------ 2 · el objetivo */
  if (paso === 1) {
    return (
      <MarcoAuth fase="empezar" paso={1} volver={volver}>
        <Paso id="objetivo" dir={dir}>
          <h1 className="empN__h">Tres preguntas y te decimos <em>tu plan</em></h1>

          <p className="empN__q">¿Qué quieres lograr?</p>
          <div className="empN__metas">
            {p.objetivos.map((o) => (
              <button type="button" key={o.id}
                className={`empN__meta empN__meta--${o.id}${p.objetivo === o.id ? ' is-on' : ''}`}
                onClick={() => p.setObjetivo(o.id)}>
                {p.objetivo === o.id && <span className="empN__metaCheck"><Ico d={D.check} /></span>}
                <span className="empN__metaIco"><Ico d={D[o.id]} /></span>
                <span>{o.titulo}</span>
              </button>
            ))}
          </div>
          {p.objetivoElegido && <p className="empN__lectura">{p.objetivoElegido.lectura}</p>}

          <p className="empN__q">Sexo de nacimiento</p>
          <div className="empN__lados" role="radiogroup" aria-label="Sexo de nacimiento">
            {[['F', 'Mujer'], ['M', 'Hombre']].map(([v, t]) => (
              <button type="button" key={v} role="radio" aria-checked={p.sexo === v}
                className={p.sexo === v ? 'is-on' : undefined} onClick={() => p.setSexo(v)}>{t}</button>
            ))}
          </div>

          <p className="empN__q">Tus medidas</p>
          <div className="empN__medidas">
            {[
              ['edad', 'Edad', 'años', 'Ej. 30', p.edad, p.setEdad],
              ['peso', 'Peso', 'kg', 'Ej. 65', p.peso, p.setPeso],
              ['talla', 'Talla', 'cm', 'Ej. 165', p.talla, p.setTalla],
            ].map(([id, txt, unidad, ej, val, set]) => (
              <label className="empN__medida" key={id}>
                <span>{txt}</span>
                <input type="tel" inputMode="numeric" maxLength={3} value={val}
                       onChange={(e) => set(e.target.value.replace(/\D/g, ''))} placeholder={ej} />
                <em>{unidad}</em>
              </label>
            ))}
          </div>
          <p className="empN__nota"><Ico d={D.candado} />Con esto la cocina calcula tus porciones. Nadie más lo ve.</p>

          {p.error && <div className="afAuth__error">{p.error}</div>}
        </Paso>

        <Accion>
          <button type="button" className="afBtn afBtn--mint empN__conFlecha"
            disabled={!p.completo || p.cargando} onClick={p.verMiPlan}>
            {p.cargando ? 'Un momento…' : <>Ver mi plan <Ico d={D.flecha} /></>}
          </button>
        </Accion>
      </MarcoAuth>
    );
  }

  /* ------------------------------------------------------ 3 · el plan */
  const plan = p.plan;
  if (!plan) return null;
  const trae = queTrae(plan);
  const resumen = (pl) => {
    const t = queTrae(pl).filter((x) => x.clave !== 'drinks').map((x) => x.txt);
    return t.length > 1 ? `${t.slice(0, -1).join(', ')} y ${t[t.length - 1].toLowerCase()}` : t[0] || '';
  };

  return (
    <MarcoAuth fase="empezar" paso={2} volver={volver}>
      <Paso id="plan" dir={dir}>
        <motion.div className="empN__plan" key={plan.id}
          initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <img className="empN__planFoto" src={platoFoto} alt="" />
          <div className="empN__planVelo" />
          <div className="empN__planTxt">
            <span className={`empN__etq${p.esRecomendado ? '' : ' empN__etq--otro'}`}>
              <Ico d={D.chispa} />{p.esRecomendado ? (PARA[p.objetivoElegido?.id] || 'Tu plan recomendado') : 'Otra opción para ti'}
            </span>
            <p className="empN__planNom">{plan.description}</p>
            <p className="empN__precio"><b>S/ {p.porComida.toFixed(2)}</b> por comida</p>
            <p className="empN__total">
              20 días de entrega en 45 días ·{' '}
              {plan.previousPrice ? <s>S/ {Number(plan.previousPrice).toFixed(0)}</s> : null}{' '}
              <b>S/ {Number(plan.price).toFixed(0)}</b>
            </p>
            <p className="empN__trae__t">Cada día te llega</p>
            <div className="empN__trae">
              {trae.map((x) => (
                <span key={x.clave}><i className={`empN__trae--${x.clase}`}><Ico d={ICO_TRAE[x.clave]} /></i>{x.txt}</span>
              ))}
            </div>
          </div>
          <div className="empN__eliges">
            <span className="empN__cuad empN__cuad--menta"><Ico d={D.cubiertos} /></span>
            <span><b>Tú eliges.</b> Tres opciones cada día</span>
          </div>
        </motion.div>

        {p.alternativas.length > 0 && (
          <>
            <p className="empN__seccion">Otros planes</p>
            <div className="empN__otros">
              {p.alternativas.map((o) => (
                <button type="button" key={o.id} className="empN__otro" onClick={() => p.setMirando(o.id)}>
                  <span className="empN__otroTxt">
                    <b>{o.description}{o.id === p.recomendado && <em>Recomendado</em>}</b>
                    <small>{resumen(o)} · S/ {o.porComida.toFixed(2)} por comida</small>
                  </span>
                  <span className={`empN__dif${o.diferencia > 0 ? '' : ' empN__dif--menos'}`}>
                    {o.diferencia > 0 ? `+ S/ ${o.diferencia}` : `− S/ ${Math.abs(o.diferencia)}`}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {p.semana.length > 0 && (
          <>
            <p className="empN__seccion">La semana que viene</p>
            <div className="empN__semana">
              {p.semana.map((s, i) => <span key={i}><Ico d={D.cubiertos} />{s}</span>)}
            </div>
          </>
        )}

        <div className="empN__vidrio empN__vidrio--suelto">
          <span className="empN__cuad empN__cuad--crema"><Ico d={D.regalo} /></span>
          <span className="empN__allpa">
            Incluye <b>Allpa+</b>: 20% en certificaciones, 15% en terapia física,
            10% en gimnasios, +100 cursos gratis. Y orientación nutricional sin costo.
          </span>
        </div>
      </Paso>

      <Accion>
        <button type="button" className="afBtn afBtn--mint" onClick={p.continuar}>
          Lo quiero · S/ {Number(plan.price).toFixed(0)}
        </button>
      </Accion>
    </MarcoAuth>
  );
}
