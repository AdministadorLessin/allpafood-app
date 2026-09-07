import React,{useState, useEffect, useRef} from "react";
import './ubicacion.scss';

// El pin del mapa traia el logo antiguo (un arbol).
import icoMarkerPin from '../../../../assets/img/isotipo_allpafood.png';

import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';

import {useAuthContext} from '../../../../context/authContext';
import axios from 'axios';

import Chip from '@mui/material/Chip';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

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

import { Polygon } from './../../../../pages/dashboard/ubicaciones/circulo';
import { API_URL } from '../../../../config';

const ProgramMenuMap = ({setPointList,handleResumenMapClose,updateUbi}) => {

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [markerRef, marker] = useAdvancedMarkerRef();

    const { token, coverCities } = useAuthContext();

    const [cover,setCover] = useState(coverCities);

    const [statusUbi,setStatusUbi] =useState(true);
    const [defailtCenter,setDefaultCenter] = useState({lat: -12.080827968350965, lng: -77.0281646638726});

    /*
    const[dataAddPoint,setDataAddPoint] = useState({
        address:'',
        description:'',
        district:'villa-el-salvador',
        location:{
            latitude:0,
            longitude:0
        }
    });
    */
    const [dataAddPoint, setDataAddPoint] = useState({
        address: '',
        description: '',
        district: '',
        location: {
            latitude: 0,
            longitude: 0
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
    

    const getDirections = () => {
        axios.get(`${API_URL}delivery/find/points`,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{
            //console.log(resp)
            setPointList(resp.data.data)
            const itemTmp = resp.data.data[resp.data.data.length - 1];
            const indxTmp = resp.data.data.length - 1;
            updateUbi(itemTmp,indxTmp);
        }).catch((error)=>{

        })
    }

    // Add ubi
    const onSubmitHandler = (datsa) => {
        axios.post(`${API_URL}delivery/create/point`,
            dataAddPoint
            ,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{
            
            //setDataAddPoint({
            //    address:'',
            //    description:'',
            //    location:{
            //        latitude:0,
            //        longitude:0
            //    }
            //})
            getDirections();
            handleResumenMapClose();
            
        }).catch((error)=>{
            console.log(error)
        })
    };


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
        getDirections();
    },[])

    return (
        <div className="dpmResumenMapBox">

            <div onClick={handleResumenMapClose} className="dpmResumenMapClose">
                <CloseIcon />
            </div>

            <div className="inlineFlex dmResumenMapBlock">
                <div className="dmResumenMapForm">
                    <h3><img src={icoMarkerPin} alt="" /> Agregar ubicación:</h3>
                    <form onSubmit={handleSubmit(onSubmitHandler)} className={dataAddPoint.location.latitude !== 0 ? '' : 'dmResumenMapFormDisabled'}>
                        <Chip label={distrito} />
                        <div className="textFieldBox">
                            <TextField

                                id="description" 
                                name="description"
                                label="N° Dep. / Oficina / Piso:"
                                type={'tel'}
                                variant="filled" 
                                error={errors.description ? true : false}
                                {...register("description", { onChange: changeFields })} 
                                value={dataAddPoint.description}
                            />
                        </div>
                        <div className="textFieldBox">
                            <TextField
                                id="address" 
                                name="address"
                                label="Referencia:"
                                
                                variant="filled" 
                                error={errors.address ? true : false}
                                {...register("address", { onChange: changeFields })} 
                                value={dataAddPoint.address} 
                            />
                        </div>
                        <div className="inlineFlex btnBox">
                            <button type={'submit'} className="btnAgregarDireccion">
                                
                                Agregar y seleccionar
                            </button>
                            <div className="btnCancelCircle">
                                <CloseIcon />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="dmResumenMap">
                    <APIProvider apiKey={'AIzaSyA2RQfrTKIQNzphsuq06Czy5u-BH2XBFsI'}>
                        <Map
                            mapId={"8f1d9e42cf8834cfb88cbcd3"}
                            className={'dmResumenMapStyle'}
                            defaultZoom={12.5}
                            defaultCenter={defailtCenter}
                            gestureHandling={"cooperative"}
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
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!autocompleteRef.current) return;

    const element = autocompleteRef.current;

    const handler = (e) => {
      const place = e.place;

      if (!place || !place.location) return;

      // Adaptamos para que tu MapHandler siga funcionando
      onPlaceSelect({
        geometry: {
          location: place.location,
          viewport: place.viewport
        },
        name: place.displayName,
        formatted_address: place.formattedAddress
      });
    };

    element.addEventListener("gmp-placeselect", handler);

    return () => {
      element.removeEventListener("gmp-placeselect", handler);
    };
  }, [onPlaceSelect]);

  return (
    <gmp-place-autocomplete
      ref={autocompleteRef}
      placeholder="Buscar dirección"
      style={{
        width: "100%",
        height: "40px"
      }}
    />
  );
};
  

export default ProgramMenuMap;
