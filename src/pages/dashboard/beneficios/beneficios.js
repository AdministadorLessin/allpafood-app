import React, { useEffect, useMemo, useState } from 'react';
import './beneficios.scss';
import axios from 'axios';
import Pantalla, { Tramo } from '../../../components/perfil/Pantalla/Pantalla';
import Hoja from '../../../components/perfil/Hoja/Hoja';
import { useAuthContext } from '../../../context/authContext';

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

/* Cada categoria trae su icono: en una lista larga deja distinguir de un
   vistazo un gimnasio de una floreria sin leer el titulo. El color es uno
   solo, el menta suave de las filas del app. */
const CATEGORIAS = {
  'Salud & Bienestar': {
    d: 'M12 21s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 12c0 4.6-7 9-7 9z',
  },
  'Educación': {
    d: 'M3 8l9-4 9 4-9 4-9-4zM7 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4',
  },
  'Hogar & Lifestyle': {
    d: 'M4 11l8-6 8 6M6 10v9h12v-9M10 19v-5h4v5',
  },
  Fitness: {
    d: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12',
  },
  'Alimentación Saludable': {
    d: 'M12 8c-3.5-3-8 .5-6.5 5.5C6.7 18 10 21 12 21s5.3-3 6.5-7.5C20 8.5 15.5 5 12 8zM12 8c0-2 1-3.5 3-4.5',
  },
  _: {
    d: 'M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z',
  },
};

const WHATSAPP = '51955797697';
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

  const cuantos = convenios ? convenios.length : 0;

  return (
    <Pantalla etiqueta="Allpa+ · Incluido en tu plan" titulo="Tu plan también rinde afuera"
      bajada="Descuentos y acompañamiento en salud, fitness, hogar y formación, solo por ser cliente."
      volver="/bienestar" clase="bnf">

      {cuantos > 0 &&
        <Tramo className="bnf__cifras">
          <div><b>{cuantos}</b><small>{cuantos === 1 ? 'convenio' : 'convenios'}</small></div>
          <div><b>{grupos.length}</b><small>{grupos.length === 1 ? 'categoría' : 'categorías'}</small></div>
        </Tramo>}

      {error && <Tramo><p className="cuP__aviso" role="alert">{error}</p></Tramo>}
      {convenios === null && <Tramo><p className="cuP__vacio">Cargando tus beneficios…</p></Tramo>}
      {convenios !== null && convenios.length === 0 && !error &&
        <Tramo><p className="cuP__vacio">Todavía no hay convenios publicados.</p></Tramo>}

      {grupos.map(([categoria, items]) => {
        const e = estilo(categoria);
        return (
          <Tramo key={categoria}>
            <p className="cuP__grupo">{categoria}<span>{items.length}</span></p>
            <div className="cuP__lista">
              {items.map((c) => (
                <button type="button" className="cuP__fila" key={categoria + c.marca} onClick={() => abrir(c)}>
                  <span className="cuP__filaIco" aria-hidden="true"><Glifo d={e.d} /></span>
                  <span className="cuP__filaTxt">
                    <b>{c.marca}</b>
                    <small>{c.que}</small>
                  </span>
                  <span className="bnf__valor">
                    <b>{c.beneficio}</b>
                    {c.detalle && <small>{c.detalle}</small>}
                  </span>
                </button>
              ))}
            </div>
          </Tramo>
        );
      })}

      {/* Ficha del convenio, en una hoja: el codigo y el enlace, para usarlo
          sin escribirle a nadie. Si la marca todavia no tiene codigo cargado,
          cae de vuelta a WhatsApp en vez de dejar al cliente sin salida. */}
      <Hoja abierta={!!abierto} alCerrar={cerrar}
        etiqueta="Allpa+ · Incluido en tu plan"
        titulo={abierto ? [abierto.beneficio, abierto.detalle].filter(Boolean).join(' ') : ''}
        bajada={abierto ? [abierto.marca, abierto.que].filter(Boolean).join(' · ') : ''}
        pie={abierto && (abierto.url
          ? <a className="hoja__btn" href={abierto.url} target="_blank" rel="noreferrer">
              Ir a {abierto.marca}
            </a>
          : <button type="button" className="hoja__btn" onClick={() => porWhatsapp(abierto)}>
              Escribirnos por WhatsApp
            </button>)}>
        {abierto && <>
          {abierto.codigo
            ? <div className="bnf__codigo">
                <span className="bnf__codigoEt">Tu código</span>
                <div className="afFicha__codigo">
                  <span>{abierto.codigo}</span>
                  <button type="button" onClick={() => copiar(abierto.codigo)} aria-live="polite">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {copiado ? <path d="M5 12l5 5 9-10" /> : <><path d="M9 9h10v11H9z" /><path d="M5 15V4h10" /></>}
                    </svg>
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            : <p className="bnf__sinCodigo">
                Este convenio todavía se activa por WhatsApp. Escríbenos y
                te damos el código al momento.
              </p>
          }

          {abierto.comoUsar && <p className="bnf__como">{abierto.comoUsar}</p>}
          {abierto.nota && <p className="bnf__nota">{abierto.nota}</p>}
        </>}
      </Hoja>
    </Pantalla>
  );
};

export default Beneficios;
