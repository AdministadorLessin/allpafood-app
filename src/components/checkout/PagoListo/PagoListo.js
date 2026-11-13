import React, { useEffect, useState } from "react";
import { olvidarCodigo } from '../../../referido';
import { useNavigate } from "react-router-dom";

import './PagoListo.scss';
import { motion, alToque } from './../../ultil/Motion/Motion';
import IcoIsotipoSvg from './../../ultil/iconSvg/icoIsotipoSvg';
import { esNativo, vibrar } from '../../../nativo';
import Isotipo from './../../ultil/Isotipo';
import { resorte, cascada, sube } from '../../../movimiento';
import { useReducedMotion } from 'motion/react';

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
const PagoListo = ({ total, plan, adicionales = 0, invitacion = null }) => {

  const navigate = useNavigate();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    /* El codigo ya viajo con el pago: no tiene que quedar para otra compra. */
    olvidarCodigo();
    const t = setTimeout(() => { setListo(true); vibrar.exito(); }, MS_ACTIVANDO);
    return () => clearTimeout(t);
  }, []);

  const quieto = useReducedMotion();

  /* En el app, la unica pantalla que celebra: menta de borde a borde, el
     isotipo y el siguiente paso (maqueta RegListo). Los datos son los
     mismos que en la web. */
  if (esNativo) {
    return (
      <motion.div className="afListo" role="dialog" aria-live="polite" aria-label="Pago recibido"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: quieto ? 0 : 0.25 }}>
        <span className="afListo__picos" aria-hidden="true" />

        {!listo ?
          <div className="afListo__cuerpo">
            <motion.div className="afListo__iso"
              animate={quieto ? undefined : { scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
              <Isotipo size={72} hojas="#16211B" sonrisa="#16211B" />
            </motion.div>
            <h1 className="afListo__t">Activando<br />tu plan</h1>
            <p className="afListo__d">Un momento, estamos cargando tus almuerzos.</p>
          </div>
        :
          <>
            <motion.div className="afListo__cuerpo" key="listo"
              variants={cascada(0.07, 0.05)} initial={quieto ? false : 'oculto'} animate="visible">
              <motion.div className="afListo__iso"
                initial={quieto ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={resorte.entra}>
                <Isotipo size={72} hojas="#16211B" sonrisa="#16211B" />
              </motion.div>
              <motion.h1 className="afListo__t" variants={sube}>¡Listo, ya<br />eres parte!</motion.h1>
              <motion.p className="afListo__d" variants={sube}>
                {plan ? <>Tu <b>{plan}</b> está activo.</> : 'Tu plan está activo.'}
                {adicionales > 0 && ` Con ${adicionales} ${adicionales === 1 ? 'adicional' : 'adicionales'}.`}
                {total > 0 && ` Pagaste S/\u00a0${Number(total).toFixed(2)}.`}
              </motion.p>

              {invitacion &&
                <motion.div className="afListo__regalo" variants={sube}>
                  <b>+{invitacion.regalo}</b>
                  <span>
                    <strong>entregas de regalo</strong>
                    {invitacion.nombre ? `Por la invitación de ${invitacion.nombre}.` : 'Por tu código de invitación.'}
                    {' '}Ya están sumadas a tu plan.
                  </span>
                </motion.div>}

              <motion.p className="afListo__sig" variants={sube}>
                Falta lo último: dinos a dónde te llevamos el almuerzo.
              </motion.p>
            </motion.div>

            <motion.div className="afListo__pie"
              initial={quieto ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...resorte.entra, delay: quieto ? 0 : 0.3 }}>
              <motion.button type="button" className="afListo__btn"
                onClick={() => navigate('/registro/direccion', { replace: true })}
                whileTap={quieto ? undefined : { scale: 0.97 }}>
                Indicar mi dirección
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </motion.button>
            </motion.div>
          </>
        }
      </motion.div>
    );
  }

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
                el lunes. Ahora primero la direccion: sin ella el pedido no
                tiene a donde ir, y es lo unico que no se puede saltar. */}
            {invitacion &&
              <p className="afPago__regalo">
                <b>+{invitacion.regalo} entregas de regalo</b>
                {invitacion.nombre ? ` por la invitación de ${invitacion.nombre}.` : ' por tu código de invitación.'}
                {' '}Ya están sumadas a tu plan.
              </p>}

            <p className="afPago__sig">
              Falta lo último: dinos a dónde te llevamos el almuerzo.
            </p>

            <motion.button type="button" className="afBtn afBtn--mint"
              onClick={() => navigate('/registro/direccion', { replace: true })} {...alToque}>
              Indicar mi dirección
            </motion.button>
          </>
        }

      </motion.div>
    </div>
  );
};

export default PagoListo;
