import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { limpiarCodigo } from '../../referido';
import { motion, useReducedMotion } from 'motion/react';
import Isotipo from '../../components/ultil/Isotipo';
import { cascada, sube, resorte } from '../../movimiento';
import './Invitacion.scss';

/**
 * A donde llega el amigo cuando toca el enlace de una invitacion
 * (app.allpafood.com/i/DIANA947).
 *
 * Un solo enlace para los dos telefonos: aqui se mira si es iPhone o Android
 * y el boton lleva a su tienda. El codigo queda a la vista porque el amigo lo
 * escribe en el app al pagar: una tienda no le pasa datos al app que instala.
 */
export const TIENDAS = {
  ios: 'https://apps.apple.com/pe/app/allpa-food-comida-saludable/id6828184246',
  android: 'https://play.google.com/store/apps/details?id=com.allpafood.app',
};

const telefono = () => {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  /* El iPad moderno se presenta como Mac; se le reconoce por la pantalla tactil. */
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return null;
};

export default function InvitacionPage() {
  const { codigo: crudo } = useParams();
  const codigo = limpiarCodigo(crudo);
  const [dato, setDato] = useState(null);     // { valido, nombre, regalo }
  const [copiado, setCopiado] = useState(false);
  const cual = telefono();
  const quieto = useReducedMotion();

  useEffect(() => {
    if (!codigo) return setDato({ valido: false });
    axios.get(`${API_URL}public/referidos/${encodeURIComponent(codigo)}`)
      .then((r) => setDato(r.data?.data ?? { valido: false }))
      /* Si no se pudo consultar, igual se le deja bajar el app con el codigo. */
      .catch(() => setDato({ valido: true, regalo: 2 }));
  }, [codigo]);

  const copiar = () => {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(codigo)
      .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); })
      .catch(() => {});
  };

  const valido = dato?.valido;
  const regalo = dato?.regalo || 2;

  const toque = quieto ? {} : { whileTap: { scale: 0.97 }, transition: resorte.toque };
  const FLECHA = 'M5 12h14M13 6l6 6-6 6';
  const flecha = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={FLECHA} /></svg>
  );

  return (
    <main className="nPant invP">
      <span className="nMenta invP__menta" aria-hidden="true" />
      {/* La clave cambia cuando llega la respuesta: lo nuevo entra en cascada. */}
      <motion.div className="invP__col" key={dato === null ? 'espera' : 'listo'}
        variants={cascada(quieto ? 0 : 0.06)} initial="oculto" animate="visible">
        <motion.p className="invP__marca" variants={sube}><Isotipo size={20} />Allpa Food</motion.p>

        {dato === null && <motion.p className="invP__espera" variants={sube}>Un momento…</motion.p>}

        {dato !== null && valido &&
          <>
            <motion.h1 className="invP__h" variants={sube}>
              {dato.nombre ? <>{dato.nombre} te invitó a comer bien</> : <>Te invitaron a comer bien</>}
            </motion.h1>
            <motion.p className="invP__bajada" variants={sube}>
              Almuerzos saludables recién cocinados, en tu casa u oficina, de lunes a viernes.
              Con este código te regalamos <b>{regalo} entregas</b> en tu primer plan.
            </motion.p>

            <motion.div className="invP__codigo" variants={sube}>
              <span>TU CÓDIGO DE INVITACIÓN<em>REGALO</em></span>
              <div>
                <b>{codigo}</b>
                <button type="button" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
              </div>
              <small>Escríbelo en el app al pagar tu plan.</small>
            </motion.div>
          </>}

        {dato !== null && !valido &&
          <>
            <motion.h1 className="invP__h" variants={sube}>Ese código no existe</motion.h1>
            <motion.p className="invP__bajada" variants={sube}>
              Revísalo con quien te invitó. Igual puedes bajar el app y mirar el menú de la semana.
            </motion.p>
          </>}

        {dato !== null &&
          <motion.div className="invP__botones" variants={sube}>
            {cual !== 'android' &&
              <motion.a className="invP__btn" href={TIENDAS.ios} {...toque}>Bajar en el App Store {flecha}</motion.a>}
            {cual !== 'ios' &&
              <motion.a className={`invP__btn${cual === null ? ' invP__btn--claro' : ''}`} href={TIENDAS.android} {...toque}>
                Bajar en Google Play {flecha}
              </motion.a>}
          </motion.div>}

        <motion.p className="invP__pie" variants={sube}>¿Ya eres cliente? <Link to="/ingresar">Ingresa</Link></motion.p>
      </motion.div>
    </main>
  );
}
