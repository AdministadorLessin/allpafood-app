import React from 'react';
import './RodrigoCara.scss';

/**
 * El icono de Rodrigo, tal como lo diseño Allpa: un cuadrado blanco de
 * esquinas redondas, el circulo verde en degradado que se sale por la
 * izquierda, un ojo, el guiño y la sonrisa de lado.
 *
 * Esta redibujado a partir de la imagen de referencia. Cuando este el archivo
 * original (SVG), se reemplaza aqui y cambia en todo el app.
 *
 * `pensando` lo hace latir mientras Rodrigo trabaja en un caso.
 */
export default function RodrigoCara({ size = 44, pensando = false }) {
  return (
    <span className={`rCara${pensando ? ' rCara--pensando' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" width={size} height={size}>
        <defs>
          <clipPath id="rCaraCorte"><rect width="48" height="48" rx="16" /></clipPath>
          {/* Verde vivo en casi todo el circulo, turquesa hacia arriba a la
              derecha, y el toque amarillo solo en la esquina de abajo a la
              izquierda (chico: si crece, se ve como un borde claro). */}
          <linearGradient id="rCaraVerde" gradientUnits="userSpaceOnUse" x1="2" y1="44" x2="42" y2="6">
            <stop offset="0" stopColor="#12F56E" />
            <stop offset=".45" stopColor="#16FF9E" />
            <stop offset="1" stopColor="#08C9C4" />
          </linearGradient>
          <radialGradient id="rCaraLuz" gradientUnits="userSpaceOnUse" cx="1" cy="47" r="15">
            <stop offset="0" stopColor="#C8FF4A" />
            <stop offset=".45" stopColor="#7DFF5E" stopOpacity=".6" />
            <stop offset="1" stopColor="#16FF7E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g clipPath="url(#rCaraCorte)">
          <rect width="48" height="48" fill="#fff" />
          <circle cx="16.800" cy="24" r="24.200" fill="url(#rCaraVerde)" />
          <circle cx="16.800" cy="24" r="24.200" fill="url(#rCaraLuz)" />
        </g>
        <g>
        <circle cx="17.600" cy="20.100" r="2.850" fill="#000" />
        <path d="M30.100 12.700l-3.900 3.900h6.800" fill="none" stroke="#000" strokeWidth="2.100" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.600 30.900c5 .300 9.500-2 10.800-7.600" fill="none" stroke="#000" strokeWidth="2.100" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  );
}
