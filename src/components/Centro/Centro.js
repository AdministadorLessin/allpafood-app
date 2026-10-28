// El centro: lo que te esta pasando y lo que necesitas saber, en una sola hoja.
//
// Dos pestañas, no dos puertas. "Avisos" es lo de hoy —salio a ruta, vas con
// retraso, te falta elegir—; "Ayuda" son las diez respuestas que antes solo
// existian en el WhatsApp de ventas. Se entra desde la barra de abajo, al lado
// de las secciones, porque un boton flotando sobre el contenido se lee como
// algo pegado encima del app y no como parte de el.
//
// En la lista cada aviso ocupa una linea. El texto largo aparece al abrirlo:
// seis parrafos a la vez no se leen, se saltan.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

import './Centro.scss';
import { TEMAS, WHATSAPP_ATENCION } from './contenido';
import { useCentro } from './CentroContext';
import { useAuthContext } from '../../context/authContext';

export const TERMINOS = 'https://allpafood.com/terminos';

const sinMovimiento =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* La hoja se arrastra: el resorte arranca del valor en pantalla y hereda la
   velocidad del dedo, asi se puede agarrar a media subida sin que salte. */
const RESORTE = { type: 'spring', bounce: 0.14, duration: 0.42 };

const ICONOS = {
  lista: <path d="M4 7h16M4 12h16M4 17h10" strokeWidth="2" strokeLinecap="round" fill="none" />,
  telefono: (
    <>
      <rect x="6.5" y="3" width="11" height="18" rx="3" strokeWidth="2" fill="none" />
      <path d="M11 17.6h2" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" strokeWidth="2" fill="none" />
      <path d="M12 7.2V12l3 1.9" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  chat: (
    <path d="M20 11.8c0 3.8-3.6 6.9-8 6.9a9.4 9.4 0 0 1-2.4-.3l-4.6 1.7 1.4-3.5a6.5 6.5 0 0 1-2.4-4.8c0-3.8 3.6-6.9 8-6.9s8 3.1 8 6.9Z"
      strokeWidth="2" fill="none" strokeLinejoin="round" />
  ),
  moto: (
    <>
      <circle cx="6" cy="17.5" r="3" strokeWidth="2" fill="none" />
      <circle cx="18" cy="17.5" r="3" strokeWidth="2" fill="none" />
      <path d="M9 17.5h6l-3-7h4M12 10.5 10 6H7.5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 4.5 2.8 19.5h18.4L12 4.5Z" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M12 10.2v3.6M12 16.6h.01" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  visto: <path d="M5 12.6 9.6 17 19 7.5" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  tarjeta: (
    <>
      <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="3" strokeWidth="2" fill="none" />
      <path d="M2.6 10h18.8M6.4 14.6h3.6" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

const Ico = ({ nombre }) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">{ICONOS[nombre]}</svg>
);

/* Cada tono trae su icono: en una lista de cuatro lineas, la forma se
   distingue antes que el color. */
const ICO_TONO = { alerta: 'alerta', ruta: 'moto', aviso: 'reloj', bien: 'tarjeta' };

/** Una pregunta que se abre. La altura se anima, no salta. */
const Pregunta = ({ dato }) => {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className={`afCentro__qa${abierta ? ' is-abierta' : ''}`}>
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
        {dato.q}
        <span className="afCentro__signo" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {abierta &&
          <motion.div
            className="afCentro__resp"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={sinMovimiento ? { duration: 0 } : RESORTE}
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

/** Un aviso de la lista: una linea. Se abre si el cliente quiere el detalle. */
const Aviso = ({ dato, alIr }) => {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className={`afCentro__av afCentro__av--${dato.tono}`}>
      <button type="button" className="afCentro__avTop" onClick={() => setAbierto((v) => !v)}>
        <span className="afCentro__avIco"><Ico nombre={ICO_TONO[dato.tono] || 'reloj'} /></span>
        <span className="afCentro__avTxt">
          <b>{dato.titulo}</b>
          <small>{dato.corto || dato.texto}</small>
        </span>
        <span className={`afCentro__signo${abierto ? ' is-abierto' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {abierto &&
          <motion.div
            className="afCentro__resp"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={sinMovimiento ? { duration: 0 } : RESORTE}
          >
            <div>
              <p>{dato.texto}</p>
              <button type="button" className="afCentro__avIr" onClick={() => alIr(dato.ruta)}>
                {dato.accion} &rsaquo;
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>
  );
};

export default function Centro() {

  const navigate = useNavigate();
  const { planInfo } = useAuthContext();
  const { avisos, abierto, cerrar, pestana, setPestana } = useCentro();
  const [tema, setTema] = useState(null);

  /* Con la hoja abierta, el fondo no se mueve. */
  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alaTecla = (e) => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', alaTecla);
    return () => window.removeEventListener('keydown', alaTecla);
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cerrar se vuelve al indice: reabrir y caer dentro de un tema que ya se
  // leyo obliga a retroceder antes de poder buscar otra cosa.
  useEffect(() => { if (!abierto) setTema(null); }, [abierto]);

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

  const ir = (ruta) => { cerrar(); navigate(ruta); };

  const actual = TEMAS.find((t) => t.id === tema);

  const lista = {
    oculto: {},
    visible: { transition: { staggerChildren: sinMovimiento ? 0 : 0.04, delayChildren: 0.04 } },
  };
  const fila = {
    oculto: sinMovimiento ? { opacity: 1 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: sinMovimiento ? { duration: 0 } : RESORTE },
  };

  return (
    <AnimatePresence>
      {abierto &&
        <>
          <motion.div
            className="afCentro__velo"
            onClick={cerrar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: sinMovimiento ? 0 : 0.3 }}
          />
          <motion.div
            className="afCentro__hoja"
            role="dialog"
            aria-modal="true"
            aria-label="Avisos y ayuda"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={sinMovimiento ? { duration: 0 } : RESORTE}
            drag={sinMovimiento ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            /* Se cierra por donde iba el gesto, no por donde quedo el dedo:
               un tiron corto pero rapido tambien cierra. */
            onDragEnd={(e, info) => {
              if (info.offset.y > 110 || info.velocity.y > 520) cerrar();
            }}
          >
            <div className="afCentro__asa" aria-hidden="true"><span /></div>

            {/* El selector solo manda en el indice. Dentro de un tema estorba:
                ahi lo que toca es volver. */}
            {!actual &&
              <div className="afCentro__seg" role="tablist">
                {[
                  { id: 'avisos', t: 'Avisos', n: avisos.length },
                  { id: 'ayuda', t: 'Ayuda', n: 0 },
                ].map((s) => (
                  <button
                    key={s.id} type="button" role="tab"
                    aria-selected={pestana === s.id}
                    className={pestana === s.id ? 'is-on' : ''}
                    onClick={() => setPestana(s.id)}
                  >
                    {pestana === s.id &&
                      <motion.span
                        className="afCentro__segPastilla"
                        layoutId="afCentroSeg"
                        transition={sinMovimiento ? { duration: 0 } : { type: 'spring', bounce: 0.18, duration: 0.38 }}
                      />}
                    <span className="afCentro__segTxt">{s.t}{s.n > 0 && <i>{s.n}</i>}</span>
                  </button>
                ))}
              </div>
            }

            <div className="afCentro__cuerpo">

              {pestana === 'avisos' &&
                <motion.div key="avisos" variants={lista} initial="oculto" animate="visible">
                  {avisos.length === 0
                    ? <div className="afCentro__vacio">
                        <span className="afCentro__vacioIco"><Ico nombre="visto" /></span>
                        <b>Todo al día</b>
                        <p>No tienes nada pendiente por ahora.</p>
                        <button type="button" className="afCentro__cta" onClick={() => setPestana('ayuda')}>
                          Ver la ayuda
                        </button>
                      </div>
                    : avisos.map((a) => (
                        <motion.div key={a.id} variants={fila}>
                          <Aviso dato={a} alIr={ir} />
                        </motion.div>
                      ))}
                </motion.div>
              }

              {pestana === 'ayuda' && !actual &&
                <motion.div key="temas" variants={lista} initial="oculto" animate="visible">
                  {TEMAS.map((t) => (
                    <motion.button
                      key={t.id} type="button" className="afCentro__fila"
                      variants={fila} onClick={() => setTema(t.id)}
                      whileTap={sinMovimiento ? undefined : { scale: 0.985 }}
                    >
                      <span className="afCentro__ico"><Ico nombre={t.icono} /></span>
                      <span>
                        <b>{t.titulo}</b>
                        <small>{t.bajada}</small>
                      </span>
                      <span className="afCentro__chev" aria-hidden="true">›</span>
                    </motion.button>
                  ))}

                  {/* La salida a una persona va al final, nunca de entrada: si
                      sale primero, todos la tocan y el reclamo solo se muda de
                      numero. */}
                  <motion.a
                    className="afCentro__fila" variants={fila}
                    href={enlaceWhatsapp('')} target="_blank" rel="noreferrer"
                    onClick={cerrar}
                  >
                    <span className="afCentro__ico"><Ico nombre="chat" /></span>
                    <span>
                      <b>Hablar con una persona</b>
                      <small>Atención al cliente por WhatsApp</small>
                    </span>
                    <span className="afCentro__chev" aria-hidden="true">›</span>
                  </motion.a>

                  <p className="afCentro__legal">
                    <a href={TERMINOS} target="_blank" rel="noreferrer">Términos y condiciones</a>
                  </p>
                </motion.div>
              }

              {pestana === 'ayuda' && actual &&
                <motion.div key={actual.id} variants={lista} initial="oculto" animate="visible">
                  <button type="button" className="afCentro__volver" onClick={() => setTema(null)}>
                    ‹ Volver
                  </button>
                  <h2>{actual.titulo}</h2>
                  <p className="afCentro__baja">{actual.bajada}</p>

                  {actual.preguntas.map((p) => (
                    <motion.div key={p.q} variants={fila}>
                      <Pregunta dato={p} />
                    </motion.div>
                  ))}

                  <div className="afCentro__cola">
                    <p>¿No encuentras lo tuyo?</p>
                    <a
                      className="afCentro__cta"
                      href={enlaceWhatsapp(actual.titulo.toLowerCase())}
                      target="_blank" rel="noreferrer" onClick={cerrar}
                    >
                      Escribir a atención al cliente
                    </a>
                  </div>
                </motion.div>
              }
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>
  );
}
