import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import { vibrar } from '../../../nativo';
import {
  codigoGuardado, limpiarCodigo, aceptarCodigo, olvidarCodigo, invitadoPor,
} from '../../../referido';
import './CodigoInvitacion.scss';

/**
 * La fila del codigo de invitacion en la pantalla de pago.
 *
 * Quien llega sin recomendacion la ve cerrada y la puede ignorar. Quien ya
 * escribio el codigo mientras miraba el app lo encuentra puesto. El regalo
 * son entregas, no un descuento: el total a pagar no cambia.
 *
 * Avisa hacia arriba con alCambiar({ codigo, nombre, regalo }) o null.
 */
const REGALO = ['M4 11h16v9H4z', 'M3 7h18v4H3zM12 7v13', 'M12 7S10.5 3 8 4s1 3 4 3zM12 7s1.5-4 4-3-1 3-4 3z'];
const Ico = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {REGALO.map((d) => <path key={d} d={d} />)}
  </svg>
);

export default function CodigoInvitacion({ token, alCambiar }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(codigoGuardado());
  const [aplicado, setAplicado] = useState(null);
  const [error, setError] = useState('');
  const [revisando, setRevisando] = useState(false);

  const revisar = (codigo) => {
    const limpio = limpiarCodigo(codigo);
    if (!limpio) return setError('Escribe el código que te pasaron.');
    setRevisando(true);
    setError('');
    axios.get(`${API_URL}referidos/validar?codigo=${encodeURIComponent(limpio)}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const d = r.data?.data ?? {};
        if (!d.valido) {
          setAplicado(null);
          setAbierto(true);
          setError(d.motivo || 'Ese código no es válido.');
          alCambiar && alCambiar(null);
          return;
        }
        const dato = { codigo: d.codigo || limpio, nombre: d.nombre || invitadoPor(), regalo: d.regalo || 2 };
        aceptarCodigo(dato.codigo, dato.nombre);
        setAplicado(dato);
        vibrar.exito();
        alCambiar && alCambiar(dato);
      })
      .catch(() => { setAbierto(true); setError('No pudimos revisar el código. Inténtalo de nuevo.'); })
      .finally(() => setRevisando(false));
  };

  /* Si ya lo traia escrito desde la visita, se revisa solo al entrar. */
  useEffect(() => {
    if (codigoGuardado()) revisar(codigoGuardado());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quitar = () => {
    olvidarCodigo();
    setAplicado(null);
    setTexto('');
    setAbierto(false);
    alCambiar && alCambiar(null);
  };

  if (aplicado) {
    return (
      <section className="codN codN--ok">
        <span className="codN__ico"><Ico /></span>
        <span className="codN__txt">
          <b>{aplicado.codigo}</b>
          <small>{aplicado.regalo} entregas de regalo{aplicado.nombre ? ` · te invitó ${aplicado.nombre}` : ''}</small>
        </span>
        <button type="button" className="codN__link" onClick={quitar}>Quitar</button>
      </section>
    );
  }

  if (!abierto) {
    return (
      <button type="button" className="codN codN--cerrado" onClick={() => { vibrar.toque(); setAbierto(true); }}>
        <span className="codN__ico"><Ico /></span>
        <span className="codN__txt">
          <b>¿Un amigo te invitó?</b>
          <small>Escribe su código y gana 2 entregas</small>
        </span>
        <span className="codN__link">Agregar</span>
      </button>
    );
  }

  return (
    <section className="codN codN--abierto">
      <label className="codN__et" htmlFor="codigoInvitacion">Código de invitación</label>
      <div className="codN__fila">
        <input id="codigoInvitacion" className="codN__campo" value={texto} placeholder="Ej. DIANA947"
               autoCapitalize="characters" autoCorrect="off" autoComplete="off" maxLength={16}
               onChange={(e) => { setTexto(e.target.value.toUpperCase()); setError(''); }} />
        <button type="button" className="codN__btn" disabled={revisando} onClick={() => revisar(texto)}>
          {revisando ? 'Revisando…' : 'Aplicar'}
        </button>
      </div>
      {error && <p className="codN__error">{error}</p>}
    </section>
  );
}
