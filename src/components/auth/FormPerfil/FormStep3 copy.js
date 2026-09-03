import React,{ useState, useEffect, useRef } from 'react';

import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from 'axios';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import icoMarkerPin from '../../../assets/img/ico_marker_pin.png';
import FormHelperText from '@mui/material/FormHelperText';

import {useAuthContext} from '../../../context/authContext';

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



const FormPerfilStep3 = ({stepForm,setStepForm,data,setData,loadStatus}) => {

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [markerRef, marker] = useAdvancedMarkerRef();


    const { token, handleUpdateToken } = useAuthContext();

    const [bodyForm,setBodyForm] = useState({
        fs3fecnac:'',
        fs3distrito:'',
        fs3restricciones:'',
        fs3dir:'',
        fs3dirdescripcion:''
    });

    const handleChangeFields = (e) =>{
        setBodyForm({
            ...bodyForm,
            [e.target.name]:e.target.value
        })
    }
    
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


    const updateData = (data) =>{
        if(data && data.information){
            setData(prevState =>({
                ...prevState,
                bornDate:bodyForm.fs3fecnac,
                district:bodyForm.fs3distrito,
                address:bodyForm.fs3dir,
                descriptionAddress:bodyForm.fs3dirdescripcion,
                location:{
                    latitude: defailtCenter.lat,
                    longitude: defailtCenter.lng
                },
                information:{
                    ...prevState.information,
                    alimentsRestrictions:bodyForm.fs3restricciones
                }   
            }))

        }
    }

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
        updateData(dataForm);

        const newObjet = data;
        const newObjet2 = {
            ...newObjet,
            bornDate:bodyForm.fs3fecnac,
            district:bodyForm.fs3distrito,
            address:bodyForm.fs3dirdescripcion,
            descriptionAddress:bodyForm.fs3dir,
            location:{
                latitude: defailtCenter.lat,
                longitude: defailtCenter.lng
            },
            information:{
                ...newObjet.information,
                alimentsRestrictions:bodyForm.fs3restricciones
            }
        }
        

        axios.put('http://localhost:8443/api-af/v1/register/profile', {
            bornDate: formatDate(newObjet2.bornDate),
            district: newObjet2.district,
            address: newObjet2.address,
            descriptionAddress: newObjet2.descriptionAddress,
            districtLocation:distrito,
            location: {
                latitude: 40.7128,
                longitude: -74.0060
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
            }
        },
        {
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{

            axios.patch('http://localhost:8443/api-af/v1/plan/user/need-day',
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



            axios.post('http://localhost:8443/api-af/v1/auth/refresh-token',
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
        })

    };

    // Mapa
    const [cover,setCover] = useState([
        {lat: -12.071775, lng: -77.127376},
        {lat: -12.050166012430507, lng: -77.12321506194232},
        {lat: -12.038534368978064, lng: -77.04307515149316},
        {lat: -12.042156223443866, lng: -77.03263247775908},
        {lat: -12.044691206072324, lng: -77.01860092752652},
        {lat: -12.040068979242449, lng: -77.01440146938337},
        {lat: -12.036134638578853, lng: -77.00749458554263},
        {lat: -12.042318909975238, lng: -76.9869421953882},
        {lat: -12.056883818600367, lng: -76.96910095272972},
        {lat: -12.063516949630726, lng: -76.9406387898395},
        {lat: -12.082228713133365, lng: -76.93482507680285},
        {lat: -12.117424586830495, lng: -76.93835277213725},
        {lat: -12.106948284912896, lng: -76.96659496993122},
        {lat: -12.149492339619586, lng: -76.98526687489377},
        {lat: -12.151039653870129, lng: -77.02450049768188},
        {lat: -12.144791188231787, lng: -77.02546162670896},
        {lat: -12.134336752232585, lng: -77.02972141600992},
        {lat: -12.109753098397164, lng: -77.05519476345135},
        {lat: -12.099267229821463, lng: -77.07202239891171},
    ]);

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

    const getCoord = (coord) =>{
        setDefaultCenter({lat: coord.lat, lng: coord.lng})
        setDataAddPoint({
            ...dataAddPoint,
            location:{
                latitude:coord.lat,
                longitude:coord.lng
            }
        })
    }

    const [distrito,setDistrito] = useState();
    const getDistrictFromCoords = (latLng) => {
        if (!window.google?.maps?.Geocoder) return;

        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status !== 'OK' || !results?.length) return;

            let district = null;

            // 1️⃣ Buscar distrito real
            for (const result of results) {
            const comp = result.address_components.find(c =>
                c.types.includes('administrative_area_level_3')
            );

            if (comp && comp.long_name.toLowerCase() !== 'lima') {
                district = comp.long_name;
                break;
            }
            }

            // 2️⃣ Fallback: sublocality SOLO si no es "Lima"
            if (!district) {
            for (const result of results) {
                const comp = result.address_components.find(c =>
                c.types.includes('sublocality_level_1')
                );

                if (comp && !comp.long_name.toLowerCase().includes('lima')) {
                district = comp.long_name;
                break;
                }
            }
            }

            // 3️⃣ Último fallback: NO aceptar Lima
            if (!district) {
            console.warn('Distrito no detectado (Google devolvió Lima)');
            return;
            }

            console.log('Distrito FINAL:', district);
            setDistrito(district)

            setDataAddPoint(prev => ({
                ...prev,
                district
            }));
        });
    };


    useEffect(()=>{
        if(data && data.information && data.information.alimentsRestrictions ){
            setBodyForm({
                fs3fecnac:data.bornDate,
                fs3distrito:data.district,
                fs3restricciones:data.information.alimentsRestrictions,
                fs3dir:data.address,
                fs3dirdescripcion:data.descriptionAddress
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
                    </div>
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
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
                                    onDragEnd={(e)=>{
                                        getCoord(marker.position);
                                        getDistrictFromCoords(e.latLng);
                                        const bermudaTriangle = new window.google.maps.Polygon({ paths: cover });

                                        const resultCob = window.google.maps.geometry.poly.containsLocation(
                                            e.latLng,
                                            bermudaTriangle,
                                        )
                                        
                                        setStatusUbi(resultCob)
                                    }}

                                >
                                    <img width={40} height={49.68} src={icoMarkerPin} />
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
                            <MapHandler place={selectedPlace} marker={marker} />

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
                </Grid>
            </Grid>

        </form>
    )
};

const MapHandler = ({ place, marker }) => {
    const map = useMap();
  
    useEffect(() => {
      if (!map || !place || !marker) return;
  
      if (place.geometry?.viewport) {
        map.fitBounds(place.geometry?.viewport);
      }
  
      marker.position = place.geometry?.location;
    }, [map, place, marker]);
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
