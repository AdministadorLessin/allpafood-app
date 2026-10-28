// Un solo centro para los avisos y la ayuda.
//
// Antes eran dos cosas distintas: una campana que solo existia en la pantalla
// de inicio y un boton de ayuda flotando encima del contenido. El cliente veia
// dos puertas para el mismo momento —"algo me pasa, quiero saber"— y ninguna
// de las dos se parecia al resto del app.
//
// Los datos de los avisos solo los tiene la pantalla de inicio, que es la que
// pide el plan y las ordenes. Por eso viven aqui arriba, sobre el router: la
// pantalla los publica una vez y siguen disponibles cuando el cliente se va a
// "Mi menu" y toca la barra desde ahi.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { avisosDelCliente, leerLeidos, guardarLeidos } from './avisos';

const CentroCtx = createContext(null);

/* Fuera del proveedor devuelve funciones vacias en vez de undefined: asi un
   componente suelto —una prueba, una pantalla fuera del panel— no revienta. */
const VACIO = { avisos: [], sinLeer: 0, abierto: false, abrir: () => {}, cerrar: () => {}, setDatos: () => {}, setPestana: () => {}, pestana: 'ayuda' };

export const useCentro = () => useContext(CentroCtx) || VACIO;

export function CentroProvider({ children }) {

  const [datos, setDatos] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [pestana, setPestana] = useState('avisos');
  const [leidos, setLeidos] = useState(() => leerLeidos());

  const avisos = useMemo(() => (datos ? avisosDelCliente(datos) : []), [datos]);
  const sinLeer = avisos.filter((a) => !leidos.has(a.id)).length;

  // Abrir es leer. Marcarlos uno por uno obligaria al cliente a hacer trabajo
  // de mantenimiento sobre avisos que ya vio.
  useEffect(() => {
    if (!abierto || avisos.length === 0) return;
    const nuevos = new Set([...leidos, ...avisos.map((a) => a.id)]);
    setLeidos(nuevos);
    guardarLeidos(nuevos);
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Se abre en avisos cuando hay algo que leer y en ayuda cuando no. Quien no
     tiene ningun aviso casi siempre viene con una pregunta. */
  const abrir = (donde) => {
    setPestana(donde || (avisos.length > 0 ? 'avisos' : 'ayuda'));
    setAbierto(true);
  };

  const valor = { datos, setDatos, avisos, sinLeer, abierto, abrir, cerrar: () => setAbierto(false), pestana, setPestana };

  return <CentroCtx.Provider value={valor}>{children}</CentroCtx.Provider>;
}
