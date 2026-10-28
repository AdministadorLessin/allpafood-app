import React from 'react';

/**
 * Un calendario con el dia marcado.
 *
 * El aviso de feriado tiene que leerse antes de leerse: la hoja arrancada y
 * el dia tachado dicen "hoy no" sin que haga falta el texto. Va dibujado a
 * mano en SVG para que pese nada y se adapte al color de la marca.
 */
const IlustracionFeriado = ({ dia = '8' }) => (
  <svg viewBox="0 0 120 112" role="img" aria-label="Calendario con el día marcado" focusable="false">
    {/* argollas */}
    <rect x="34" y="4" width="7" height="20" rx="3.5" fill="#183A2A" opacity=".35" />
    <rect x="79" y="4" width="7" height="20" rx="3.5" fill="#183A2A" opacity=".35" />

    {/* hoja */}
    <rect x="14" y="14" width="92" height="86" rx="18" fill="#FFFFFF" />
    <rect x="14" y="14" width="92" height="86" rx="18" fill="none" stroke="#183A2A" strokeOpacity=".10" strokeWidth="2" />

    {/* banda superior */}
    <path d="M14 32a18 18 0 0 1 18-18h56a18 18 0 0 1 18 18v6H14z" fill="#3CFB9F" />
    <circle cx="37.5" cy="23" r="4.5" fill="#183A2A" opacity=".45" />
    <circle cx="82.5" cy="23" r="4.5" fill="#183A2A" opacity=".45" />

    {/* dia */}
    <text x="60" y="80" textAnchor="middle" fontSize="42" fontWeight="800"
          fill="#183A2A" fontFamily="inherit" letterSpacing="-1">{dia}</text>

    {/* tachado suave */}
    <path d="M30 86 L90 52" stroke="#0F8B54" strokeWidth="5" strokeLinecap="round" opacity=".85" />
  </svg>
);

export default IlustracionFeriado;
