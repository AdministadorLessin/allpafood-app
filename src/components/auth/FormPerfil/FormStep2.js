import React,{useState,useEffect} from "react";

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { motion, alToque } from './../../ultil/Motion/Motion';

/* Las seis rutinas del calculo, con su descripcion. Antes vivian dentro de un
   <Select> de MUI: para elegir habia que abrir un desplegable, leer seis
   etiquetas sueltas —"Sedentario", "Trabajo activo"— y adivinar cual era la
   propia. Aqui se ven las seis a la vez y cada una dice a que se parece. */
const RUTINAS = [
    { v: 'A', t: 'Sedentario',           d: 'Paso el día sentado y casi no camino' },
    { v: 'B', t: 'Trabajo de oficina',   d: 'Sentado la mayor parte del día, camino algo' },
    { v: 'C', t: 'Trabajo activo',       d: 'De pie o moviéndome buena parte del día' },
    { v: 'D', t: 'Entreno fuerte',       d: 'Gimnasio o deporte 5 veces por semana' },
    { v: 'E', t: 'Atleta profesional',   d: 'Entreno todos los días, a veces dos veces' },
    { v: 'F', t: 'Atleta de resistencia',d: 'Fondo, ciclismo o triatlón' },
];

const DIAS  = [0, 1, 2, 3, 4, 5, 6, 7];
const HORAS = [
    { v: 0.5, t: '½ h' },
    { v: 1,   t: '1 h' },
    { v: 1.5, t: '1½ h' },
    { v: 2,   t: '2 h' },
    { v: 3,   t: '3 h o más' },
];

/** Anos cumplidos a partir de una fecha, para poder volver al paso. */
const edadDesde = (fecha) => {
    if (!fecha) return '';
    const hoy = new Date();
    const nac = new Date(fecha);
    if (isNaN(nac.getTime())) return '';
    let anos = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) anos -= 1;
    return anos > 0 ? String(anos) : '';
};

/** La fecha que hay que guardar para que el servidor calcule esa edad. */
const fechaDesdeEdad = (edad) => {
    const n = parseInt(edad, 10);
    if (!n || n < 1) return '';
    const hoy = new Date();
    const d = new Date(hoy.getFullYear() - n, hoy.getMonth(), hoy.getDate());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
};

const FormPerfilStep2 = ({stepForm,setStepForm,data,setData}) => {

    const [campos,setCampos] = useState({
        edad: '',
        estatura: '',
        peso: '',
    });
    const [rutina,setRutina]         = useState('');
    const [dias,setDias]             = useState(null);
    const [horas,setHoras]           = useState(null);
    const [intensidad,setIntensidad] = useState('');
    const [fuerza,setFuerza]         = useState(null);
    const [tocado,setTocado]         = useState(false);

    const cambiar = (e) => setCampos({ ...campos, [e.target.name]: e.target.value });

    /* La edad se pedia como fecha de nacimiento con un datepicker. El calculo
       solo usa los anos cumplidos —bmrCalc y fitCalc reciben age, no la
       fecha—, asi que pedir dia y mes era pedir un dato que nadie usa y que
       cuesta tres toques mas en un telefono. */
    const entrena = dias !== null && dias > 0;

    const faltan = !campos.edad || !campos.estatura || !campos.peso || !rutina
        || dias === null
        || (entrena && (horas === null || !intensidad || fuerza === null));

    const siguiente = () => {
        setTocado(true);
        if (faltan) return;

        setData(prev => ({
            ...prev,
            bornDate: fechaDesdeEdad(campos.edad),
            information: {
                ...(prev?.information || {}),
                height: campos.estatura,
                weight: campos.peso,
                trainingDays: dias,
                trainingHours: entrena ? horas : 0,
                trainingLevel: entrena ? intensidad : 'L',
                routine: rutina,
                strengthTraining: entrena ? fuerza : false,
            }
        }));
        setStepForm(stepForm + 1);
    };

    useEffect(()=>{
        if (!data) return;
        const i = data.information || {};
        setCampos({
            edad: edadDesde(data.bornDate),
            estatura: i.height ?? '',
            peso: i.weight ?? '',
        });
        setRutina(i.routine ?? '');
        setDias(i.trainingDays ?? null);
        setHoras(i.trainingHours ?? null);
        setIntensidad(i.trainingLevel ?? '');
        setFuerza(i.strengthTraining ?? null);
    },[]) // eslint-disable-line react-hooks/exhaustive-deps

    const Aviso = ({ si, texto }) => (si && tocado ?
        <div className="regErrorField"><p><ErrorOutlineIcon /> {texto}</p></div> : null
    );

    return (
        <div className="regStepResp">

            <div className="rsrTitle"><span>Tus medidas</span></div>
            <div className="afTres">
                <div className="afCampo">
                    <TextField
                        name="edad" type="number" inputMode="numeric"
                        variant="filled" label="Edad"
                        value={campos.edad} onChange={cambiar}
                        InputProps={{ endAdornment: campos.edad ?
                            <InputAdornment position="end" className="uMedida">años</InputAdornment> : null }}
                    />
                </div>
                <div className="afCampo">
                    <TextField
                        name="estatura" type="number" inputMode="numeric"
                        variant="filled" label="Estatura"
                        value={campos.estatura} onChange={cambiar}
                        InputProps={{ endAdornment: campos.estatura ?
                            <InputAdornment position="end" className="uMedida">cm</InputAdornment> : null }}
                    />
                </div>
                <div className="afCampo">
                    <TextField
                        name="peso" type="number" inputMode="decimal"
                        variant="filled" label="Peso"
                        value={campos.peso} onChange={cambiar}
                        InputProps={{ endAdornment: campos.peso ?
                            <InputAdornment position="end" className="uMedida">kg</InputAdornment> : null }}
                    />
                </div>
            </div>
            <Aviso si={!campos.edad || !campos.estatura || !campos.peso}
                   texto="Completa tu edad, estatura y peso." />

            <div className="rsrTitle"><span>¿Cómo es tu día normal?</span></div>
            <div className="afOpc">
                {RUTINAS.map((r)=>(
                    <motion.button
                        type="button" key={r.v}
                        className={`afOpc__it${rutina === r.v ? ' afOpc__it--sel' : ''}`}
                        onClick={()=>setRutina(r.v)} {...alToque}
                    >
                        <span className="afOpc__txt">
                            <b>{r.t}</b>
                            <small>{r.d}</small>
                        </span>
                        <span className="afOpc__tick" />
                    </motion.button>
                ))}
            </div>
            <Aviso si={!rutina} texto="Elige la opción que más se parezca a tu día." />

            <div className="rsrTitle"><span>¿Cuántos días entrenas por semana?</span></div>
            <div className="afChips afChips--num">
                {DIAS.map((d)=>(
                    <button type="button" key={d}
                        className={`afChip${dias === d ? ' afChip--sel' : ''}`}
                        onClick={()=>setDias(d)}>{d}</button>
                ))}
            </div>
            <Aviso si={dias === null} texto="Marca cuántos días entrenas. Si no entrenas, elige 0." />

            {/* Todo lo del entrenamiento solo tiene sentido si entrena: antes se
                le preguntaba la intensidad y las horas a quien acababa de poner
                que no entrena ningun dia. */}
            {entrena &&
                <>
                    <div className="rsrTitle"><span>¿Cuánto dura cada sesión?</span></div>
                    <div className="afChips">
                        {HORAS.map((h)=>(
                            <button type="button" key={h.v}
                                className={`afChip${horas === h.v ? ' afChip--sel' : ''}`}
                                onClick={()=>setHoras(h.v)}>{h.t}</button>
                        ))}
                    </div>
                    <Aviso si={horas === null} texto="Marca cuánto dura tu sesión." />

                    <div className="rsrTitle"><span>¿Qué tan intenso entrenas?</span></div>
                    <div className="rsrIntensidad">
                        <span className={intensidad === 'L' ? 'active' : undefined} onClick={()=>setIntensidad('L')}>Leve</span>
                        <span className={intensidad === 'M' ? 'active' : undefined} onClick={()=>setIntensidad('M')}>Moderada</span>
                        <span className={intensidad === 'F' ? 'active' : undefined} onClick={()=>setIntensidad('F')}>Fuerte</span>
                    </div>
                    <Aviso si={!intensidad} texto="Marca la intensidad." />

                    <div className="rsrTitle"><span>¿Levantas pesas?</span></div>
                    <div className="rsrIntensidad">
                        <span className={fuerza === true ? 'active' : undefined} onClick={()=>setFuerza(true)}>Sí</span>
                        <span className={fuerza === false ? 'active' : undefined} onClick={()=>setFuerza(false)}>No</span>
                    </div>
                    <Aviso si={fuerza === null} texto="Marca sí o no." />
                </>
            }

            <div className="btnBox">
                <button type="button" onClick={()=>setStepForm(stepForm - 1)}
                        className="btnPrimary btnIcon btnOutline">
                    <span>Volver</span>
                </button>
                <motion.button type="button" onClick={siguiente}
                        className="btnPrimary btnIcon btnIconRight" {...alToque}>
                    <span>Siguiente</span>
                </motion.button>
            </div>
        </div>
    )
};

export default FormPerfilStep2;
