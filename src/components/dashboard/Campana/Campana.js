import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';

import './Campana.scss';
import { motion, alToque } from './../../ultil/Motion/Motion';
import { avisosDelCliente, leerLeidos, guardarLeidos } from './avisos';

const IcoCampana = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 9a6 6 0 1 0-12 0c0 4.2-1.3 5.6-1.9 6.2a.8.8 0 0 0 .6 1.3h14.6a.8.8 0 0 0 .6-1.3C19.3 14.6 18 13.2 18 9Z"/>
    <path d="M10.2 19.6a2.1 2.1 0 0 0 3.6 0"/>
  </svg>
);

const IcoCerrar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
);

/**
 * La campana del panel.
 *
 * No es un adorno: es el segundo canal automatico que tiene la operacion. Todo
 * lo que hoy se manda por difusion de WhatsApp a las 11 —salio a ruta, vamos
 * con retraso, te falta elegir— cabe aqui, y aqui el cliente lo encuentra
 * cuando le preocupa, no cuando a nosotros nos toca escribirlo.
 *
 * Por eso la campana solo aparece si hay algo que decir. Una campana que abre
 * un panel vacio ensena al cliente a no tocarla nunca mas.
 */
const Campana = ({ plan, ordenes, aviso }) => {

  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [leidos, setLeidos] = useState(() => leerLeidos());

  const avisos = useMemo(
    () => avisosDelCliente({ plan, ordenes, aviso }),
    [plan, ordenes, aviso]
  );

  const sinLeer = avisos.filter((a) => !leidos.has(a.id)).length;

  // Abrir es leer. Marcarlos uno por uno obligaria al cliente a hacer trabajo
  // de mantenimiento sobre avisos que ya vio.
  useEffect(() => {
    if (!abierto || avisos.length === 0) return;
    const nuevos = new Set([...leidos, ...avisos.map((a) => a.id)]);
    setLeidos(nuevos);
    guardarLeidos(nuevos);
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!abierto) return;
    const alaTecla = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', alaTecla);
    return () => window.removeEventListener('keydown', alaTecla);
  }, [abierto]);

  if (avisos.length === 0) return null;

  const ir = (ruta) => { setAbierto(false); navigate(ruta); };

  return (
    <>
      <motion.button
        type="button"
        className={`afCampana${sinLeer > 0 ? ' afCampana--viva' : ''}`}
        onClick={() => setAbierto(true)}
        aria-label={sinLeer > 0 ? `Avisos, ${sinLeer} sin leer` : 'Avisos'}
        {...alToque}
      >
        <IcoCampana />
        {sinLeer > 0 && <span className="afCampana__punto">{sinLeer}</span>}
      </motion.button>

      {abierto &&
        <div className="afAvisos">
          <motion.div
            className="afAvisos__fondo"
            onClick={() => setAbierto(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.div
            className="afAvisos__hoja"
            initial={{ opacity: 0, y: -14, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: .28, ease: [0.16, 0.84, 0.44, 1] }}
          >
            <div className="afAvisos__top">
              <h2>Avisos</h2>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar">
                <IcoCerrar />
              </button>
            </div>

            <div className="afAvisos__lista">
              {avisos.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className={`afAviso afAviso--${a.tono}`}
                  onClick={() => ir(a.ruta)}
                >
                  <span className="afAviso__marca" />
                  <span className="afAviso__cuerpo">
                    <span className="afAviso__cuando">{a.cuando}</span>
                    <b className="afAviso__titulo">{a.titulo}</b>
                    <span className="afAviso__texto">{a.texto}</span>
                    <span className="afAviso__accion">{a.accion} &rsaquo;</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      }
    </>
  );
};

export default Campana;
