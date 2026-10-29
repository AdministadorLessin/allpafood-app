import React, { useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

import './MarcoAuth.scss';
import isotipo from '../../../assets/img/isotipo_allpafood.png';
import { Cascada, Bloque } from './../../ultil/Motion/Motion';
import { esNativo, vibrar } from '../../../nativo';

/* Las cuatro fases reales entre "quiero probar" y "ya tengo mi plan". Estan
   aqui, en un solo sitio, porque hasta ahora cada pantalla del embudo era una
   isla: el cliente no sabia cuanto le faltaba y abandonaba sin saber que
   estaba a dos pasos. */
/* El embudo nuevo. 'perfil' ya no esta en la barra: el cuestionario se
   pregunta ahora en 'empezar', antes de pedir el telefono, y la direccion se
   pide al final, cuando el pago ya esta hecho. El registro viejo sigue
   pasando fase="perfil" y en ese caso no se dibuja barra, como hasta ahora. */
export const FASES = [
  { clave: 'empezar',   nombre: 'Tu objetivo',  pasos: 3 },
  { clave: 'cuenta',    nombre: 'Cuenta',       pasos: 3 },
  { clave: 'plan',      nombre: 'Plan',         pasos: 1 },
  { clave: 'pago',      nombre: 'Pago',         pasos: 1 },
  { clave: 'direccion', nombre: 'Entrega',      pasos: 1 },
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
/* Dentro del app, el registro cuenta los nueve pasos donde el cliente hace
   algo —zona, objetivo, plan, numero, codigo, datos, pago, direccion y "para
   tu cocina"— en una sola barra. Las fases de arriba siguen siendo las de la
   web. */
const PASOS_APP = 9;
const pasoEnApp = (fase, paso) => (
  fase === 'empezar' ? paso + 1
  : fase === 'cuenta' ? paso + 4
  : fase === 'pago' ? 7
  : fase === 'direccion' ? 8
  : fase === 'cocina' ? 9
  : null
);

/**
 * El boton principal de la pantalla.
 *
 * En la web va donde se escribe. En el app va fijo abajo, al alcance del
 * pulgar, y sube con el teclado: se dibuja fuera de la pantalla (en el body)
 * porque cualquier contenedor animado con transform haria que "fijo" se
 * midiera contra el y no contra el telefono. Un boton de enviar que quede
 * afuera del <form> necesita el atributo form="id" para seguir enviandolo.
 */
export const Accion = ({ children }) => (
  esNativo
    ? createPortal(<div className="afNatPie" onClickCapture={() => vibrar.toque()}>{children}</div>, document.body)
    : <>{children}</>
);

const MarcoNativo = ({ fase, paso, children, volver, sinVolver }) => {
  const navigate = useNavigate();
  const n = pasoEnApp(fase, paso);

  /* Sin un "volver" propio, la flecha regresa a la pantalla anterior; si se
     entro directo (sin historial), a la bienvenida. */
  const atras = volver || (() => (window.history.length > 1 ? navigate(-1) : navigate('/ingresar')));

  /* El boton atras de Android hace lo mismo que la flecha: retrocede un paso
     dentro de la pantalla en vez de salir de ella. */
  const volverRef = useRef(volver);
  volverRef.current = volver;
  useEffect(() => {
    const alAtras = (e) => {
      if (volverRef.current) { e.preventDefault(); volverRef.current(); }
    };
    window.addEventListener('af-atras', alAtras);
    return () => window.removeEventListener('af-atras', alAtras);
  }, []);

  /* Deslizar desde el borde izquierdo hacia la derecha vuelve atras, como en
     cualquier app de iPhone. Solo cuenta si el dedo empieza pegado al borde
     y el gesto es claramente horizontal, para no confundirlo con bajar la
     pantalla. */
  const gesto = useRef(null);
  const alTocar = (e) => {
    const t = e.touches[0];
    gesto.current = (!sinVolver && t.clientX < 24) ? { x: t.clientX, y: t.clientY } : null;
  };
  const alSoltar = (e) => {
    const g = gesto.current;
    gesto.current = null;
    if (!g) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - g.x;
    const dy = Math.abs(t.clientY - g.y);
    if (dx > 70 && dy < 50) { vibrar.toque(); atras(); }
  };

  return (
    <main className="afAuth afAuth--nat" onTouchStart={alTocar} onTouchEnd={alSoltar}>
      <header className="afNat__top">
        {!sinVolver &&
          <button type="button" className="afNat__volver" onClick={atras} aria-label="Volver">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        }
        {n &&
          <>
            <div className="afNat__barra" role="progressbar" aria-valuemin={1}
                 aria-valuemax={PASOS_APP} aria-valuenow={n}>
              <i style={{ transform: `scaleX(${n / PASOS_APP})` }} />
            </div>
            <span className="afNat__cuenta">{n}/{PASOS_APP}</span>
          </>
        }
      </header>
      <div className="afAuth__col">{children}</div>
    </main>
  );
};

const MarcoAuth = (props) => (
  esNativo ? <MarcoNativo {...props} /> : <MarcoWeb {...props} />
);

const MarcoWeb = ({ fase, paso = 0, children, volver }) => (
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
