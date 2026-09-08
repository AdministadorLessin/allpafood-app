/**
 * Direccion del API.
 *
 * Antes cada archivo llevaba la URL escrita a mano, asi que probar en local
 * obligaba a editar 47 lineas repartidas en 24 archivos —y a acordarse de
 * revertirlas todas antes de desplegar—. Con esto se cambia en un solo sitio,
 * o sin tocar codigo mediante REACT_APP_API_URL.
 *
 * En desarrollo, si nadie fijo esa variable, la direccion se deduce del propio
 * navegador: el API corre en el mismo equipo que sirve la app, en el 8443. Asi
 * funciona igual abriendo localhost en la Mac que la IP de la red desde el
 * celular, y deja de romperse cada vez que el router le cambia la IP al equipo.
 *
 * En produccion nada de esto aplica: alli NODE_ENV es 'production' y se usa la
 * URL de siempre.
 */
const enDesarrollo = process.env.NODE_ENV === 'development';

const apiDelMismoEquipo = () => {
  if (typeof window === 'undefined') return null;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8443/api-af/v1/`;
};

export const API_URL =
  process.env.REACT_APP_API_URL
  || (enDesarrollo && apiDelMismoEquipo())
  || 'https://api.allpafood.com/dev/api-af/v1/';

export default API_URL;
