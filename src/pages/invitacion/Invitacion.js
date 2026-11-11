import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { limpiarCodigo } from '../../referido';
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

  return (
    <main className="invP">
      <div className="invP__col">
        <p className="invP__marca">Allpa Food</p>

        {dato === null && <p className="invP__espera">Un momento…</p>}

        {dato !== null && valido &&
          <>
            <h1 className="invP__h">
              {dato.nombre ? <>{dato.nombre} te invitó a <em>comer bien</em></> : <>Te invitaron a <em>comer bien</em></>}
            </h1>
            <p className="invP__bajada">
              Almuerzos saludables recién cocinados, en tu casa u oficina, de lunes a viernes.
              Con este código te regalamos <b>{regalo} entregas</b> en tu primer plan.
            </p>

            <div className="invP__codigo">
              <span>TU CÓDIGO DE INVITACIÓN</span>
              <div>
                <b>{codigo}</b>
                <button type="button" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
              </div>
              <small>Escríbelo en el app al pagar tu plan.</small>
            </div>
          </>}

        {dato !== null && !valido &&
          <>
            <h1 className="invP__h">Ese código <em>no existe</em></h1>
            <p className="invP__bajada">
              Revísalo con quien te invitó. Igual puedes bajar el app y mirar el menú de la semana.
            </p>
          </>}

        {dato !== null &&
          <div className="invP__botones">
            {cual !== 'android' &&
              <a className="invP__btn" href={TIENDAS.ios}>Bajar en el App Store</a>}
            {cual !== 'ios' &&
              <a className={`invP__btn${cual === null ? ' invP__btn--claro' : ''}`} href={TIENDAS.android}>Bajar en Google Play</a>}
          </div>}

        <p className="invP__pie">¿Ya eres cliente? <Link to="/ingresar">Ingresa</Link></p>
      </div>
    </main>
  );
}
