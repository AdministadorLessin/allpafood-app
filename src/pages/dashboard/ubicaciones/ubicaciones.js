import React,{useState, useEffect, useRef} from "react";
import './ubicaciones.scss';
import Pantalla, { Tramo } from './../../../components/perfil/Pantalla/Pantalla';
import '../../../components/perfil/Edit/campos.scss';

// El pin traia el logo antiguo (un arbol). Este es el isotipo actual.
import icoMarkerPin from '../../../assets/img/isotipo_allpafood.png';

import Skeleton from '@mui/material/Skeleton';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";


import { 
    APIProvider,
    AdvancedMarker,
    Map,
    useMap,
    useMapsLibrary,
    useAdvancedMarkerRef
  } from '@vis.gl/react-google-maps';
  
import {  Polygon } from './circulo';
import { API_URL, MAPS_KEY, MAPS_ID } from '../../../config';

const UbicacionesPage = (props) => {
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [markerRef, marker] = useAdvancedMarkerRef();

    const { token, coverCities } = useAuthContext();

    const [cover,setCover] = useState(coverCities);

    const [statusUbi,setStatusUbi] =useState(true);
    const [defailtCenter,setDefaultCenter] = useState({lat: -12.080827968350965, lng: -77.0281646638726});

    const[dataAddPoint,setDataAddPoint] = useState({
        address:'',
        description:'',
        location:{
            latitude:0,
            longitude:0
        }
    });

    const handleLocationChange = (latLng) => {

        if (!latLng) return;

        const lat = typeof latLng.lat === 'function'
            ? latLng.lat()
            : latLng.lat;

        const lng = typeof latLng.lng === 'function'
            ? latLng.lng()
            : latLng.lng;

        const newLocation = {
            lat,
            lng
        };

        // Actualizar centro del mapa
        setDefaultCenter(newLocation);

        // Actualizar coordenadas que se enviarán al backend
        setDataAddPoint(prev => ({
            ...prev,
            location: {
                latitude: lat,
                longitude: lng
            }
        }));

        // Obtener distrito
        getDistrictFromCoords(newLocation);

        // Validar cobertura
        if (
            window.google?.maps?.geometry?.poly
        ) {

            const bermudaTriangle = new window.google.maps.Polygon({
                paths: cover
            });

            const resultCob =
                window.google.maps.geometry.poly.containsLocation(
                    newLocation,
                    bermudaTriangle
                );

            setStatusUbi(resultCob);
        }
    };

    /* "Usar mi ubicación": el navegador da el punto y el pin se va ahi. Es lo
       mas preciso y lo mas rapido para quien esta en su casa pidiendo. */
    const [buscandoUbi,setBuscandoUbi] = useState(false);
    const usarMiUbicacion = () => {
        if (!navigator.geolocation) {
            setErrorUbi('Tu navegador no comparte la ubicación. Marca el punto en el mapa.');
            return;
        }
        setBuscandoUbi(true);
        setErrorUbi('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setBuscandoUbi(false);
                handleLocationChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {
                setBuscandoUbi(false);
                setErrorUbi('No pudimos leer tu ubicación. Permite el acceso o marca el punto en el mapa.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const changeFields = (event) =>{
        setDataAddPoint({
            ...dataAddPoint,
            [event.target.name]:event.target.value
        })
    }

    const validationSchema = Yup.object().shape({
        // Los dos campos pedian "un telefono valido": copiado del formulario de
        // registro y nunca corregido.
        name: Yup.string()
                        .required('Ponle un nombre para reconocerlo después.')
                        .max(40,'Un nombre corto se lee mejor: "Casa", "Oficina".'),
        address: Yup.string()
                        .required('Escribe el número de tu casa, departamento u oficina.')
                        .min(1,'Escribe el número de tu casa, departamento u oficina.'),
        description: Yup.string()
                        .required('Una referencia ayuda al repartidor a encontrarte.')
                        .min(1,'Una referencia ayuda al repartidor a encontrarte.'),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "all",
        shouldUnregister: true,
        resolver: yupResolver(validationSchema),
    });
    
    const [pointList,setPointList] = useState();
    const [loadPl,setLoadPl] = useState(false);
    const getDirections = () => {
        setLoadPl(true)
        axios.get(`${API_URL}delivery/find/points`,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{
            setPointList(resp.data.data)
            
            setTimeout(() => {
                setLoadPl(false)    
            }, 1500);
            
        }).catch((error)=>{

        })
    }

    // Add ubi
    const onSubmitHandler = (datsa) => {
        /* El distrito es lo que mete el punto en la ruta de un motorizado.
           Sin el, la base lo rechaza: antes el cliente recibia el error de
           SQL en pantalla sin saber que le faltaba. */
        const distritoFinal = (distrito || distritoManual || '').trim();
        if (!distritoFinal) {
            setErrorUbi('Escribe tu distrito para poder guardar la dirección.');
            return;
        }
        setErrorUbi('');

        // Se guarda la calle del mapa junto al numero que escribio el cliente.
        // Antes solo viajaba el numero, asi que en la base quedaban direcciones
        // como "776" sin ninguna calle.
        const detalle = (dataAddPoint.address || '').trim();
        const direccionCompleta = calleDelMapa
            ? (detalle ? `${calleDelMapa}, ${detalle}` : calleDelMapa)
            : detalle;

        axios.post(`${API_URL}delivery/create/point`,
            { ...dataAddPoint, address: direccionCompleta, district: distritoFinal }
            ,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then(()=>{
            /* La siguiente direccion arranca limpia: si no, la calle que el
               cliente corrigio para su casa se quedaria pegada al registrar la
               de su oficina. */
            setCalleTocada(false);
            setCalleDelMapa(null);
            setDistritoManual('');
            getDirections()
        }).catch((error)=>{
            setErrorUbi(error?.response?.data?.message || 'No pudimos guardar la dirección. Revisa los datos e intenta de nuevo.');
        })
    };

    // Update ubi
    // Marca cual de las direcciones se usa para las entregas.
    //
    // Se llamaba con PUT y el servidor expone PATCH: devolvia 405 y el catch
    // solo escribia en consola, asi que el cliente tocaba y no pasaba nada.
    // Ademas el boton estaba dentro de un {false && ...}: la accion existia
    // pero nadie podia verla.
    const [errorUbi,setErrorUbi] = useState('');
    const updateUbi = (item) =>{
        if(!token) return;
        setErrorUbi('');
        axios.patch(`${API_URL}delivery/update/point?deliveryPointId=`+item.id,
            {},
            { headers: {"Authorization" : `Bearer ${token}`} }
        ).then(()=>{
            getDirections()
        }).catch((error)=>{
            setErrorUbi(error?.response?.data?.message || 'No pudimos cambiar tu dirección de entrega.');
        })
    }

    const removeUbi = (item) =>{
        setErrorUbi('');
        axios.delete(`${API_URL}delivery/delete/point?deliveryPointId=`+item.id,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then(()=>{
            getDirections()
        }).catch((error)=>{
            setErrorUbi(error?.response?.data?.message || 'No pudimos eliminar esta dirección.');
        })
    }


    const [distrito,setDistrito] = useState();
    /* Google devuelve "Lima" en muchas avenidas principales, y a veces no
       responde del todo. Cuando pasa, el distrito se pide a mano en lugar de
       dejar al cliente trabado: la pantalla de registro ya lo resolvia asi,
       esta no, y una clienta nueva se quedo ocho intentos sin poder guardar
       su direccion. */
    const [distritoManual,setDistritoManual] = useState('');
    const [distritoNoDetectado,setDistritoNoDetectado] = useState(false);
    // Calle que devuelve el mapa para el punto marcado.
    const [calleDelMapa,setCalleDelMapa] = useState(null);

    /* Si el cliente ya corrigio la direccion, mover el pin unos metros no se
       la puede volver a pisar: corregiria justo lo que acaba de arreglar. */
    const [calleTocada,setCalleTocada] = useState(false);
    /* Ultimo punto que se le pregunto a Google. Cada consulta de geocoding se
       paga, asi que no se repite por un pin que se movio dos metros ni por dos
       toques seguidos en el mismo sitio. Es la red de seguridad: aunque manana
       alguien vuelva a enganchar esto a un evento que dispara seguido, el
       cobro no se dispara con el. */
    const ultimoConsultado = useRef(null);

    const getDistrictFromCoords = (latLng) => {

        if (!window.google?.maps?.Geocoder) {
            setDistritoNoDetectado(true);
            return;
        }

        const lat = typeof latLng.lat === 'function'
            ? latLng.lat()
            : latLng.lat;

        const lng = typeof latLng.lng === 'function'
            ? latLng.lng()
            : latLng.lng;

        /* Menos de ~15 metros respecto de la ultima consulta es el mismo sitio
           para lo unico que se usa esto: saber el distrito y la calle. */
        const previo = ultimoConsultado.current;
        if (previo
            && Math.abs(previo.lat - lat) < 0.00015
            && Math.abs(previo.lng - lng) < 0.00015) return;

        ultimoConsultado.current = { lat, lng };

        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode(
            {
                location: {
                    lat,
                    lng
                }
            },
            (results, status) => {

                /* Puede fallar por cuota diaria agotada o por la llave: en
                   los dos casos el cliente no tiene la culpa ni puede hacer
                   nada, asi que se le abre el campo para escribirlo. */
                if (status !== 'OK' || !results?.length) {
                    setDistrito(undefined);
                    setDistritoNoDetectado(true);
                    return;
                }

                let district = null;

                // 1. Buscar distrito real
                for (const result of results) {

                    const comp = result.address_components.find(c =>
                        c.types.includes(
                            'administrative_area_level_3'
                        )
                    );

                    if (
                        comp &&
                        comp.long_name.toLowerCase() !== 'lima'
                    ) {
                        district = comp.long_name;
                        break;
                    }
                }

                // 2. Fallback
                if (!district) {

                    for (const result of results) {

                        const comp = result.address_components.find(c =>
                            c.types.includes(
                                'sublocality_level_1'
                            )
                        );

                        if (
                            comp &&
                            !comp.long_name
                                .toLowerCase()
                                .includes('lima')
                        ) {
                            district = comp.long_name;
                            break;
                        }
                    }
                }

                // 3. No encontramos distrito
                if (!district) {

                    console.warn(
                        'Distrito no detectado'
                    );

                    /* Se limpia el anterior a proposito: si el cliente movio
                       el pin a otro distrito y aqui no se detecta, dejar el
                       de antes guardaria la direccion en el distrito
                       equivocado y el pedido saldria en la ruta que no es. */
                    setDistrito(undefined);
                    setDistritoNoDetectado(true);
                    return;
                }

                console.log(
                    'Distrito FINAL:',
                    district
                );

                setDistrito(district);
                setDistritoNoDetectado(false);

                // La calle ya venia en la respuesta del mapa y se descartaba:
                // solo se aprovechaba el distrito. Por eso lo unico que quedaba
                // guardado era el numero suelto que escribia el cliente ("776"),
                // sin ninguna calle que el repartidor pudiera usar.
                const conCalle = results.find(r =>
                    r.address_components.some(c => c.types.includes('route')));
                let calle = null;
                if (conCalle) {
                    const via = conCalle.address_components.find(c => c.types.includes('route'));
                    const num = conCalle.address_components.find(c => c.types.includes('street_number'));
                    calle = num ? `${via.long_name} ${num.long_name}` : via.long_name;
                }
                if (!calleTocada) setCalleDelMapa(calle);

                setDataAddPoint(prev => ({
                    ...prev,
                    district
                }));
            }
        );
    };

    useEffect(()=>{
        //console.log('tokeeeen ===>',token)
        getDirections();
    },[])

    const hayPunto = dataAddPoint.location.latitude !== 0;

    const PIN = (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><path d="M12 12a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z" />
        </svg>
    );
    const campo = (nombre, etiqueta, ejemplo, valor) => (
        <label className="cuF__campo" htmlFor={nombre}>
            <span className="cuF__et">{etiqueta}</span>
            <input className="cuF__in" id={nombre} type="text" placeholder={ejemplo} autoComplete="off"
                aria-invalid={errors[nombre] ? 'true' : undefined}
                {...register(nombre, { onChange: changeFields })}
                value={valor || ''} />
            {errors[nombre]?.message && <span className="cuF__error" role="alert">{errors[nombre].message}</span>}
        </label>
    );

    return (
        <Pantalla etiqueta="Mis direcciones" titulo="Dónde te entregamos"
            bajada="Cada día puede llegarte a un lugar distinto. Lo eliges en el Menú."
            clase="dir">

            {/* Primero lo que ya tiene: es a lo que viene la mayoria, a
                comprobar o cambiar a donde le llega. */}
            <Tramo as="section" className="dir__lugares" aria-label="Tus direcciones">
                {errorUbi && <p className="cuP__aviso" role="alert">{errorUbi}</p>}

                {loadPl &&
                    <>
                        <Skeleton variant="rounded" height={78} sx={{ borderRadius: '22px' }} />
                        <Skeleton variant="rounded" height={78} sx={{ borderRadius: '22px' }} />
                    </>
                }

                {!loadPl && (!pointList || pointList.length === 0) &&
                    <p className="cuP__vacio">
                        Todavía no tienes ninguna dirección guardada. Agrega la
                        primera aquí abajo y ahí te dejaremos tu almuerzo.
                    </p>
                }

                {!loadPl && (pointList || []).map((item) => (
                    <div className={`dir__lugar${item.assigned ? ' is-on' : ''}`} key={item.id}>
                        <span className="dir__ico" aria-hidden="true">{PIN}</span>
                        <span className="dir__txt">
                            <b>
                                {item.name || item.address}
                                {item.assigned && <span className="cuP__chip">La de siempre</span>}
                            </b>
                            {/* Sin distrito guardado, no se escribe "undefined"
                                al costado de la calle. */}
                            <small>{[item.name ? item.address : null, item.district].filter(Boolean).join(' · ')}</small>
                            {item.description && <small>{item.description}</small>}
                            {!item.assigned &&
                                <span className="dir__acciones">
                                    <button type="button" className="dir__usar" onClick={() => updateUbi(item)}>
                                        Entregar aquí
                                    </button>
                                    <button type="button" className="dir__borrar"
                                        aria-label={`Borrar ${item.name || item.address}`}
                                        onClick={() => removeUbi(item)}>
                                        Borrar
                                    </button>
                                </span>}
                        </span>
                    </div>
                ))}

                {!loadPl && pointList && pointList.length > 0 &&
                    <p className="cuP__nota dir__nota">
                        La dirección marcada es la que usamos por defecto. Para un día
                        puntual puedes elegir otra desde el Menú.
                    </p>}
            </Tramo>

            {/* Agregar una, en el orden en que se usa: primero el punto en el
                mapa, despues los datos del lugar. Es donde la gente se perdia
                —el formulario aparecia vacio, sin decir que habia que marcar
                el mapa primero—. */}
            <Tramo as="section" className="cuP__bloque dir__nueva">
                <h2>Agregar otra dirección</h2>

                <div className="dir__paso">
                    <span className={`dir__n${hayPunto ? ' is-ok' : ' is-on'}`} aria-hidden="true">
                        {hayPunto
                            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                            : 1}
                    </span>
                    <div>
                        <b>Marca el punto en el mapa</b>
                        <small>
                            Busca tu calle, toca el punto donde queda tu puerta o arrastra
                            el pin. La punta del pin es donde llega el motorizado.
                        </small>
                    </div>
                </div>

                <div className="dir__mapa">
                    <div className="ubiPageMapApi">
                            <APIProvider apiKey={MAPS_KEY}>
                                <Map
                                    mapId={MAPS_ID}
                                    className={'ubiPageMapApiStyle'}
                                    defaultZoom={12.5}
                                    defaultCenter={defailtCenter}
                                    gestureHandling={"greedy"}
                                    disableDefaultUI={true}
                                    /* Tocar el mapa tambien mueve el pin: arrastrar un
                                       marcador de 46px con el dedo es dificil, y en el
                                       telefono casi siempre termina moviendo el mapa. */
                                    onClick={(ev) => {
                                        if (ev?.detail?.latLng) handleLocationChange(ev.detail.latLng);
                                    }}
                                >
                                    <AdvancedMarker
                                        draggable={true}
                                        ref={markerRef}
                                        position={defailtCenter}
                                        /* La punta del pin es lo que marca el punto: sin
                                           esto el ancla quedaba en el centro de la
                                           burbuja y el reparto salia unos metros corrido. */
                                        anchorPoint={['50%', '100%']}
                                        /* Solo al SOLTAR el pin, nunca mientras se
                                           arrastra.

                                           Tenia tambien un onDrag, que el mapa dispara en
                                           cada cuadro del movimiento —decenas de veces por
                                           segundo—, y cada uno preguntaba el distrito a
                                           Google. Arrastrar el pin cuatro segundos podia
                                           costar mas de doscientas consultas de geocoding,
                                           todas facturadas, para un dato que solo importa
                                           donde el pin se queda. Es de donde salio la
                                           cuenta de Google. El pin se mueve solo: el mapa
                                           lo dibuja sin que el codigo toque nada. */
                                        onDragEnd={(e) => {
                                            handleLocationChange(e.latLng);
                                        }}
                                    >
                                        {/* Antes era el logo suelto flotando sobre el mapa.
                                            Un marcador necesita punta: sin ella no se
                                            entiende que punto exacto esta señalando. */}
                                        <span className="ubiPin">
                                            <img src={icoMarkerPin} alt="" />
                                        </span>
                                    </AdvancedMarker>
                                    <Polygon
                                        /* La zona de cobertura es un dibujo, no un boton:
                                           mientras era clickeable se tragaba los toques y
                                           el pin no se movia al tocar el mapa. */
                                        clickable={false}
                                        paths={cover}
                                        strokeColor="#5AD178"
                                        strokeOpacity={0.8}
                                        fillColor = {"#5AD178"}
                                        strokeWeight={3} 
                                        fillOpacity={0.2}

                                    />
                                </Map>
                                <MapHandler 
                                    place={selectedPlace} 
                                    marker={marker}
                                    onLocationChange={handleLocationChange}
                                />

                                {/* El buscador vivia dentro de un MapControl. Google envuelve
                                    cada control en un div que se ajusta al contenido, asi que la
                                    caja no tenia contra que medir un porcentaje y por eso estaba
                                    clavada en 500px: en un movil de 375 se salia del mapa. Aqui
                                    cuelga del contenedor del mapa, igual que el aviso de
                                    cobertura, y left/right la ajustan a cualquier pantalla. */}
                                <div className="searchMapBox">
                                    <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
                                </div>
                            </APIProvider>
                        {!statusUbi &&
                            <div className="searchNotCobertura">
                                <p>Todavía no llegamos a esa zona. Prueba con otro punto del mapa.</p>
                            </div>
                        }
                    </div>
                    <button type="button" className="cuP__enlace" onClick={usarMiUbicacion}>
                        {buscandoUbi ? 'Buscando…' : 'Usar mi ubicación'}
                    </button>
                </div>

                {/* La calle que resolvio el mapa, para que el cliente la
                    confirme antes de guardarla. El mapa acierta casi siempre,
                    pero el que sabe donde vive es el cliente: verla y poder
                    corregirla vale mas que adivinarla mejor. */}
                {hayPunto &&
                    <div className="cuF dir__confirma">
                        <label className="cuF__campo" htmlFor="calleConfirmada">
                            <span className="cuF__et">Dirección{distrito ? ` · ${distrito}` : ''}</span>
                            <input className="cuF__in"
                                id="calleConfirmada"
                                value={calleDelMapa || ''}
                                placeholder="Av. Ejemplo 123"
                                onChange={(e) => {
                                    setCalleDelMapa(e.target.value);
                                    setCalleTocada(true);
                                }}
                            />
                            <span className="dir__pista">
                                {calleTocada
                                    ? 'Así va a quedar guardada.'
                                    : 'La sacamos del mapa. Corrígela si le falta el número o está mal.'}
                            </span>
                        </label>

                        {/* El mapa no siempre devuelve el distrito —en varias
                            avenidas grandes contesta "Lima" y nada mas—. Sin
                            esto el cliente no tenia como seguir. */}
                        {!distrito &&
                            <label className="cuF__campo" htmlFor="distritoManual">
                                <span className="cuF__et">Distrito</span>
                                <input className="cuF__in"
                                    id="distritoManual"
                                    placeholder="San Isidro"
                                    value={distritoManual}
                                    onChange={(e) => setDistritoManual(e.target.value)}
                                />
                                <span className="dir__pista">
                                    {distritoNoDetectado
                                        ? 'No pudimos detectarlo desde el mapa. Escríbelo aquí.'
                                        : 'Escribe el distrito donde te entregamos.'}
                                </span>
                            </label>
                        }
                    </div>
                }

                <div className="dir__paso">
                    <span className={`dir__n${hayPunto ? ' is-on' : ''}`} aria-hidden="true">2</span>
                    <div>
                        <b>Cuéntanos del lugar</b>
                        <small>Cómo le llamas, el número o departamento y una referencia.</small>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmitHandler)} noValidate
                    className={`cuF dir__form${hayPunto ? '' : ' is-espera'}`}>
                    {campo('name', '¿Cómo le llamas a este lugar?', 'Casa · Oficina · Casa de mis papás', dataAddPoint.name)}
                    {campo('address', 'Número, departamento u oficina', 'Dpto. 402 · Oficina B · Casa 15', dataAddPoint.address)}
                    {campo('description', 'Referencia para el motorizado', 'Portón verde, al lado de la farmacia', dataAddPoint.description)}

                    <button type="submit" className="cuF__guardar" disabled={!hayPunto}>
                        Guardar esta dirección
                    </button>
                </form>
                {!hayPunto &&
                    <p className="cuP__nota">
                        Primero marca el punto en el mapa y estos campos se activan.
                    </p>
                }
            </Tramo>
        </Pantalla>
    )
};

const MapHandler = ({
    place,
    marker,
    onLocationChange
}) => {

    const map = useMap();

    useEffect(() => {

        if (
            !map ||
            !place ||
            !marker ||
            !place.geometry?.location
        ) {
            return;
        }

        const location = place.geometry.location;

        // Mover marcador
        marker.position = location;

        // Ejecutar la misma lógica
        // que el drag del marcador
        onLocationChange(location);

        // Ajustar mapa
        if (place.geometry?.viewport) {

            map.fitBounds(
                place.geometry.viewport
            );

        } else {

            map.panTo(location);
            map.setZoom(16);

        }

    }, [
        map,
        place,
        marker,
        onLocationChange
    ]);

    return null;
};
  
const PlaceAutocomplete = ({ onPlaceSelect }) => {
    const [placeAutocomplete, setPlaceAutocomplete] = useState(null);
    const inputRef = useRef(null);
    const places = useMapsLibrary("places");
  
    useEffect(() => {
      if (!places || !inputRef.current) return;
  
      const options = {
        fields: ["geometry", "name", "formatted_address"],
      };
  
      setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
    }, [places]);
    useEffect(() => {
      if (!placeAutocomplete) return;
  
      placeAutocomplete.addListener("place_changed", () => {
        onPlaceSelect(placeAutocomplete.getPlace());
      });
    }, [onPlaceSelect, placeAutocomplete]);
    return (
      <div className="autocomplete-container">
        <input ref={inputRef} />
      </div>
    );
};

export default UbicacionesPage;
