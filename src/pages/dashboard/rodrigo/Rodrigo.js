import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { useAuthContext } from '../../../context/authContext';
import RodrigoCara from '../../../components/ultil/RodrigoCara/RodrigoCara';
import { vibrar } from '../../../nativo';
import { resorte } from '../../../movimiento';
import { apiPara } from './rodrigoApi';
import './Rodrigo.scss';

/**
 * Rodrigo, el asistente de Allpa Food dentro del app.
 *
 * Lo que decide (que contestar, que consultar, que puede cambiar) pasa en el
 * servidor. Esta pantalla hace tres cosas: mostrar la conversacion, mostrar en
 * que esta trabajando Rodrigo mientras el cliente espera, y poner el boton
 * con el que el cliente confirma cada cambio. Rodrigo nunca cambia nada solo.
 */

const Ico = ({ d, w = 2.2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const I = {
  atras: 'M15 6l-6 6 6 6',
  enviar: ['M5 12h14', 'M13 6l6 6-6 6'],
  camara: ['M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M12 16.500a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7z'],
  check: 'M5 12l5 5 9-10',
  x: ['M6 6l12 12', 'M18 6L6 18'],
};
const Cara = ({ s = 30, pensando }) => <RodrigoCara size={s} pensando={pensando} />;

/* Lo que Rodrigo adjunta a un mensaje: el pedido, unos platos, lo que va a
   cambiar. Se pinta con lo que llegue; si falta un dato, esa linea no sale. */
function Tarjeta({ tarjeta }) {
  const d = tarjeta?.datos || {};
  if (tarjeta?.tipo === 'pedido') {
    return (
      <div className="rod__tj">
        <span className="rod__tjEt">TU PEDIDO DE HOY{d.etiqueta && <em>{d.etiqueta}</em>}</span>
        {d.plato && <b>{d.plato}</b>}
        {d.total > 0 &&
          <span className="rod__tjRuta" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${d.total}, minmax(0, 1fr))` }}>
            {Array.from({ length: d.total }, (_, i) => <i key={i} className={i < d.hechos ? 'is-on' : ''} />)}
          </span>}
        {d.nota && <small>{d.nota}</small>}
      </div>
    );
  }
  if (tarjeta?.tipo === 'platos') {
    return (d.items || []).map((p) => (
      <div className="rod__tj rod__tj--plato" key={p.nombre}>
        {p.imagen && <img src={p.imagen} alt="" />}
        <span><b>{p.nombre}</b>{p.detalle && <small>{p.detalle}</small>}</span>
      </div>
    ));
  }
  if (tarjeta?.tipo === 'comparacion') {
    return (
      <div className="rod__tj">
        <span className="rod__tjEt">LO QUE PEDISTE</span><b>{d.pediste}</b>
        <span className="rod__tjEt rod__tjEt--mal">LO QUE SE VE EN TU FOTO</span><b>{d.seVe}</b>
      </div>
    );
  }
  if (tarjeta?.tipo === 'vista_previa') {
    return (
      <div className="rod__tj">
        {d.titulo && <span className="rod__tjEt">{d.titulo}</span>}
        {(d.lineas || []).map((l) => <b key={l}>{l}</b>)}
      </div>
    );
  }
  return null;
}

/* Los pasos de Rodrigo: cada uno gira mientras se hace y se marca al
   terminar. Salen del servidor, uno por cada consulta de verdad. */
function Trabajando({ estado }) {
  return (
    <motion.div className="rod__fila" layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }} transition={resorte.entra}>
      <Cara pensando />
      <div className="rod__burbuja rod__pasos" role="status" aria-live="polite">
        <span className="rod__pasosCab">
          <span className="rod__puntos" aria-hidden="true"><i /><i /><i /></span>
          Rodrigo está trabajando en tu caso
        </span>
        <AnimatePresence initial={false}>
          {(estado.pasos || []).map((p) => (
            <motion.div className="rod__paso" key={p.clave} layout
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={resorte.entra}>
              <span className="rod__pasoMarca">
                <AnimatePresence initial={false} mode="wait">
                  {p.hecho
                    ? <motion.span key="ok" className="rod__pasoOk" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={resorte.toque}><Ico d={I.check} w={3.4} /></motion.span>
                    : <motion.span key="gira" className="rod__pasoGira" exit={{ opacity: 0, transition: { duration: 0.1 } }} />}
                </AnimatePresence>
              </span>
              {p.texto}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function RodrigoPage() {
  const { token } = useAuthContext();
  const navigate = useNavigate();
  const quieto = useReducedMotion();
  const api = useMemo(() => apiPara(token), [token]);

  const [mensajes, setMensajes] = useState(null);
  const [estado, setEstado] = useState({ trabajando: false, pasos: [] });
  const [persona, setPersona] = useState(null);
  const [fallo, setFallo] = useState(null);       // 'carga' | 'envio'
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState(null);         // { archivo, vista }
  const [enviando, setEnviando] = useState(false);
  const [motivo, setMotivo] = useState(null);
  const fin = useRef(null);
  const archivo = useRef(null);
  const ultimo = useRef(null);

  /* Suma los mensajes nuevos sin repetir ninguno. */
  const recibir = useCallback((r) => {
    if (!r) return;
    if (r.mensajes?.length) {
      setMensajes((antes) => {
        const base = (antes || []).filter((m) => !m.provisional);
        const tengo = new Set(base.map((m) => String(m.id)));
        const nuevos = r.mensajes.filter((m) => !tengo.has(String(m.id)));
        /* Lo que el app pinto por su cuenta se queda hasta que el servidor
           devuelve ese mismo mensaje ya guardado. */
        const llegoElMio = nuevos.some((m) => m.de === 'cliente');
        const mios = llegoElMio ? [] : (antes || []).filter((m) => m.provisional);
        return [...base, ...nuevos, ...mios];
      });
    }
    if (r.estado) setEstado(r.estado);
    if (r.persona) setPersona(r.persona);
  }, []);

  useEffect(() => {
    let vivo = true;
    api.conversacion()
      .then((r) => { if (vivo) { setMensajes(r?.mensajes || []); recibir(r); } })
      .catch(() => { if (vivo) { setMensajes([]); setFallo('carga'); } });
    return () => { vivo = false; };
  }, [api, recibir]);

  useEffect(() => {
    const reales = (mensajes || []).filter((m) => !m.provisional);
    ultimo.current = reales.length ? reales[reales.length - 1].id : null;
  }, [mensajes]);

  /* Mientras Rodrigo trabaja se le pregunta seguido; en reposo, de vez en
     cuando, por si contesta una persona. */
  useEffect(() => {
    if (fallo === 'carga' || mensajes === null) return undefined;
    const cada = estado.trabajando ? 1400 : 12000;
    const t = setInterval(() => {
      api.novedades(ultimo.current).then(recibir).catch(() => {});
    }, cada);
    return () => clearInterval(t);
  }, [api, estado.trabajando, fallo, mensajes === null, recibir]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'end' });
  }, [mensajes, estado, quieto]);

  const elegirFoto = (e) => {
    const a = e.target.files?.[0];
    e.target.value = '';
    if (!a) return;
    setFoto({ archivo: a, vista: URL.createObjectURL(a) });
  };

  const enviar = async (e) => {
    e?.preventDefault();
    const t = texto.trim();
    if ((!t && !foto) || enviando) return;
    vibrar.toque();
    setEnviando(true);
    setFallo(null);
    setMotivo(null);
    const mio = { id: `mio-${Date.now()}`, de: 'cliente', texto: t, fotoUrl: foto?.vista, provisional: true };
    setMensajes((antes) => [...(antes || []), mio]);
    setTexto('');
    const laFoto = foto;
    setFoto(null);
    try {
      const subida = laFoto ? await api.foto(laFoto.archivo) : null;
      await api.enviar(t, subida?.fotoId);
      setEstado((s) => ({ ...s, trabajando: true }));
      recibir(await api.novedades(ultimo.current));
    } catch (err) {
      /* El servidor explica el motivo (foto muy pesada, demasiados mensajes). */
      setMotivo(err?.response?.data?.message || null);
      setMensajes((antes) => (antes || []).filter((m) => m.id !== mio.id));
      setTexto(t);
      setFoto(laFoto);
      setFallo('envio');
    } finally {
      setEnviando(false);
    }
  };

  const tocar = async (pedir) => {
    vibrar.toque();
    setFallo(null);
    /* Un boton sirve una sola vez: se quitan todos al tocar uno. */
    setMensajes((antes) => (antes || []).map((m) => ({ ...m, acciones: undefined })));
    try {
      const r = await pedir();
      recibir(r);
      /* Un boton responde con todo hecho; "Persona" sigue trabajando y lo
         dice el servidor. Solo si no dijo nada se asume que sigue. */
      if (!r?.estado) setEstado((s) => ({ ...s, trabajando: true }));
    } catch (err) { setFallo('envio'); }
  };

  const conPersona = persona?.disponible;

  return (
    <main className="nPant rod">
      <span className="nMenta rod__menta" aria-hidden="true" />
      <header className="rod__cab">
        <motion.button type="button" className="rod__atras" aria-label="Volver" whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}><Ico d={I.atras} w={2.4} /></motion.button>
        <Cara s={46} pensando={estado.trabajando} />
        <span className="rod__quien">
          <b>Rodrigo</b>
          <AnimatePresence mode="wait" initial={false}>
            <motion.small key={estado.trabajando ? 'si' : 'no'} className={estado.trabajando ? 'is-on' : ''}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
              {estado.trabajando ? (estado.titulo || 'Revisando tu caso…') : 'Asistente de Allpa Food'}
            </motion.small>
          </AnimatePresence>
        </span>
        {conPersona &&
          <button type="button" className="rod__persona" onClick={() => tocar(() => api.persona())}>Persona</button>}
      </header>

      <div className="rod__hilo">
        {mensajes === null && <p className="rod__nota">Abriendo tu conversación…</p>}
        {fallo === 'carga' &&
          <p className="rod__nota">No pudimos abrir tu conversación con Rodrigo. Revisa tu conexión y vuelve a entrar.</p>}

        <AnimatePresence initial={false}>
          {(mensajes || []).map((m) => {
            const mio = m.de === 'cliente';
            return (
              <motion.div key={m.id} layout className={`rod__fila${mio ? ' rod__fila--mio' : ''}`}
                initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={resorte.entra}>
                {!mio && <Cara />}
                <div className="rod__col">
                  <div className={`rod__burbuja${mio ? ' rod__burbuja--mio' : ''}${m.fotoUrl ? ' rod__burbuja--foto' : ''}`}>
                    {m.fotoUrl && <img className="rod__foto" src={m.fotoUrl} alt="Foto enviada" />}
                    {m.de === 'persona' && <span className="rod__tjEt">PERSONA DEL EQUIPO</span>}
                    {m.texto && <p>{m.texto}</p>}
                    <Tarjeta tarjeta={m.tarjeta} />
                  </div>
                  {m.acciones?.length > 0 &&
                    <div className="rod__acciones">
                      {m.acciones.map((a) => (
                        <motion.button key={a.id} type="button" whileTap={{ scale: 0.95 }} transition={resorte.toque}
                          className={a.principal ? 'rod__accion rod__accion--on' : 'rod__accion'}
                          onClick={() => tocar(() => api.accion(a.id))}>{a.texto}</motion.button>
                      ))}
                    </div>}
                </div>
              </motion.div>
            );
          })}
          {estado.trabajando && <Trabajando key="trabajando" estado={estado} />}
        </AnimatePresence>
        <span ref={fin} className="rod__fin" />
      </div>

      <form className="rod__pie" onSubmit={enviar}>
        <AnimatePresence>
          {fallo === 'envio' &&
            <motion.p className="rod__aviso" role="alert" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {motivo || 'No se envió. Revisa tu conexión y vuelve a intentar.'}
            </motion.p>}
          {foto &&
            <motion.div className="rod__adjunto" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={resorte.toque}>
              <img src={foto.vista} alt="Foto por enviar" />
              <button type="button" aria-label="Quitar la foto" onClick={() => setFoto(null)}><Ico d={I.x} w={2.6} /></button>
            </motion.div>}
        </AnimatePresence>
        <div className="rod__caja">
          <input ref={archivo} type="file" accept="image/*" hidden onChange={elegirFoto} />
          <motion.button type="button" className="rod__redondo" aria-label="Enviar una foto" whileTap={{ scale: 0.9 }}
            onClick={() => archivo.current?.click()}><Ico d={I.camara} w={2} /></motion.button>
          <label htmlFor="rodMsj" className="rod__oculto">Escribe tu mensaje</label>
          <input id="rodMsj" type="text" autoComplete="off" enterKeyHint="send" placeholder="Escríbele a Rodrigo"
            value={texto} onChange={(e) => setTexto(e.target.value)} disabled={fallo === 'carga'} />
          <motion.button type="submit" className="rod__redondo rod__redondo--enviar" aria-label="Enviar"
            whileTap={{ scale: 0.9 }} disabled={(!texto.trim() && !foto) || enviando}><Ico d={I.enviar} /></motion.button>
        </div>
        <p className="rod__legal">Rodrigo es el asistente virtual de Allpa Food y solo ayuda con tu servicio.</p>
      </form>
    </main>
  );
}
