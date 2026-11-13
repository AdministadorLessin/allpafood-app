import React, { useState } from 'react';

import Hoja from '../Hoja/Hoja';
import { vibrar } from '../../../nativo';
import './HojaNutricion.scss';

/**
 * "Habla con nutricion" (maqueta HojaNutricion): se elige de que se quiere
 * hablar y se abre WhatsApp con ese mensaje ya escrito. No guarda nada ni
 * llama al servidor: es el mismo numero de atencion de siempre.
 *
 *   <HojaNutricion abierta={ver} alCerrar={() => setVer(false)} />
 */
const WHATSAPP = '51955797697';
const TEMAS = [
  { t: 'Quiero ajustar mi meta', m: 'Hola, quiero hablar con nutrición: quiero ajustar mi meta.' },
  { t: 'Tengo una duda sobre un plato', m: 'Hola, quiero hablar con nutrición: tengo una duda sobre un plato.' },
  { t: 'Qué plan me conviene', m: 'Hola, quiero hablar con nutrición: quiero saber qué plan me conviene.' },
];
const GENERAL = 'Hola, quiero hablar con nutrición.';

export default function HojaNutricion({ abierta, alCerrar }) {
  const [tema, setTema] = useState(null);
  const mensaje = tema !== null ? TEMAS[tema].m : GENERAL;

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar}
      etiqueta="Orientación sin costo" titulo="Habla con nutrición"
      bajada="Te responde el equipo de nutrición de Allpa Food por WhatsApp, de lunes a viernes."
      pie={
        <a className="hoja__btn" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`}
          target="_blank" rel="noreferrer" onClick={alCerrar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4.500A8 8 0 1 1 21 12z" />
          </svg>
          Escribir por WhatsApp
        </a>
      }>
      <div className="hojaNut" role="radiogroup" aria-label="¿De qué quieres hablar?">
        {TEMAS.map((x, i) => (
          <button type="button" key={x.t} role="radio" aria-checked={tema === i}
            className={`hojaNut__op${tema === i ? ' is-on' : ''}`}
            onClick={() => { vibrar.toque(); setTema(tema === i ? null : i); }}>
            {x.t}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {tema === i ? <path d="M5 12l5 5 9-10" /> : <path d="M9 6l6 6-6 6" />}
            </svg>
          </button>
        ))}
      </div>
    </Hoja>
  );
}
