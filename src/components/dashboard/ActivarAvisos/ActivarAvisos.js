import React, { useEffect, useState } from 'react';
import './ActivarAvisos.scss';
import { esNativo } from '../../../nativo';
import { estadoAvisos, activarAvisos, refrescarAvisos } from '../../../avisos';

/*
 * La tarjeta que invita a activar los avisos, en el inicio del app.
 *
 * Android pregunta una sola vez; si el cliente dice que no, despues solo se
 * puede activar desde los ajustes del telefono. Por eso primero se le cuenta
 * para que sirven, con nuestras palabras, y recien al tocar "Activar" sale la
 * ventana de Android. "Ahora no" la esconde una semana.
 */

const LLAVE_LUEGO = 'af_avisos_luego';
const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000;

const pospuesta = () => {
  try {
    return Date.now() - (Number(window.localStorage.getItem(LLAVE_LUEGO)) || 0) < UNA_SEMANA;
  } catch (e) {
    return false;
  }
};

export default function ActivarAvisos() {
  const [visible, setVisible] = useState(false);
  const [pidiendo, setPidiendo] = useState(false);

  useEffect(() => {
    if (!esNativo) return;
    let vivo = true;
    estadoAvisos().then((estado) => {
      if (!vivo) return;
      if (estado === 'granted') refrescarAvisos();
      else if (estado === 'prompt' && !pospuesta()) setVisible(true);
    });
    return () => { vivo = false; };
  }, []);

  if (!visible) return null;

  const activar = async () => {
    setPidiendo(true);
    await activarAvisos();
    setVisible(false);
  };

  const luego = () => {
    try { window.localStorage.setItem(LLAVE_LUEGO, String(Date.now())); } catch (e) { /* nada */ }
    setVisible(false);
  };

  return (
    <section className="afActivarAvisos" aria-label="Activar avisos">
      <div className="afActivarAvisos__ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>
      <div className="afActivarAvisos__texto">
        <h3>Entérate cuando sale tu almuerzo</h3>
        <p>Te avisamos cuando va en camino y antes de que cierre el día para elegir. Nada más.</p>
      </div>
      <div className="afActivarAvisos__acciones">
        <button type="button" className="afActivarAvisos__si" onClick={activar} disabled={pidiendo}>
          Activar avisos
        </button>
        <button type="button" className="afActivarAvisos__no" onClick={luego}>
          Ahora no
        </button>
      </div>
    </section>
  );
}
