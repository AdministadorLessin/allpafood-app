// La entrada al panel: el isotipo de Allpa se dibuja solo sobre la menta y
// despues aparece el panel. Dura poco —algo mas de un segundo— y se ve una
// sola vez por visita: no es un adorno repetido, es el momento en que la marca
// aparece mientras los datos del cliente llegan del servidor.

import React, { useEffect, useState } from 'react';
import { HOJAS, SONRISA } from '../Isotipo';
import './CargaAllpa.scss';

const LLAVE = 'af_splash_visto';
const DURACION = 1150;

export default function CargaAllpa() {
  /* Una vez por pestaña. Quien navega entre secciones no vuelve a verlo: el
     encanto de la primera vez es molestia a la quinta. */
  const [visible, setVisible] = useState(() => {
    try { return window.sessionStorage.getItem(LLAVE) !== '1'; } catch (e) { return false; }
  });
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    try { window.sessionStorage.setItem(LLAVE, '1'); } catch (e) { /* modo privado */ }
    const irse = setTimeout(() => setSaliendo(true), DURACION);
    const quitar = setTimeout(() => setVisible(false), DURACION + 480);
    return () => { clearTimeout(irse); clearTimeout(quitar); };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`afCarga${saliendo ? ' afCarga--fuera' : ''}`} aria-hidden="true">
      <div className="afCarga__marca">
        <svg className="afCarga__iso" viewBox="-3 -3 100 103" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Las hojas y la sonrisa: se dibujan con el trazo y despues se
              rellenan, como si la marca se escribiera sola. */}
          <path className="afCarga__hoja afCarga__hoja--1" pathLength="1" d={HOJAS} />
          <path className="afCarga__hoja afCarga__hoja--2" pathLength="1" d={SONRISA} />
        </svg>
        <p className="afCarga__txt">Allpa Food</p>
      </div>
    </div>
  );
}
