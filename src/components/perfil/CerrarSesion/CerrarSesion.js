import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Hoja from '../Hoja/Hoja';

import './CerrarSesion.scss';
import { useAuthContext } from './../../../context/authContext';
import { motion, alToque } from './../../ultil/Motion/Motion';

/**
 * Cerrar sesion.
 *
 * Con confirmacion a proposito: es una accion que no se deshace —hay que
 * volver a escribir la clave— y el boton vive al final de una pantalla por la
 * que el cliente pasa a hacer otras cosas.
 */
const CerrarSesion = ({ enlace }) => {

  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const salir = () => {
    logout();
    navigate('/ingresar', { replace: true });
  };

  return (
    <>
      {enlace ? (
        /* En "Yo" es una linea de texto al pie, como en la maqueta. */
        <button type="button" className="afSalirEnlace" onClick={() => setAbierto(true)}>
          Cerrar sesión
        </button>
      ) : (
        <motion.button
          type="button"
          className="afSalir"
          onClick={() => setAbierto(true)}
          {...alToque}
        >
          <svg className="afSalir__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 3.5h3a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1-2.5 2.5h-3" />
            <path d="M10 16.5 14.5 12 10 7.5M14.5 12H3.5" />
          </svg>
          Cerrar sesión
        </motion.button>
      )}

      <Hoja abierta={abierto} alCerrar={() => setAbierto(false)}
        etiqueta="Tu sesión" titulo="¿Cerrar sesión?"
        bajada="Tendrás que escribir tu correo o celular y tu contraseña para volver a entrar."
        textoCerrar="Quedarme"
        pie={<button type="button" className="hoja__btn" onClick={salir}>Cerrar sesión</button>} />
    </>
  );
};

export default CerrarSesion;
