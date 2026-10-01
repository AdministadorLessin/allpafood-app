/**
 * Mapas sin Google.
 *
 * Todo lo que el sistema le pedia a Google —dibujar el mapa, poner un pin,
 * saber si un punto cae dentro de la zona de reparto, averiguar el distrito y
 * buscar una calle— resuelto con OpenStreetMap, que no cobra ni pide tarjeta.
 *
 * El motivo no fue tecnico: una sola pantalla mal programada consumio S/1,544
 * en llamadas a Google. Con esto no existe una factura que se pueda desbocar.
 *
 * Lo que se pierde: la busqueda de direcciones es menos fina que la de Google
 * en Lima. Se compensa con el pin, que es lo que el cliente ajusta igual.
 */

/* El proveedor de los cuadritos del mapa, en un solo sitio por si algun dia
   hay que mudarse a otro. Requiere mostrar el credito a OpenStreetMap: no es
   cortesia, es la condicion de uso. */
export const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILES_CREDITO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/**
 * ¿El punto cae dentro del poligono?
 *
 * Reemplaza a google.maps.geometry.poly.containsLocation. Es el algoritmo del
 * rayo: se traza una linea al infinito y se cuentan los cruces con los lados;
 * impar significa dentro.
 *
 * Se resuelve aqui, en el navegador, sin preguntarle a nadie: es aritmetica,
 * no un servicio que se pague.
 */
export function dentroDePoligono(punto, poligono) {
  if (!punto || !Array.isArray(poligono) || poligono.length < 3) return false;

  const x = Number(punto.lng);
  const y = Number(punto.lat);
  let dentro = false;

  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const xi = Number(poligono[i].lng);
    const yi = Number(poligono[i].lat);
    const xj = Number(poligono[j].lng);
    const yj = Number(poligono[j].lat);

    const cruza = (yi > y) !== (yj > y)
      && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (cruza) dentro = !dentro;
  }

  return dentro;
}

/* Lo ultimo que se le pregunto a Nominatim. Su politica de uso pide no
   abusar —una consulta por segundo como mucho—, y ademas preguntar dos veces
   por el mismo punto no aporta nada. */
let ultimoPunto = null;
let ultimaRespuesta = null;

const MISMO_SITIO = 0.00015; // ~15 metros

/**
 * De un punto del mapa a distrito y calle.
 *
 * Reemplaza al Geocoder de Google. Devuelve null si no se pudo averiguar; la
 * pantalla tiene que seguir funcionando igual, porque lo que de verdad manda
 * es el pin que el cliente dejo, no el nombre que le pongamos.
 */
export async function ubicarPunto({ lat, lng }) {
  if (lat == null || lng == null) return null;

  if (ultimoPunto
      && Math.abs(ultimoPunto.lat - lat) < MISMO_SITIO
      && Math.abs(ultimoPunto.lng - lng) < MISMO_SITIO) {
    return ultimaRespuesta;
  }

  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      + '&zoom=18&addressdetails=1&accept-language=es';
    const r = await fetch(url);
    if (!r.ok) return null;

    const d = await r.json();
    const a = d.address || {};

    /* El distrito de Lima puede llegar con varios nombres segun la zona.
       Se toma el primero que no sea "Lima" a secas, que es la provincia y no
       le sirve a nadie para repartir. */
    const distrito = [a.city_district, a.suburb, a.town, a.village, a.city, a.county]
      .map((v) => (v || '').trim())
      .find((v) => v && v.toLowerCase() !== 'lima' && v.toLowerCase() !== 'lima metropolitana');

    const calle = [a.road, a.house_number].filter(Boolean).join(' ');

    ultimoPunto = { lat, lng };
    ultimaRespuesta = {
      distrito: distrito || null,
      calle: calle || null,
      direccion: d.display_name || null,
    };
    return ultimaRespuesta;
  } catch {
    return null;
  }
}

/**
 * Buscar una direccion escrita.
 *
 * Reemplaza al autocompletado de Google. Se limita a Peru y a los alrededores
 * de Lima para que "Los Olivos" no devuelva un pueblo de España.
 *
 * Quien llame a esto tiene que esperar a que el cliente deje de escribir: la
 * politica de Nominatim es de una consulta por segundo, y ademas cada tecla
 * no es una busqueda distinta.
 */
export async function buscarDireccion(texto) {
  const q = (texto || '').trim();
  if (q.length < 4) return [];

  try {
    const url = `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}`
      + '&countrycodes=pe&limit=6&addressdetails=1&accept-language=es'
      // Recuadro de Lima metropolitana: acota sin excluir Lurin ni Ancon.
      + '&viewbox=-77.25,-11.70,-76.70,-12.40&bounded=1';
    const r = await fetch(url);
    if (!r.ok) return [];

    const lista = await r.json();
    return (Array.isArray(lista) ? lista : []).map((d) => ({
      etiqueta: d.display_name,
      lat: Number(d.lat),
      lng: Number(d.lon),
    }));
  } catch {
    return [];
  }
}
