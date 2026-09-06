import React from "react";
import { Link } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

import './StatusBanner.scss';
import { estadoDelPanel } from './estadoPlan';

/**
 * Lo primero que ve el cliente al entrar: que tiene que hacer y el boton para
 * hacerlo. Antes ese espacio decia "¡Bienvenido a tu panel de control!", que no
 * ayuda a nadie a decidir nada.
 *
 * Toda la logica vive en estadoDelPanel: este componente solo pinta.
 */
const StatusBanner = ({ plan, ordenes, creditos, cargando, ahora }) => {

  if (cargando) {
    return (
      <div className="afBanner afBanner--esqueleto">
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="80%" height={30} />
        <Skeleton variant="text" width="60%" height={14} />
        <Skeleton variant="rounded" height={42} sx={{ borderRadius: '999px', marginTop: '14px' }} />
      </div>
    );
  }

  const estado = estadoDelPanel({ plan, ordenes, creditos, ahora });

  return (
    <div className={`afBanner afBanner--${estado.tono}`}>
      <p className="afBanner__kick">{estado.encabezado}</p>
      <h2 className="afBanner__titulo">{estado.titulo}</h2>
      <p className="afBanner__detalle">{estado.detalle}</p>
      {estado.accion &&
        <Link className="afBanner__accion" to={estado.accion.a}>
          {estado.accion.texto}
        </Link>
      }
    </div>
  );
};

export default StatusBanner;
