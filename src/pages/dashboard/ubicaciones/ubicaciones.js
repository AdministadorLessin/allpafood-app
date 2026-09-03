import React,{useState, useEffect, useRef} from "react";
import './ubicaciones.scss';
import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';

import icoPreguntasFrecuentes from '../../../assets/img/ico_preguntas_frecuentes.svg';
import icoMarker from '../../../assets/img/ico_marker.svg';
import icoMarkerPin from '../../../assets/img/ico_marker_pin.png';
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
    ControlPosition,
    MapControl,
    AdvancedMarker,
    Map,
    useMap,
    useMapsLibrary,
    useAdvancedMarkerRef
  } from '@vis.gl/react-google-maps';
  
import {  Polygon } from './circulo';

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
        address: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        description: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
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
        axios.get('http://localhost:8443/api-af/v1/delivery/find/points',{
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
        axios.post('http://localhost:8443/api-af/v1/delivery/create/point',
            dataAddPoint
            ,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{
            getDirections()
        }).catch((error)=>{
            console.log(error)
        })
    };

    // Update ubi
    const updateUbi = (item) =>{
        if(token){
            axios.put('http://localhost:8443/api-af/v1/delivery/update/point?deliveryPointId='+item.id,
                {},
            {
                headers: {"Authorization" : `Bearer ${token}`} 
            }).then((resp)=>{
                console.log('ubicacion actualizada')
                getDirections()
            }).catch((error)=>{
                console.log(error)
            })
        }
    }

    const removeUbi = (item) =>{
        axios.delete('http://localhost:8443/api-af/v1/delivery/delete/point?deliveryPointId='+item.id,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{
            getDirections()
        }).catch((error)=>{
            console.log(error)
        })
    }


    const [distrito,setDistrito] = useState();
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
                        titulo:'Marque su lugar de envio:',
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
                                    titulo:'Agregar lugar de entrega:',
                                    ico:icoMarker,
                                    className:false
                                }
                            }
                        >
                            <form onSubmit={handleSubmit(onSubmitHandler)} className={dataAddPoint.location.latitude !== 0 ? '' : 'ubiFormDisabled'}>
                                <div className="textFieldBox">
                                    <TextField
                                        id="address" 
                                        name="address"
                                        label="N° Dep. / Oficina / Piso:"
                                        type={'tel'}
                                        variant="filled" 
                                        error={errors.address ? true : false}
                                        {...register("address")} 
                                        onChange={changeFields} 
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
                                        {...register("description")} 
                                        onChange={changeFields} 
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
                                    titulo:'Puntos de entrega:',
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
                                                        //className={activeClass ? 'ubiPageMapItem ubiPageMapItemAct':'ubiPageMapItem'}
                                                        className={activeClass ? 'ubiPageMapItem ubiPageMapItemAct':'ubiPageMapItem'}
                                                    >
                                                        <div className="txt">
                                                            <p>{item.address} - {item.district}</p>
                                                            <h3>{item.description}</h3>
                                                        </div>
                                                        {!activeClass &&
                                                        <div className="actions">
                                                            {false &&
                                                                <div onClick={()=>updateUbi(item)} className="check">
                                                                    <span></span>
                                                                </div>
                                                            }
                                                            <div onClick={()=>removeUbi(item)} className="remove">
                                                                <DeleteIcon />
                                                            </div>
                                                        </div>
                                                        }
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
                                        <img 
                                            width={40} 
                                            height={49.68} 
                                            src={icoMarkerPin}
                                            alt=""
                                        />
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
                                <MapControl position={ControlPosition.TOP_LEFT} width={'100%'}>
                                    <div className="searchMapBox" >
                                        <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
                                    </div>
                                </MapControl>
                                <MapHandler 
                                    place={selectedPlace} 
                                    marker={marker}
                                    onLocationChange={handleLocationChange}
                                />

                            </APIProvider>
                            {!statusUbi &&
                            <div className="searchNotCobertura">
                                <p>Lo sentimos estas fuera de nuestra cobertura</p>
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
