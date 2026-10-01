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

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import { Cascada, Bloque, motion, alToque } from './../../../components/ultil/Motion/Motion';

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

    useEffect(() => {
        axios.get('https://admin-landing.allpafood.com/wp-json/wp/v2/preguntas-frecuentes')
            .then((resp) => setFaqList(Array.isArray(resp.data) ? resp.data : []))
            .catch(() => setFaqList([]));
    }, []);

    return (
        <LayoutDasboard claseStyle={false}>
            <Cascada className="afPanel">

                <Bloque><h1 className="afPanel__titular">Preguntas frecuentes</h1></Bloque>
                <Bloque>
                    <p className="afMenu__ayuda">
                        Lo que más nos preguntan sobre los planes, las entregas y los platos.
                    </p>
                </Bloque>

                <Bloque>
                    <div className="afCard afFaq">
                        {faqList === null &&
                            [0, 1, 2, 3].map((i) => (
                                <div className="afFaq__it" key={i}>
                                    <Skeleton variant="text" width={`${70 - i * 8}%`} height={28} />
                                </div>
                            ))
                        }

                        {faqList && faqList.length === 0 &&
                            <p className="afMenu__nota afMenu__nota--suelta">
                                No pudimos cargar las preguntas. Escríbenos y te respondemos al toque.
                            </p>
                        }

                        {(faqList || []).map((item, i) => {
                            const abierto = abierta === i;
                            const pregunta = aTexto(item?.title?.rendered);
                            const respuesta = aTexto(item?.content?.rendered);
                            return (
                                <div className={`afFaq__it${abierto ? ' afFaq__it--on' : ''}`} key={item.id || i}>
                                    <button type="button" className="afFaq__btn"
                                        aria-expanded={abierto}
                                        onClick={() => setAbierta(abierto ? -1 : i)}>
                                        <span>{pregunta}</span>
                                        <i className="afFaq__mas" aria-hidden="true">{abierto ? '−' : '+'}</i>
                                    </button>
                                    {abierto &&
                                        <p className="afFaq__txt">{respuesta}</p>
                                    }
                                </div>
                            );
                        })}
                    </div>
                </Bloque>

                {/* La salida: quien llega hasta abajo sin respuesta necesita una
                    persona, no otra pantalla. */}
                <Bloque>
                    <div className="afCard afFaq__ayuda">
                        <div>
                            <b>¿No encuentras tu respuesta?</b>
                            <small>Te contestamos por WhatsApp de lunes a viernes.</small>
                        </div>
                        <motion.a className="afBtn afBtn--mint afFaq__wa"
                            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, tengo una consulta sobre mi plan.')}`}
                            target="_blank" rel="noreferrer" {...alToque}>
                            Escribirnos
                        </motion.a>
                    </div>
                </Bloque>

            </Cascada>
        </LayoutDasboard>
    );
};

export default PreguntasFrecuentesPage;
