import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';

import { API_URL } from '../../config';
import { vibrar } from '../../nativo';
import { REPARTO } from '../../components/dashboard/PedidoDeHoy/PedidoDeHoy';
import { Ico, MotoEnCamino } from '../../components/dashboard/InicioNativo/InicioNativo';
import {
  avatarDeVisita, guardarAvatarDeVisita, direccionDeVisita, entrarDeVisita,
} from '../../visita';
import { codigoGuardado, invitadoPor, guardarCodigo, olvidarCodigo, limpiarCodigo } from '../../referido';

import '../../components/LayoutDashborad/LayoutDashboard.scss';
import '../../components/TabBar/TabBar.scss';
import '../../components/dashboard/InicioNativo/InicioNativo.scss';
import '../dashboard/perfil/CuentaNativa.scss';
import './Visita.scss';

/**
 * El app por dentro para quien todavia no es cliente.
 *
 * Son las mismas pantallas del cliente (Inicio y Mi cuenta) con datos de
 * ejemplo y el menu real de la semana que viene, que el servidor ya publica
 * sin pedir cuenta. Nada de lo que se toca aqui crea un pedido. "Quiero mi
 * plan" lleva al registro de siempre (/empezar), que no cambia.
 */

const I = {
  ojo: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  yo: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'],
  pin: ['M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  plan: ['M2 8a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z', 'M2 10h20M6 15h4'],
  pagos: ['M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z', 'M10 8h4M10 12h4'],
  regalo: ['M4 11h16v9H4z', 'M3 7h18v4H3zM12 7v13', 'M12 7S10.5 3 8 4s1 3 4 3zM12 7s1.5-4 4-3-1 3-4 3z'],
  chat: 'M21 12a8 8 0 0 1-12 7l-5 1 1-4.5A8 8 0 1 1 21 12z',
  candado: ['M5 11h14v10H5z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  ir: 'M9 6l6 6-6 6',
  check: 'M5 12l5 5 9-10',
  olla: ['M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z', 'M2 10h20', 'M9 6c0-1 1-2 3-2s3 1 3 2'],
  moto: ['M6 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M9 17h6l-3-8h3M6 14l3-5'],
  plato: ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'],
  casa: ['M3 10.5 12 3l9 7.5', 'M5.5 9.6V20.5h13V9.6', 'M9.6 20.5V15h4.8v5.5'],
};
const WHATSAPP = '51955797697';
const AVATARES = [...Array(24)].map((_, i) => i);
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const prop = (menu, nombre) => menu?.properties?.find((p) => p.name === nombre)?.value ?? 0;

/** El lunes a viernes de la semana que viene, igual que en /empezar. */
const semanaQueViene = () => {
  const hoy = moment();
  const dia = hoy.isoWeekday();
  const lunes = hoy.clone().add(8 - dia, 'days').startOf('day');
  return [...Array(5)].map((_, i) => lunes.clone().add(i, 'days'));
};
const estaSemana = () => {
  const lunes = moment().startOf('isoWeek');
  return [...Array(5)].map((_, i) => lunes.clone().add(i, 'days'));
};

/** La barra de abajo y el boton de comprar, que acompanan todas las pantallas. */
const Marco = ({ children }) => {
  const navigate = useNavigate();
  /* Quien ya tiene cuenta no tiene nada que hacer de visita. */
  let conSesion = false;
  try { conSesion = !!window.localStorage.getItem('aftkn'); } catch (e) { /* nada */ }
  useEffect(() => { if (!conSesion) entrarDeVisita(); }, [conSesion]);
  if (conSesion) return <Navigate to="/" replace />;

  const Tab = ({ a, texto, ico, fin }) => (
    <NavLink to={a} end={fin} className={({ isActive }) => (isActive ? 'afTab afTab--on' : 'afTab')}>
      <span className="afTab__caja">
        <svg className="afTab__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
             strokeLinecap="round" strokeLinejoin="round">
          {[].concat(ico).map((x) => <path key={x} d={x} />)}
        </svg>
        <span className="afTab__txt">{texto}</span>
      </span>
    </NavLink>
  );

  return (
    <main className="displayFlex pageLayout vis">
      <nav className="afTabs" aria-label="Navegación principal">
        <Tab a="/visita" fin texto="Inicio" ico={I.casa} />
        <Tab a="/visita/cuenta" texto="Cuenta" ico={I.yo} />
        <Tab a="/empezar" texto="Mi plan" ico={I.plan} />
      </nav>
      <div className="mainLayout">
        <div className="mainLayoutBox">{children}</div>
      </div>
      {createPortal(
        <div className="vis__pie">
          <button type="button" className="vis__comprar"
                  onClick={() => { vibrar.toque(); navigate('/empezar'); }}>
            Quiero mi plan
          </button>
        </div>, document.body)}
    </main>
  );
};

const AvisoVisita = () => (
  <p className="vis__aviso"><Ico d={I.ojo} w={2.2} /><span><b>Estás de visita.</b> Lo que ves es un ejemplo de cómo se usa.</span></p>
);

/* ------------------------------------------------------------------ Inicio */
export function VisitaInicio() {
  const navigate = useNavigate();
  const [dias, setDias] = useState(semanaQueViene);
  const [esProxima, setEsProxima] = useState(true);
  const [menu, setMenu] = useState(null);       // { 'YYYY-MM-DD': [platos] }
  const [sel, setSel] = useState(0);
  const [elegidos, setElegidos] = useState({});
  const avatar = avatarDeVisita();

  useEffect(() => {
    const f = (d) => d.format('YYYY-MM-DD');
    const traer = (semana) =>
      axios.get(`${API_URL}public/menu/schedule?startDate=${f(semana[0])}&endDate=${f(semana[4])}`)
        .then((r) => {
          const porDia = {};
          (r.data?.data ?? []).forEach((d) => {
            const almuerzos = (d.menuTypeGroups || []).find((g) => g.type === 'lunch')?.menuTypes ?? [];
            if (d.localDate) porDia[d.localDate] = almuerzos.map((m) => m.menu).filter((m) => m?.name);
          });
          return porDia;
        });
    const conPlatos = (porDia) => Object.values(porDia).some((p) => p.length);

    /* La semana que viene es lo que compraria. Pero cocina la publica hacia
       el final de la semana: mientras no este, se muestra la de ahora, que
       sirve igual para ver como se elige. */
    traer(dias)
      .then((proxima) => {
        if (conPlatos(proxima)) return setMenu(proxima);
        const actual = estaSemana();
        return traer(actual).then((ahora) => {
          setDias(actual);
          setEsProxima(false);
          setMenu(ahora);
        });
      })
      .catch(() => setMenu({}));
    // Una sola vez: la semana no cambia mientras se mira.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clave = dias[sel].format('YYYY-MM-DD');
  const platos = menu?.[clave] ?? [];
  const listos = Object.keys(elegidos).length;
  const ejemplo = menu && Object.values(menu).find((p) => p.length)?.[0]?.name;

  return (
    <Marco>
      <div className="inN">
        <span className="inN__brillo inN__brillo--menta" aria-hidden="true" />
        <span className="inN__brillo inN__brillo--cielo" aria-hidden="true" />

        <header className="inN__cab">
          <Link to="/visita/cuenta" className="inN__ava vis__ava" aria-label="Elige tu avatar">
            {avatar !== null
              ? <img src={`assets/img/avatars/avatar_${avatar}.jpg`} alt="" />
              : <span><Ico d={I.yo} /></span>}
            {avatar === null && <i aria-hidden="true">+</i>}
          </Link>
          <div className="inN__saludo">
            <p>{mayuscula(moment().format('dddd D [de] MMMM'))}</p>
            <h1>Hola, <em>bienvenido</em></h1>
          </div>
        </header>

        <AvisoVisita />

        {codigoGuardado() &&
          <p className="vis__invitado">
            <b>{invitadoPor() ? `${invitadoPor()} te invitó.` : 'Tienes un código de invitación.'}</b>{' '}
            2 entregas de regalo en tu primer plan.
          </p>}

        <section className="inN__hoy">
          <span className="inN__hoyBrillo" aria-hidden="true" />
          <div className="inN__hoyCab">
            <span className="inN__hoyEt">ASÍ SIGUES TU ALMUERZO</span>
            <span className="inN__hoyEstado"><i />En camino</span>
          </div>
          <div className="inN__hoyCuerpo">
            <h2 className="inN__hoyH">Llega antes de la <em>{REPARTO.hasta}</em></h2>
            <MotoEnCamino />
          </div>
          {ejemplo &&
            <div className="inN__hoyPlato">
              <span className="inN__cuad inN__cuad--menta"><Ico d={I.plato} /></span>
              <span><b>{String(ejemplo).replace(/\.$/, '')}</b><small>Con el refresco del día</small></span>
            </div>}
          <ol className="inN__ruta">
            {[I.olla, I.moto, I.check].map((d, i) => (
              <li key={i} className={`inN__paso${i <= 1 ? ' is-on' : ''}${i === 1 ? ' is-actual' : ''}`}>
                <span className="inN__rutaPunto"><Ico d={d} w={2.4} /></span>
                <span className="inN__pasoTxt">{['Preparando', 'En camino', 'Entregado'][i]}</span>
              </li>
            ))}
          </ol>
          <p className="vis__hoyNota">Con tu plan, aquí ves cada día cómo va tu pedido y te llega un aviso cuando sale.</p>
        </section>

        <section className="inN__card inN__semana">
          <div className="inN__cardCab">
            <h3>Tu semana</h3>
            <span><b>{listos}</b> de 5 días listos</span>
          </div>
          <p className="inN__ayuda">Es el menú real de {esProxima ? 'la próxima semana' : 'esta semana'}. Toca un día y elige, como lo haría un cliente.</p>

          <div className="inN__dias">
            {dias.map((x, i) => {
              const k = x.format('YYYY-MM-DD');
              const listo = elegidos[k] !== undefined;
              return (
                <button type="button" key={k}
                  className={`inN__dia inN__dia--${listo ? 'hecho' : 'elegir'}${sel === i ? ' is-sel' : ''}`}
                  aria-pressed={sel === i}
                  onClick={() => { vibrar.toque(); setSel(i); }}>
                  <span className="inN__diaN">{x.format('ddd').replace('.', '').toUpperCase()}</span>
                  <b>{x.format('D')}</b>
                  <span className="inN__diaM">{listo ? 'Listo' : '+ Elegir'}</span>
                </button>
              );
            })}
          </div>

          <div className="vis__platos" role="radiogroup" aria-label={`Platos del ${dias[sel].format('dddd')}`}>
            {menu === null && <p className="vis__vacio">Trayendo el menú…</p>}
            {menu !== null && platos.length === 0 &&
              <p className="vis__vacio">El menú de este día todavía no está publicado.</p>}
            {platos.map((m, i) => {
              const on = elegidos[clave] === i;
              const kcal = prop(m, 'calorias');
              const prot = prop(m, 'proteinas');
              return (
                <button type="button" key={m.id ?? m.name} role="radio" aria-checked={on}
                  className={`vis__plato${on ? ' is-on' : ''}`}
                  onClick={() => { vibrar.toque(); setElegidos((e) => ({ ...e, [clave]: i })); }}>
                  <span className={`vis__platoIco vis__platoIco--${i % 3}`}><Ico d={I.plato} w={1.8} /></span>
                  <span className="vis__platoTxt">
                    <b>{String(m.name).replace(/\.$/, '')}</b>
                    {(kcal > 0 || prot > 0) &&
                      <span className="vis__chips">
                        {kcal > 0 && <span className="vis__chip vis__chip--crema">{Math.round(kcal)} kcal</span>}
                        {prot > 0 && <span className="vis__chip vis__chip--cielo">{Math.round(prot)} g proteína</span>}
                      </span>}
                  </span>
                  <span className="vis__radio">{on && <Ico d={I.check} w={3.2} />}</span>
                </button>
              );
            })}
          </div>
          <p className="vis__nota">
            {listos >= 5 ? 'Armaste tu semana completa. Con tu plan, esto es lo que te llegaría.'
              : listos > 0 ? 'Así de fácil. Sigue con los otros días: de visita no se guarda ningún pedido.'
              : 'Es una prueba: de visita no se guarda ningún pedido.'}
          </p>
        </section>

        <section className="inN__card vis__plan">
          <span className="inN__chip">Tu plan</span>
          <b>Todavía no tienes uno</b>
          <p>Tres preguntas y te decimos cuál te conviene y cuánto cuesta por comida.</p>
          <button type="button" className="vis__btnTinta" onClick={() => { vibrar.toque(); navigate('/empezar'); }}>
            Descubrir mi plan
          </button>
        </section>
      </div>
    </Marco>
  );
}

/* --------------------------------------------------------------- Mi cuenta */
const Fila = ({ ico, tono, titulo, sub, a, href, candado }) => {
  const dentro = (
    <>
      <span className={`cuN__ico cuN__ico--${tono}`}><Ico d={ico} /></span>
      <span className="cuN__filaTxt"><b>{titulo}</b>{sub && <small>{sub}</small>}</span>
      {candado
        ? <span className="vis__candado"><Ico d={I.candado} w={2.6} />Con tu plan</span>
        : <span className="cuN__ir"><Ico d={I.ir} /></span>}
    </>
  );
  if (a) return <Link className="cuN__fila" to={a}>{dentro}</Link>;
  if (href) return <a className="cuN__fila" href={href} target="_blank" rel="noreferrer">{dentro}</a>;
  return <div className="cuN__fila vis__cerrada">{dentro}</div>;
};

/** El codigo de un amigo, escrito antes de tener cuenta. Se revisa contra el
    servidor solo para saber de quien es; si le vale o no se decide al pagar. */
function CodigoDeVisita() {
  const [codigo, setCodigo] = useState(codigoGuardado());
  const [nombre, setNombre] = useState(invitadoPor());
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [revisando, setRevisando] = useState(false);

  const aplicar = () => {
    const limpio = limpiarCodigo(texto);
    if (!limpio) return setError('Escribe el código que te pasaron.');
    setRevisando(true);
    setError('');
    axios.get(`${API_URL}public/referidos/${encodeURIComponent(limpio)}`)
      .then((r) => {
        const d = r.data?.data ?? {};
        if (!d.valido) return setError('Ese código no existe. Revísalo con quien te invitó.');
        guardarCodigo(d.codigo || limpio, d.nombre);
        setCodigo(d.codigo || limpio);
        setNombre(d.nombre || '');
        setAbierto(false);
        vibrar.exito();
      })
      .catch(() => setError('No pudimos revisar el código. Inténtalo de nuevo.'))
      .finally(() => setRevisando(false));
  };

  if (codigo) {
    return (
      <div className="cuN__fila vis__cerrada">
        <span className="cuN__ico cuN__ico--menta"><Ico d={I.regalo} /></span>
        <span className="cuN__filaTxt">
          <b>{codigo}</b>
          <small>{nombre ? `${nombre} te invitó · ` : ''}2 entregas de regalo al comprar</small>
        </span>
        <button type="button" className="vis__quitar"
                onClick={() => { olvidarCodigo(); setCodigo(''); setNombre(''); setTexto(''); }}>Quitar</button>
      </div>
    );
  }
  if (!abierto) {
    return (
      <button type="button" className="cuN__fila" onClick={() => { vibrar.toque(); setAbierto(true); }}>
        <span className="cuN__ico cuN__ico--gris"><Ico d={I.regalo} /></span>
        <span className="cuN__filaTxt"><b>Tengo un código de invitación</b><small>Gana 2 entregas en tu primer plan</small></span>
        <span className="cuN__ir"><Ico d={I.ir} /></span>
      </button>
    );
  }
  return (
    <div className="vis__codigo">
      <label htmlFor="codigoVisita">Código de invitación</label>
      <div>
        <input id="codigoVisita" value={texto} placeholder="Ej. DIANA947" maxLength={16}
               autoCapitalize="characters" autoCorrect="off" autoComplete="off"
               onChange={(e) => { setTexto(e.target.value.toUpperCase()); setError(''); }} />
        <button type="button" disabled={revisando} onClick={aplicar}>{revisando ? 'Revisando…' : 'Aplicar'}</button>
      </div>
      {error && <p>{error}</p>}
    </div>
  );
}

export function VisitaCuenta() {
  const [avatar, setAvatar] = useState(avatarDeVisita());
  const dir = direccionDeVisita();
  const elegir = (n) => { vibrar.toque(); guardarAvatarDeVisita(n); setAvatar(String(n)); };

  return (
    <Marco>
      <div className="cuN">
        <h1 className="cuN__h">Mi <em>cuenta</em></h1>

        <section className="cuN__ficha">
          <span className="cuN__cielo" aria-hidden="true" />
          <span className="cuN__ava">
            {avatar !== null
              ? <img src={`/assets/img/avatars/avatar_${avatar}.jpg`} alt="Tu avatar" />
              : <span>?</span>}
          </span>
          <b className="cuN__nombre">Invitado</b>
          <span className="cuN__tel">Aquí irá tu nombre y tu celular</span>
          <span className="vis__sinPlan">Sin plan todavía</span>

          <p className="cuN__avaEt">Elige tu avatar, lo guardamos para ti</p>
          <div className="cuN__avatares" role="radiogroup" aria-label="Elige tu avatar">
            {AVATARES.map((n) => {
              const on = String(n) === String(avatar);
              return (
                <button type="button" key={n} role="radio" aria-checked={on} aria-label={`Avatar ${n + 1}`}
                  className={`cuN__avaOp${on ? ' is-on' : ''}`} onClick={() => elegir(n)}>
                  <img src={`/assets/img/avatars/avatar_${n}.jpg`} alt="" loading="lazy" />
                </button>
              );
            })}
          </div>
        </section>

        <p className="cuN__grupo">PUEDES PROBAR YA</p>
        <nav className="cuN__lista" aria-label="Puedes probar ya">
          <Fila ico={I.pin} tono="crema" titulo="Direcciones" a="/visita/direccion"
                sub={dir?.calle ? `${dir.calle}${dir.enCobertura ? ' · sí llegamos' : ''}` : 'Marca tu casa u oficina y mira si llegamos'} />
          <Fila ico={I.plan} tono="mentaFuerte" titulo="Descubrir mi plan" a="/empezar"
                sub="Tres preguntas y te decimos cuál y cuánto" />
          <CodigoDeVisita />
          <Fila ico={I.chat} tono="menta" titulo="Escríbenos" sub="Por WhatsApp" href={`https://wa.me/${WHATSAPP}`} />
        </nav>

        <p className="cuN__grupo">SE ABRE CON TU PLAN</p>
        <nav className="cuN__lista" aria-label="Se abre con tu plan">
          <Fila ico={I.pagos} tono="gris" titulo="Mis pagos" sub="Tus comprobantes y renovaciones" candado />
          <Fila ico={I.regalo} tono="gris" titulo="Allpa+ · Tus beneficios" sub="Descuentos en gimnasios, terapia y cursos" candado />
          <Fila ico={I.chat} tono="gris" titulo="Invita y come gratis" sub="Gana entregas por cada amigo que compre" candado />
        </nav>

        <p className="vis__entrar">¿Ya tienes cuenta? <Link to="/ingresar">Ingresa</Link></p>
      </div>
    </Marco>
  );
}
