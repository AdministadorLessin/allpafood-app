import React, { useEffect, useMemo, useState } from 'react';
import './beneficios.scss';
import axios from 'axios';
import LayoutDashboard from '../../../components/LayoutDashborad/LayoutDashboard';
import { useAuthContext } from '../../../context/authContext';
import { Cascada, Bloque, motion, alToque, Contador } from '../../../components/ultil/Motion/Motion';

/**
 * Allpa+, los convenios que vienen con el plan.
 *
 * Existian solo en la web publica, asi que quien ya habia pagado —el unico
 * que puede usarlos— no los veia por ningun lado. Estaba pagando por algo que
 * no sabia que tenia, y eso es lo que sostiene una renovacion.
 *
 * Los convenios no van escritos aqui: se leen de settings/allpa_plus, que es
 * una fila de la base. Sumar una marca, cambiar un porcentaje o cargar un
 * codigo nuevo es editar esa fila, sin compilar ni desplegar.
 */

/* Cada categoria trae su icono y su par de colores. El degradado no es
   decoracion: en una lista de diez tarjetas es lo que deja distinguir de un
   vistazo un gimnasio de una floreria sin leer el titulo. */
const CATEGORIAS = {
  'Salud & Bienestar': {
    d: 'M12 21s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 12c0 4.6-7 9-7 9z',
    de: '#DCEFE4', a: '#A8D8BE', 
  },
  'Educación': {
    d: 'M3 8l9-4 9 4-9 4-9-4zM7 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4',
    de: '#DEE9F7', a: '#AFC9EA',
  },
  'Hogar & Lifestyle': {
    d: 'M4 11l8-6 8 6M6 10v9h12v-9M10 19v-5h4v5',
    de: '#F5E7D3', a: '#E3C79B',
  },
  Fitness: {
    d: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12',
    de: '#EFE0EC', a: '#D5B4CE',
  },
  'Alimentación Saludable': {
    d: 'M12 8c-3.5-3-8 .5-6.5 5.5C6.7 18 10 21 12 21s5.3-3 6.5-7.5C20 8.5 15.5 5 12 8zM12 8c0-2 1-3.5 3-4.5',
    de: '#E2EFD6', a: '#B9DCA2',
  },
  _: {
    d: 'M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z',
    de: '#E6E9E7', a: '#C3CAC6',
  },
};

const WHATSAPP = '51999999999';
const estilo = (c) => CATEGORIAS[c] || CATEGORIAS._;

const Glifo = ({ d, className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Beneficios = () => {
  const { baseUrl, token } = useAuthContext();
  const [convenios, setConvenios] = useState(null);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    axios
      .get(`${baseUrl}settings/allpa_plus`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setConvenios(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .catch(() => {
        setConvenios([]);
        setError('No pudimos cargar tus beneficios. Vuelve a intentarlo.');
      });
  }, [baseUrl, token]);

  /* Se agrupa en el orden en que llegan, no alfabetico: asi el orden lo decide
     quien edita la fila de la base, sin tocar codigo. */
  const grupos = useMemo(() => {
    const m = new Map();
    (convenios ?? []).forEach((c) => {
      const k = c.categoria || 'Otros';
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    });
    return [...m.entries()];
  }, [convenios]);

  const abrir = (c) => { setAbierto(c); setCopiado(false); };
  const cerrar = () => setAbierto(null);

  /**
   * Copia el codigo al portapapeles.
   *
   * navigator.clipboard no existe fuera de contexto seguro y puede fallar sin
   * avisar. Antes el fallo se tragaba en un catch vacio: el cliente tocaba
   * "Copiar", no pasaba nada, y no tenia forma de saber si habia funcionado.
   *
   * Se intenta la via moderna, se cae a la vieja, y si ninguna funciona se
   * SELECCIONA el codigo en pantalla para que al menos pueda copiarlo a mano.
   */
  const copiar = (codigo) => {
    const aviso = () => { setCopiado(true); setTimeout(() => setCopiado(false), 2200); };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(codigo).then(aviso).catch(() => porLoViejo(codigo, aviso));
      return;
    }
    porLoViejo(codigo, aviso);
  };

  const porLoViejo = (codigo, aviso) => {
    try {
      const t = document.createElement('textarea');
      t.value = codigo;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;top:-9999px';
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(t);
      if (ok) { aviso(); return; }
    } catch { /* sigue abajo */ }

    const span = document.querySelector('.afFicha__codigo span');
    if (span && window.getSelection) {
      const r = document.createRange();
      r.selectNodeContents(span);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    }
  };

  const porWhatsapp = (c) => {
    const texto = `Hola, quiero usar mi beneficio Allpa+ de ${c.marca}.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <LayoutDashboard>
      <Cascada className="afPlus">

        <Bloque>
          <div className="afPlusHero">
            <span className="afPlusHero__et">Allpa+</span>
            <h1 className="afPlusHero__tit">
              Tu plan <em>también rinde afuera</em>
            </h1>
            <p className="afPlusHero__baja">
              Descuentos y acompañamiento en salud, fitness, hogar y formación,
              solo por ser cliente.
            </p>
            {convenios !== null && convenios.length > 0 &&
              <div className="afPlusHero__cifras">
                <span><b><Contador valor={convenios.length} /></b> convenios</span>
                <i />
                <span><b><Contador valor={grupos.length} /></b> categorías</span>
              </div>
            }
          </div>
        </Bloque>

        {error && <Bloque><p className="afPlus__aviso">{error}</p></Bloque>}
        {convenios === null && <Bloque><p className="afPlus__aviso">Cargando tus beneficios…</p></Bloque>}
        {convenios !== null && convenios.length === 0 && !error &&
          <Bloque><p className="afPlus__aviso">Todavía no hay convenios publicados.</p></Bloque>}

        {grupos.map(([categoria, items]) => {
          const e = estilo(categoria);
          return (
            <React.Fragment key={categoria}>
              <Bloque>
                <p className="afPlus__cat">
                  <span className="afPlus__catIco" style={{ background: `linear-gradient(140deg,${e.de},${e.a})` }}>
                    <Glifo d={e.d} />
                  </span>
                  {categoria}
                  <b>{items.length}</b>
                </p>
              </Bloque>

              {items.map((c) => (
                <Bloque key={categoria + c.marca}>
                  <motion.button
                    type="button"
                    className="afConv"
                    onClick={() => abrir(c)}
                    {...alToque}
                  >
                    <span
                      className="afConv__ico"
                      style={{ background: `linear-gradient(140deg,${e.de},${e.a})` }}
                    >
                      <Glifo d={e.d} />
                    </span>
                    <span className="afConv__txt">
                      <b>{c.marca}</b>
                      <small>{c.que}</small>
                    </span>
                    <span className="afConv__valor">
                      <b>{c.beneficio}</b>
                      <small>{c.detalle}</small>
                    </span>
                  </motion.button>
                </Bloque>
              ))}
            </React.Fragment>
          );
        })}
      </Cascada>

      {/* Ficha del convenio: el codigo y el enlace, para usarlo sin escribirle
          a nadie. Si la marca todavia no tiene codigo cargado, cae de vuelta a
          WhatsApp en vez de dejar al cliente sin salida. */}
      {abierto && (() => {
        const e = estilo(abierto.categoria);
        return (
          <div className="afFicha" onClick={cerrar}>
            <motion.div
              className="afFicha__caja"
              onClick={(ev) => ev.stopPropagation()}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 0.84, 0.44, 1] }}
            >
              <button type="button" className="afFicha__x" onClick={cerrar} aria-label="Cerrar">×</button>

              <div className="afFicha__top" style={{ background: `linear-gradient(140deg,${e.de},${e.a})` }}>
                <span className="afFicha__ico"><Glifo d={e.d} /></span>
                <p className="afFicha__valor">{abierto.beneficio}</p>
                <p className="afFicha__detalle">{abierto.detalle}</p>
              </div>

              <div className="afFicha__cuerpo">
                <p className="afFicha__marca">{abierto.marca}</p>
                <p className="afFicha__que">{abierto.que}</p>

                {abierto.codigo
                  ? <>
                      <p className="afFicha__lbl">Tu código</p>
                      <div className="afFicha__codigo">
                        <span>{abierto.codigo}</span>
                        <button type="button" onClick={() => copiar(abierto.codigo)}>
                          {copiado ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </>
                  : <p className="afFicha__sinCodigo">
                      Este convenio todavía se activa por WhatsApp. Escríbenos y
                      te damos el código al momento.
                    </p>
                }

                {abierto.comoUsar && <p className="afFicha__como">{abierto.comoUsar}</p>}
                {abierto.nota && <span className="afFicha__nota">{abierto.nota}</span>}

                {abierto.url
                  ? <a className="afFicha__btn" href={abierto.url} target="_blank" rel="noreferrer">
                      Ir a {abierto.marca}
                    </a>
                  : <button type="button" className="afFicha__btn" onClick={() => porWhatsapp(abierto)}>
                      Escribirnos por WhatsApp
                    </button>
                }
              </div>
            </motion.div>
          </div>
        );
      })()}
    </LayoutDashboard>
  );
};

export default Beneficios;
