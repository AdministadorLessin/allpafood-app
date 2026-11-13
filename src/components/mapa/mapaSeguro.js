/**
 * El marcador de Google lanza un error al soltarse de un mapa que no llego a
 * cargar (llave rechazada, sin conexion): "Cannot read properties of
 * undefined (reading 'getRootNode')". Pasa justo cuando la pantalla del mapa
 * se cierra, y tumbaba el app entero aunque no hubiera nada roto que mostrar.
 *
 * Aqui se envuelve esa unica operacion (quitar el marcador del mapa) para que
 * un fallo ahi no pase de ser un aviso en la consola. Poner el marcador en un
 * mapa sigue fallando en voz alta si algo anda mal: eso si hay que verlo.
 */
let listo = false;

const proteger = () => {
  const Marcador = window.google?.maps?.marker?.AdvancedMarkerElement;
  if (!Marcador) return false;
  /* "map" puede estar definido en la clase o en una de la que hereda. */
  let dueno = Marcador.prototype;
  let d = null;
  while (dueno && !(d = Object.getOwnPropertyDescriptor(dueno, 'map'))) dueno = Object.getPrototypeOf(dueno);
  if (!d || !d.set || !d.configurable) return true;   // nada que envolver
  const poner = d.set;
  Object.defineProperty(dueno, 'map', {
    ...d,
    set(valor) {
      try {
        poner.call(this, valor);
      } catch (error) {
        if (valor !== null && valor !== undefined) throw error;
        console.warn('[AllpaFood] El marcador no pudo soltarse del mapa:', error?.message);
      }
    },
  });
  return true;
};

/* La libreria de marcadores se carga sola cuando se abre el primer mapa: se
   revisa seguido hasta que aparezca, y ahi se deja de revisar. */
export const protegerMapa = () => {
  if (listo || typeof window === 'undefined') return;
  const t = setInterval(() => {
    try { if (proteger()) { listo = true; clearInterval(t); } } catch (e) { clearInterval(t); }
  }, 60);
};
