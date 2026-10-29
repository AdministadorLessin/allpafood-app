import { Capacitor } from '@capacitor/core';

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

/**
 * La llave de Google Maps.
 *
 * Estaba escrita a mano en seis archivos del app y tres del panel. Rotarla
 * —algo que toca hacer si se filtra o si se cambia de proyecto en Google—
 * significaba encontrar los nueve sitios sin olvidar ninguno.
 *
 * Ahora es un solo lugar, y se puede cambiar sin tocar codigo poniendo
 * REACT_APP_MAPS_KEY antes de compilar.
 *
 * El mapId va aparte porque pertenece al mismo proyecto de Google: si algun
 * dia se cambia la llave, este tambien cambia.
 */
/*
 * El app de iPhone no puede usar esa llave. Esa llave solo acepta sitios
 * https://, y en el iPhone el app se presenta como capacitor://app.allpafood.com
 * (Apple no deja que un app use https). Google respondia
 * RefererNotAllowedMapError y la pantalla del mapa se caia. Android si la usa:
 * ahi el app se presenta como https://app.allpafood.com.
 *
 * El iPhone lleva su propia llave, limitada a Maps, Places y Geocoding y con
 * tope diario. No esta en el repo (es publico): se pasa en
 * REACT_APP_MAPS_KEY_IOS al compilar el app, desde la carpeta de la firma. Sin
 * ella, el iPhone cae en la llave de la web.
 */
const LLAVE_IOS = process.env.REACT_APP_MAPS_KEY_IOS;

export const MAPS_KEY =
  (LLAVE_IOS && Capacitor.getPlatform() === 'ios')
    ? LLAVE_IOS
    : (process.env.REACT_APP_MAPS_KEY || 'AIzaSyBtKeD-JuzJdX7HvLrxzBPkuTPrB7EgtUk');

export const MAPS_ID = process.env.REACT_APP_MAPS_ID || 'e151d2a33166c8baa4ff73ee';
