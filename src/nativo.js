import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { iniciarAvisos } from './avisos';

/**
 * Lo que hace que el app instalado se sienta app y no una pagina web.
 *
 * Todo esto solo corre dentro del app de Android (y despues de iPhone). En el
 * navegador no hace nada, asi que app.allpafood.com sigue igual que siempre.
 */
export const esNativo = Capacitor.isNativePlatform();

const Barras = registerPlugin('Barras');

/* Los colores de las franjas del telefono (la de la hora y la de abajo).
   Las pantallas de ingreso y registro son blancas; el panel lleva el mismo
   degradado de marfil a menta que el body en global.scss. */
const BLANCO = { arriba: '#FFFFFF', abajo: '#FFFFFF' };
const PANEL = { arriba: '#F7FAF4', abajo: '#E6F2E2' };
/* El ingreso es oscuro; con la hoja abierta, la franja de abajo toma el
   blanco de la hoja. */
/* La apertura usa el verde del logo oficial. */
const APERTURA = { arriba: '#183A2A', abajo: '#183A2A', oscuro: true };
const INGRESO = { arriba: '#0E1713', abajo: '#0E1713', oscuro: true };
const INGRESO_HOJA = { arriba: '#0E1713', abajo: '#F4F6F5', oscuro: true };

/* La pantalla de arranque (el logo sobre verde tinta) se queda hasta que hay algo
   que leer. Antes se iba apenas cargaba el codigo y el cliente miraba una
   pantalla vacia varios segundos mientras llegaban sus datos. Con tope de 10
   segundos, para que una red lenta nunca deje a nadie mirando el logo. */
let arranqueVisible = true;
const quitarArranque = () => {
  if (!arranqueVisible) return;
  arranqueVisible = false;
  SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
};
const hayContenido = () =>
  (document.getElementById('root')?.innerText || '').trim().length > 0;

let ultimo = '';
const pintarBarras = () => {
  if (document.querySelector('.afApertura:not(.afApertura--sale)')) {
    const clave = 'apertura';
    if (clave !== ultimo) { ultimo = clave; Barras.colores(APERTURA).catch(() => {}); }
    return;
  }
  const ingreso = document.querySelector('.afIngreso');
  const colores = ingreso
    ? (ingreso.classList.contains('afIngreso--hoja') ? INGRESO_HOJA : INGRESO)
    : (document.querySelector('.afAuth') ? BLANCO : PANEL);
  const clave = colores.arriba + colores.abajo;
  if (clave === ultimo) return;
  ultimo = clave;
  Barras.colores(colores).catch(() => {});
};

export const iniciarNativo = () => {
  if (!esNativo) return;

  document.documentElement.classList.add('es-nativo');
  iniciarAvisos();

  /* Cada cambio de pantalla cambia el contenido de #root; se revisa una vez
     por cuadro, no en cada nodo que React toca. */
  let pendiente = false;
  new MutationObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      pintarBarras();
      if (arranqueVisible && hayContenido()) quitarArranque();
    });
  }).observe(document.getElementById('root'), {
    childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
  });
  pintarBarras();
  setTimeout(quitarArranque, 10000);

  /* El boton atras de Android. Sin esto cerraba el app desde cualquier
     pantalla: el cliente estaba eligiendo platos, tocaba atras y se iba. */
  App.addListener('backButton', ({ canGoBack }) => {
    /* Una pantalla con algo abierto encima (la hoja de ingreso) lo cierra
       primero; solo si nadie lo atiende se navega. */
    const aviso = new CustomEvent('af-atras', { cancelable: true });
    window.dispatchEvent(aviso);
    if (aviso.defaultPrevented) return;
    const enInicio = ['/', '/ingresar'].includes(window.location.pathname);
    if (canGoBack && !enInicio) window.history.back();
    else App.minimizeApp();
  });
};
