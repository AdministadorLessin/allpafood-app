import React from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

import './CuentaNativa.scss';
import CerrarSesion from '../../../components/perfil/CerrarSesion/CerrarSesion';
import EliminarCuenta from '../../../components/perfil/EliminarCuenta/EliminarCuenta';

/**
 * "Mi cuenta" dentro del app: la ficha con el avatar arriba y, debajo, una
 * lista agrupada como los Ajustes del iPhone. Antes eran tres botones grandes
 * cuyo texto se partia en dos lineas y una pagina larga de datos sueltos.
 *
 * Los datos y sus formularios siguen siendo los de perfil.js; aqui solo se
 * pintan. En la web la pantalla no cambia.
 */

/* Los avatares que hay en public/assets/img/avatars (el selector de la web
   ofrece los mismos 24). */
const AVATARES = [...Array(24)].map((_, i) => i);
const WHATSAPP = '51955797697';

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const I = {
  yo: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'],
  doc: ['M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M7 10h4M7 14h6M15.5 10.5h2'],
  pin: ['M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  llave: ['M8 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M11 12l9-9M16 7l3 3'],
  plan: ['M2 8a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z', 'M2 10h20M6 15h4'],
  pagos: ['M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z', 'M10 8h4M10 12h4'],
  regalo: ['M4 11h16v9H4z', 'M3 7h18v4H3zM12 7v13', 'M12 7S10.5 3 8 4s1 3 4 3zM12 7s1.5-4 4-3-1 3-4 3z'],
  chat: 'M21 12a8 8 0 0 1-12 7l-5 1 1-4.5A8 8 0 1 1 21 12z',
  ayuda: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01'],
  hoja: ['M5 19c9 1 14-5 14-14-9 0-15 5-14 14z', 'M5 19l7-7'],
  ir: 'M9 6l6 6-6 6',
  lapiz: 'M4 20h4L19 9l-4-4L4 16z',
};

const Fila = ({ ico, tono, titulo, sub, a, href, onClick }) => {
  const dentro = (
    <>
      <span className={`cuN__ico cuN__ico--${tono}`}><Ico d={ico} /></span>
      <span className="cuN__filaTxt">
        <b>{titulo}</b>
        {sub && <small>{sub}</small>}
      </span>
      <span className="cuN__ir"><Ico d={I.ir} /></span>
    </>
  );
  if (a) return <Link className="cuN__fila" to={a}>{dentro}</Link>;
  if (href) return <a className="cuN__fila" href={href} target="_blank" rel="noreferrer">{dentro}</a>;
  return <button type="button" className="cuN__fila" onClick={onClick}>{dentro}</button>;
};

export default function CuentaNativa({ person, nombre, telefono, plan, delivery, imagen, abrir, elegirAvatar }) {
  const tieneImagen = imagen !== undefined && imagen !== null && imagen !== '';
  const vence = plan?.expirationDate
    ? new Date(plan.expirationDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '')
    : null;
  const direccion = delivery?.address ? String(delivery.address).split(',')[0] : null;

  return (
    <div className="cuN">
      <h1 className="cuN__h">Mi <em>cuenta</em></h1>

      <section className="cuN__ficha">
        <span className="cuN__cielo" aria-hidden="true" />
        <span className="cuN__ava">
          {tieneImagen
            ? <img src={`/assets/img/avatars/avatar_${imagen}.jpg`} alt="Tu avatar" />
            : <span>{(person?.name || '?').charAt(0).toUpperCase()}</span>}
          <i aria-hidden="true"><Ico d={I.lapiz} /></i>
        </span>
        {person
          ? <b className="cuN__nombre">{nombre || 'Tu cuenta'}</b>
          : <Skeleton variant="text" width={180} height={32} sx={{ mx: 'auto' }} />}
        {telefono && <span className="cuN__tel">{telefono}</span>}
        {plan?.planName &&
          <span className="cuN__planChip"><i />{plan.planName}{vence ? ` · vence ${vence}` : ''}</span>}

        <p className="cuN__avaEt">Elige tu avatar</p>
        <div className="cuN__avatares" role="radiogroup" aria-label="Elige tu avatar">
          {AVATARES.map((n) => {
            const on = String(n) === String(imagen);
            return (
              <button type="button" key={n} role="radio" aria-checked={on}
                aria-label={`Avatar ${n + 1}`}
                className={`cuN__avaOp${on ? ' is-on' : ''}`}
                onClick={() => elegirAvatar(n)}>
                <img src={`/assets/img/avatars/avatar_${n}.jpg`} alt="" loading="lazy" />
              </button>
            );
          })}
        </div>
      </section>

      <p className="cuN__grupo">TU CUENTA</p>
      <nav className="cuN__lista" aria-label="Tu cuenta">
        <Fila ico={I.yo} tono="menta" titulo="Tus datos" sub={nombre || 'Nombre y correo'} onClick={() => abrir(0)} />
        <Fila ico={I.doc} tono="cielo" titulo="Documento y celular" sub="DNI, WhatsApp, nacimiento" onClick={() => abrir(1)} />
        <Fila ico={I.pin} tono="crema" titulo="Direcciones" sub={direccion || 'Dónde te entregamos'} a="/ubicaciones" />
        <Fila ico={I.llave} tono="gris" titulo="Contraseña" onClick={() => abrir(2)} />
      </nav>

      <p className="cuN__grupo">TU PLAN</p>
      <nav className="cuN__lista" aria-label="Tu plan">
        <Fila ico={I.plan} tono="mentaFuerte" titulo="Mi plan" sub={plan?.planName} a="/mi-plan" />
        <Fila ico={I.pagos} tono="gris" titulo="Mis pagos" a="/facturacion" />
        <Fila ico={I.regalo} tono="crema" titulo="Allpa+ · Tus beneficios" a="/beneficios" />
      </nav>

      <p className="cuN__grupo">AYUDA</p>
      <nav className="cuN__lista" aria-label="Ayuda">
        <Fila ico={I.chat} tono="menta" titulo="Escríbenos" sub="Por WhatsApp" href={`https://wa.me/${WHATSAPP}`} />
        <Fila ico={I.ayuda} tono="gris" titulo="Preguntas frecuentes" a="/preguntas-frecuentes" />
        <Fila ico={I.hoja} tono="gris" titulo="Salud y bienestar" a="/salud-y-bienestar" />
      </nav>

      <div className="cuN__salir">
        <CerrarSesion />
        <EliminarCuenta />
      </div>
    </div>
  );
}
