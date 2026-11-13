import React, { useEffect, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { useReducedMotion } from 'motion/react';
import './AperturaNativa.scss';

/*
 * La apertura del app instalado, como la de la mayoria de apps: el fondo es
 * el mismo color claro del app y el isotipo esta al centro desde el primer
 * instante (lo pone el telefono mientras el app carga). Cuando el app esta
 * listo, ese mismo isotipo da un saltito, guiña y se va, dejando ver la
 * pantalla que toque. Menos de dos segundos.
 *
 * El telefono muestra ese mismo fondo claro mientras el app carga, asi que no
 * hay corte entre uno y otro.
 *
 * Una sola vez por arranque: volver al app desde segundo plano no la repite.
 */
const HOJAS = 'M143.93 105.199C146.554 98.1537 148.952 91.0695 151.803 84.153C158.927 66.8568 168.734 51.2773 182.094 38.0363C200.011 20.2763 221.343 8.87054 245.96 3.47349C256.725 1.11536 267.608 -0.0192943 278.629 0.0300389C279.803 0.0300389 280.336 0.316159 280.356 1.55936C280.642 17.5532 279.438 33.3694 274.672 48.7515C269.887 64.2224 261.915 77.9765 251.663 90.4084C236.518 108.77 218.334 123.166 196.242 132.381C180.643 138.893 164.393 142.149 147.481 142.198C138 142.228 128.547 142.041 119.174 140.373C98.3555 136.673 79.5299 128.405 62.6974 115.677C44.6316 102.002 30.0388 85.3468 19.8663 64.9821C13.6109 52.4613 9.88132 39.2006 8.72693 25.2788C8.08559 17.5137 8.05598 9.70919 7.69091 1.91454C7.62184 0.385211 8.16452 0.000410067 9.64452 0.000410067C31.6274 -0.0489231 52.6236 4.35162 72.426 13.9617C85.8939 20.5033 97.6846 29.4129 108.074 40.1873C123.969 56.6646 134.221 76.4077 141.463 97.8973C142.272 100.305 143.061 102.722 143.87 105.139C143.88 105.169 143.959 105.179 143.93 105.169V105.199Z';
const SONRISA = 'M63.0724 160.294C70.1369 182.158 82.2432 200.047 102.174 211.788C115.602 219.691 130.136 223.786 145.923 223.352C164.63 222.839 181.196 216.583 195.631 204.99C210.075 193.387 219.39 178.182 224.866 160.373C225.379 160.58 225.852 160.738 226.296 160.945C246.247 170.309 266.197 179.662 286.137 189.036C288.288 190.042 288.318 190.062 287.519 192.41C281.135 211.166 271.397 228.009 258.195 242.769C248.615 253.475 237.83 262.799 225.625 270.485C206.81 282.344 186.435 289.863 164.363 292.537C133.283 296.306 103.466 291.974 75.3267 277.835C63.9308 272.113 53.4425 265.019 43.8324 256.612C28.6773 243.371 16.4426 227.88 7.7205 209.716C5.00718 204.062 2.82665 198.142 0.507991 192.301C-0.37014 190.091 -0.241882 190.032 1.94851 188.996C18.5541 181.201 35.1695 173.417 51.775 165.622C55.4849 163.876 59.1948 162.129 63.0724 160.304V160.294Z';

const DURA = 1.9;               // segundos, de principio a fin
let yaSeVio = false;

export default function AperturaNativa() {
  const quieto = useReducedMotion();
  const [fuera, setFuera] = useState(yaSeVio);

  useEffect(() => {
    if (fuera) return undefined;
    yaSeVio = true;
    /* El fondo nativo y el nuestro son el mismo: se cambia sin que se note. */
    SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {});
    const fin = setTimeout(() => setFuera(true), (quieto ? 0.7 : DURA) * 1000);
    return () => clearTimeout(fin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fuera) return null;

  /* Todo el movimiento va en la hoja de estilos (AperturaNativa.scss): corre
     aunque el telefono este ocupado arrancando el app, que es justo cuando
     esto se ve. */
  return (
    <div className="afApertura" aria-hidden="true">
      {/* Arranca ya dibujado y en el mismo sitio que el isotipo que puso el
          telefono: lo que se ve es que ese dibujo cobra vida. Un saltito, el
          guiño, y se va creciendo. */}
      <div className="afApertura__iso">
        <svg viewBox="0 0 288 294" width="96" height="98" style={{ overflow: 'visible' }}>
          <defs>
            <clipPath id="afApIzq"><rect x="-20" y="-20" width="164" height="190" /></clipPath>
            <clipPath id="afApDer"><rect x="144" y="-20" width="170" height="190" /></clipPath>
          </defs>
          <path fillRule="evenodd" clipRule="evenodd" d={HOJAS} fill="#3CFB9F" clipPath="url(#afApIzq)" />
          {/* El guiño: la hoja derecha se cierra sobre su propio eje, sin moverse. */}
          <g className="afApertura__guino">
            <path fillRule="evenodd" clipRule="evenodd" d={HOJAS} fill="#3CFB9F" clipPath="url(#afApDer)" />
          </g>
          <path fillRule="evenodd" clipRule="evenodd" d={SONRISA} fill="#16211B" />
        </svg>
      </div>
    </div>
  );
}
