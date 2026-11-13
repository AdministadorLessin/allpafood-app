import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Skeleton from '@mui/material/Skeleton';
import moment from 'moment';
import 'moment/locale/es';
import { animate, motion, AnimatePresence, useReducedMotion } from 'motion/react';

import './CuentaNativa.scss';
import Hoja from '../../../components/perfil/Hoja/Hoja';
import ProfileChangePerson from '../../../components/perfil/Edit/Personales/Personales';
import ProfileChangePrivacity from '../../../components/perfil/Edit/Privacidad/Privacidad';
import ProfileChangePassword from '../../../components/perfil/Edit/Password/Password';
import CerrarSesion from '../../../components/perfil/CerrarSesion/CerrarSesion';
import EliminarCuenta from '../../../components/perfil/EliminarCuenta/EliminarCuenta';
import RodrigoCara from '../../../components/ultil/RodrigoCara/RodrigoCara';
import { useCentro } from '../../../components/Centro/CentroContext';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
import { cascada, sube, resorte } from '../../../movimiento';

/**
 * "Yo": la pestaña de la cuenta dentro del app (maqueta Yo.dc.html). Arriba
 * quien eres, sobre el degradado menta; debajo tu plan, tu codigo para
 * invitar y las filas de la cuenta, separadas por lineas finas.
 *
 * Los datos y sus guardados siguen siendo los de perfil.js; aqui se pintan y
 * se abren las hojas (avatar, datos). En la web la pantalla no cambia.
 */

/* Los avatares que hay en public/assets/img/avatars. */
const AVATARES = [...Array(24)].map((_, i) => i);
const WHATSAPP = '51955797697';

const Ico = ({ d, w = 1.9 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const I = {
  yo: ['M12 11.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z', 'M4.6 20.4c0-3.7 3.4-5.6 7.4-5.6s7.4 1.9 7.4 5.6'],
  pin: ['M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  pagos: ['M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z', 'M10 8h4M10 12h4'],
  chat: 'M21 12a8 8 0 0 1-12 7l-5 1 1-4.500A8 8 0 1 1 21 12z',
  ayuda: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01'],
  ir: 'M9 6l6 6-6 6',
  lapiz: ['M4 20h4L19 9l-4-4L4 16z'],
  campana: ['M18 9.5a6 6 0 1 0-12 0c0 4.2-1.300 5.600-1.900 6.200a.8.8 0 0 0 .6 1.300h14.600a.8.8 0 0 0 .6-1.300c-.6-.6-1.900-2-1.900-6.200z', 'M10.200 20.100a2.100 2.100 0 0 0 3.600 0'],
  copiar: ['M9 9h10v11H9z', 'M5 15V4h10'],
  check: 'M5 12l5 5 9-10',
};

/* Un numero que sube contando hasta su valor. */
function Cuenta({ hasta }) {
  const ref = useRef(null);
  const quieto = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return undefined;
    if (quieto) { ref.current.textContent = Math.round(hasta); return undefined; }
    const c = animate(0, hasta, { duration: 0.8, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v); } });
    return () => c.stop();
  }, [hasta, quieto]);
  return <span ref={ref}>{Math.round(hasta)}</span>;
}

const Fila = ({ ico, cara, titulo, sub, a, href, onClick }) => {
  const dentro = (
    <>
      {cara ? <RodrigoCara size={44} /> : <span className="yo__filaIco" aria-hidden="true"><Ico d={ico} /></span>}
      <span className="yo__filaTxt">
        <b>{titulo}</b>
        {sub && <small>{sub}</small>}
      </span>
      <span className="yo__filaIr" aria-hidden="true"><Ico d={I.ir} w={2.2} /></span>
    </>
  );
  if (a) return <Link className="yo__fila" to={a}>{dentro}</Link>;
  if (href) return <a className="yo__fila" href={href} target="_blank" rel="noreferrer">{dentro}</a>;
  return <button type="button" className="yo__fila" onClick={onClick}>{dentro}</button>;
};

const entregas = (n) => (Number(n) === 1 ? '1 entrega' : `${n} entregas`);
const premio = (n) => (n === 5 ? 'una semana gratis' : n === 10 ? 'dos semanas gratis' : n === 20 ? 'un mes gratis' : entregas(n));

export default function CuentaNativa({
  person, nombre, telefono, plan, delivery, imagen, elegirAvatar,
  privacity, actualizarPersona, actualizarPrivacidad,
}) {
  const { token, esCorporativo } = useAuthContext();
  const { abrir: abrirAvisos, sinLeer } = useCentro();
  const quieto = useReducedMotion();

  const tieneImagen = imagen !== undefined && imagen !== null && imagen !== '';

  /* --- Hojas --- */
  const [hoja, setHoja] = useState(null);            // 'avatar' | 'datos' | null
  const [vista, setVista] = useState('datos');       // dentro de la hoja de datos: datos | documento | clave
  const [elegido, setElegido] = useState(null);
  const cerrar = () => setHoja(null);
  const abrirAvatar = () => { vibrar.toque(); setElegido(tieneImagen ? Number(imagen) : null); setHoja('avatar'); };
  const abrirDatos = () => { vibrar.toque(); setVista('datos'); setHoja('datos'); };
  const guardarAvatar = () => {
    if (elegido !== null) elegirAvatar(elegido);
    cerrar();
  };

  /* --- Plan --- */
  /* Con moment y no con new Date: new Date('2026-11-30') lo lee como
     medianoche en UTC, que en Lima todavia es el 29, y aqui salia un dia
     antes que en el inicio. */
  const vence = plan?.expirationDate
    ? moment(plan.expirationDate).format('D MMM').replace('.', '')
    : null;
  const total = Number(plan?.consumption?.orders?.total) || 0;
  const usados = Number(plan?.consumption?.orders?.consumed) || 0;
  const quedan = Math.max(total - usados, 0);

  const direccion = delivery?.address ? String(delivery.address).split(',')[0] : null;
  const desde = (() => {
    const m = moment(person?.registeDate, ['YYYY-MM-DD', moment.ISO_8601], true);
    return m.isValid() ? m.format('MMMM [de] YYYY').replace('septiembre', 'setiembre') : null;
  })();

  /* --- Invitar: el codigo del cliente, el mismo que muestra /invita. Si no
     llega, la tarjeta igual lleva a esa pantalla. --- */
  const [refe, setRefe] = useState(null);
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    let vivo = true;
    axios.get(`${API_URL}referidos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (vivo) setRefe(r.data?.data ?? null); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [token]);
  const copiar = () => {
    if (!refe?.codigo) return;
    vibrar.toque();
    const listo = () => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(refe.codigo).then(listo).catch(() => {});
  };

  const titulos = {
    datos: { et: 'Mis datos', t: 'Tus datos' },
    documento: { et: 'Mis datos', t: 'Documento y celular' },
    clave: { et: 'Mis datos', t: 'Cambia tu contraseña' },
  };

  return (
    <>
      <motion.div className="nPant yo" variants={cascada(0.06)} initial="oculto" animate="visible">
        <span className="yo__menta" aria-hidden="true" />

        <motion.div className="yo__cab" variants={sube}>
          <span className="yo__marca">Mi cuenta</span>
          <motion.button type="button" className="yo__campana" whileTap={{ scale: 0.9 }} transition={resorte.toque}
            onClick={() => abrirAvisos()}
            aria-label={sinLeer > 0 ? `Avisos, ${sinLeer} sin leer` : 'Avisos'}>
            <Ico d={I.campana} />
            {sinLeer > 0 && <i aria-hidden="true" />}
          </motion.button>
        </motion.div>

        <motion.div className="yo__quien" variants={sube}>
          <motion.button type="button" className="yo__ava" onClick={abrirAvatar}
            whileTap={{ scale: 0.94 }} transition={resorte.toque} aria-label="Cambiar mi avatar">
            {tieneImagen
              ? <img src={`/assets/img/avatars/avatar_${imagen}.jpg`} alt="" />
              : <span className="yo__inicial">{(person?.name || '?').charAt(0).toUpperCase()}</span>}
            <span className="yo__lapiz" aria-hidden="true"><Ico d={I.lapiz} w={2.2} /></span>
          </motion.button>
          <div className="yo__quienTxt">
            {person
              ? <h1>{nombre || 'Tu cuenta'}</h1>
              : <Skeleton variant="text" width={170} height={40} />}
            {telefono && <span className="yo__tel">{telefono}</span>}
            {desde && <span className="yo__desde">Cliente desde {desde}</span>}
          </div>
        </motion.div>

        {/* Solo cifras que el sistema tiene de verdad. */}
        {refe && total > 0 &&
          <motion.div className="yo__cifras" variants={sube}>
            <div><b>{usados}</b><small>{usados === 1 ? 'entrega pedida' : 'entregas pedidas'}</small></div>
            <div><b>{Number(refe.amigos) || 0}</b><small>{Number(refe.amigos) === 1 ? 'amigo invitado' : 'amigos invitados'}</small></div>
            <div><b>{Number(refe.ganadas) || 0}</b><small>{Number(refe.ganadas) === 1 ? 'entrega ganada' : 'entregas ganadas'}</small></div>
          </motion.div>}

        <motion.section className="yo__plan" variants={sube} aria-label="Mi plan">
          {plan?.planName ? (
            <>
              <div className="yo__planCab">
                <span className="yo__et">Mi plan · {plan.planName}</span>
                {vence && <span className="yo__vence">Vence el {vence}.</span>}
              </div>
              {total > 0 && <>
                <div className="yo__quedan">
                  <b><Cuenta hasta={quedan} /></b>
                  <span>{quedan === 1 ? 'entrega' : 'entregas'}<br />te {quedan === 1 ? 'queda' : 'quedan'}</span>
                </div>
                <span className="yo__barra" role="img" aria-label={`Usaste ${usados} de ${total} entregas`}>
                  <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(quedan / total, 1) }}
                    transition={quieto ? { duration: 0 } : { ...resorte.suave, delay: 0.3 }} />
                </span>
                <span className="yo__planNota">Usaste {usados} de {total}.</span>
              </>}
              <div className={`yo__planBtns${esCorporativo ? ' yo__planBtns--uno' : ''}`}>
                {!esCorporativo && <Link to="/planes" className="yo__btn">Renovar</Link>}
                <Link to="/mi-plan" className={`yo__btn${esCorporativo ? '' : ' yo__btn--suave'}`}>Ver mi plan</Link>
              </div>
            </>
          ) : (
            <>
              {/* Aqui solo se sabe del plan lo que quedo guardado al entrar.
                  Si no hay nada, no se afirma que no tiene plan: se le manda
                  a "Mi plan", que lo consulta. */}
              <span className="yo__et">Mi plan</span>
              <b className="yo__sinPlan">Tu plan y tus entregas</b>
              <span className="yo__planNota">Mira cuántas te quedan y hasta cuándo puedes usarlas.</span>
              <div className="yo__planBtns yo__planBtns--uno">
                <Link to="/mi-plan" className="yo__btn">Ver mi plan</Link>
              </div>
            </>
          )}
        </motion.section>

        <motion.div variants={sube}>
          {/* El enlace cubre toda la tarjeta; "Copiar" queda encima, aparte. */}
          <div className="yo__invita">
            <span className="yo__invitaCab">
              <Link to="/invita" className="yo__et yo__et--claro yo__invitaIr">Invita y gana entregas</Link>
              <span className="yo__regalo" aria-hidden="true">REGALO</span>
            </span>
            {refe?.codigo ? (
              <span className="yo__codigo">
                <b>{refe.codigo}</b>
                <button type="button" onClick={copiar} aria-label={copiado ? 'Código copiado' : `Copiar mi código ${refe.codigo}`}>
                  <Ico d={copiado ? I.check : I.copiar} w={2.2} />{copiado ? 'Copiado' : 'Copiar'}
                </button>
              </span>
            ) : null}
            <span className="yo__invitaTxt">
              {refe?.codigo
                ? (Number(refe.faltan) > 0 && refe.premioSiguiente
                    ? `Te ${Number(refe.faltan) === 1 ? 'falta 1 amigo' : `faltan ${refe.faltan} amigos`} para ganar ${premio(refe.premioSiguiente)}.`
                    : 'Cada amigo que compra su primer plan te da entregas gratis.')
                : 'Comparte tu código. Cuando un amigo compra su primer plan, los dos ganan entregas.'}
            </span>
          </div>
        </motion.div>

        <motion.div variants={sube}>
          <p className="yo__grupo">Mi cuenta</p>
          <nav className="yo__lista" aria-label="Mi cuenta">
            <Fila ico={I.yo} titulo="Mis datos" onClick={abrirDatos} />
            <Fila ico={I.pin} titulo="Mis direcciones" sub={direccion || undefined} a="/ubicaciones" />
            <Fila ico={I.pagos} titulo="Mis pagos" a="/facturacion" />
          </nav>
        </motion.div>

        <motion.div variants={sube}>
          <p className="yo__grupo yo__grupo--sig">Ayuda</p>
          <nav className="yo__lista" aria-label="Ayuda">
            {/* Rodrigo primero: es la ayuda mas rapida. */}
            <Fila cara titulo="Hablar con Rodrigo" sub="Tu asistente" a="/rodrigo" />
            <Fila ico={I.chat} titulo="Escríbenos" sub="WhatsApp" href={`https://wa.me/${WHATSAPP}`} />
            <Fila ico={I.ayuda} titulo="Preguntas frecuentes" a="/preguntas-frecuentes" />
          </nav>
        </motion.div>

        <motion.div className="yo__salir" variants={sube}>
          <CerrarSesion enlace />
          <EliminarCuenta enlace />
        </motion.div>
        <motion.p className="yo__pie" variants={sube}>Allpa Food · hecho en Perú</motion.p>
      </motion.div>

      {/* --- Hoja: mi avatar --- */}
      <Hoja abierta={hoja === 'avatar'} alCerrar={cerrar}
        etiqueta="Mi avatar" titulo="Elige cómo te vemos"
        pie={<button type="button" className="hoja__btn" onClick={guardarAvatar} disabled={!person}>Guardar</button>}>
        <div className="yoAva" role="radiogroup" aria-label="Avatares">
          {AVATARES.map((n) => {
            const on = elegido === n;
            return (
              <motion.button type="button" key={n} role="radio" aria-checked={on}
                aria-label={`Avatar ${n + 1}`}
                className={`yoAva__op${on ? ' is-on' : ''}`}
                whileTap={{ scale: 0.92 }} transition={resorte.toque}
                onClick={() => { vibrar.toque(); setElegido(n); }}>
                <img src={`/assets/img/avatars/avatar_${n}.jpg`} alt="" loading="lazy" />
              </motion.button>
            );
          })}
        </div>
        <p className="yoAva__nota">Hay {AVATARES.length} para elegir.</p>
      </Hoja>

      {/* --- Hoja: mis datos (nombre, documento y contraseña) --- */}
      <Hoja abierta={hoja === 'datos'} alCerrar={cerrar}
        etiqueta={titulos[vista].et} titulo={titulos[vista].t}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={vista}
            initial={quieto ? { opacity: 0 } : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={quieto ? { duration: 0.01 } : resorte.entra}>
            {vista === 'datos' && (person
              ? <ProfileChangePerson enHoja data={person} closeModal={cerrar} updatePerson={actualizarPersona}>
                  <div className="cuF__enlaces">
                    <button type="button" className="cuF__enlace" onClick={() => setVista('documento')}>Documento y celular</button>
                    <button type="button" className="cuF__enlace" onClick={() => setVista('clave')}>Cambiar mi contraseña</button>
                  </div>
                </ProfileChangePerson>
              : <Skeleton variant="rounded" height={180} sx={{ borderRadius: '18px' }} />)}
            {vista === 'documento' && (privacity
              ? <ProfileChangePrivacity enHoja data={privacity} closeModal={cerrar} updatePrivacity={actualizarPrivacidad}>
                  <div className="cuF__enlaces">
                    <button type="button" className="cuF__enlace" onClick={() => setVista('datos')}>Volver a mis datos</button>
                  </div>
                </ProfileChangePrivacity>
              : <>
                  <p className="hoja__bajada">Todavía no cargan tu documento y tu celular. Vuelve a intentarlo en un momento.</p>
                  <button type="button" className="hoja__enlace" onClick={() => setVista('datos')}>Volver a mis datos</button>
                </>)}
            {vista === 'clave' &&
              <ProfileChangePassword enHoja closeModal={cerrar}>
                <div className="cuF__enlaces">
                  <button type="button" className="cuF__enlace" onClick={() => setVista('datos')}>Volver a mis datos</button>
                </div>
              </ProfileChangePassword>}
          </motion.div>
        </AnimatePresence>
      </Hoja>
    </>
  );
}
