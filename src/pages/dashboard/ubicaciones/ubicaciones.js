import React,{useState, useEffect, useRef} from "react";
import './ubicaciones.scss';
import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';

import icoPreguntasFrecuentes from '../../../assets/img/ico_preguntas_frecuentes.svg';
import icoMarker from '../../../assets/img/ico_marker.svg';
// El pin traia el logo antiguo (un arbol). Este es el isotipo actual.
import icoMarkerPin from '../../../assets/img/isotipo_allpafood.png';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';

import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"

import { 
    APIProvider,
    AdvancedMarker,
    Map,
    useMap,
    useMapsLibrary,
    useAdvancedMarkerRef
  } from '@vis.gl/react-google-maps';
  
import {  Polygon } from './circulo';
import { API_URL } from '../../../config';

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
        // Se guarda la calle del mapa junto al numero que escribio el cliente.
        // Antes solo viajaba el numero, asi que en la base quedaban direcciones
        // como "776" sin ninguna calle.
        const detalle = (dataAddPoint.address || '').trim();
        const direccionCompleta = calleDelMapa
            ? (detalle ? `${calleDelMapa}, ${detalle}` : calleDelMapa)
            : detalle;

        axios.post(`${API_URL}delivery/create/point`,
            { ...dataAddPoint, address: direccionCompleta }
            ,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then(()=>{
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
    // Calle que devuelve el mapa para el punto marcado.
    const [calleDelMapa,setCalleDelMapa] = useState(null);
    const getDistrictFromCoords = (latLng) => {

        if (!window.google?.maps?.Geocoder) return;

        const lat = typeof latLng.lat === 'function'
            ? latLng.lat()
            : latLng.lat;

        const lng = typeof latLng.lng === 'function'
            ? latLng.lng()
            : latLng.lng;

        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode(
            {
                location: {
                    lat,
                    lng
                }
            },
            (results, status) => {

                if (status !== 'OK' || !results?.length) {
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

                    return;
                }

                console.log(
                    'Distrito FINAL:',
                    district
                );

                setDistrito(district);

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
                setCalleDelMapa(calle);

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

    return (
        <LayoutDasboard claseStyle={false}>
            <CardPaper
                data={
                    {
                        titulo:'¿Dónde te entregamos?',
                        ico:icoPreguntasFrecuentes,
                        className:false
                    }
                }
            >


                <div className="inlineFlex ubiPageMap">
                    <div className="ubiPageMapLeft">
                        <CardPaper
                            data={
                                {
                                    titulo:'Datos de la entrega',
                                    ico:icoMarker,
                                    className:false
                                }
                            }
                        >
                            <form onSubmit={handleSubmit(onSubmitHandler)} className={dataAddPoint.location.latitude !== 0 ? '' : 'ubiFormDisabled'}>

                                {/* La direccion que sale del mapa, a la vista. Antes el
                                    cliente escribia "402" sin saber de que calle, y eso
                                    era todo lo que quedaba guardado. */}
                                {dataAddPoint.location.latitude !== 0 &&
                                    <div className="ubiCalle">
                                        <span className="ubiCalle__et">Dirección del punto que marcaste</span>
                                        <strong>{calleDelMapa || 'Sin nombre de calle en este punto'}</strong>
                                        {distrito && <em>{distrito}</em>}
                                    </div>
                                }

                                {/* El nombre va primero: es como el cliente piensa el
                                    lugar antes de dar cualquier detalle. */}
                                <div className="textFieldBox">
                                    <TextField
                                        id="name"
                                        name="name"
                                        label="¿Cómo le llamas a este lugar?"
                                        placeholder="Casa · Oficina · Casa de mis papás"
                                        variant="filled"
                                        error={errors.name ? true : false}
                                        {...register("name", { onChange: changeFields })}
                                        value={dataAddPoint.name || ''}
                                    />
                                </div>

                                <div className="textFieldBox">
                                    <TextField
                                        id="address" 
                                        name="address"
                                        label="Número, departamento u oficina"
                                        placeholder="Dpto. 402 · Oficina B · Casa 15"
                                        variant="filled" 
                                        error={errors.address ? true : false}
                                        {...register("address", { onChange: changeFields })} 
                                        value={dataAddPoint.address} 
                                    />
                                </div>
                                <div className="textFieldBox">
                                    <TextField
                                        id="description" 
                                        name="description"
                                        label="Referencia:"
                                        
                                        variant="filled" 
                                        error={errors.description ? true : false}
                                        {...register("description", { onChange: changeFields })} 
                                        value={dataAddPoint.description} 
                                    />
                                </div>
                                {false &&
                                    <div className="textFieldBox">
                                        <TextField id="filled-basic" label="Nombre:" variant="filled" />
                                    </div>
                                }
                                <div className="btnBox">
                                    <button type={'submit'} className="btnAgregarDireccion">
                                        
                                        Agregar y seleccionar
                                    </button>
                                    <div className="btnCancelCircle">
                                        <CloseIcon />
                                    </div>
                                </div>
                            </form>
                        </CardPaper>
                        <CardPaper
                            data={
                                {
                                    titulo:'Tus direcciones',
                                    ico:icoMarker,
                                    className:false
                                }
                            }
                        >

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={!loadPl ? 'loadtst' : "empty"}
                                    initial={{ y: 3, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -3, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={'ubiPageMapList'}
                                >
                                    {errorUbi &&
                                        <p className="ubiError">{errorUbi}</p>}

                                    {!loadPl && pointList && pointList.length > 0 ?
                                        <div 
                                            className="ubiPageMapListBox"
                                            onClick={()=>console.log(pointList)}
                                        >
                                            {pointList.length > 0 && pointList.map((item)=>{
                                                let activeClass = false;
                                                if(item.assigned){
                                                    activeClass = true;
                                                }
                                                return (
                                                    <div
                                                        className={activeClass ? 'ubiPageMapItem ubiPageMapItemAct':'ubiPageMapItem'}
                                                    >
                                                        {/* El titulo era la referencia y el subtitulo la direccion:
                                                            el cliente veia "Frente al parque" como nombre del lugar.
                                                            Va primero lo que identifica el sitio. */}
                                                        <div className="txt">
                                                            <h3>{item.name || item.address}</h3>
                                                            <p className="ubiDistrito">
                                                                {item.name ? `${item.address} · ${item.district}` : item.district}
                                                            </p>
                                                            {item.description &&
                                                                <p className="ubiRef">{item.description}</p>}
                                                        </div>

                                                        <div className="actions">
                                                            {activeClass ?
                                                                <span className="ubiEnUso">Aquí entregamos</span>
                                                            :
                                                                <>
                                                                    {/* Estaba escondido tras un {false &&}: el cliente
                                                                        no tenia forma de cambiar su direccion. */}
                                                                    <button type="button" className="ubiUsar"
                                                                        onClick={()=>updateUbi(item)}>
                                                                        Entregar aquí
                                                                    </button>
                                                                    <div onClick={()=>removeUbi(item)} className="remove">
                                                                        <DeleteIcon />
                                                                    </div>
                                                                </>
                                                            }
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            
                                        </div>
                                    :
                                        <div 
                                            className="ubiPageMapListBox"
                                        >
                                            {pointList && pointList.length > 0 && pointList.map((item)=>(
                                                <Skeleton variant="rounded" width={'100%'} sx={{mb:1,borderRadius:4}} height={70} />
                                            ))}
                                        </div>
                                    }
                                </motion.div>
                            </AnimatePresence>
                            
                        </CardPaper>
                    </div>
                    <div className="ubiPageMapRight">
                        <div className="inlineFlex ubiPageMapApi">
                            <APIProvider apiKey={'AIzaSyA2RQfrTKIQNzphsuq06Czy5u-BH2XBFsI'}>
                                <Map
                                    mapId={"bf51a910020fa25a"}
                                    className={'ubiPageMapApiStyle'}
                                    defaultZoom={12.5}
                                    defaultCenter={defailtCenter}
                                    gestureHandling={"greedy"}
                                    disableDefaultUI={true}
                                >
                                    <AdvancedMarker 
                                        draggable={true} 
                                        ref={markerRef} 
                                        position={defailtCenter}
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

                    </div>
                </div>                
            </CardPaper>
        </LayoutDasboard>
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
