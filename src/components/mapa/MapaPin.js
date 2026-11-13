import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { TILES_URL, TILES_CREDITO, buscarDireccion } from './osm';
import './MapaPin.scss';

/* El pin. Leaflet trae uno por defecto que apunta desde el centro; este apunta
   con la punta, que es el punto exacto al que llega el motorizado. Unos metros
   de diferencia son media cuadra. */
/* A color: circulo menta con el pin en tinta, y la punta debajo. */
const PIN = L.divIcon({
  className: 'afPinWrap',
  html: '<span class="afPin"><span class="afPin__c">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
    + '</span><span class="afPin__p"></span></span>',
  iconSize: [48, 57],
  iconAnchor: [24, 57],
});

/** Un toque en el mapa mueve el pin, igual que antes. */
const AlTocar = ({ onMover }) => {
  useMapEvents({ click: (e) => onMover({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

/* Centrar sin pelearse con el usuario: solo cuando el punto cambia de verdad,
   no en cada repintado. */
const Centrar = ({ punto }) => {
  const map = useMap();
  const ultimo = useRef(null);

  useEffect(() => {
    if (!punto) return;
    const igual = ultimo.current
      && Math.abs(ultimo.current.lat - punto.lat) < 1e-7
      && Math.abs(ultimo.current.lng - punto.lng) < 1e-7;
    if (igual) return;
    ultimo.current = punto;
    map.setView([punto.lat, punto.lng], map.getZoom() < 15 ? 16 : map.getZoom());
  }, [punto, map]);

  return null;
};

/**
 * Buscador de calles.
 *
 * Espera a que el cliente deje de escribir. Cada tecla no es una busqueda
 * distinta, y la politica de OpenStreetMap pide no pasar de una consulta por
 * segundo. Antes, con Google, cada tecla era una llamada facturada.
 */
const Buscador = ({ onElegir }) => {
  const [texto, setTexto] = useState('');
  const [opciones, setOpciones] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (texto.trim().length < 4) { setOpciones([]); return undefined; }
    setBuscando(true);
    const t = setTimeout(() => {
      buscarDireccion(texto)
        .then(setOpciones)
        .finally(() => setBuscando(false));
    }, 800);
    return () => { clearTimeout(t); setBuscando(false); };
  }, [texto]);

  return (
    <div className="afBuscaMapa">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Busca tu calle o avenida"
        aria-label="Buscar calle"
      />
      {buscando && <span className="afBuscaMapa__estado">Buscando…</span>}
      {opciones.length > 0 && (
        <ul className="afBuscaMapa__lista">
          {opciones.map((o) => (
            <li key={`${o.lat},${o.lng}`}>
              <button type="button" onClick={() => { onElegir(o); setTexto(''); setOpciones([]); }}>
                {o.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * El mapa donde el cliente marca su puerta.
 *
 * Reemplaza al de Google. Misma forma de usarse: toca o arrastra el pin, y el
 * punto que queda es el que recibe el motorizado.
 *
 * La consulta de distrito NO se hace aqui: el pin puede moverse muchas veces
 * seguidas y cada movimiento no es una direccion nueva. La pantalla que use
 * este componente decide cuando preguntar, al soltar.
 */
const MapaPin = ({ punto, onMover, zona, conBuscador = true, alto = 320 }) => {
  const centro = punto && punto.lat != null ? [punto.lat, punto.lng] : [-12.0931, -77.0262];

  return (
    <div className="afMapa" style={{ height: alto }}>
      {conBuscador && <Buscador onElegir={(o) => onMover({ lat: o.lat, lng: o.lng })} />}

      <MapContainer center={centro} zoom={punto ? 16 : 12} className="afMapa__lienzo"
                    scrollWheelZoom={false}>
        <TileLayer url={TILES_URL} attribution={TILES_CREDITO} maxZoom={19} />

        {/* La zona de reparto, para que el cliente vea si entra antes de
            terminar de escribir sus datos. */}
        {Array.isArray(zona) && zona.length > 2 && (
          <Polygon
            positions={zona.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#12A866', weight: 2, fillColor: '#3CFB9F', fillOpacity: 0.28 }}
          />
        )}

        <AlTocar onMover={onMover} />
        <Centrar punto={punto} />

        {punto && punto.lat != null && (
          <Marker
            position={[punto.lat, punto.lng]}
            icon={PIN}
            draggable
            eventHandlers={{
              /* Solo al soltar. Mientras se arrastra, el mapa mueve el pin
                 solo y no hace falta avisar a nadie: avisar en cada cuadro es
                 exactamente lo que disparo la cuenta de Google. */
              dragend: (e) => {
                const p = e.target.getLatLng();
                onMover({ lat: p.lat, lng: p.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapaPin;
