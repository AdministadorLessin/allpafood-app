import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';

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
const CerrarSesion = () => {

  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const salir = () => {
    logout();
    navigate('/ingresar', { replace: true });
  };

  return (
    <>
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

      <Dialog open={abierto} onClose={() => setAbierto(false)}>
        <div className="afSalirDlg">
          <h3>¿Cerrar sesión?</h3>
          <p>Tendrás que escribir tu correo y tu clave para volver a entrar.</p>
          <div className="afSalirDlg__acciones">
            <button type="button" className="afBtn afBtn--fantasma"
              onClick={() => setAbierto(false)}>Quedarme</button>
            <button type="button" className="afBtn" onClick={salir}>Cerrar sesión</button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default CerrarSesion;
