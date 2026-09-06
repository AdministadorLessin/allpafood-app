import React,{ useState, useEffect, useRef } from 'react';

import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { styled } from '@mui/material/styles';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
// El pin del mapa traia el logo antiguo (un arbol).
import icoMarkerPin from '../../../assets/img/isotipo_allpafood.png';
import FormHelperText from '@mui/material/FormHelperText';

import {useAuthContext} from '../../../context/authContext';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import { fitCalc } from 'fitcalc';

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
import { Polygon } from './../../../pages/dashboard/ubicaciones/circulo';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { API_URL } from '../../../config';

const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#65C466',
        opacity: 1,
        border: 0,
        ...theme.applyStyles('dark', {
          backgroundColor: '#2ECA45',
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
      ...theme.applyStyles('dark', {
        color: theme.palette.grey[600],
      }),
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
      ...theme.applyStyles('dark', {
        opacity: 0.3,
      }),
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
    ...theme.applyStyles('dark', {
      backgroundColor: '#39393D',
    }),
  },
}));


const FormPerfilStep3 = ({stepForm,setStepForm,data,setData,loadStatus}) => {

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [markerRef, marker] = useAdvancedMarkerRef();


    const { token, coverCities, handleUpdateToken } = useAuthContext();

    const [bodyForm,setBodyForm] = useState({
        fs3fecnac:'',
        fs3distrito:'',
        fs3restricciones:'',
        fs3dir:'',
        fs3dirdescripcion:'',
        fs3azucar: true
    });

    const handleChangeFields = (e) => {
        const { name, value, type, checked } = e.target;
        setBodyForm({
            ...bodyForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };
    
    const validationSchema = Yup.object().shape({
        fs3fecnac: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        fs3distrito: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        //fs3restricciones: Yup.string()
                        //.required('Ingrese un telefono valido por favor.')
                        //.min(1,'Ingrese un telefono valido por favor.'),
        fs3dir: Yup.string()
                        .required('Ingrese un telefono valido por favor.')
                        .min(1,'Ingrese un telefono valido por favor.'),
        fs3dirdescripcion: Yup.string()
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

    const updateData = (data) => {
        if (data && data.information) {
            setData(prevState => ({
                ...prevState,
                bornDate: bodyForm.fs3fecnac,
                district: bodyForm.fs3distrito,
                address: bodyForm.fs3dir,
                descriptionAddress: bodyForm.fs3dirdescripcion,
                location: {
                    latitude: defailtCenter.lat,
                    longitude: defailtCenter.lng
                },
                information: {
                    ...prevState.information,
                    alimentsRestrictions: bodyForm.fs3restricciones,
                    sugar: bodyForm.fs3azucar // <-- Agregado
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

        setLoadingForm(true)
        setErrorGuardar('');   // limpiar el aviso del intento anterior
        updateData(dataForm);

        const newObjet = data;
        const newObjet2 = {
            ...newObjet,
            bornDate:bodyForm.fs3fecnac,
            district:bodyForm.fs3distrito,
            // Estaban invertidos: se guardaba la referencia como direccion y la
            // direccion como referencia. Es el dato que usa el motorizado.
            address:bodyForm.fs3dir,
            descriptionAddress:bodyForm.fs3dirdescripcion,
            location:{
                latitude: defailtCenter.lat,
                longitude: defailtCenter.lng
            },
            information:{
                ...newObjet.information,
                alimentsRestrictions:bodyForm.fs3restricciones
            }
        }
        

        axios.put(`${API_URL}register/profile`, {
            bornDate: formatDate(newObjet2.bornDate),
            district: newObjet2.district,
            address: newObjet2.address,
            descriptionAddress: newObjet2.descriptionAddress,
            // Si el geocodificador no detecto el distrito, se usa el que
            // el cliente escribio. Antes viajaba vacio y el API devolvia 400.
            districtLocation: distrito || bodyForm.fs3distrito,
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
                alimentsRestrictions: newObjet2.information.alimentsRestrictions,
                sugar: bodyForm.fs3azucar // <-- Se envía el valor boolean aquí
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

                console.log('Distrito FINAL:', district);

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
        if(data && data.information && data.information.alimentsRestrictions ){
            setBodyForm({
                fs3fecnac:data.bornDate,
                fs3distrito:data.district,
                fs3restricciones:data.information.alimentsRestrictions,
                fs3dir:data.address,
                fs3dirdescripcion:data.descriptionAddress,
                fs3azucar: data.information.sugar ?? true // <-- Recupera o usa default
            });
        }
    },[])

    return (
        
        <form className={loadingForm ? 'regStepResp disableForms':'regStepResp'} onSubmit={handleSubmit(onSubmitHandler)}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2 textFieldReg3">
                        <TextField
                            id="fs3fecnac" 
                            name="fs3fecnac"
                            type={'date'}
                            label={'Fecha de nacimiento:'}
                            variant="filled" 
                            error={errors.fs3fecnac ? true : false}
                            {...register("fs3fecnac")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fs3fecnac} 
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            id="fs3distrito" 
                            name="fs3distrito"
                            type={'text'}
                            label={'Distrito:'}
                            variant="filled" 
                            error={errors.fs3distrito ? true : false}
                            {...register("fs3distrito")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fs3distrito} 
                        />
                        {/* El geocodificador de Google devuelve "Lima" en muchas
                            avenidas principales. Cuando eso pasa hay que pedir el
                            distrito, no fallar en silencio. */}
                        {distritoNoDetectado && !bodyForm.fs3distrito &&
                            <div className="regErrorField">
                                <p> <ErrorOutlineIcon /> No pudimos detectar tu distrito. Escríbelo aquí por favor.</p>
                            </div>
                        }
                        {errors.fs3distrito &&
                            <div className="regErrorField">
                                <p> <ErrorOutlineIcon /> Ingresa tu distrito por favor.</p>
                            </div>
                        }
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={10}>
                    <div className="textFieldReg2 textFieldRegNota">
                        <FormHelperText>*Coloca ingredientes que no puedes consumir por alergia o orden medica.</FormHelperText>
                        <TextField
                            id="fs3restricciones"
                            name="fs3restricciones"
                            type={'text'}
                            label={'Restricciones alimenticias:'}
                            variant="filled" 
                            //error={errors.fs3restricciones ? true : false}
                            {...register("fs3restricciones")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fs3restricciones} 
                        />
                        
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={2}>
                    <div className="textFieldReg2 textFieldRegSwitch">
                        <FormHelperText>¿Desea azucar?</FormHelperText>
                        <FormControlLabel
                            control={
                                <IOSSwitch 
                                    sx={{ m: 1 }} 
                                    name="fs3azucar"
                                    checked={bodyForm.fs3azucar}
                                    onChange={handleChangeFields}
                                />
                            }
                            label="Azúcar"
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            id="fs3dir" 
                            name="fs3dir"
                            label={'N° Dep. / Oficina / Piso:'}
                            type={'text'}
                            variant="filled" 
                            error={errors.fs3dir ? true : false}
                            {...register("fs3dir")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fs3dir} 
                        />
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                    <div className="textFieldReg2">
                        <TextField
                            id="fs3dirdescripcion" 
                            name="fs3dirdescripcion"
                            type={'text'}
                            label={'Referencia:'}
                            variant="filled" 
                            error={errors.fs3dirdescripcion ? true : false}
                            {...register("fs3dirdescripcion")} 
                            onChange={handleChangeFields} 
                            value={bodyForm.fs3dirdescripcion} 
                        />
                    </div>
                </Grid>
                <Grid item xs={12}>
                    <div className="rsrMap">
                        <APIProvider apiKey={'AIzaSyA2RQfrTKIQNzphsuq06Czy5u-BH2XBFsI'}>
                            <Map
                                mapId={"8f1d9e42cf8834cfb88cbcd3"}
                                className={'rsrMapUbiPageMapApiStyle'}
                                defaultZoom={11}
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
                                        alt="Ubicación"
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
                                <div className="rsrMapsearchMapBox" >
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
                            <div className="rsrMapNotCobertura">
                                <p>Lo sentimos estas fuera de nuestra cobertura</p>
                            </div>
                        }
                    </div>
                </Grid>
                <Grid item xs={12}>
                    <div className="btnBox">
                        <a onClick={prevForm} className="btnPrimary btnIcon btnOutline">
                            <span>
                                <ArrowBackIosIcon />
                                Volver
                            </span>
                        </a>
                        <button type={'submit'} className="btnPrimary btnIcon btnIconRight">
                            <span>
                                Finalizar
                                <ArrowForwardIosIcon />
                            </span>
                        </button>
                    </div>
                    {/* Si el guardado falla, el cliente tiene que enterarse.
                        Antes el formulario quedaba gris sin explicacion. */}
                    {errorGuardar &&
                        <div className="regErrorField">
                            <p> <ErrorOutlineIcon /> {errorGuardar}</p>
                        </div>
                    }
                </Grid>
            </Grid>

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
