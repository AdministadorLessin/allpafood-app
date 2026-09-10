import React, { useEffect, useState } from 'react';
import './Bienvenida.scss';
import axios from 'axios';
import { useAuthContext } from '../../../context/authContext';
import { motion, alToque } from '../../ultil/Motion/Motion';
import IcoIsotipoSvg from '../../ultil/iconSvg/icoIsotipoSvg';

/**
 * Bienvenida y eleccion de avatar, la primera vez que se entra al panel.
 *
 * No existia ningun primer contacto: tanto quien se registraba por la
 * pasarela como quien un administrador daba de alta caian directo al panel
 * vacio, con un avatar roto —"avatar_null.jpg"— junto a su nombre. Nadie
 * elegia foto porque nadie sabia que existia esa opcion: estaba escondida
 * en Perfil > Editar.
 *
 * Se dispara con una sola condicion, valida para los dos flujos de alta: el
 * perfil no tiene image_url. Ni el registro por pasarela ni el alta desde el
 * admin lo llenan hoy, asi que sirve para ambos sin necesidad de dos
 * implementaciones.
 */

const TOTAL_AVATARES = 25;

/** El id del usuario sale del token, no de \`inf\`: asi el "ya lo vi" queda
    atado a la PERSONA y no al telefono. En un equipo compartido, que alguien
    cierre la bienvenida no se la esconde a quien entre despues. */
function idDesdeToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json).userId || null;
  } catch {
    return null;
  }
}

const claveVista = (userId) => `af_bienvenida_vista_${userId}`;

/** Si ya se mostro y se descarto, no se vuelve a insistir en cada visita. */
export function bienvenidaYaVista(token) {
  const id = idDesdeToken(token);
  return !id || localStorage.getItem(claveVista(id)) === '1';
}

const Bienvenida = ({ nombre, onListo }) => {
  const { baseUrl, token, planInfo, handleUpdateToken } = useAuthContext();
  const [elegido, setElegido] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cabecera = { headers: { Authorization: `Bearer ${token}` } };

  const cerrar = (marcarVista, avatarElegido) => {
    if (marcarVista) {
      const id = idDesdeToken(token);
      if (id) localStorage.setItem(claveVista(id), '1');
    }
    onListo(avatarElegido);
  };

  const guardar = () => {
    if (elegido === null) return;
    setGuardando(true);
    setError('');

    /* Se lee el perfil actual antes de escribir. updateBasicProfile pisa
       name, lastname y el genero en el mismo UPDATE: si se manda cualquiera
       de los tres vacio, se lo borra de verdad. Mandar de vuelta lo que ya
       tenia es la unica forma segura de tocar solo el avatar. */
    axios
      .get(`${baseUrl}profile/data/personal`, cabecera)
      .then((r) => {
        const actual = r.data?.data ?? r.data ?? {};
        return axios.put(
          `${baseUrl}profile/data/personal`,
          {
            name: actual.name,
            lastname: actual.lastname,
            gender: actual.gender,
            registerDate: actual.registerDate || '2025-04-04',
            image: String(elegido),
          },
          cabecera
        );
      })
      .then(() => {
        // Refleja el avatar nuevo de inmediato, sin esperar a la proxima carga.
        try {
          const inf = JSON.parse(localStorage.getItem('inf')) || {};
          if (inf.profile) inf.profile.image = String(elegido);
          handleUpdateToken(token, inf);
        } catch { /* si falla, el avatar igual se vera en la proxima carga */ }
        cerrar(true, elegido);
      })
      .catch(() => {
        setError('No pudimos guardar tu avatar. Intenta de nuevo.');
        setGuardando(false);
      });
  };

  return (
    <div className="afBien" onClick={() => cerrar(false)}>
      <motion.div
        className="afBien__caja"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 0.84, 0.44, 1] }}
      >
        <div className="afBien__top">
          <span className="afBien__iso"><IcoIsotipoSvg /></span>
          <h2 className="afBien__tit">
            {nombre ? <>¡Bienvenido, {nombre}!</> : '¡Bienvenido a Allpa Food!'}
          </h2>
          <p className="afBien__baja">
            Elige el avatar con el que te vamos a reconocer en tu panel.
          </p>
        </div>

        <div className="afBien__cuerpo">
          <div className="afBien__grid">
            {[...Array(TOTAL_AVATARES)].map((_, i) => (
              <motion.button
                key={i}
                type="button"
                className={`afBien__av${elegido === i ? ' afBien__av--sel' : ''}`}
                onClick={() => setElegido(i)}
                {...alToque}
              >
                <img src={`/assets/img/avatars/avatar_${i}.jpg`} alt="" />
                {elegido === i && <span className="afBien__check">✓</span>}
              </motion.button>
            ))}
          </div>

          {error && <p className="afBien__error">{error}</p>}

          <motion.button
            type="button"
            className="afBien__btn"
            disabled={elegido === null || guardando}
            onClick={guardar}
            {...alToque}
          >
            {guardando ? 'Guardando…' : 'Guardar y continuar'}
          </motion.button>

          <button type="button" className="afBien__luego" onClick={() => cerrar(true)}>
            Elegir después
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Bienvenida;
