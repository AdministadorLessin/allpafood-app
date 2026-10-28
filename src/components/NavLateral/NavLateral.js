// Navegacion de escritorio.
//
// En el celular la navegacion es la barra de abajo. En la computadora habia
// una columna de iconos sin nombre —y con entradas que ya no llevan a ningun
// lado— que el cliente no usaba: no se entiende un icono suelto, y encima
// dejaba el panel metido en una tira estrecha al centro de una pantalla ancha.
//
// Aqui cada seccion va con su nombre, en el orden en que se usan: primero lo
// de esta semana, despues el plan, al final la cuenta. Abajo, quien eres.

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import './NavLateral.scss';
import { useCentro } from '../Centro/CentroContext';
import logo from '../../assets/img/logo_allpafood.png';
import { motion, alToque } from '../ultil/Motion/Motion';

const Ico = ({ n }) => {
  const c = {
    className: 'afNav__ic', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (n === 'home') return <svg {...c}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.6V20.5h13V9.6" /><path d="M9.6 20.5V15h4.8v5.5" /></svg>;
  if (n === 'menu') return <svg {...c}><rect x="3.5" y="4.5" width="17" height="16" rx="3.2" /><path d="M3.5 9.5h17M8 2.6v3.8M16 2.6v3.8" /><path d="m9 14.6 2 2 4-4" /></svg>;
  if (n === 'plan') return <svg {...c}><rect x="2.5" y="5" width="19" height="14" rx="3.2" /><path d="M2.5 10h19M6.5 15h4" /></svg>;
  if (n === 'pin') return <svg {...c}><path d="M12 21.2s6.4-6.2 6.4-11a6.4 6.4 0 1 0-12.8 0c0 4.8 6.4 11 6.4 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>;
  if (n === 'plus') return <svg {...c}><path d="M12 3.5l2.5 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9 6.8 19.6l1.1-5.8L3.6 9.7l5.9-.8L12 3.5z" /></svg>;
  if (n === 'recibo') return <svg {...c}><path d="M5.5 3.5h13v17l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5v-17Z" /><path d="M9 9h6M9 13h6" /></svg>;
  if (n === 'salud') return <svg {...c}><path d="M12 20.3S4.2 15.7 4.2 10.2A3.9 3.9 0 0 1 12 8.4a3.9 3.9 0 0 1 7.8 1.8c0 5.5-7.8 10.1-7.8 10.1Z" /></svg>;
  if (n === 'ayuda') return <svg {...c}><circle cx="12" cy="12" r="8.6" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4" /><path d="M12 17h.01" /></svg>;
  return <svg {...c}><circle cx="12" cy="8" r="3.6" /><path d="M4.6 20.4c0-3.7 3.4-5.6 7.4-5.6s7.4 1.9 7.4 5.6" /></svg>;
};

/* El orden es el de la semana del cliente: lo que tiene que hacer, lo que
   recibe, lo que pago. Soporte al final, que es donde se busca. */
const SECCIONES = [
  { grupo: 'Mi semana', items: [
    { a: '/', texto: 'Inicio', icono: 'home', exacto: true },
    { a: '/menu', texto: 'Mi menú', icono: 'menu' },
    { a: '/ubicaciones', texto: 'Mis direcciones', icono: 'pin' },
  ]},
  { grupo: 'Mi plan', items: [
    { a: '/mi-plan', texto: 'Mi plan', icono: 'plan' },
    { a: '/beneficios', texto: 'Allpa+', icono: 'plus' },
    { a: '/facturacion', texto: 'Mis pagos', icono: 'recibo' },
  ]},
  { grupo: 'Más', items: [
    { a: '/salud-y-bienestar', texto: 'Salud y bienestar', icono: 'salud' },
  ]},
];

const NavLateral = () => {
  const navigate = useNavigate();
  const { abrir, sinLeer } = useCentro();

  /* El avatar y el nombre salen de lo guardado al entrar. Si viniera a medias
     —pasa con quien se dio de alta desde el panel— se muestra la inicial. */
  let inf = null;
  try { inf = JSON.parse(window.localStorage.getItem('inf')); } catch (e) { inf = null; }
  const nombre = inf?.profile?.name ? String(inf.profile.name).split(' ')[0] : null;
  const avatar = inf?.profile?.image;

  return (
    <aside className="afNav" aria-label="Navegación">
      <div className="afNav__marca">
        <img src={logo} alt="Allpa Food" />
      </div>

      <nav className="afNav__menu">
        {SECCIONES.map((s) => (
          <div className="afNav__grupo" key={s.grupo}>
            <p className="afNav__grupoT">{s.grupo}</p>
            {s.items.map((i) => (
              <NavLink
                key={i.a}
                to={i.a}
                end={i.exacto}
                className={({ isActive }) => (isActive ? 'afNav__item afNav__item--on' : 'afNav__item')}
              >
                <Ico n={i.icono} />
                <span>{i.texto}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {/* En escritorio no hay barra de abajo, asi que el centro entra por
            aqui. Lleva el punto igual que en el celular. */}
        <div className="afNav__grupo">
          <p className="afNav__grupoT">Soporte</p>
          <button type="button" className="afNav__item afNav__item--centro" onClick={() => abrir()}>
            <Ico n="ayuda" />
            <span>Avisos y ayuda</span>
            {sinLeer > 0 && <i className="afNav__punto">{sinLeer}</i>}
          </button>
        </div>
      </nav>

      {/* Quien eres, y el camino a tu cuenta. Va abajo y anclado: es lo que
          menos se toca, pero da la seguridad de estar en la cuenta correcta. */}
      <motion.button type="button" className="afNav__yo" onClick={() => navigate('/perfil')} {...alToque}>
        <span className="afNav__ava">
          {avatar
            ? <img src={`/assets/img/avatars/avatar_${avatar}.jpg`} alt="" />
            : <span className="afNav__inicial">{(nombre || '?').charAt(0).toUpperCase()}</span>}
        </span>
        <span className="afNav__yoTxt">
          <b>{nombre || 'Mi cuenta'}</b>
          <small>Ver mi cuenta</small>
        </span>
      </motion.button>
    </aside>
  );
};

export default NavLateral;
