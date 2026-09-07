import React,{useState,useEffect} from 'react';
import './FormPerfil.scss';

import TextField from '@mui/material/TextField';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { motion, alToque } from './../../ultil/Motion/Motion';

const OBJETIVOS = [
    { v:'LOSE',    Ic:TrendingDownIcon, t:'Bajar de peso',    d:'Menos calorías de las que gastas, sin pasar hambre' },
    { v:'IMPROVE', Ic:FavoriteIcon,     t:'Mejorar mi salud', d:'Mantener tu peso y comer mejor cada día' },
    { v:'GAIN',    Ic:TrendingUpIcon,   t:'Subir de peso',    d:'Más calorías y proteína, para ganar masa' },
];

/* Lo que la cocina necesita saber. Antes se preguntaba con un campo de texto
   libre en la pantalla de la direccion —entre el distrito y el numero de
   departamento—, donde no venia a cuento y casi nadie lo llenaba. */
const RESTRICCIONES = ['Sin lactosa', 'Sin gluten', 'Vegetariano', 'Sin cerdo', 'Sin mariscos', 'Sin picante'];

const FormPerfilStep1 = ({stepForm,setStepForm,data,setData}) => {

    const [sexo,setSexo] = useState('');
    const [objetivo,setObjetivo] = useState('');
    const [marcadas,setMarcadas] = useState([]);
    const [otra,setOtra] = useState('');
    const [azucar,setAzucar] = useState(true);
    const [tocado,setTocado] = useState(false);

    const alternar = (r) => setMarcadas((p) => p.includes(r) ? p.filter(x=>x!==r) : [...p, r]);

    const siguiente = () =>{
        setTocado(true);
        if(!sexo || !objetivo) return;

        const restricciones = [...marcadas, otra.trim()].filter(Boolean).join(', ');

        setData(prev =>({
            ...prev,
            information:{
                ...(prev?.information || {}),
                gender: sexo,
                nutritionalObjective: objetivo,
                alimentsRestrictions: restricciones,
                sugar: azucar,
            }
        }));
        setStepForm(stepForm + 1);
    }

    useEffect(()=>{
        const i = data?.information;
        if(!i) return;
        setSexo(i.gender ?? '');
        setObjetivo(i.nutritionalObjective ?? '');
        setAzucar(i.sugar ?? true);
        // El texto guardado se vuelve a repartir entre fichas y campo libre.
        const partes = (i.alimentsRestrictions || '').split(',').map(s=>s.trim()).filter(Boolean);
        setMarcadas(partes.filter(p => RESTRICCIONES.includes(p)));
        setOtra(partes.filter(p => !RESTRICCIONES.includes(p)).join(', '));
    },[]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="regStepResp">

            <div className="rsrTitle"><span>¿Cuál es tu sexo de nacimiento?</span></div>
            <div className="regSexBox">
                <span className={sexo === 'M' ? 'active' : undefined} onClick={()=>setSexo('M')}>
                    <MaleIcon /> Masculino
                </span>
                <span className={sexo === 'F' ? 'active' : undefined} onClick={()=>setSexo('F')}>
                    <FemaleIcon /> Femenino
                </span>
            </div>
            {tocado && !sexo &&
                <div className="regErrorField"><p><ErrorOutlineIcon /> Selecciona una opción.</p></div>}

            <div className="rsrTitle"><span>¿Qué quieres lograr?</span></div>
            <div className="regObjList">
                {OBJETIVOS.map(({v, Ic, t, d})=>(
                    <motion.div key={v}
                        className={objetivo === v ? 'regObjItem regObjItemAct' : 'regObjItem'}
                        onClick={()=>setObjetivo(v)} {...alToque}
                    >
                        <div className="checkBox"><Ic /></div>
                        <div className="txt"><h4>{t}</h4><p>{d}</p></div>
                    </motion.div>
                ))}
            </div>
            {tocado && !objetivo &&
                <div className="regErrorField"><p><ErrorOutlineIcon /> Elige un objetivo.</p></div>}

            <div className="rsrTitle"><span>¿Hay algo que no comes?</span></div>
            <p className="afAyuda">Opcional. Lo tiene en cuenta la cocina al armar tus platos.</p>
            <div className="afChips">
                {RESTRICCIONES.map((r)=>(
                    <button type="button" key={r}
                        className={`afChip${marcadas.includes(r) ? ' afChip--sel' : ''}`}
                        onClick={()=>alternar(r)}>{r}</button>
                ))}
            </div>
            <div className="afCampo afCampo--suelto">
                <TextField variant="filled" label="Otra alergia o restricción"
                    value={otra} onChange={(e)=>setOtra(e.target.value)} />
            </div>

            <div className="rsrTitle"><span>Tus refrescos</span></div>
            <div className="rsrIntensidad">
                <span className={azucar === true ? 'active' : undefined} onClick={()=>setAzucar(true)}>Con azúcar</span>
                <span className={azucar === false ? 'active' : undefined} onClick={()=>setAzucar(false)}>Sin azúcar</span>
            </div>

            <div className="btnBox btnBoxLeft">
                <motion.button type="button" className="btnPrimary btnIcon btnIconRight"
                    onClick={siguiente} {...alToque}>
                    <span>Siguiente</span>
                </motion.button>
            </div>
        </div>
    )
};

export default FormPerfilStep1;
