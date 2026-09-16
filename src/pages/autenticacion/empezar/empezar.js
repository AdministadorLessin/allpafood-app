import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

import MarcoAuth from './../../../components/auth/Marco/MarcoAuth';
import { API_URL } from '../../../config';
import './empezar.scss';

/* Los distritos a los que se reparte hoy, tomados de las direcciones activas.
   Es deliberado que la lista sea corta y real: prometer cobertura que no
   existe se paga con un cliente que paga y despues no recibe nada. */
const DISTRITOS = [
  'San Isidro', 'Santiago de Surco', 'Miraflores', 'San Miguel',
  'Pueblo Libre', 'San Borja', 'Jesús María', 'Magdalena del Mar',
  'Surquillo', 'Breña', 'La Victoria', 'Cercado de Lima', 'La Molina',
];

const WHATSAPP = '51955797697';

/* Cada objetivo dice a que plan apunta y con que idea. El id viaja tal cual
   al servidor, que es quien decide el plan recomendado. */
const OBJETIVOS = [
  { id: 'LOSE',    titulo: 'Bajar de peso',  lectura: 'Vamos por un déficit moderado, sin que pases hambre.' },
  { id: 'IMPROVE', titulo: 'Mantenerme',     lectura: 'Porciones parejas, para sostener lo que ya lograste.' },
  { id: 'GAIN',    titulo: 'Ganar masa',     lectura: 'Más proteína en cada plato, repartida en el día.' },
];

const soloDigitos = (v) => (v || '').replace(/\D/g, '');

export default function EmpezarPage() {

  const navigate = useNavigate();

  const [paso, setPaso] = useState(0);
  const [distrito, setDistrito] = useState('');
  const [fuera, setFuera] = useState(false);

  const [objetivo, setObjetivo] = useState('');
  const [sexo, setSexo] = useState('');
  const [edad, setEdad] = useState('');
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');

  const [planes, setPlanes] = useState(null);
  const [recomendado, setRecomendado] = useState(null);
  const [semana, setSemana] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const objetivoElegido = OBJETIVOS.find((o) => o.id === objetivo);
  const completo = objetivo && sexo && edad && peso && talla;

  /* Los platos reales de la semana que viene. Es la prueba mas barata que
     existe: nadie inventa "filete de pescado en costra de avena". */
  const traerSemana = () => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + ((8 - (dia === 0 ? 7 : dia)) % 7 || 7));
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);
    const f = (d) => d.toISOString().slice(0, 10);

    axios.get(`${API_URL}public/menu/schedule?startDate=${f(lunes)}&endDate=${f(viernes)}`)
      .then((r) => {
        const dias = r.data?.data ?? [];
        const platos = [];
        dias.forEach((d) => {
          const almuerzos = (d.menuTypeGroups || []).find((g) => g.type === 'lunch');
          const primero = almuerzos?.menuTypes?.[0]?.menu?.name;
          if (primero) platos.push(primero);
        });
        setSemana(platos.slice(0, 3));
      })
      .catch(() => setSemana([]));
  };

  const verMiPlan = () => {
    setCargando(true);
    setError('');
    axios.get(`${API_URL}public/plans?objective=${objetivo}`)
      .then((r) => {
        const datos = r.data?.data ?? r.data ?? {};
        setPlanes(datos.plans || []);
        setRecomendado(datos.recommendedPlanId ?? null);
        setPaso(2);
        traerSemana();
      })
      .catch(() => setError('No pudimos traer los planes. Intenta de nuevo.'))
      .finally(() => setCargando(false));
  };

  /* Las respuestas viajan al registro para no volver a preguntarlas. El
     perfil las vuelve a leer desde aqui cuando llega su turno. */
  const continuar = () => {
    try {
      window.localStorage.setItem('preregistro', JSON.stringify({
        distrito, objetivo, sexo,
        edad: soloDigitos(edad),
        peso: soloDigitos(peso),
        talla: soloDigitos(talla),
      }));
    } catch (e) { /* si el navegador no deja guardar, el registro pregunta de nuevo */ }
    navigate('/registro');
  };

  const plan = planes?.find((p) => p.id === recomendado) || planes?.[0];
  const comidasPorDia = plan?.benefits?.principalBenefits?.length || 1;
  const platosTotales = 20 * comidasPorDia;
  const porComida = plan ? (plan.price / platosTotales) : 0;

  /* ------------------------------------------------------------ pantallas */

  if (fuera) {
    return (
      <MarcoAuth fase="empezar" paso={0} volver={() => { setFuera(false); setDistrito(''); }}>
        <h1 className="afAuth__titular"><span className="t1">Todavía no,</span>pero queremos llegar</h1>
        <p className="afAuth__bajada">
          Por ahora repartimos en {DISTRITOS.length} distritos de Lima y {distrito} no
          está entre ellos. Escríbenos y te avisamos apenas abramos tu zona.
        </p>
        <a className="afBtn afBtn--mint empBtnLink"
           href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, quiero Allpa Food en ${distrito}`)}`}
           target="_blank" rel="noreferrer">
          Avísenme cuando lleguen
        </a>
        <p className="afAuth__pie">¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth
      fase="empezar"
      paso={paso}
      volver={paso > 0 ? () => setPaso(paso - 1) : undefined}
    >
      {paso === 0 && (
        <>
          <h1 className="afAuth__titular"><span className="t1">Empecemos,</span>¿a dónde te llevamos?</h1>
          <p className="afAuth__bajada">Antes de pedirte un solo dato, revisa si llegamos a tu zona.</p>

          <div className="empDistritos">
            {DISTRITOS.map((d) => (
              <button type="button" key={d}
                className={`empChip${distrito === d ? ' empChip--sel' : ''}`}
                onClick={() => setDistrito(d)}>{d}</button>
            ))}
            <button type="button"
              className={`empChip empChip--otro${distrito === 'otro' ? ' empChip--sel' : ''}`}
              onClick={() => setDistrito('otro')}>Otro distrito</button>
          </div>

          {distrito && distrito !== 'otro' && (
            <div className="empLectura">
              <b>Sí llegamos a {distrito}.</b> Repartimos de lunes a viernes, entre 11:00 y 2:00.
            </div>
          )}

          <motion.button type="button" className="afBtn afBtn--mint"
            disabled={!distrito}
            onClick={() => (distrito === 'otro' ? setFuera(true) : setPaso(1))}>
            Continuar
          </motion.button>
          <p className="afAuth__pie">¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
        </>
      )}

      {paso === 1 && (
        <>
          <h1 className="afAuth__titular"><span className="t1">Tres preguntas,</span>y te decimos cuál es tu plan</h1>

          <div className="empPregunta">¿Qué quieres lograr?</div>
          <div className="empOps">
            {OBJETIVOS.map((o) => (
              <button type="button" key={o.id}
                className={`empChip${objetivo === o.id ? ' empChip--sel' : ''}`}
                onClick={() => setObjetivo(o.id)}>{o.titulo}</button>
            ))}
          </div>
          {objetivoElegido && <div className="empLectura">{objetivoElegido.lectura}</div>}

          <div className="empPregunta">¿Cuál es tu sexo de nacimiento?</div>
          <div className="empOps">
            <button type="button" className={`empChip${sexo === 'F' ? ' empChip--sel' : ''}`} onClick={() => setSexo('F')}>Mujer</button>
            <button type="button" className={`empChip${sexo === 'M' ? ' empChip--sel' : ''}`} onClick={() => setSexo('M')}>Hombre</button>
          </div>

          <div className="empPregunta">Tus medidas</div>
          <div className="empMedidas">
            <label className="empCampo"><span>Edad</span>
              <input type="tel" inputMode="numeric" value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="34" />
            </label>
            <label className="empCampo"><span>Peso (kg)</span>
              <input type="tel" inputMode="numeric" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="64" />
            </label>
            <label className="empCampo"><span>Talla (cm)</span>
              <input type="tel" inputMode="numeric" value={talla} onChange={(e) => setTalla(e.target.value)} placeholder="163" />
            </label>
          </div>
          <p className="empNota">Con esto la cocina calcula tus porciones. Nada de esto se publica.</p>

          {error && <div className="afAuth__error">{error}</div>}

          <motion.button type="button" className="afBtn afBtn--mint"
            disabled={!completo || cargando} onClick={verMiPlan}>
            {cargando ? 'Un momento…' : 'Ver mi plan'}
          </motion.button>
        </>
      )}

      {paso === 2 && plan && (
        <>
          <p className="empEtq">Tu plan recomendado</p>
          <h1 className="afAuth__titular"><span className="t1">{objetivoElegido?.titulo},</span>{plan.description}</h1>

          <div className="empPrecio">
            <span className="empPrecio__g">S/ {porComida.toFixed(2)}</span>
            <span className="empPrecio__t">por comida</span>
          </div>
          <p className="empNota">
            {platosTotales} comidas en 45 días ·{' '}
            {plan.previousPrice ? <s>S/ {Number(plan.previousPrice).toFixed(0)}</s> : null}{' '}
            <b>S/ {Number(plan.price).toFixed(0)}</b>
          </p>

          <div className="empLectura"><b>Tú eliges.</b> Tres opciones cada día, no un táper sorpresa.</div>

          {semana.length > 0 && (
            <div className="empPlatos">
              <span className="empPlatos__t">La semana que viene</span>
              {semana.map((p, i) => <span key={i}>{p}</span>)}
            </div>
          )}

          <div className="empLectura">
            Incluye <b>Allpa+</b>: 20% en certificaciones, 15% en terapia física,
            10% en gimnasios, +100 cursos gratis. Y orientación nutricional sin costo.
          </div>

          <motion.button type="button" className="afBtn afBtn--mint" onClick={continuar}>
            Lo quiero
          </motion.button>
          <p className="afAuth__pie">¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
        </>
      )}
    </MarcoAuth>
  );
}
