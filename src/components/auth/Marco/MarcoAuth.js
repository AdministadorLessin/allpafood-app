import React from "react";
import { Link } from 'react-router-dom';

import './MarcoAuth.scss';
import isotipo from '../../../assets/img/isotipo_allpafood.png';
import { Cascada, Bloque } from './../../ultil/Motion/Motion';

/* Las cuatro fases reales entre "quiero probar" y "ya tengo mi plan". Estan
   aqui, en un solo sitio, porque hasta ahora cada pantalla del embudo era una
   isla: el cliente no sabia cuanto le faltaba y abandonaba sin saber que
   estaba a dos pasos. */
export const FASES = [
  { clave: 'cuenta', nombre: 'Cuenta', pasos: 3 },
  { clave: 'perfil', nombre: 'Perfil', pasos: 3 },
  { clave: 'plan',   nombre: 'Plan',   pasos: 1 },
  { clave: 'pago',   nombre: 'Pago',   pasos: 1 },
];

/**
 * Barra de avance del embudo entero.
 *
 * Un segmento por fase. El de la fase actual se llena en proporcion al paso
 * dentro de ella, asi que el avance nunca se queda quieto tres pantallas
 * seguidas.
 */
const Progreso = ({ fase, paso }) => {
  const indice = FASES.findIndex((f) => f.clave === fase);
  if (indice < 0) return null;
  const actual = FASES[indice];

  return (
    <div className="afAvance">
      <div className="afAvance__barra">
        {FASES.map((f, i) => {
          const lleno = i < indice ? 100
            : i > indice ? 0
            : Math.round(((paso + 1) / f.pasos) * 100);
          return (
            <span className="afAvance__seg" key={f.clave}>
              <i style={{ width: `${lleno}%` }} />
            </span>
          );
        })}
      </div>
      <p className="afAvance__pie">
        <span>
          <b>{actual.nombre}</b>
          {actual.pasos > 1 && ` · paso ${paso + 1} de ${actual.pasos}`}
        </span>
        <span>Fase {indice + 1} de {FASES.length}</span>
      </p>
    </div>
  );
};

/**
 * El marco de todas las pantallas de registro, ingreso y compra.
 *
 * Antes cada una traia su propio fondo, su propio ancho y su propia
 * tipografia: el cliente cruzaba tres disenos distintos antes de pagar y el
 * cuarto —el panel— no se parecia a ninguno. Aqui se usa el mismo ancho, el
 * mismo degradado y la misma escala que el panel, para que la app se sienta
 * una sola cosa desde la primera pantalla.
 */
const MarcoAuth = ({ fase, paso = 0, children, volver }) => (
  <main className="afAuth">
    <Cascada className="afAuth__col">

      <Bloque className="afAuth__top">
        {volver ?
          <button type="button" className="afAuth__volver" onClick={volver} aria-label="Volver">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
          </button>
        :
          <Link to="/ingresar" className="afAuth__marca">
            <img src={isotipo} alt="" />
            <span>Allpa Food</span>
          </Link>
        }
        {volver &&
          <span className="afAuth__marca afAuth__marca--centro">
            <img src={isotipo} alt="" />
            <span>Allpa Food</span>
          </span>
        }
      </Bloque>

      {fase && <Bloque><Progreso fase={fase} paso={paso} /></Bloque>}

      {children}
    </Cascada>
  </main>
);

export default MarcoAuth;
