import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Bienvenida/Bienvenida.scss';
import { useAuthContext } from '../../../context/authContext';
import { motion, alToque } from '../../ultil/Motion/Motion';
import IcoIsotipoSvg from '../../ultil/iconSvg/icoIsotipoSvg';
import { API_URL } from '../../../config';

/**
 * Lo que operacion hizo en la cuenta del cliente y el cliente tiene que saber:
 * hoy, que le devolvimos envios. Sale una vez al entrar al panel y al tocar
 * "Entendido" no vuelve a aparecer. Usa la misma hoja que la bienvenida.
 */
const AvisosCliente = ({ oculto }) => {
  const { token } = useAuthContext();
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}avisos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setAvisos(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
      .catch(() => setAvisos([]));
  }, [token]);

  if (oculto || avisos.length === 0) return null;

  const cerrar = () => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };
    avisos.forEach((a) => axios.post(`${API_URL}avisos/${a.id}/visto`, null, cab).catch(() => {}));
    setAvisos([]);
  };

  const [primero, ...resto] = avisos;

  return (
    <div className="afBien" onClick={cerrar}>
      <motion.div
        className="afBien__caja"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 0.84, 0.44, 1] }}
      >
        <div className="afBien__top">
          <span className="afBien__iso"><IcoIsotipoSvg /></span>
          <h2 className="afBien__tit">{primero.titulo}</h2>
          <p className="afBien__baja">{primero.mensaje}</p>
        </div>

        <div className="afBien__cuerpo">
          {resto.map((a) => (
            <p className="afBien__baja" key={a.id} style={{ marginBottom: 12 }}>
              <b>{a.titulo}.</b> {a.mensaje}
            </p>
          ))}
          <motion.button type="button" className="afBien__btn" onClick={cerrar} {...alToque}>
            Entendido
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AvisosCliente;
