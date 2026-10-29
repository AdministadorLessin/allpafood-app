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

/* Solo alergias, y en pocas palabras. Las opciones de dieta (sin gluten, sin
   lactosa, vegetariano) no se ofrecen y daban a entender que si; y un campo
   libre largo invitaba a escribir un pedido a medida, cuando los platos son
   los del menu del dia. */
const MAX_ALERGIA = 60;

/* Quien compra es gente de oficina sin tiempo para cocinar, no atletas.
   Los mismos codigos que el cuestionario viejo, de los que sale el calculo de
   calorias. */
const RUTINAS = [
  { v: 'A', t: 'Casi todo el día sentado', d: 'Me muevo poco' },
  { v: 'B', t: 'Oficina', d: 'Sentado, camino algo' },
  { v: 'C', t: 'Me muevo bastante', d: 'De pie buena parte del día' },
  { v: 'D', t: 'Hago deporte', d: 'Tres veces por semana o más' },
];

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const OLLA = ['M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z', 'M2 10h20', 'M9 6c0-1 1-2 3-2s3 1 3 2', 'M12 4V2'];

const terminarAlta = () => {
  try {
    window.localStorage.removeItem('af_alta');
    window.localStorage.removeItem('preregistro');
  } catch (e) { /* nada */ }
};

export default function CocinaPage() {
  const navigate = useNavigate();
  const { token } = useAuthContext();

  const [tieneAlergia, setTieneAlergia] = useState(false);
  const [alergia, setAlergia] = useState('');
  const [azucar, setAzucar] = useState(true);
  const [rutina, setRutina] = useState('B');
  const [guardando, setGuardando] = useState(false);

  const elegir = (set, v) => { vibrar.toque(); set(v); };

  const entrar = () => {
    terminarAlta();
    vibrar.exito();
    navigate('/', { replace: true });
  };

  const guardar = () => {
    setGuardando(true);
    const cabecera = { headers: { Authorization: `Bearer ${token}` } };
    const restricciones = tieneAlergia ? alergia.trim().slice(0, MAX_ALERGIA) : '';
    const deporte = rutina === 'D';

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
            routine: rutina,
            trainingDays: deporte ? 3 : 0,
            trainingHours: deporte ? 1 : 0,
            trainingLevel: deporte ? 'M' : 'L',
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
        <p className="empN__b">Dos cosas rápidas para que tu almuerzo te llegue bien.</p>

        <p className="empN__q">¿Tienes alguna alergia?</p>
        <div className="empN__lados" role="radiogroup" aria-label="¿Tienes alguna alergia?">
          {[[false, 'No'], [true, 'Sí']].map(([v, t]) => (
            <button type="button" key={t} role="radio" aria-checked={tieneAlergia === v}
              className={tieneAlergia === v ? 'is-on' : undefined} onClick={() => elegir(setTieneAlergia, v)}>{t}</button>
          ))}
        </div>
        {tieneAlergia && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <label className="cocN__otra">
              <input type="text" value={alergia} maxLength={MAX_ALERGIA} autoFocus
                     onChange={(e) => setAlergia(e.target.value)}
                     placeholder="Ej. maní, mariscos" aria-label="Tu alergia" />
            </label>
            <p className="cocN__nota">Solo alergias. Los platos son los del menú del día y no se preparan a pedido.</p>
          </motion.div>
        )}

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
