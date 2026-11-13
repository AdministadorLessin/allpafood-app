// Preguntas frecuentes, con el lenguaje del resto del panel.
//
// Antes era un acordeon de MUI dentro de una tarjeta con su propio estilo:
// tipografia distinta, bordes distintos y una flecha gris. Aqui se usa lo
// mismo que ve el cliente en el resto de la app, y al final un camino claro a
// WhatsApp, que es donde termina quien no encuentra su respuesta.

import React, { useState, useEffect } from "react";
import './preguntas-frecuentes.scss';

import Skeleton from '@mui/material/Skeleton';
import axios from 'axios';

import { motion, useReducedMotion } from 'motion/react';
import Pantalla, { Tramo } from './../../../components/perfil/Pantalla/Pantalla';
import { resorte } from '../../../movimiento';

const WHATSAPP = '51955797697';

/* El contenido llega de WordPress con etiquetas HTML. Se limpian aqui: en una
   respuesta de tres lineas, un <p> suelto se veria como texto roto. */
const aTexto = (html) => String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;/g, "'")
    .trim();

const PreguntasFrecuentesPage = () => {

    const [faqList, setFaqList] = useState(null);
    const [abierta, setAbierta] = useState(0);
    const quieto = useReducedMotion();

    useEffect(() => {
        axios.get('https://admin-landing.allpafood.com/wp-json/wp/v2/preguntas-frecuentes')
            .then((resp) => setFaqList(Array.isArray(resp.data) ? resp.data : []))
            .catch(() => setFaqList([]));
    }, []);

    return (
        <Pantalla etiqueta="Ayuda" titulo="Preguntas frecuentes"
            bajada="Lo que más nos preguntan sobre los planes, las entregas y los platos."
            clase="faq">

            <Tramo className="faq__lista">
                {faqList === null &&
                    [0, 1, 2, 3].map((i) => (
                        <div className="faq__it" key={i}>
                            <Skeleton variant="text" width={`${70 - i * 8}%`} height={30} sx={{ my: '14px' }} />
                        </div>
                    ))
                }

                {faqList && faqList.length === 0 &&
                    <p className="cuP__vacio">
                        No pudimos cargar las preguntas. Escríbenos y te respondemos pronto.
                    </p>
                }

                {(faqList || []).map((item, i) => {
                    const abierto = abierta === i;
                    const pregunta = aTexto(item?.title?.rendered);
                    const respuesta = aTexto(item?.content?.rendered);
                    const id = `faq-r-${item.id || i}`;
                    return (
                        <div className={`faq__it${abierto ? ' is-on' : ''}`} key={item.id || i}>
                            <button type="button" className="faq__btn"
                                aria-expanded={abierto} aria-controls={id}
                                onClick={() => setAbierta(abierto ? -1 : i)}>
                                <span>{pregunta}</span>
                                <motion.i className="faq__mas" aria-hidden="true"
                                    animate={{ rotate: abierto ? 45 : 0 }}
                                    transition={quieto ? { duration: 0 } : resorte.toque}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                </motion.i>
                            </button>
                            {abierto &&
                                <motion.p className="faq__txt" id={id}
                                    initial={quieto ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                    transition={quieto ? { duration: 0 } : resorte.entra}>
                                    {respuesta}
                                </motion.p>
                            }
                        </div>
                    );
                })}
            </Tramo>

            {/* La salida: quien llega hasta abajo sin respuesta necesita una
                persona, no otra pantalla. */}
            <Tramo className="cuP__tinta faq__ayuda">
                <b>¿No encuentras tu respuesta?</b>
                <p>Te contestamos por WhatsApp de lunes a viernes.</p>
                <motion.a className="cuP__btn cuP__btn--menta"
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, tengo una consulta sobre mi plan.')}`}
                    target="_blank" rel="noreferrer" whileTap={{ scale: 0.97 }} transition={resorte.toque}>
                    Escribirnos por WhatsApp
                </motion.a>
            </Tramo>

        </Pantalla>
    );
};

export default PreguntasFrecuentesPage;
