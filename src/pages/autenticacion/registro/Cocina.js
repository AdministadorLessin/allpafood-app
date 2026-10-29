import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

import MarcoAuth, { Accion } from './../../../components/auth/Marco/MarcoAuth';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
import '../empezar/EmpezarNativo.scss';
import './Cocina.scss';

/**
 * "Para tu cocina": el ultimo paso del alta en el app, despues de pagar y de
 * dar la direccion.
 *
 * Son las preguntas del cuestionario viejo que el registro nuevo no hacia y
 * que la cocina si usa: lo que no come, si el refresco va con azucar y cuanto
 * se mueve. Van despues del pago a proposito: antes de pagar cada pregunta de
 * mas es un cliente que se va, y despues ya es cliente. Se pueden saltar.
 *
 * Se guardan con el mismo cuestionario del registro, sumando estas respuestas
 * a las que dio al empezar (preregistro), para no pisar ninguna.
 */

const RESTRICCIONES = ['Sin lactosa', 'Sin gluten', 'Vegetariano', 'Sin cerdo', 'Sin mariscos', 'Sin picante'];

/* Los mismos codigos que el cuestionario viejo: de ellos sale el calculo de
   calorias. */
const RUTINAS = [
  { v: 'A', t: 'Sedentario', d: 'Paso el día sentado y casi no camino' },
  { v: 'B', t: 'Trabajo de oficina', d: 'Sentado la mayor parte del día, camino algo' },
  { v: 'C', t: 'Trabajo activo', d: 'De pie o moviéndome buena parte del día' },
  { v: 'D', t: 'Entreno fuerte', d: 'Gimnasio o deporte 5 veces por semana' },
  { v: 'E', t: 'Atleta profesional', d: 'Entreno todos los días, a veces dos veces' },
  { v: 'F', t: 'Atleta de resistencia', d: 'Fondo, ciclismo o triatlón' },
];
const DIAS = [0, 1, 2, 3, 4, 5, 6, 7];
const HORAS = [{ v: 0.5, t: '½ h' }, { v: 1, t: '1 h' }, { v: 1.5, t: '1½ h' }, { v: 2, t: '2 h o más' }];
const INTENSIDAD = [{ v: 'L', t: 'Leve' }, { v: 'M', t: 'Moderada' }, { v: 'F', t: 'Fuerte' }];

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const OLLA = ['M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z', 'M2 10h20', 'M9 6c0-1 1-2 3-2s3 1 3 2', 'M12 4V2'];
const CHECK = 'M5 12.5l4.5 4.5L19 7.5';

const terminarAlta = () => {
  try {
    window.localStorage.removeItem('af_alta');
    window.localStorage.removeItem('preregistro');
  } catch (e) { /* nada */ }
};

export default function CocinaPage() {
  const navigate = useNavigate();
  const { token } = useAuthContext();

  const [marcadas, setMarcadas] = useState([]);
  const [otra, setOtra] = useState('');
  const [azucar, setAzucar] = useState(true);
  const [rutina, setRutina] = useState('');
  const [dias, setDias] = useState(null);
  const [horas, setHoras] = useState(null);
  const [intensidad, setIntensidad] = useState('');
  const [guardando, setGuardando] = useState(false);

  const entrena = dias > 0;

  const alternar = (r) => {
    vibrar.toque();
    setMarcadas((m) => (m.includes(r) ? m.filter((x) => x !== r) : [...m, r]));
  };
  const elegir = (set, v) => { vibrar.toque(); set(v); };

  const entrar = () => {
    terminarAlta();
    vibrar.exito();
    navigate('/', { replace: true });
  };

  const guardar = () => {
    setGuardando(true);
    const cabecera = { headers: { Authorization: `Bearer ${token}` } };
    const restricciones = [...marcadas, otra.trim()].filter(Boolean).join(', ');

    let previo = null;
    try { previo = JSON.parse(window.localStorage.getItem('preregistro')); } catch (e) { previo = null; }

    /* Sin lo que respondio al empezar (otro telefono, datos borrados), solo se
       guarda lo de la cocina, que tiene su propio servicio. */
    const peticion = previo?.objetivo
      ? axios.put(`${API_URL}register/questionnaire`, {
          bornDate: Number.isFinite(parseInt(previo.edad, 10))
            ? `${new Date().getFullYear() - parseInt(previo.edad, 10)}-01-01` : null,
          district: previo.distrito || null,
          information: {
            gender: previo.sexo,
            nutritionalObjective: previo.objetivo,
            height: parseFloat(previo.talla),
            weight: parseFloat(previo.peso),
            sugar: azucar,
            alimentsRestrictions: restricciones,
            routine: rutina || 'C',
            trainingDays: dias ?? 0,
            trainingHours: entrena ? (horas ?? 1) : 0,
            trainingLevel: entrena ? (intensidad || 'M') : 'L',
            strengthTraining: false,
          },
        }, cabecera)
      : axios.patch(`${API_URL}profile/data/preferences`,
          { alimentsRestrictions: restricciones, sugar: azucar }, cabecera);

    /* Si no se pudo guardar, igual entra: son datos para afinar la cocina,
       no para dejar al cliente afuera de su plan recien pagado. */
    peticion.catch(() => {}).finally(entrar);
  };

  return (
    <MarcoAuth fase="cocina" paso={0} sinVolver>
      <motion.div initial={{ x: 36, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.9, 0.2, 1] }}>
        <div className="empN__ico"><Ico d={OLLA} /></div>
        <h1 className="empN__h">Para tu <em>cocina</em></h1>
        <p className="empN__b">Con esto armamos tus platos a tu medida. Te toma un minuto.</p>

        <p className="empN__q">¿Hay algo que no comes?</p>
        <div className="empN__chips cocN__chips">
          {RESTRICCIONES.map((r) => (
            <button type="button" key={r}
              className={`empN__chip${marcadas.includes(r) ? ' is-on' : ''}`} onClick={() => alternar(r)}>
              {marcadas.includes(r) && <span className="empN__chipCheck"><Ico d={CHECK} /></span>}
              {r}
            </button>
          ))}
        </div>
        <label className="cocN__otra">
          <input type="text" value={otra} onChange={(e) => setOtra(e.target.value)}
                 placeholder="Otra alergia o restricción" aria-label="Otra alergia o restricción" />
        </label>

        <p className="empN__q">Tu refresco</p>
        <div className="empN__lados" role="radiogroup" aria-label="Tu refresco">
          {[[true, 'Con azúcar'], [false, 'Sin azúcar']].map(([v, t]) => (
            <button type="button" key={t} role="radio" aria-checked={azucar === v}
              className={azucar === v ? 'is-on' : undefined} onClick={() => elegir(setAzucar, v)}>{t}</button>
          ))}
        </div>

        <p className="empN__q">¿Cómo es tu día?</p>
        <div className="cocN__rutinas">
          {RUTINAS.map((r) => (
            <button type="button" key={r.v}
              className={`cocN__rutina${rutina === r.v ? ' is-on' : ''}`} onClick={() => elegir(setRutina, r.v)}>
              <b>{r.t}</b><small>{r.d}</small>
            </button>
          ))}
        </div>

        <p className="empN__q">¿Cuántos días entrenas a la semana?</p>
        <div className="cocN__dias" role="radiogroup" aria-label="Días de entrenamiento">
          {DIAS.map((d) => (
            <button type="button" key={d} role="radio" aria-checked={dias === d}
              className={dias === d ? 'is-on' : undefined} onClick={() => elegir(setDias, d)}>{d}</button>
          ))}
        </div>

        {entrena && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <p className="empN__q">¿Cuánto dura cada entreno?</p>
            <div className="cocN__dias cocN__dias--4">
              {HORAS.map((h) => (
                <button type="button" key={h.v} className={horas === h.v ? 'is-on' : undefined}
                  onClick={() => elegir(setHoras, h.v)}>{h.t}</button>
              ))}
            </div>
            <p className="empN__q">¿Qué tan intenso?</p>
            <div className="cocN__dias cocN__dias--3">
              {INTENSIDAD.map((x) => (
                <button type="button" key={x.v} className={intensidad === x.v ? 'is-on' : undefined}
                  onClick={() => elegir(setIntensidad, x.v)}>{x.t}</button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <Accion>
        <button type="button" className="afBtn afBtn--mint" disabled={guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : 'Entrar a Allpa Food'}
        </button>
        <p className="afAuth__pie">
          <button type="button" className="cocN__saltar" onClick={entrar} disabled={guardando}>Saltar por ahora</button>
        </p>
      </Accion>
    </MarcoAuth>
  );
}
