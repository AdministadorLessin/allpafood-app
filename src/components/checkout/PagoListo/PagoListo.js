import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import './PagoListo.scss';
import { motion, alToque } from './../../ultil/Motion/Motion';
import IcoIsotipoSvg from './../../ultil/iconSvg/icoIsotipoSvg';

/* Cuanto esperamos antes de dar por activado el plan. El servidor aplica los
   beneficios justo despues de confirmar el cobro; salir antes lleva al cliente
   a un panel que todavia dice que no tiene plan. */
const MS_ACTIVANDO = 3600;

/**
 * Lo que ve el cliente cuando su pago entra.
 *
 * Antes era una maquina de escribir de siete segundos y un redirect forzado al
 * panel. Dos problemas: el cliente no podia hacer nada durante esos siete
 * segundos, y al llegar al panel nadie le decia que lo siguiente —lo unico
 * que tiene que hacer para comer el lunes— es elegir sus almuerzos.
 */
const PagoListo = ({ total, plan, adicionales = 0 }) => {

  const navigate = useNavigate();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setListo(true), MS_ACTIVANDO);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="afPago">
      <motion.div
        className="afPago__hoja"
        initial={{ opacity: 0, y: 18, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .4, ease: [0.16, 0.84, 0.44, 1] }}
      >

        {!listo ?
          <>
            <div className="afPago__iso"><IcoIsotipoSvg /></div>
            <h2 className="afPago__t">Activando tu plan</h2>
            <p className="afPago__d">Un momento, estamos cargando tus almuerzos.</p>
          </>
        :
          <>
            <motion.div
              className="afPago__check"
              initial={{ scale: .4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <motion.svg viewBox="0 0 44 44" fill="none" stroke="currentColor"
                   strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="m13 22.5 6.5 6.5L32 15.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: .45, delay: .12, ease: 'easeOut' }}
                />
              </motion.svg>
            </motion.div>

            <h2 className="afPago__t">¡Listo, ya eres parte!</h2>
            <p className="afPago__d">
              {plan ? <>Tu <b>{plan}</b> está activo.</> : 'Tu plan está activo.'}
              {adicionales > 0 && ` Con ${adicionales} ${adicionales === 1 ? 'adicional' : 'adicionales'}.`}
            </p>

            {total > 0 &&
              <div className="afPago__monto">
                <span>Pagaste</span>
                <b>S/ {Number(total).toFixed(2)}</b>
              </div>
            }

            {/* Lo siguiente que tiene que hacer, dicho aqui. Antes el cliente
                caia en el panel sin saber que sin elegir sus platos no come
                el lunes. */}
            <p className="afPago__sig">
              Ahora elige qué vas a comer esta semana. Toma un minuto.
            </p>

            <motion.button type="button" className="afBtn afBtn--mint"
              onClick={() => navigate('/menu', { replace: true })} {...alToque}>
              Elegir mis almuerzos
            </motion.button>

            <button type="button" className="afPago__luego"
              onClick={() => navigate('/', { replace: true })}>
              Lo hago después
            </button>
          </>
        }

      </motion.div>
    </div>
  );
};

export default PagoListo;
