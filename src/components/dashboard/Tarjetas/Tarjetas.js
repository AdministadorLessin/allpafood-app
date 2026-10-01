import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { API_URL } from '../../../config';
import { useAuthContext } from '../../../context/authContext';
import { motion } from './../../ultil/Motion/Motion';
import './Tarjetas.scss';

/* Si el cliente pidio menos movimiento, entra todo quieto. */
const sinMovimiento =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Entrada en cascada: una tarjeta tras otra, de abajo hacia arriba y con
   resorte. Un desvanecido lineal se siente a pantalla que carga; un resorte
   se siente a objeto que llega y se acomoda. */
const entrada = (i) => ({
  initial: sinMovimiento ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: sinMovimiento
    ? { duration: 0 }
    : { type: 'spring', stiffness: 260, damping: 26, delay: 0.06 * i },
});

/* Al tocarla cede un poco, como un boton fisico. Se interrumpe sola si el
   dedo se va: por eso resorte y no una duracion fija. */
const alTocar = sinMovimiento
  ? {}
  : { whileTap: { scale: 0.965 }, transition: { type: 'spring', stiffness: 400, damping: 28 } };

/* Iconos dibujados, no imagenes: pesan nada y se pintan del color de la
   tarjeta. Una tarjeta de tip tiene que cargar al instante en un celular con
   datos, no despues de bajar una foto. */
const ICONOS = {
  idea:      'M9 21h6M10 3a6 6 0 0 1 4 10.5V17h-4v-3.5A6 6 0 0 1 10 3Z',
  nevera:    'M6 3h12v18H6zM6 10h12M9 6.5v1M9 13.5v2',
  calendario:'M3 9h18M8 3v3M16 3v3M4 5h16v16H4zM9 14h2M9 18h2M14 14h2',
  reloj:     'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  corazon:   'M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.5 12 20 12 20Z',
  pesa:      'M6 9v6M18 9v6M3 11v2M21 11v2M6 12h12',
  agua:      'M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z',
  regalo:    'M3 11h18v10H3zM3 7h18v4H3zM12 7v14M12 7S9 3 7 5s5 2 5 2Zm0 0s3-4 5-2-5 2-5 2Z',
};

const Icono = ({ nombre }) => (
  <svg className="afTarjeta__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONOS[nombre] || ICONOS.idea} />
  </svg>
);

/* La tarjeta es de color y el texto encima tiene que leerse. Los colores de
   la paleta son claros, asi que el texto va oscuro; si alguien pone uno
   oscuro desde el panel, se invierte solo en vez de quedar ilegible. */
const esClaro = (hex) => {
  const c = String(hex || '').replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 150;
};

/**
 * Tips y avisos del plan, dentro del app.
 *
 * 210 de 215 clientes entran cada semana a elegir sus platos: es el canal
 * propio mas usado del negocio y no se usaba para decirles nada.
 *
 * Quien decide que tarjeta le toca a cada uno es el servidor. El app pide las
 * suyas y las pinta; si no hay ninguna, no ocupa espacio.
 */
const Tarjetas = ({ lugar = 'inicio', titulo = 'Para ti' }) => {
  const { token } = useAuthContext();
  const [tarjetas, setTarjetas] = useState([]);
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
      .then((r) => setTarjetas(r.data?.data ?? r.data ?? []))
      .catch(() => setTarjetas([]));
  }, [token, lugar]);

  const cerrar = (id) => {
    const nuevas = [...ocultas, id];
    setOcultas(nuevas);
    try { window.sessionStorage.setItem('af_tarjetas_ocultas', JSON.stringify(nuevas)); } catch { /* sin espacio */ }
  };

  const contar = (id) => {
    axios.post(`${API_URL}user/tarjetas/${id}/clic`, {},
      { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  };

  const visibles = tarjetas.filter((t) => !ocultas.includes(t.id));
  if (!visibles.length) return null;

  return (
    <section className="afTarjetas">
      {titulo && <h2 className="afTarjetas__titulo">{titulo}</h2>}

      {/* En fila y con desplazamiento lateral: en un celular, apilarlas
          empujaria hacia abajo lo que el cliente vino a hacer. */}
      <div className="afTarjetas__fila">
        {visibles.map((t, i) => {
          const claro = esClaro(t.color);

          /* Con foto la tarjeta cambia de forma: la imagen ocupa todo y el
             texto va encima, sobre un velo. Es lo que la hace llamativa —una
             foto detras de un recuadro de color no se ve, compite.

             Va ANTES de interior y no despues: interior es JSX, se evalua en
             el momento de crearlo, asi que leer conFoto desde ahi cuando
             todavia no esta declarado tumba la pantalla entera. Paso el
             30-09-2026 y dejo el inicio caido para todos. */
          const conFoto = !!t.imagenUrl;
          const clases = `afTarjeta ${conFoto ? 'afTarjeta--foto' : (claro ? '' : 'afTarjeta--oscura')}`;
          const estilo = conFoto ? undefined : { background: t.color || '#E2F3E9' };
          const interno = t.enlace && t.enlace.startsWith('/');

          const interior = (
            <>
              <div className="afTarjeta__alto">
                {t.etiqueta && <span className="afTarjeta__pildora">{t.etiqueta}</span>}
                {t.enlace && <span className="afTarjeta__flecha" aria-hidden="true">↗</span>}
              </div>

              {!conFoto && <Icono nombre={t.icono} />}

              <h3 className="afTarjeta__titulo">{t.titulo}</h3>
              {t.texto && <p className="afTarjeta__texto">{t.texto}</p>}
              {t.pie && <span className="afTarjeta__pie">{t.pie}</span>}
            </>
          );

          return (
            <motion.article key={t.id} className={clases} style={estilo}
              {...entrada(i)} {...(t.enlace ? alTocar : {})}>
              {/* Poder cerrarla es lo que separa un tip de un anuncio. */}
              <button type="button" className="afTarjeta__cerrar"
                onClick={() => cerrar(t.id)} aria-label="No mostrar esta tarjeta">×</button>

              {/* La foto se asienta al entrar: arranca un poco mas grande y
                  se acomoda. Dura un segundo y no se repite. */}
              {conFoto &&
                <motion.img className="afTarjeta__fondo" src={t.imagenUrl} alt="" aria-hidden="true"
                  initial={sinMovimiento ? { scale: 1 } : { scale: 1.08 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: sinMovimiento ? 0 : 1.1, ease: [0.16, 0.84, 0.44, 1] }} />
              }
              {conFoto && <span className="afTarjeta__velo" />}

              {t.enlace
                ? (interno
                    ? <Link className="afTarjeta__zona" to={t.enlace} onClick={() => contar(t.id)}>{interior}</Link>
                    : <a className="afTarjeta__zona" href={t.enlace} target="_blank" rel="noreferrer"
                         onClick={() => contar(t.id)}>{interior}</a>)
                : <div className="afTarjeta__zona">{interior}</div>}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default Tarjetas;
