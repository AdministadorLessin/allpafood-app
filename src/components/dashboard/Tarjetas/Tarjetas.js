import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

import { API_URL } from '../../../config';
import { useAuthContext } from '../../../context/authContext';
import { vibrar } from '../../../nativo';
import { cascada, resorte } from '../../../movimiento';
import Hoja from '../../Centro/Hoja';
import './Tarjetas.scss';

const IR = 'M9 6l6 6-6 6';
const FLECHA = 'M5 12h14M13 6l6 6-6 6';
const Ico = ({ d, w = 2.4 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

/* El panel administrativo deja elegir un color por tarjeta. Si alguien pone
   uno oscuro, la tarjeta va en tinta con el texto claro; los claros se
   reparten entre los tonos de la identidad (menta suave, cielo, papel). */
const esClaro = (hex) => {
  const c = String(hex || '').replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 150;
};
const TONOS = ['menta', 'cielo', 'papel'];

/* El dibujo de cada tema (lo elige el panel al crear la tarjeta). */
const ICONOS = {
  idea:      'M9 21h6M10 3a6 6 0 0 1 4 10.5V17h-4v-3.500A6 6 0 0 1 10 3z',
  nevera:    'M6 3h12v18H6zM6 10h12M9 6.500v1M9 13.500v2',
  calendario:'M3 9h18M8 3v3M16 3v3M4 5h16v16H4zM9 14h2M9 18h2M14 14h2',
  reloj:     'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  corazon:   'M12 20s-7-4.500-7-9.500A3.800 3.800 0 0 1 12 8a3.800 3.800 0 0 1 7 2.500C19 15.500 12 20 12 20z',
  pesa:      'M6 9v6M18 9v6M3 11v2M21 11v2M6 12h12',
  agua:      'M12 3s6 6.500 6 10.500a6 6 0 0 1-12 0C6 9.500 12 3 12 3z',
  regalo:    'M3 11h18v10H3zM3 7h18v4H3zM12 7v14M12 7S9 3 7 5s5 2 5 2zm0 0s3-4 5-2-5 2-5 2z',
};
/* Cada tarjeta llega desde la derecha, girando un poco, y se acomoda. */
const llega = {
  oculto: { opacity: 0, x: 40, rotate: 3 },
  visible: { opacity: 1, x: 0, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

/* El pie de una tarjeta es o el tiempo de lectura ("1 min de lectura") o lo
   que dice su boton ("Renovar mi plan"). */
const esLectura = (pie) => /\bmin\b|lectura/i.test(String(pie || ''));

/**
 * Tips y avisos del plan, dentro del app.
 *
 * 210 de 215 clientes entran cada semana a elegir sus platos: es el canal
 * propio mas usado del negocio y no se usaba para decirles nada.
 *
 * Quien decide que tarjeta le toca a cada uno es el servidor. El app pide las
 * suyas y las pinta; si no hay ninguna, no ocupa espacio. Al tocar una se
 * abre la hoja con el tip completo.
 */
const Tarjetas = ({ lugar = 'inicio', titulo = 'Para ti' }) => {
  const { token } = useAuthContext();
  const navigate = useNavigate();
  const quieto = useReducedMotion();
  const [tarjetas, setTarjetas] = useState([]);
  const [abierta, setAbierta] = useState(null);     // la tarjeta que se esta leyendo
  const [ultima, setUltima] = useState(null);       // se conserva mientras la hoja baja
  const [ocultas, setOcultas] = useState(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem('af_tarjetas_ocultas') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}user/tarjetas?lugar=${lugar}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setTarjetas(Array.isArray(d) ? d : []);
      })
      .catch(() => setTarjetas([]));
  }, [token, lugar]);

  const ocultar = (id) => {
    const nuevas = [...ocultas, id];
    setOcultas(nuevas);
    try { window.sessionStorage.setItem('af_tarjetas_ocultas', JSON.stringify(nuevas)); } catch { /* sin espacio */ }
  };

  const contar = (id) => {
    axios.post(`${API_URL}user/tarjetas/${id}/clic`, {},
      { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  };

  const abrir = (t) => {
    vibrar.toque();
    contar(t.id);
    setUltima(t);
    setAbierta(t.id);
  };
  const cerrar = () => setAbierta(null);

  const visibles = tarjetas.filter((x) => !ocultas.includes(x.id));

  const t = ultima;
  const interno = !!t?.enlace && t.enlace.startsWith('/');
  const textoBoton = t?.pie && !esLectura(t.pie) ? t.pie : 'Ver más';
  const sobre = t ? [t.etiqueta, esLectura(t.pie) ? t.pie : null].filter(Boolean).join(' · ') : '';
  const parrafos = String(t?.texto || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
    {visibles.length > 0 &&
    <section className="afTarjetas">
      <div className="afTarjetas__cab">
        {titulo ? <h2 className="afTarjetas__titulo">{titulo}</h2> : <span />}
        {lugar === 'inicio' &&
          <Link to="/bienestar" className="afTarjetas__mas">Bienestar <Ico d={IR} /></Link>}
      </div>

      {/* En fila y con desplazamiento lateral: en un celular, apilarlas
          empujaria hacia abajo lo que el cliente vino a hacer. */}
      <motion.div className="afTarjetas__fila" variants={cascada(quieto ? 0 : 0.09, 0.15)} initial="oculto" animate="visible">
        {visibles.map((x, i) => {
          const tono = esClaro(x.color) ? TONOS[i % TONOS.length] : 'tinta';
          return (
            <motion.button
              type="button" key={x.id}
              className={`afTarjeta afTarjeta--${x.imagenUrl ? 'foto' : tono}`}
              variants={quieto ? undefined : llega}
              whileTap={quieto ? undefined : { scale: 0.96, rotate: 0 }}
              transition={resorte.toque}
              onClick={() => abrir(x)}
            >
              {x.imagenUrl
                ? <><img className="afTarjeta__foto" src={x.imagenUrl} alt="" loading="lazy" /><span className="afTarjeta__velo" aria-hidden="true" /></>
                : /* Sin foto, el dibujo del tema en grande: flota apenas, para
                     que la tarjeta no se vea como un rectangulo de color. */
                  <motion.span className="afTarjeta__dibujo" aria-hidden="true"
                    animate={quieto ? undefined : { y: [0, -5, 0], rotate: [-8, -4, -8] }}
                    transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={ICONOS[x.icono] || ICONOS.idea} />
                    </svg>
                  </motion.span>}
              <span className="afTarjeta__sello">{x.etiqueta || 'Para ti'}</span>
              <span className="afTarjeta__bajo">
                <b className="afTarjeta__titulo">{x.titulo}</b>
                <span className="afTarjeta__pie">
                  <small>{x.enlace && x.pie && !esLectura(x.pie) ? x.pie : (esLectura(x.pie) ? x.pie : 'Leer')}</small>
                  <i aria-hidden="true"><Ico d={FLECHA} /></i>
                </span>
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </section>}

      {/* La hoja va fuera de la seccion: si se quita la ultima tarjeta, la
          seccion desaparece pero la hoja todavia tiene que bajar. */}
      <Hoja abierta={abierta !== null} alCerrar={cerrar} etiqueta={t?.titulo || 'Para ti'} clase="afLectura">
        {t && <>
          {t.imagenUrl &&
            <img className="afLectura__foto" src={t.imagenUrl} alt="" />}
          {sobre && <span className="afLectura__et">{sobre}</span>}
          <h1 className="afLectura__h">{t.titulo}</h1>
          {parrafos.map((p, i) => <p key={i} className="afLectura__p">{p}</p>)}

          <div className="afLectura__pie">
            {t.enlace && (interno
              ? <button type="button" className="nHoja__btn"
                  onClick={() => { vibrar.toque(); cerrar(); navigate(t.enlace); }}>
                  {textoBoton} <Ico d={FLECHA} />
                </button>
              : <a className="nHoja__btn" href={t.enlace} target="_blank" rel="noreferrer" onClick={cerrar}>
                  {textoBoton} <Ico d={FLECHA} />
                </a>)}
            <div className="afLectura__dos">
              <button type="button" className="nHoja__cerrar" onClick={cerrar}>Cerrar</button>
              {/* Poder quitarla es lo que separa un tip de un anuncio. */}
              <button type="button" className="nHoja__cerrar"
                onClick={() => { cerrar(); ocultar(t.id); }}>No mostrar más</button>
            </div>
          </div>
        </>}
      </Hoja>
    </>
  );
};

export default Tarjetas;
