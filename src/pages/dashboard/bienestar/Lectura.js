import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import moment from 'moment';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { resorte } from '../../../movimiento';

/**
 * Una lectura o receta, a pantalla completa: sube desde abajo como una hoja,
 * con la foto arriba y el texto para leer con calma. Se cierra con su boton,
 * con Escape o jalando hacia abajo desde la foto.
 */
/* Los emojis, incluidos los numeros en recuadro, que si no dejarian el
   numero suelto delante del titulo. */
const EMOJI = /[0-9#*]\uFE0F?\u20E3\s*|[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu;

export const limpio = (html) => {
  const d = document.createElement('div');
  d.innerHTML = String(html || '');
  return (d.textContent || '').replace(EMOJI, '').replace(/\s+/g, ' ').trim();
};
export const portada = (p) => p?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
export const minutos = (p) => Math.max(1, Math.round(limpio(p?.content?.rendered).split(' ').length / 200));

/* El texto llega del blog con su HTML. Se deja solo lo que es texto: fuera
   scripts, marcos, estilos en linea, atributos de eventos y emojis. */
const PERMITIDAS = new Set(['P', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'BLOCKQUOTE', 'BR', 'A', 'IMG', 'FIGURE', 'FIGCAPTION']);
const cuerpoSeguro = (html) => {
  const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const raiz = doc.body.firstChild;
  const pasar = (nodo) => {
    [...nodo.childNodes].forEach((n) => {
      if (n.nodeType === 3) { n.textContent = n.textContent.replace(EMOJI, ''); return; }
      if (n.nodeType !== 1) { n.remove(); return; }
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'SVG'].includes(n.tagName.toUpperCase())) { n.remove(); return; }
      pasar(n);
      if (!PERMITIDAS.has(n.tagName)) { n.replaceWith(...n.childNodes); return; }
      [...n.attributes].forEach((a) => {
        const ok = (n.tagName === 'A' && a.name === 'href' && /^https?:/i.test(a.value))
          || (n.tagName === 'IMG' && (a.name === 'src' || a.name === 'alt') && (a.name === 'alt' || /^https?:/i.test(a.value)));
        if (!ok) n.removeAttribute(a.name);
      });
      if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
      if (n.tagName === 'IMG') n.setAttribute('loading', 'lazy');
    });
  };
  pasar(raiz);
  /* Los titulos que eran solo un emoji con numero quedan con un espacio al
     inicio: se recorta. */
  raiz.querySelectorAll('h2,h3,h4,p,li').forEach((e) => { if (!e.textContent.trim() && !e.querySelector('img')) e.remove(); });
  return raiz.innerHTML;
};

export default function Lectura({ articulo, categoria, alCerrar }) {
  const quieto = useReducedMotion();
  const cuerpo = useMemo(() => (articulo ? cuerpoSeguro(articulo.content?.rendered) : ''), [articulo]);

  useEffect(() => {
    if (!articulo) return undefined;
    const tecla = (e) => { if (e.key === 'Escape') alCerrar(); };
    document.addEventListener('keydown', tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = antes; };
  }, [articulo, alCerrar]);

  return createPortal(
    <AnimatePresence>
      {articulo &&
        <motion.div className="lec" key="lectura" role="dialog" aria-modal="true" aria-label={limpio(articulo.title?.rendered)}
          initial={quieto ? { opacity: 0 } : { y: '100%' }} animate={quieto ? { opacity: 1 } : { y: 0 }}
          exit={quieto ? { opacity: 0 } : { y: '100%' }} transition={resorte.suave}>
          <div className="lec__hilo">
            <header className="lec__foto">
              {portada(articulo) && <img src={portada(articulo)} alt="" />}
              <span className="lec__velo" aria-hidden="true" />
              <span className="lec__titulo">
                <small>{categoria.toUpperCase()} · {minutos(articulo)} MIN</small>
                <h1>{limpio(articulo.title?.rendered)}</h1>
                <em>{moment(articulo.date).format('D [de] MMMM [de] YYYY')}</em>
              </span>
            </header>
            {/* eslint-disable-next-line react/no-danger */}
            <article className="lec__texto" dangerouslySetInnerHTML={{ __html: cuerpo }} />
          </div>
          <motion.button type="button" className="lec__cerrar" aria-label="Cerrar la lectura" onClick={alCerrar}
            whileTap={{ scale: 0.9 }} transition={resorte.toque}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </motion.button>
        </motion.div>}
    </AnimatePresence>,
    document.body
  );
}
