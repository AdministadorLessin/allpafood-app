// El centro: lo que te esta pasando y lo que necesitas saber, en una sola hoja.
//
// Dos pestañas, no dos puertas. "Avisos" es lo de hoy —salio a ruta, vas con
// retraso, te falta elegir—; "Ayuda" son las diez respuestas que antes solo
// existian en el WhatsApp de ventas. Se abre con la campana del Inicio.
//
// La hoja sube sobre la pantalla, que queda desenfocada detras. Los avisos
// son una lista con lineas finas: el que todavia no se leyo lleva el circulo
// menta y un punto; el leido, el circulo gris.

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import Hoja from './Hoja';
import './Centro.scss';
import { TEMAS, WHATSAPP_ATENCION } from './contenido';
import { leerLeidos } from './avisos';
import { useCentro } from './CentroContext';
import { useAuthContext } from '../../context/authContext';
import { vibrar } from '../../nativo';
import RodrigoCara from '../ultil/RodrigoCara/RodrigoCara';
import { cascada, sube, resorte } from '../../movimiento';

export const TERMINOS = 'https://allpafood.com/terminos';

const ICONOS = {
  moto: ['M6 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M9 17h6l-3-8h3M6 14l3-5'],
  calendario: ['M6 5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z', 'M3 10h18M8 3v4M16 3v4'],
  regalo: ['M5 9h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', 'M2 9h20M12 9v12M12 9C10 9 7 8 7 6s3-3 5 3zM12 9c2 0 5-1 5-3s-3-3-5 3z'],
  recibo: ['M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z', 'M10 8h4M10 12h4'],
  reloj: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  visto: ['M5 12l5 5 9-10'],
  chat: ['M21 12a8 8 0 0 1-12 7l-5 1 1-4.5A8 8 0 1 1 21 12z'],
  ir: ['M9 6l6 6-6 6'],
  atras: ['M15 6l-6 6 6 6'],
  mas: ['M12 5v14M5 12h14'],
};

const Ico = ({ nombre, w = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {(ICONOS[nombre] || ICONOS.reloj).map((d) => <path key={d} d={d} />)}
  </svg>
);

/* El icono sale del hecho, no del tono: el id de cada aviso empieza con lo
   que paso (ruta-, programar-, pocos-...). En una lista de cuatro lineas la
   forma se distingue antes que el texto. */
const ICO_HECHO = {
  retraso: 'reloj', ruta: 'moto', entregado: 'visto', programar: 'calendario',
  pocos: 'recibo', vence: 'recibo', credito: 'regalo',
};
const iconoDe = (aviso) => ICO_HECHO[String(aviso.id).split('-')[0]] || 'reloj';

/** Una pregunta que se abre. La altura se anima, no salta. */
const Pregunta = ({ dato, quieto }) => {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className={`afCentro__qa${abierta ? ' is-abierta' : ''}`}>
      <button type="button" onClick={() => { vibrar.toque(); setAbierta((v) => !v); }} aria-expanded={abierta}>
        <span>{dato.q}</span>
        <motion.span className="afCentro__signo" aria-hidden="true"
          animate={{ rotate: abierta ? 45 : 0 }} transition={quieto ? { duration: 0 } : resorte.toque}>
          <Ico nombre="mas" w={2.4} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {abierta &&
          <motion.div
            className="afCentro__resp"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={quieto ? { duration: 0 } : resorte.entra}
          >
            <div>
              {dato.a.map((p, i) => (
                <p key={i} className={p.fuerte ? 'es-clave' : ''}>{p.fuerte || p}</p>
              ))}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>
  );
};

export default function Centro() {

  const navigate = useNavigate();
  const quieto = useReducedMotion();
  const { planInfo, token } = useAuthContext();
  const { avisos, abierto, cerrar, pestana, setPestana } = useCentro();
  const [tema, setTema] = useState(null);

  /* Abrir el centro marca todo como leido (lo hace el contexto, despues de
     pintar). Para poder mostrar cuales eran nuevos, se mira aqui, al pintar,
     lo que ya estaba leido antes de abrir. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const yaLeidos = useMemo(() => leerLeidos(), [abierto]);
  const nuevos = avisos.filter((a) => !yaLeidos.has(a.id)).length;

  // Cada vez que se abre, se abre en el indice: caer dentro de un tema que ya
  // se leyo obliga a retroceder antes de poder buscar otra cosa. Se hace al
  // abrir y no al cerrar, para no cambiar el contenido mientras la hoja baja.
  const [eraAbierto, setEraAbierto] = useState(abierto);
  if (abierto !== eraAbierto) {
    setEraAbierto(abierto);
    if (abierto) setTema(null);
  }

  const nombre = planInfo?.profile?.name || '';
  const plan = planInfo?.plan?.description || planInfo?.planDescription || '';

  /* El mensaje sale escrito: atencion ya sabe quien es y que le pasa, sin
     volver a preguntarle los datos. */
  const enlaceWhatsapp = (motivo) => {
    const lineas = [
      nombre ? `Hola, soy ${nombre}.` : 'Hola.',
      plan ? `Plan ${plan}.` : '',
      motivo ? `Motivo: ${motivo}.` : '',
    ].filter(Boolean);
    return `https://wa.me/${WHATSAPP_ATENCION}?text=${encodeURIComponent(lineas.join('\n'))}`;
  };

  const ir = (ruta) => { vibrar.toque(); cerrar(); navigate(ruta); };

  const actual = pestana === 'ayuda' ? TEMAS.find((t) => t.id === tema) : null;

  const lista = cascada(quieto ? 0 : 0.045, 0.04);
  const fila = quieto ? { oculto: { opacity: 1 }, visible: { opacity: 1 } } : sube;

  const cabecera = actual
    ? <div className="afCentro__cabTema">
        <button type="button" className="afCentro__volver" aria-label="Volver a la ayuda"
          onPointerDown={(e) => e.stopPropagation()} onClick={() => { vibrar.toque(); setTema(null); }}>
          <Ico nombre="atras" w={2.4} />
        </button>
        <h1>{actual.titulo}</h1>
      </div>
    : <h1 className="afCentro__h">{pestana === 'avisos' ? 'Avisos' : 'Ayuda'}</h1>;

  return (
    <Hoja abierta={abierto} alCerrar={cerrar} etiqueta="Avisos y ayuda" clase="afCentro" cabecera={cabecera}>

      {/* El selector solo manda en el indice. Dentro de un tema estorba:
          ahi lo que toca es volver. */}
      {!actual &&
        <div className="afCentro__seg" role="tablist">
          {/* La pastilla es una sola y se desliza. Va con x y no con layoutId:
              en esta version de motion, una pieza con layoutId que se desmonta
              dentro de una hoja abierta deja la hoja sin poder cerrarse. */}
          <motion.span
            className="afCentro__segPastilla" aria-hidden="true"
            initial={false}
            animate={{ x: pestana === 'avisos' ? '0%' : '100%' }}
            transition={quieto ? { duration: 0 } : resorte.toque}
          />
          {[
            { id: 'avisos', t: 'Avisos', n: nuevos },
            { id: 'ayuda', t: 'Ayuda', n: 0 },
          ].map((s) => (
            <button
              key={s.id} type="button" role="tab"
              aria-selected={pestana === s.id}
              className={pestana === s.id ? 'is-on' : ''}
              onClick={() => { vibrar.toque(); setPestana(s.id); }}
            >
              <span className="afCentro__segTxt">{s.t}{s.n > 0 && <i>{s.n}</i>}</span>
            </button>
          ))}
        </div>
      }

      {pestana === 'avisos' &&
        <motion.div key="avisos" className="afCentro__lista" variants={lista} initial="oculto" animate="visible">
          {avisos.length === 0
            ? <motion.div className="afCentro__vacio" variants={fila}>
                <span className="afCentro__vacioIco"><Ico nombre="visto" w={2.6} /></span>
                <b>Todo al día</b>
                <p>No tienes nada pendiente por ahora. Si algo cambia con tu almuerzo o con tu plan, te lo contamos aquí.</p>
                <button type="button" className="afCentro__enlace" onClick={() => setPestana('ayuda')}>
                  Ver la ayuda
                </button>
              </motion.div>
            : avisos.map((a) => {
                const nuevo = !yaLeidos.has(a.id);
                return (
                  <motion.button
                    key={a.id} type="button" variants={fila}
                    className={`afCentro__av${nuevo ? ' is-nuevo' : ''}`}
                    onClick={() => ir(a.ruta)}
                  >
                    <span className="afCentro__avIco">
                      <Ico nombre={iconoDe(a)} />
                      {nuevo && <i aria-hidden="true" />}
                    </span>
                    <span className="afCentro__avTxt">
                      <span className="afCentro__avCab">
                        <b>{a.titulo}{nuevo && <span className="afCentro__oculto">, sin leer</span>}</b>
                        <small>{String(a.cuando || '').toLowerCase()}</small>
                      </span>
                      <small className="afCentro__avBaja">{a.texto}</small>
                      {a.accion && <span className="afCentro__avIr">{a.accion}</span>}
                    </span>
                  </motion.button>
                );
              })}
        </motion.div>
      }

      {pestana === 'ayuda' && !actual &&
        <motion.div key="temas" className="afCentro__temas" variants={lista} initial="oculto" animate="visible">
          <div className="afCentro__lista">
            {TEMAS.map((t) => (
              <motion.button
                key={t.id} type="button" className="afCentro__fila"
                variants={fila} onClick={() => { vibrar.toque(); setTema(t.id); }}
              >
                <span className="afCentro__ico"><Ico nombre={t.icono} /></span>
                <span className="afCentro__filaTxt">
                  <b>{t.titulo}</b>
                  <small>{t.bajada}</small>
                </span>
                <span className="afCentro__chev"><Ico nombre="ir" w={2.4} /></span>
              </motion.button>
            ))}
          </div>

          {/* Primero Rodrigo: resuelve en el momento lo que una persona
              tardaria en contestar (dónde está el pedido, cambiar el plato,
              una devolución) y, si hace falta, pasa el caso a una persona
              con el resumen. WhatsApp queda como salida chica, al final. */}
          {token ? (
            <motion.button
              type="button" className="afCentro__persona" variants={fila}
              whileTap={quieto ? undefined : { scale: 0.98 }}
              onClick={() => ir('/rodrigo')}
            >
              <span className="afCentro__rodrigo"><RodrigoCara size={46} /></span>
              <span className="afCentro__filaTxt">
                <b>Pregúntale a Rodrigo</b>
                <small>Resuelve tu pedido al toque. Si hace falta, te pasa con una persona.</small>
              </span>
              <span className="afCentro__chev"><Ico nombre="ir" w={2.4} /></span>
            </motion.button>
          ) : (
            <motion.a
              className="afCentro__persona" variants={fila}
              whileTap={quieto ? undefined : { scale: 0.98 }}
              href={enlaceWhatsapp('')} target="_blank" rel="noreferrer"
              onClick={cerrar}
            >
              <span className="afCentro__ico"><Ico nombre="chat" /></span>
              <span className="afCentro__filaTxt">
                <b>Hablar con una persona</b>
                <small>Atención al cliente por WhatsApp</small>
              </span>
              <span className="afCentro__chev"><Ico nombre="ir" w={2.4} /></span>
            </motion.a>
          )}
          {token &&
            <motion.p className="afCentro__otra" variants={fila}>
              <a href={enlaceWhatsapp('')} target="_blank" rel="noreferrer" onClick={cerrar}>
                Prefiero escribir por WhatsApp
              </a>
            </motion.p>}
        </motion.div>
      }

      {actual &&
        <motion.div key={actual.id} className="afCentro__tema" variants={lista} initial="oculto" animate="visible">
          <motion.p className="afCentro__baja" variants={fila}>{actual.bajada}</motion.p>

          <div className="afCentro__lista">
            {actual.preguntas.map((p) => (
              <motion.div key={p.q} variants={fila}>
                <Pregunta dato={p} quieto={quieto} />
              </motion.div>
            ))}
          </div>

          <motion.div className="afCentro__cola" variants={fila}>
            <p>¿No encuentras lo tuyo?</p>
            {token ? (
              <>
                <button type="button" className="nHoja__btn" onClick={() => ir('/rodrigo')}>
                  <RodrigoCara size={26} />Pregúntale a Rodrigo
                </button>
                <a className="afCentro__otraLink" href={enlaceWhatsapp(actual.titulo.toLowerCase())}
                  target="_blank" rel="noreferrer" onClick={cerrar}>
                  O escribe a atención al cliente
                </a>
              </>
            ) : (
              <a
                className="nHoja__btn"
                href={enlaceWhatsapp(actual.titulo.toLowerCase())}
                target="_blank" rel="noreferrer" onClick={cerrar}
              >
                <Ico nombre="chat" />Escribir a atención al cliente
              </a>
            )}
          </motion.div>
        </motion.div>
      }

      {/* El pie de la hoja, siempre abajo. */}
      {!actual && pestana === 'avisos' &&
        <p className="afCentro__pie">Desliza hacia abajo para cerrar</p>}
      {!actual && pestana === 'ayuda' &&
        <p className="afCentro__pie">
          <a href={TERMINOS} target="_blank" rel="noreferrer">Términos y condiciones</a>
        </p>}
    </Hoja>
  );
}
