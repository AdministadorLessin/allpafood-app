/**
 * Direccion del API.
 *
 * Antes cada archivo llevaba la URL escrita a mano, asi que probar en local
 * obligaba a editar 47 lineas repartidas en 24 archivos —y a acordarse de
 * revertirlas todas antes de desplegar—. Con esto se cambia en un solo sitio,
 * o sin tocar codigo mediante REACT_APP_API_URL.
 *
 * Si la variable no existe, se usa la de produccion: el comportamiento por
 * defecto es exactamente el de siempre.
 */
export const API_URL =
  process.env.REACT_APP_API_URL || 'https://api.allpafood.com/dev/api-af/v1/';

export default API_URL;
