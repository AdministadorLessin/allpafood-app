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
import icoMarkerPin from '../../../assets/img/isotipo_allpafood.png';
import { useAuthContext } from '../../../context/authContext';
import { esNativo } from '../../../nativo';
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
const RegistroDireccionPage = () => {

    const navigate = useNavigate();
    const { token, coverCities } = useAuthContext();

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [markerRef, marker] = useAdvancedMarkerRef();

    const [centro, setCentro] = useState({ lat: -12.080827968350965, lng: -77.0281646638726 });
    const [marcado, setMarcado] = useState(false);
    const [enCobertura, setEnCobertura] = useState(true);

    const [calleDelMapa, setCalleDelMapa] = useState(null);

    /* Si el cliente ya corrigio la direccion, mover el pin unos metros no se
       la puede volver a pisar. */
    const [calleTocada, setCalleTocada] = useState(false);
    const [distrito, setDistrito] = useState('');
    const [distritoNoDetectado, setDistritoNoDetectado] = useState(false);

    const [campos, setCampos] = useState({
        distrito: '',
        detalle: '',
        referencia: '',
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

    const handleLocationChange = (latLng) => {
        if (!latLng) return;

        const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
        const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

        setCentro({ lat, lng });
        setMarcado(true);
        buscarDistrito({ lat, lng });

        if (window.google?.maps?.geometry?.poly) {
            const zona = new window.google.maps.Polygon({ paths: coverCities });
            setEnCobertura(
                window.google.maps.geometry.poly.containsLocation({ lat, lng }, zona)
            );
        }
    };

    /* Mismo criterio que /ubicaciones: Google devuelve "Lima" en muchas
       avenidas principales, y en ese caso el distrito se pide a mano. */
    const buscarDistrito = ({ lat, lng }) => {
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
            if (conCalle && !calleTocada) {
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
        <MarcoAuth fase="direccion" paso={0} sinVolver>

            {esNativo ?
                <h1 className="afAuth__titular">Falta lo último, <em>¿dónde te entregamos?</em></h1>
            :
                <h1 className="afAuth__titular">
                    <span className="t1">Falta lo último,</span>
                    ¿dónde te entregamos?
                </h1>
            }
            <p className="afAuth__bajada">
                Marca el punto en el mapa. Es la dirección a la que llegará tu almuerzo.
            </p>

            <form id="afFormDireccion" className={guardando ? 'regStepResp disableForms' : 'regStepResp'} onSubmit={guardar}>

                <div className="rsrMap">
                    <APIProvider apiKey={MAPS_KEY}>
                        <Map
                            mapId={MAPS_ID}
                            className={'rsrMapUbiPageMapApiStyle'}
                            defaultZoom={11}
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
                                <span className="ubiPin">
                                    <img src={icoMarkerPin} alt="" />
                                </span>
                            </AdvancedMarker>
                            <Polygon
                                paths={coverCities}
                                strokeColor="#5AD178"
                                strokeOpacity={0.8}
                                fillColor={"#5AD178"}
                                strokeWeight={3}
                                fillOpacity={0.2}
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
                    {!enCobertura &&
                        <div className="rsrMapNotCobertura">
                            <p>
                                Todavía no llegamos a ese punto. Marca otro dentro de la zona
                                verde, o escríbenos por WhatsApp al 941 152 020 y lo vemos contigo.
                            </p>
                        </div>
                    }
                </div>

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

                {error &&
                    <div className="regErrorField">
                        <p><ErrorOutlineIcon /> {error}</p>
                    </div>
                }

                {esNativo
                    ? <Accion>
                        <button type="submit" form="afFormDireccion" className="afBtn afBtn--mint">
                            {guardando ? 'Guardando…' : (enAltaApp ? 'Continuar' : 'Guardar y entrar')}
                        </button>
                      </Accion>
                    : <div className="btnBox">
                        <button type="submit" className="btnPrimary btnIcon btnIconRight">
                            <span>{guardando ? 'Guardando…' : 'Terminar'}</span>
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
        onLocationChange(location);

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
            fields: ["geometry", "name", "formatted_address"],
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
