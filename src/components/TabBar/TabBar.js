import React from "react";
import { NavLink } from 'react-router-dom';
import './TabBar.scss';

/**
 * Reemplaza el menu hamburguesa. Una app se navega sin gestos: las cuatro
 * secciones estan siempre a la vista.
 *
 * "Mi plan" es nueva: antes no existia ninguna entrada para ver el plan, los
 * envios restantes ni comprar. El unico enlace a /planes aparecia dentro del
 * saludo, y solo despues de consumir 15 de 20 envios.
 */
const TABS = [
  { a: '/',            texto: 'Inicio',  icono: 'home' },
  { a: '/menu',        texto: 'Mi menú', icono: 'menu' },
  { a: '/mi-plan',     texto: 'Mi plan', icono: 'plan' },
  { a: '/perfil',      texto: 'Cuenta',  icono: 'user' },
];

const Icono = ({ nombre }) => {
  const comun = {
    className: 'afTab__ic', viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (nombre === 'home') return (
    <svg {...comun}><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.6V20.5h13V9.6"/><path d="M9.6 20.5V15h4.8v5.5"/></svg>
  );
  if (nombre === 'menu') return (
    <svg {...comun}><rect x="3.5" y="4.5" width="17" height="16" rx="3.2"/><path d="M3.5 9.5h17M8 2.6v3.8M16 2.6v3.8"/><path d="m9 14.6 2 2 4-4"/></svg>
  );
  if (nombre === 'plan') return (
    <svg {...comun}><rect x="2.5" y="5" width="19" height="14" rx="3.2"/><path d="M2.5 10h19M6.5 15h4"/></svg>
  );
  return (
    <svg {...comun}><circle cx="12" cy="8" r="3.6"/><path d="M4.6 20.4c0-3.7 3.4-5.6 7.4-5.6s7.4 1.9 7.4 5.6"/></svg>
  );
};

const TabBar = () => (
  <nav className="afTabs" aria-label="Navegación principal">
    {TABS.map((t) => (
      <NavLink
        key={t.a}
        to={t.a}
        end={t.a === '/'}
        className={({ isActive }) => isActive ? 'afTab afTab--on' : 'afTab'}
      >
        {/* Solo la pestaña activa muestra su nombre: se expande en una pildora
            clara y las demas quedan en icono. Da la referencia de donde estas
            sin repetir cuatro etiquetas que nadie lee. */}
        <span className="afTab__caja">
          <Icono nombre={t.icono} />
          <span className="afTab__txt">{t.texto}</span>
        </span>
      </NavLink>
    ))}
  </nav>
);

export default TabBar;
