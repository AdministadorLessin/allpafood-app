import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

import TextField from '@mui/material/TextField';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import {
    APIProvider,
    AdvancedMarker,
    Map,
    useMap,
    useMapsLibrary,
    useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';

import MarcoAuth, { Accion } from './../../../components/auth/Marco/MarcoAuth';
import { Polygon } from './../../../pages/dashboard/ubicaciones/circulo';
import { useAuthContext } from '../../../context/authContext';
import { esNativo } from '../../../nativo';
import { direccionDeVisita, guardarDireccionDeVisita, olvidarDireccionDeVisita } from '../../../visita';
import '../../visita/Visita.scss';
import { API_URL, MAPS_KEY, MAPS_ID } from '../../../config';

import './registro.scss';

/**
 * Ultima pantalla del registro: la direccion de entrega.
 *
 * Va DESPUES del pago a proposito. Pedir la direccion antes de que el cliente
 * decida comprar es un formulario largo delante de la caja; pedirla despues es
 * el unico dato que de verdad hace falta para que el almuerzo salga.
 *
 * La direccion se guarda como punto de entrega —la misma tabla que usa
 * /ubicaciones y que lee el motorizado—, no como texto suelto en el perfil.
 *
 * Las alergias y el azucar se preguntan aqui tambien, pero se pueden saltar.
 * NO es cocina personalizada: es lo que el cliente no puede comer.
 */
/* La calle y el numero de lo que se eligio en el buscador. */
const calleDelBuscador = (lugar) => {
    if (!lugar) return '';
    const piezas = lugar.address_components || [];
    const via = piezas.find((c) => c.types.includes('route'));
    const num = piezas.find((c) => c.types.includes('street_number'));
    if (via) return num ? `${via.long_name} ${num.long_name}` : via.long_name;
    /* Sin piezas, el primer tramo de la direccion escrita ("Jiron X 776"). */
    return String(lugar.formatted_address || lugar.name || '').split(',')[0].trim();
};

/* El distrito de lo elegido en el buscador, con el mismo criterio que el del
   mapa: "Lima" a secas no es un distrito. */
const distritoDelBuscador = (lugar) => {
    const piezas = lugar?.address_components || [];
    for (const tipo of ['administrative_area_level_3', 'sublocality_level_1', 'locality']) {
        const c = piezas.find((x) => x.types.includes(tipo));
        if (c && !c.long_name.toLowerCase().includes('lima')) return c.long_name;
    }
    return '';
};

/* Con `visita`, la misma pantalla sirve a quien todavia no es cliente: marca
   su punto, ve si llegamos y se guarda en el telefono. Cuando compra, este
   paso lo encuentra ya marcado. */
const RegistroDireccionPage = ({ visita = false }) => {

    const navigate = useNavigate();
    const { token, coverCities } = useAuthContext();

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [markerRef, marker] = useAdvancedMarkerRef();

    /* Lo que marco estando de visita, si lo hizo. */
    const previa = useRef(direccionDeVisita()).current;

    const [centro, setCentro] = useState(previa?.lat
        ? { lat: previa.lat, lng: previa.lng }
        : { lat: -12.080827968350965, lng: -77.0281646638726 });
    const [marcado, setMarcado] = useState(!!previa?.lat);
    const [enCobertura, setEnCobertura] = useState(previa ? previa.enCobertura !== false : true);

    const [calleDelMapa, setCalleDelMapa] = useState(previa?.calle || null);

    /* Si el cliente ya corrigio la direccion, mover el pin unos metros no se
       la puede volver a pisar. */
    const [calleTocada, setCalleTocada] = useState(false);
    const [distrito, setDistrito] = useState(previa?.distrito || '');
    const [distritoNoDetectado, setDistritoNoDetectado] = useState(false);

    const [campos, setCampos] = useState({
        distrito: previa?.distrito || '',
        detalle: previa?.detalle || '',
        referencia: previa?.referencia || '',
        alergias: ''
    });
    const [azucar, setAzucar] = useState(true);

    /* Si no esta cuando llega el motorizado, que pueda dejarlo en recepcion a
       su nombre sin llamar ni esperar. Va dentro de la referencia porque es lo
       que el motorizado ya lee en su ruta, junto a la direccion. Marcado de
       entrada: casi todos los clientes reciben en una oficina. */
    const [enRecepcion, setEnRecepcion] = useState(true);
    const nombreCliente = (() => {
        try {
            const p = JSON.parse(window.localStorage.getItem('inf'))?.profile;
            return [p?.name, p?.lastname].filter(Boolean).join(' ').trim();
        } catch (e) { return ''; }
    })();

    /* En el alta del app, lo que no come y el azucar se preguntan en la
       pantalla siguiente, "Para tu cocina", junto con cuanto se mueve. Aqui
       queda solo la direccion. */
    const enAltaApp = esNativo && (() => {
        try { return window.localStorage.getItem('af_alta') === '1'; } catch (e) { return false; }
    })();
    const [aceptaTerminos, setAceptaTerminos] = useState(false);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const cambiar = (e) => {
        const { name, value } = e.target;
        setCampos((prev) => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (latLng, lugar) => {
        if (!latLng) return;

        const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
        const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

        setCentro({ lat, lng });
        setMarcado(true);

        /* Si la direccion vino del buscador, ya la tenemos escrita: es la que
           el cliente eligio. Antes se tiraba y se le volvia a preguntar a
           Google por el punto; cuando esa consulta no respondia, el campo
           quedaba vacio aunque arriba se leyera la direccion completa. */
        const deBuscador = calleDelBuscador(lugar);
        if (deBuscador && !calleTocada) setCalleDelMapa(deBuscador);
        const distritoBuscado = distritoDelBuscador(lugar);
        if (distritoBuscado) {
            setDistritoNoDetectado(false);
            setDistrito(distritoBuscado);
            setCampos((prev) => ({ ...prev, distrito: distritoBuscado }));
        }

        buscarDistrito({ lat, lng }, { conservarCalle: !!deBuscador });

        if (window.google?.maps?.geometry?.poly) {
            const zona = new window.google.maps.Polygon({ paths: coverCities });
            setEnCobertura(
                window.google.maps.geometry.poly.containsLocation({ lat, lng }, zona)
            );
        }
    };

    /* Mismo criterio que /ubicaciones: Google devuelve "Lima" en muchas
       avenidas principales, y en ese caso el distrito se pide a mano. */
    const buscarDistrito = ({ lat, lng }, { conservarCalle = false } = {}) => {
        if (!window.google?.maps?.Geocoder) return;

        new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results?.length) return;

            let encontrado = null;

            for (const r of results) {
                const c = r.address_components.find((x) => x.types.includes('administrative_area_level_3'));
                if (c && c.long_name.toLowerCase() !== 'lima') { encontrado = c.long_name; break; }
            }

            if (!encontrado) {
                for (const r of results) {
                    const c = r.address_components.find((x) => x.types.includes('sublocality_level_1'));
                    if (c && !c.long_name.toLowerCase().includes('lima')) { encontrado = c.long_name; break; }
                }
            }

            /* La calle. Sin esto en la base quedan direcciones que son solo un
               numero de departamento, imposibles de buscar para el motorizado. */
            const conCalle = results.find((r) =>
                r.address_components.some((c) => c.types.includes('route')));
            if (conCalle && !calleTocada && !conservarCalle) {
                const via = conCalle.address_components.find((c) => c.types.includes('route'));
                const num = conCalle.address_components.find((c) => c.types.includes('street_number'));
                setCalleDelMapa(num ? `${via.long_name} ${num.long_name}` : via.long_name);
            }

            if (!encontrado) { setDistritoNoDetectado(true); return; }

            setDistritoNoDetectado(false);
            setDistrito(encontrado);
            setCampos((prev) => ({ ...prev, distrito: encontrado }));
        });
    };

    const guardar = (e) => {
        e.preventDefault();

        const distritoFinal = distrito || campos.distrito.trim();
        const detalle = campos.detalle.trim();
        const referencia = campos.referencia.trim();

        if (!marcado) return setError('Marca en el mapa el punto donde te entregamos.');

        /* De visita no hay cuenta donde guardar: queda en el telefono. */
        if (visita) {
            guardarDireccionDeVisita({
                lat: centro.lat, lng: centro.lng, calle: calleDelMapa || '',
                distrito: distrito || campos.distrito.trim(), enCobertura,
                detalle: campos.detalle.trim(), referencia: campos.referencia.trim(),
            });
            return navigate('/visita/cuenta');
        }
        if (!distritoFinal) return setError('Marca tu punto en el mapa o escribe tu distrito.');
        if (!detalle) return setError('Indica el número, piso o departamento.');
        if (!referencia) return setError('Una referencia ayuda al repartidor a encontrarte.');
        if (!enCobertura) return setError('Todavía no llegamos a esa zona. Prueba con otro punto.');
        if (!aceptaTerminos) return setError('Marca que aceptas los términos para continuar.');

        const direccionCompleta = calleDelMapa
            ? `${calleDelMapa}, ${detalle}`
            : detalle;

        setError('');
        setGuardando(true);

        const cabecera = { headers: { "Authorization": `Bearer ${token}` } };

        axios.post(`${API_URL}delivery/create/point`, {
            name: 'Mi dirección',
            address: direccionCompleta,
            description: enRecepcion
                ? `${referencia}. Si no está, dejar en recepción a nombre de ${nombreCliente || 'el cliente'}`
                : referencia,
            district: distritoFinal,
            location: { latitude: centro.lat, longitude: centro.lng }
        }, cabecera).then((resp) => {

            /* Que sea la direccion activa. La creacion sola no basta si el
               cliente ya tenia otro punto guardado. */
            const id = resp?.data?.data?.id;
            const marcarActiva = id
                ? axios.patch(`${API_URL}delivery/update/point?deliveryPointId=${id}`, {}, cabecera)
                : Promise.resolve();

            return marcarActiva.catch(() => {}).then(() => enAltaApp ? null :
                axios.patch(`${API_URL}profile/data/preferences`, {
                    alimentsRestrictions: campos.alergias.trim(),
                    sugar: azucar
                }, cabecera).catch(() => {})
            );

        }).then(() => {
            olvidarDireccionDeVisita();
            navigate(enAltaApp ? '/registro/cocina' : '/menu', { replace: true });
        }).catch((err) => {
            setGuardando(false);
            setError(
                err?.response?.data?.data?.message ||
                err?.response?.data?.message ||
                'No pudimos guardar tu dirección. Revísala e inténtalo de nuevo.'
            );
        });
    };

    return (
        /* Despues del pago no hay a donde volver: el plan ya esta activo y lo
           unico que falta es la direccion. */
        <MarcoAuth fase={visita ? 'visita' : 'direccion'} paso={0} sinVolver={!visita}
                   volver={visita ? () => navigate('/visita/cuenta') : undefined}>

            {visita ?
                <h1 className="afAuth__titular">¿Dónde te entregaríamos?</h1>
            : esNativo ?
                <h1 className="afAuth__titular">Falta lo último, ¿dónde te entregamos?</h1>
            :
                <h1 className="afAuth__titular">
                    <span className="t1">Falta lo último,</span>
                    ¿dónde te entregamos?
                </h1>
            }
            <p className="afAuth__bajada">
                {visita
                    ? 'Marca tu casa u oficina. Te decimos al instante si llegamos a ese punto.'
                    : previa?.lat
                        ? 'Es la dirección que marcaste cuando mirabas el app. Revísala y confirma.'
                        : 'Marca el punto en el mapa. Es la dirección a la que llegará tu almuerzo.'}
            </p>

            <form id="afFormDireccion" className={guardando ? 'regStepResp disableForms' : 'regStepResp'} onSubmit={guardar}>

                <div className="rsrMap">
                    <APIProvider apiKey={MAPS_KEY}>
                        <Map
                            mapId={MAPS_ID}
                            className={'rsrMapUbiPageMapApiStyle'}
                            defaultZoom={previa?.lat ? 16 : 11}
                            defaultCenter={centro}
                            gestureHandling={"cooperative"}
                            disableDefaultUI={true}
                            /* Tocar el mapa tambien marca el punto. Arrastrar un
                               pin con el pulgar en un celular es incomodo y es
                               la parte donde la gente se queda trabada. */
                            onClick={(e) => handleLocationChange(e?.detail?.latLng)}
                        >
                            <AdvancedMarker
                                draggable={true}
                                ref={markerRef}
                                position={centro}
                                onDragEnd={(e) => handleLocationChange(e.latLng)}
                            >
                                {/* El pin a color: circulo menta, pin tinta. La
                                    punta de abajo es el punto exacto que se
                                    guarda. */}
                                <span className="nPin">
                                    <span className="nPin__c">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                                             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
                                            <circle cx="12" cy="9.5" r="2.5" />
                                        </svg>
                                    </span>
                                    <span className="nPin__p" />
                                </span>
                            </AdvancedMarker>
                            <Polygon
                                paths={coverCities}
                                strokeColor="#12A866"
                                strokeOpacity={0.9}
                                fillColor={"#3CFB9F"}
                                strokeWeight={2}
                                fillOpacity={0.28}
                            />
                        </Map>

                        <div className="rsrMapsearchMapBox">
                            <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
                        </div>

                        <MapHandler
                            place={selectedPlace}
                            marker={marker}
                            onLocationChange={handleLocationChange}
                        />
                    </APIProvider>

                    {/* Aqui el cliente ya pago, asi que no basta con decirle
                        que no llegamos: hay que darle la salida. */}
                    {!enCobertura && !visita &&
                        <div className="rsrMapNotCobertura">
                            <p>
                                Todavía no llegamos a ese punto. Marca otro dentro de la zona
                                verde, o escríbenos por WhatsApp al 941 152 020 y lo vemos contigo.
                            </p>
                        </div>
                    }
                </div>

                {/* Ya pago: en cuanto marca un punto dentro de la zona se le
                    confirma, sin esperar a que toque "Continuar". */}
                {!visita && esNativo && marcado && enCobertura &&
                    <p className="rg__ok" role="status">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                        Sí llegamos a este punto
                    </p>
                }

                {visita && marcado && (enCobertura
                    ? <p className="vis__dirOk">
                        <b>Sí llegamos a este punto</b>
                        De lunes a viernes, entre las 10:30 y la 1:30 p.m. Guardamos esta dirección
                        para cuando actives tu plan, así no la marcas otra vez.
                      </p>
                    : <p className="vis__dirNo">
                        <b>Todavía no llegamos a ese punto</b>
                        Prueba con otro dentro de la zona verde, o{' '}
                        <a href="https://wa.me/51955797697?text=Hola%2C%20quiero%20Allpa%20Food%20en%20mi%20zona"
                           target="_blank" rel="noreferrer">escríbenos</a> y te avisamos apenas abramos ahí.
                      </p>)}

                {/* Editable, no solo para mirar. Es el registro: por aqui pasan
                    todos los clientes nuevos, y la direccion que quede aqui es
                    la que va a leer el motorizado durante meses. El mapa
                    acierta casi siempre, pero quien sabe donde vive es el
                    cliente. */}
                {marcado &&
                    <div className="ubiCalle">
                        <label className="ubiCalle__et" htmlFor="calleConfirmada">
                            Tu dirección {distrito ? `· ${distrito}` : ''}
                        </label>
                        <input
                            id="calleConfirmada"
                            className="ubiCalle__campo"
                            value={calleDelMapa || ''}
                            placeholder="Av. Ejemplo 123"
                            onChange={(e) => { setCalleDelMapa(e.target.value); setCalleTocada(true); }}
                        />
                        <small className="ubiCalle__nota">
                            {calleTocada
                                ? 'Así va a quedar guardada.'
                                : 'La sacamos del mapa. Revísala y complétale el número si falta.'}
                        </small>
                    </div>
                }

                {/* De visita son opcionales: quien los deja escritos encuentra
                    el paso de la direccion completo cuando compra. */}
                {visita && marcado && enCobertura && <>
                    <div className="afCampo">
                        <TextField id="detalle" name="detalle" variant="filled"
                                   label={'Número, piso o departamento (opcional)'}
                                   onChange={cambiar} value={campos.detalle} />
                    </div>
                    <div className="afCampo">
                        <TextField id="referencia" name="referencia" variant="filled"
                                   label={'Referencia (opcional)'} placeholder="Frente al parque, portón verde…"
                                   onChange={cambiar} value={campos.referencia} />
                    </div>
                </>}

                {!visita && <>
                {(distritoNoDetectado || !distrito) &&
                    <div className="afCampo">
                        <TextField
                            id="distrito"
                            name="distrito"
                            variant="filled"
                            label={'Distrito'}
                            onChange={cambiar}
                            value={campos.distrito}
                        />
                        {distritoNoDetectado &&
                            <span className="afCampo__ayuda">
                                No pudimos detectar tu distrito desde el mapa. Escríbelo aquí.
                            </span>
                        }
                    </div>
                }

                <div className="afCampo">
                    <TextField
                        id="detalle"
                        name="detalle"
                        variant="filled"
                        label={'Número, piso o departamento'}
                        onChange={cambiar}
                        value={campos.detalle}
                    />
                </div>

                <div className="afCampo">
                    <TextField
                        id="referencia"
                        name="referencia"
                        variant="filled"
                        label={'Referencia'}
                        placeholder="Frente al parque, portón verde…"
                        onChange={cambiar}
                        value={campos.referencia}
                    />
                </div>

                <button type="button" role="switch" aria-checked={enRecepcion}
                        className={enRecepcion ? 'afRecepcion is-on' : 'afRecepcion'}
                        onClick={() => setEnRecepcion(!enRecepcion)}>
                    <span className="afRecepcion__txt">
                        <b>Si no estoy, déjenlo en recepción</b>
                        <small>A nombre de {nombreCliente || 'quien hizo el pedido'}. Así el motorizado no espera.</small>
                    </span>
                    <span className="afRecepcion__switch" aria-hidden="true"><i /></span>
                </button>

                {/* Alergias y azucar. Se pueden saltar: son para que cocina sepa
                    que NO mandarte, no un plato hecho a medida. */}
                {!enAltaApp && (
                <div className="afExtras">
                    <p className="afExtras__t">¿Algo que no puedas comer?</p>
                    <p className="afExtras__d">
                        Alergias o restricciones médicas. Cocina lo tendrá en cuenta al
                        armar tu pedido. Si no tienes ninguna, sigue nomás.
                    </p>

                    <div className="afCampo">
                        <TextField
                            id="alergias"
                            name="alergias"
                            variant="filled"
                            label={'Alergias o restricciones (opcional)'}
                            placeholder="Maní, mariscos, sin gluten…"
                            multiline
                            minRows={2}
                            onChange={cambiar}
                            value={campos.alergias}
                        />
                    </div>

                    <p className="afExtras__t">Tu refresco</p>
                    <div className="afOpciones">
                        <button
                            type="button"
                            className={azucar ? 'afOpcion afOpcion--on' : 'afOpcion'}
                            onClick={() => setAzucar(true)}
                        >
                            Con azúcar
                        </button>
                        <button
                            type="button"
                            className={!azucar ? 'afOpcion afOpcion--on' : 'afOpcion'}
                            onClick={() => setAzucar(false)}
                        >
                            Sin azúcar
                        </button>
                    </div>
                </div>
                )}

                {/* Las reglas de la entrega, dichas antes y no cuando ya hay un
                    problema. Que el motorizado espera ocho minutos no es un
                    capricho: cada minuto parado se lo quita al siguiente
                    cliente de la ruta. */}
                <div className="afReglas">
                    <p className="afReglas__t">Cómo es la entrega</p>
                    <ul>
                        <li><b>Llegamos entre las 10:30 y la 1:30 p.m.</b>, de lunes a viernes. Mantente
                            atento en ese rango: no avisamos con hora exacta.</li>
                        <li><b>El motorizado espera 8 minutos</b> como máximo. Después tiene que seguir,
                            porque detrás de ti hay otras entregas esperando.</li>
                        <li><b>No enviamos cubiertos</b> por salubridad. Tu almuerzo llega sellado.</li>
                    </ul>
                </div>

                <label className="afTerminos">
                    <input type="checkbox" checked={aceptaTerminos}
                           onChange={(e) => setAceptaTerminos(e.target.checked)} />
                    <span>
                        Acepto los <a href="https://allpafood.com/terminos"
                                      target="_blank" rel="noreferrer">términos y condiciones</a> y
                        las condiciones de entrega.
                    </span>
                </label>
                </>}

                {error &&
                    <div className="regErrorField">
                        <p><ErrorOutlineIcon /> {error}</p>
                    </div>
                }

                {esNativo
                    ? <Accion>
                        <button type="submit" form="afFormDireccion" className="afBtn" disabled={guardando}>
                            {visita ? 'Guardar esta dirección'
                                : guardando ? 'Guardando…' : (enAltaApp ? 'Continuar' : 'Guardar y entrar')}
                        </button>
                      </Accion>
                    : <div className="btnBox">
                        <button type="submit" className="btnPrimary btnIcon btnIconRight">
                            <span>{visita ? 'Guardar esta dirección' : guardando ? 'Guardando…' : 'Terminar'}</span>
                        </button>
                      </div>
                }

            </form>
        </MarcoAuth>
    );
};

const MapHandler = ({ place, marker, onLocationChange }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !place || !marker) return;

        const location = place.geometry?.location;
        if (!location) return;

        marker.position = location;
        onLocationChange(location, place);

        if (place.geometry?.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.panTo(location);
            map.setZoom(16);
        }
    }, [map, place, marker, onLocationChange]);

    return null;
};

const PlaceAutocomplete = ({ onPlaceSelect }) => {
    const [placeAutocomplete, setPlaceAutocomplete] = useState(null);
    const inputRef = useRef(null);
    const places = useMapsLibrary("places");

    useEffect(() => {
        if (!places || !inputRef.current) return;
        setPlaceAutocomplete(new places.Autocomplete(inputRef.current, {
            fields: ["geometry", "name", "formatted_address", "address_components"],
        }));
    }, [places]);

    useEffect(() => {
        if (!placeAutocomplete) return;
        placeAutocomplete.addListener("place_changed", () => {
            onPlaceSelect(placeAutocomplete.getPlace());
        });
    }, [onPlaceSelect, placeAutocomplete]);

    return (
        <div className="autocomplete-container">
            {/* Sin texto de ayuda el cliente no sabia que se podia escribir
                aqui. */}
            <input ref={inputRef} placeholder="Escribe tu dirección" aria-label="Escribe tu dirección"
                   autoComplete="off" />
        </div>
    );
};

export default RegistroDireccionPage;
