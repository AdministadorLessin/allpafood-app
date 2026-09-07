import React,{ useState, useEffect, useRef } from 'react';

import TextField from '@mui/material/TextField';


import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';

// El pin del mapa traia el logo antiguo (un arbol).
import icoMarkerPin from '../../../assets/img/isotipo_allpafood.png';

import {useAuthContext} from '../../../context/authContext';


import { fitCalc } from 'fitcalc';

import { 
    APIProvider,
    AdvancedMarker,
    Map,
    useMap,
    useMapsLibrary,
    useAdvancedMarkerRef
  } from '@vis.gl/react-google-maps';
import { Polygon } from './../../../pages/dashboard/ubicaciones/circulo';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { API_URL } from '../../../config';

const FormPerfilStep3 = ({stepForm,setStepForm,data,setData,loadStatus}) => {

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [markerRef, marker] = useAdvancedMarkerRef();


    const { token, coverCities, handleUpdateToken } = useAuthContext();

    /* Este paso pasa a ser SOLO la direccion de entrega.
       Antes mezclaba fecha de nacimiento, distrito, restricciones
       alimenticias y un interruptor de azucar entre el numero de departamento
       y la referencia, y el mapa iba al final —despues de pedir el numero de
       piso, que es imposible de saber antes de marcar el punto—. La edad y
       las preferencias viven ahora donde corresponde: con las medidas y con
       el objetivo. */
    const [bodyForm,setBodyForm] = useState({
        fs3distrito:'',
        fs3dir:'',
        fs3dirdescripcion:''
    });

    // Calle que devuelve el mapa para el punto marcado, como en /ubicaciones.
    const [calleDelMapa,setCalleDelMapa] = useState(null);

    const handleChangeFields = (e) => {
        const { name, value, type, checked } = e.target;
        setBodyForm({
            ...bodyForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };
    
    // Los mensajes eran todos "Ingrese un telefono valido por favor.", incluso
    // en los campos de direccion.
    /* El distrito NO va en el esquema: su campo solo se muestra cuando el mapa
       no lo detecto, y Yup validaba igual un campo que ni siquiera existe en
       pantalla —pedia "escribe tu distrito" sin ningun sitio donde escribirlo.
       Se comprueba a mano al enviar, contra el del mapa o el escrito. */
    const validationSchema = Yup.object().shape({
        fs3dir: Yup.string().required('Indica el número, piso o departamento.'),
        fs3dirdescripcion: Yup.string().required('Una referencia ayuda al repartidor a encontrarte.'),
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

    const updateData = (data) => {
        if (data && data.information) {
            setData(prevState => ({
                ...prevState,
                district: bodyForm.fs3distrito,
                address: bodyForm.fs3dir,
                descriptionAddress: bodyForm.fs3dirdescripcion,
                location: {
                    latitude: defailtCenter.lat,
                    longitude: defailtCenter.lng
                }
            }));
        }
    };

    const prevForm = () => {
        updateData(data);
        setStepForm(stepForm - 1);
    }

    const formatDate = (date) =>{
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + (d.getDate() + 1),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        return [year, month, day].join('-');
    }
  
    const getAgeCalculator = (dateString) =>{
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }


    
    // Calc Macros
    const bmrCalc = (gender,weight,height,age) =>{
        if (gender === "male") {
            return Math.floor(88.36 + 13.4 * weight + 4.8 * height - 5.7 * age);
        } else if (gender === "female") {
            return Math.floor(447.6 + 9.2 * weight + 3.1 * height - 4.3 * age);
        } else {
            return 0;
        }
    }

    const tdeeeCalc = (bmr, activityLevel, goal) =>{
        switch (goal) {
            case "moderateLose":
                return bmr * activityLevel * 0.85;
            case "mildLose":
                return bmr * activityLevel * 0.9;
            case "maintain":
                return bmr * activityLevel;
            case "mildGain":
                return bmr * activityLevel * 1.1;
            case "moderateGain":
                return bmr * activityLevel * 1.15;
            default:
                return 0;
        }
    }

    const balancedSplitCalc = (tdee) => {
        const protein = Math.floor((tdee * 0.15) / 4);
        const fat = Math.floor((tdee * 0.3) / 9);
        const carbs = Math.floor((tdee * 0.55) / 4);
    
        return {
            carbs: carbs,
            fat: fat,
            protein: protein,
        };
    }

    const ketoSplitCalc = (tdee) => {
        const protein = Math.floor((tdee * 0.15) / 4);
        const fat = Math.floor((tdee * 0.75) / 9);
        const carbs = Math.floor((tdee * 0.1) / 4);
    
        return {
        carbs: carbs,
        fat: fat,
        protein: protein,
        };
    }

    const macroSplitCalc = (tdee, weight) => {
        const protein = Math.floor(weight * 2);
        const fat = Math.floor(weight);
    
        const proteinKcal = protein * 4;
        const fatKcal = fat * 9;
    
        const carbsKcal = tdee - proteinKcal - fatKcal;
        const carbs = Math.floor(carbsKcal / 4);
    
        return {
            carbs: carbs,
            fat: fat,
            protein: protein,
        };
    }

    const macroSplitSelector = (
        macroSplit,
        tdee,
        weight
    ) => {
        switch (macroSplit) {
        case "balanced":
            return balancedSplitCalc(tdee);
        case "weightlifting":
            return macroSplitCalc(tdee, weight);
        case "keto":
            return ketoSplitCalc(tdee);
        default:
            return macroSplitCalc(tdee, weight);
        }
    }


    const getCaloriesAllDays = (info) => {
        const getPercentFat = (info.information.weight/(info.information.height * 2))*100;

        let setGoal = '';
        if(info.information.nutritionalObjective === 'LOSE'){
            setGoal = 'moderateLose'
        }else if(info.information.nutritionalObjective === 'IMPROVE'){
            setGoal = 'maintain'
        }else if(info.information.nutritionalObjective === 'GAIN'){
            setGoal = 'moderateGain'
        }

        const dailyActivity = info.information.routine;
        let getDailyActivity = 0;
        
        if(dailyActivity === 'A'){
            getDailyActivity = 1.2;
        }else if(dailyActivity === 'B'){
            
            if(info.information.trainingDays > 0){
                getDailyActivity = 1.3;
            }else{
                getDailyActivity = 1.25;
            }
        }else if(dailyActivity === 'C'){
            if(info.information.trainingDays > 0){
                getDailyActivity = 1.375;
            }else{
                getDailyActivity = 1.33;
            }
        }else if(dailyActivity === 'D'){
            getDailyActivity = 1.45;
        }else if(dailyActivity === 'E'){
            getDailyActivity = 1.155;
        }else if(dailyActivity === 'F'){
            getDailyActivity = 1.725;
        }

        const getGender = info.information.gender;
        let setGentder= '';
        if(getGender === 'M'){
            setGentder= 'male';
        }else if(getGender === 'F'){
            setGentder= 'female';
        }

        const dataMetric =  fitCalc({
          gender: setGentder,
          weight: info.information.weight,
          height: info.information.height,
          age: getAgeCalculator(info.bornDate),
          dailyActivityLevel: getDailyActivity,
          bodyFatPercentage: getPercentFat,
          bodyType: 'meso',
          goal: setGoal
        })


        const personsBMR = bmrCalc(setGentder, parseFloat(info.information.weight), parseFloat(info.information.height), getAgeCalculator(info.bornDate));
        const personsTDEE = tdeeeCalc(personsBMR, parseFloat(getDailyActivity), setGoal);
        const tdee = Math.floor(personsTDEE);
        const macros = macroSplitSelector('balanced', personsTDEE, parseFloat(info.information.weight));

        window.localStorage.setItem('needBrm',JSON.stringify({
            bmr:personsTDEE,
            macros:macros
        }));
        return {
            bmr:personsTDEE,
            macros:macros
        };
    }

    const [loadingForm,setLoadingForm] = useState(false);
    const onSubmitHandler = (dataForm) => {

        const getUserTmp = JSON.parse(window.localStorage.getItem('inf'));

        const distritoFinal = distrito || bodyForm.fs3distrito;
        if (!distritoFinal) {
            setErrorGuardar('Marca tu punto en el mapa o escribe tu distrito.');
            return;
        }

        setLoadingForm(true)
        setErrorGuardar('');   // limpiar el aviso del intento anterior
        updateData(dataForm);

        // La direccion que se guarda es la calle del mapa mas el detalle que
        // escribio el cliente. Antes viajaba solo el detalle.
        const detalle = (bodyForm.fs3dir || '').trim();
        const direccionCompleta = calleDelMapa
            ? (detalle ? `${calleDelMapa}, ${detalle}` : calleDelMapa)
            : detalle;

        const newObjet = data;
        const newObjet2 = {
            ...newObjet,
            district:bodyForm.fs3distrito,
            address:direccionCompleta,
            descriptionAddress:bodyForm.fs3dirdescripcion,
            location:{
                latitude: defailtCenter.lat,
                longitude: defailtCenter.lng
            }
        }
        

        axios.put(`${API_URL}register/profile`, {
            bornDate: newObjet2.bornDate,
            district: distritoFinal,
            address: newObjet2.address,
            descriptionAddress: newObjet2.descriptionAddress,
            // Si el geocodificador no detecto el distrito, se usa el que
            // el cliente escribio. Antes viajaba vacio y el API devolvia 400.
            districtLocation: distritoFinal,
            location: {
                latitude: defailtCenter.lat,
                longitude: defailtCenter.lng
            },
            information: {
                gender: newObjet2.information.gender,
                nutritionalObjective: newObjet2.information.nutritionalObjective,
                height: parseFloat(newObjet2.information.height),
                weight: parseFloat(newObjet2.information.weight),
                trainingDays: parseFloat(newObjet2.information.trainingDays),
                trainingHours: parseFloat(newObjet2.information.trainingHours),
                trainingLevel: newObjet2.information.trainingLevel,
                routine: newObjet2.information.routine,
                strengthTraining: newObjet2.information.strengthTraining,
                alimentsRestrictions: newObjet2.information.alimentsRestrictions ?? '',
                sugar: newObjet2.information.sugar ?? true
            }
        },
        {
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{

            axios.patch(`${API_URL}plan/user/need-day`,
                {
                    needDay:JSON.stringify(getCaloriesAllDays(newObjet2))
                },
                {
                    headers: {"Authorization" : `Bearer ${token}`} 
                }
            ).then((resp)=>{
                //console.log('save need days ====>',resp);
            }).catch((error)=>{
                console.log('save need days ====>',error);
            })



            axios.post(`${API_URL}auth/refresh-token`,
            {},
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
            ).then((resp)=>{
                if(resp.status === 200){
                    let userDate = resp.data.data;

                    userDate.log = getUserTmp.email;
                    handleUpdateToken(resp.data.data.token,userDate);
                }
            }).catch((error) =>{
                console.log(error)
            })
            loadStatus(true)
            
        }).catch((errr)=>{
            console.log(errr);
            // Antes esto solo iba a consola: el formulario quedaba gris y el
            // cliente no sabia que su registro habia fallado.
            // Reactivar el formulario: sin esto queda gris y el cliente no
            // puede reintentar aunque corrija el dato.
            setLoadingForm(false);
            loadStatus(false);
            setErrorGuardar(
                errr?.response?.data?.data?.message ||
                'No pudimos guardar tus datos. Revisa el distrito e intentalo de nuevo.'
            );
        })

    };

    // Mapa
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

        // Actualizar ubicación
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
        if (window.google?.maps?.geometry?.poly) {

            const bermudaTriangle = new window.google.maps.Polygon({
                paths: cover
            });

            const resultCob = window.google.maps.geometry.poly.containsLocation(
                newLocation,
                bermudaTriangle
            );

            setStatusUbi(resultCob);
        }
    };

    const [distrito,setDistrito] = useState();
    const [distritoNoDetectado,setDistritoNoDetectado] = useState(false);
    const [errorGuardar,setErrorGuardar] = useState('');

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
                        c.types.includes('administrative_area_level_3')
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
                            c.types.includes('sublocality_level_1')
                        );

                        if (
                            comp &&
                            !comp.long_name.toLowerCase().includes('lima')
                        ) {
                            district = comp.long_name;
                            break;
                        }
                    }
                }

                // 3. No encontramos distrito.
                // Google devuelve "Lima" en muchas direcciones de avenida
                // principal. Antes esto hacia `return` y dejaba districtLocation
                // vacio: el API respondia 400 y el cliente no veia nada.
                // Ahora se avisa y el campo queda para que lo complete a mano.
                if (!district) {
                    console.warn('Distrito no detectado (Google devolvio Lima)');
                    setDistritoNoDetectado(true);
                    return;
                }

                setDistritoNoDetectado(false);

                /* La calle. El geocodificador ya devolvia 'route' y
                   'street_number' y se tiraban: por eso en la base quedaban
                   direcciones como "402" —solo el numero de departamento—,
                   sin ninguna via que el motorizado pudiera buscar. Es el
                   mismo arreglo que ya se hizo en /ubicaciones. */
                const conCalle = results.find(r =>
                    r.address_components.some(c => c.types.includes('route')));
                let calle = null;
                if (conCalle) {
                    const via = conCalle.address_components.find(c => c.types.includes('route'));
                    const num = conCalle.address_components.find(c => c.types.includes('street_number'));
                    calle = num ? `${via.long_name} ${num.long_name}` : via.long_name;
                }
                setCalleDelMapa(calle);

                setDistrito(district);

                setDataAddPoint(prev => ({
                    ...prev,
                    district
                }));

                // IMPORTANTE:
                // También actualizar el formulario
                setBodyForm(prev => ({
                    ...prev,
                    fs3distrito: district
                }));

            }
        );
    };


    useEffect(()=>{
        if(!data) return;
        setBodyForm({
            fs3distrito: data.district ?? '',
            fs3dir: data.address ?? '',
            fs3dirdescripcion: data.descriptionAddress ?? ''
        });
    },[]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        
        <form className={loadingForm ? 'regStepResp disableForms':'regStepResp'} onSubmit={handleSubmit(onSubmitHandler)}>

            {/* El mapa va primero. Pedir el numero de piso antes de marcar el
                punto es pedirlo a ciegas, y es la razon por la que en la base
                habia direcciones que eran solo un numero. */}
            <div className="rsrMap">
                <APIProvider apiKey={'AIzaSyA2RQfrTKIQNzphsuq06Czy5u-BH2XBFsI'}>
                    <Map
                        mapId={"8f1d9e42cf8834cfb88cbcd3"}
                        className={'rsrMapUbiPageMapApiStyle'}
                        defaultZoom={11}
                        defaultCenter={defailtCenter}
                        gestureHandling={"cooperative"}
                        disableDefaultUI={true}
                    >
                        <AdvancedMarker
                            draggable={true}
                            ref={markerRef}
                            position={defailtCenter}
                            onDragEnd={(e) => { handleLocationChange(e.latLng); }}
                        >
                            {/* Gota con el isotipo dentro, como en /ubicaciones:
                                el logo suelto no senala ningun punto. */}
                            <span className="ubiPin">
                                <img src={icoMarkerPin} alt="" />
                            </span>
                        </AdvancedMarker>
                        <Polygon
                            paths={cover}
                            strokeColor="#5AD178"
                            strokeOpacity={0.8}
                            fillColor={"#5AD178"}
                            strokeWeight={3}
                            fillOpacity={0.2}
                        />
                    </Map>

                    {/* Fuera del MapControl: Google envuelve cada control en un
                        div que se ajusta al contenido, asi que la caja no tenia
                        contra que medir un ancho y se salia del mapa. */}
                    <div className="rsrMapsearchMapBox">
                        <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
                    </div>

                    <MapHandler
                        place={selectedPlace}
                        marker={marker}
                        onLocationChange={handleLocationChange}
                    />
                </APIProvider>

                {!statusUbi &&
                    <div className="rsrMapNotCobertura">
                        <p>Todavía no llegamos a esa zona. Prueba con otro punto.</p>
                    </div>
                }
            </div>

            {dataAddPoint.location.latitude !== 0 &&
                <div className="ubiCalle">
                    <span className="ubiCalle__et">Dirección del punto que marcaste</span>
                    <strong>{calleDelMapa || 'Sin nombre de calle en este punto'}</strong>
                    {distrito && <em>{distrito}</em>}
                </div>
            }

            {/* Solo se pide a mano cuando el mapa no lo detecto. Google devuelve
                "Lima" en muchas avenidas principales. */}
            {(distritoNoDetectado || !distrito) &&
                <div className="afCampo">
                    <TextField
                        id="fs3distrito"
                        name="fs3distrito"
                        variant="filled"
                        label={'Distrito'}
                        error={errors.fs3distrito ? true : false}
                        {...register("fs3distrito", { onChange: handleChangeFields })}
                        value={bodyForm.fs3distrito}
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
                    id="fs3dir"
                    name="fs3dir"
                    variant="filled"
                    label={'Número, piso o departamento'}
                    error={errors.fs3dir ? true : false}
                    {...register("fs3dir", { onChange: handleChangeFields })}
                    value={bodyForm.fs3dir}
                />
            </div>

            <div className="afCampo">
                <TextField
                    id="fs3dirdescripcion"
                    name="fs3dirdescripcion"
                    variant="filled"
                    label={'Referencia'}
                    placeholder="Frente al parque, portón verde…"
                    error={errors.fs3dirdescripcion ? true : false}
                    {...register("fs3dirdescripcion", { onChange: handleChangeFields })}
                    value={bodyForm.fs3dirdescripcion}
                />
            </div>

            {(errors.fs3distrito || errors.fs3dir || errors.fs3dirdescripcion) &&
                <div className="regErrorField">
                    <p><ErrorOutlineIcon /> {
                        errors.fs3distrito?.message
                        || errors.fs3dir?.message
                        || errors.fs3dirdescripcion?.message
                    }</p>
                </div>
            }

            <div className="btnBox">
                <button type="button" onClick={prevForm} className="btnPrimary btnIcon btnOutline">
                    <span>Volver</span>
                </button>
                <button type={'submit'} className="btnPrimary btnIcon btnIconRight">
                    <span>{loadingForm ? 'Guardando…' : 'Terminar'}</span>
                </button>
            </div>

            {/* Si el guardado falla, el cliente tiene que enterarse.
                Antes el formulario quedaba gris sin explicacion. */}
            {errorGuardar &&
                <div className="regErrorField">
                    <p> <ErrorOutlineIcon /> {errorGuardar}</p>
                </div>
            }

        </form>
    )
};

const MapHandler = ({ 
    place, 
    marker,
    onLocationChange
}) => {

    const map = useMap();

    useEffect(() => {

        if (!map || !place || !marker) return;

        const location = place.geometry?.location;

        if (!location) return;

        // Mover el marcador
        marker.position = location;

        // Ejecutar exactamente la misma lógica
        // que cuando hacemos drag
        onLocationChange(location);

        // Ajustar mapa
        if (place.geometry?.viewport) {
            map.fitBounds(place.geometry.viewport);
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
  

export default FormPerfilStep3;
