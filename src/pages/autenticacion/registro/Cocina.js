import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, useReducedMotion } from 'motion/react';

import MarcoAuth, { Accion } from './../../../components/auth/Marco/MarcoAuth';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
import { resorte } from '../../../movimiento';
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

const Marca = () => (
  <span className="rg__marca" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
         strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
  </span>
);

const terminarAlta = () => {
  try {
    window.localStorage.removeItem('af_alta');
    window.localStorage.removeItem('preregistro');
  } catch (e) { /* nada */ }
};

export default function CocinaPage() {
  const navigate = useNavigate();
  const { token } = useAuthContext();
  const quieto = useReducedMotion();

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
      <h1 className="afAuth__titular">Para tu cocina</h1>
      <p className="afAuth__bajada">Dos cosas rápidas para que tu almuerzo te llegue bien.</p>

      <p className="rg__q">¿Tienes alguna alergia?</p>
      <div className="rg__pildoras rg__pildoras--dos" role="radiogroup" aria-label="¿Tienes alguna alergia?">
        {[[false, 'No'], [true, 'Sí']].map(([v, t]) => (
          <button type="button" key={t} role="radio" aria-checked={tieneAlergia === v}
            className={`rg__pildora${tieneAlergia === v ? ' is-on' : ''}`} onClick={() => elegir(setTieneAlergia, v)}>{t}</button>
        ))}
      </div>
      {tieneAlergia && (
        <motion.div initial={{ opacity: 0, y: quieto ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={resorte.entra}>
          <label className="rg__campo cocN__otra">
            <span>Tu alergia</span>
            <div>
              <input type="text" value={alergia} maxLength={MAX_ALERGIA} autoFocus
                     onChange={(e) => setAlergia(e.target.value)}
                     placeholder="Ej. maní, mariscos" />
            </div>
          </label>
          <p className="rg__nota">Solo alergias. Los platos son los del menú del día y no se preparan a pedido.</p>
        </motion.div>
      )}

      <p className="rg__q">Tu refresco</p>
      <div className="rg__pildoras rg__pildoras--dos" role="radiogroup" aria-label="Tu refresco">
        {[[true, 'Con azúcar'], [false, 'Sin azúcar']].map(([v, t]) => (
          <button type="button" key={t} role="radio" aria-checked={azucar === v}
            className={`rg__pildora${azucar === v ? ' is-on' : ''}`} onClick={() => elegir(setAzucar, v)}>{t}</button>
        ))}
      </div>

      <p className="rg__q">¿Cómo es tu día?</p>
      <div className="rg__opciones" role="radiogroup" aria-label="¿Cómo es tu día?">
        {RUTINAS.map((r) => (
          <button type="button" key={r.v} role="radio" aria-checked={rutina === r.v}
            className={`rg__opcion${rutina === r.v ? ' is-on' : ''}`} onClick={() => elegir(setRutina, r.v)}>
            <span><b>{r.t}</b><small>{r.d}</small></span>
            <Marca />
          </button>
        ))}
      </div>

      <Accion>
        <button type="button" className="afBtn" disabled={guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : 'Entrar a Allpa Food'}
        </button>
        <button type="button" className="afNatPie__suave" onClick={entrar} disabled={guardando}>Saltar por ahora</button>
      </Accion>
    </MarcoAuth>
  );
}
