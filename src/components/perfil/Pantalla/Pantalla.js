import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

import LayoutDasboard from '../../LayoutDashborad/LayoutDashboard';
import { esNativo } from '../../../nativo';
import { cascada, sube, resorte } from '../../../movimiento';
import './Pantalla.scss';

/**
 * El marco de las pantallas que cuelgan de "Yo" (Mi plan, Mis pagos, Mis
 * direcciones, Allpa+, planes, preguntas, lecturas): degradado menta arriba,
 * boton redondo en tinta para volver, titular en Bricolage y el contenido en
 * filas con lineas finas.
 *
 *   <Pantalla etiqueta="Mi plan" titulo="Nutrivital" bajada="..." volver="/perfil">
 *     <Tramo>...</Tramo>
 *   </Pantalla>
 *
 * En el app llena la pantalla de borde a borde. En la web va dentro de la
 * caja del panel, como una columna, para no pisar la navegacion lateral.
 */
export const Tramo = ({ children, className, as = 'div', ...resto }) => {
  const Pieza = motion[as] || motion.div;
  return <Pieza className={className} variants={sube} {...resto}>{children}</Pieza>;
};

export default function Pantalla({ etiqueta, titulo, bajada, volver = '/perfil', clase, lado, children }) {
  const navigate = useNavigate();
  const quieto = useReducedMotion();

  /* Vuelve a donde estaba; si entro directo a esta pantalla (un aviso, un
     enlace), a la pestaña de la que cuelga. */
  const atras = () => {
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate(volver, { replace: true });
  };

  return (
    <LayoutDasboard claseStyle={esNativo ? 'nCaja' : false}>
      <motion.div
        className={`nPant cuP${esNativo ? '' : ' cuP--web'}${clase ? ` ${clase}` : ''}`}
        variants={cascada(quieto ? 0 : 0.06)} initial="oculto" animate="visible">
        <span className="cuP__menta" aria-hidden="true" />

        <motion.div className="cuP__barra" variants={sube}>
          <motion.button type="button" className="cuP__volver" onClick={atras} aria-label="Volver"
            whileTap={{ scale: 0.9 }} transition={resorte.toque}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </motion.button>
          {lado}
        </motion.div>

        <motion.header className="cuP__cab" variants={sube}>
          {etiqueta && <p className="cuP__et">{etiqueta}</p>}
          <h1>{titulo}</h1>
          {bajada && <p className="cuP__bajada">{bajada}</p>}
        </motion.header>

        {children}
      </motion.div>
    </LayoutDasboard>
  );
}
