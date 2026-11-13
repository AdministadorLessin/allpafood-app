import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import './Festejo.scss';

/**
 * Un estallido corto de papelitos, para los momentos que valen la pena:
 * completar la semana, ganar una entrega. Dura poco mas de un segundo, no
 * tapa nada (no recibe toques) y no sale si el telefono pide menos
 * movimiento. Se dispara montandolo con una `key` nueva.
 */
const COLORES = ['#3CFB9F', '#16211B', '#12C7A0', '#FFFFFF', '#8CFCC4'];

export default function Festejo({ piezas = 26 }) {
  const quieto = useReducedMotion();
  const [vivo, setVivo] = useState(true);
  const lista = useMemo(() => Array.from({ length: piezas }, (_, i) => {
    const angulo = (-150 + (i / (piezas - 1)) * 120) * (Math.PI / 180);   // abanico hacia arriba
    const fuerza = 150 + Math.random() * 190;
    return {
      id: i,
      x: Math.cos(angulo) * fuerza * (0.7 + Math.random() * 0.6),
      y: Math.sin(angulo) * fuerza,
      giro: (Math.random() - 0.5) * 720,
      color: COLORES[i % COLORES.length],
      ancho: 7 + Math.random() * 6,
      alto: Math.random() > 0.5 ? 7 + Math.random() * 6 : 14 + Math.random() * 6,
      redondo: Math.random() > 0.6,
      espera: Math.random() * 0.08,
    };
  }), [piezas]);

  useEffect(() => {
    const t = setTimeout(() => setVivo(false), 1900);
    return () => clearTimeout(t);
  }, []);

  if (quieto || !vivo) return null;
  return createPortal(
    <div className="afFestejo" aria-hidden="true">
      {lista.map((p) => (
        <motion.i key={p.id}
          style={{ width: p.ancho, height: p.alto, background: p.color, borderRadius: p.redondo ? '50%' : 3 }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
          animate={{ x: [0, p.x, p.x * 1.15], y: [0, p.y, p.y + 420], opacity: [0, 1, 1, 0], rotate: p.giro, scale: 1 }}
          transition={{ duration: 1.6, delay: p.espera, times: [0, 0.32, 1], ease: ['easeOut', 'easeIn'], opacity: { duration: 1.6, delay: p.espera, times: [0, 0.08, 0.7, 1] } }} />
      ))}
    </div>,
    document.body
  );
}
