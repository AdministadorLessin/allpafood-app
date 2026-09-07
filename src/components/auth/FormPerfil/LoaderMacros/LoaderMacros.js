import React,{useState,useEffect} from "react";
import { useNavigate } from "react-router-dom";

import './LoaderMacros.scss';
import IcoIsotipoSvg from './../../../ultil/iconSvg/icoIsotipoSvg';
import { motion, alToque, Contador } from './../../../ultil/Motion/Motion';
import { useAuthContext } from "context/authContext";

/* Cuanto dura la fase de calculo. Antes eran seis frases escritas a maquina
   —"Estamos calculando sus proteinas", "Estamos calculando sus grasas"—
   encadenadas durante mas de ocho segundos, con las cifras apareciendo de a
   una. El calculo es instantaneo: esa espera era teatro, y el cliente ya
   habia llenado tres pantallas. */
const MS_CALCULO = 1900;

/** Anillo de progreso. */
const Anillo = ({ pct, color }) => {
    const R = 26, C = 2 * Math.PI * R;
    return (
        <svg className="afMac__viz" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7"
                    stroke="currentColor" opacity=".18" />
            <motion.circle
                cx="32" cy="32" r={R} fill="none" strokeWidth="7" strokeLinecap="round"
                stroke={color} transform="rotate(-90 32 32)"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - pct) }}
                transition={{ duration: .9, ease: [0.16, 0.84, 0.44, 1], delay: .25 }}
            />
        </svg>
    );
};

/** Barras, para la proteina. */
const Barras = ({ color }) => {
    const alturas = [10, 16, 13, 22, 18, 26, 20];
    return (
        <svg className="afMac__viz" viewBox="0 0 64 40" aria-hidden="true">
            {alturas.map((h, i) => (
                <motion.rect
                    key={i} x={i * 9 + 3} width="5" rx="2.5" fill={color}
                    initial={{ height: 0, y: 34 }}
                    animate={{ height: h, y: 34 - h }}
                    transition={{ duration: .5, delay: .3 + i * .05, ease: 'easeOut' }}
                />
            ))}
        </svg>
    );
};

/** Dona de tres tramos: el reparto real del dia. */
const Dona = ({ partes }) => {
    const R = 26, C = 2 * Math.PI * R;
    let acumulado = 0;
    return (
        <svg className="afMac__viz" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r={R} fill="none" strokeWidth="8"
                    stroke="rgba(16,31,24,.08)" />
            {partes.map((p, i) => {
                const desde = acumulado;
                acumulado += p.parte;
                return (
                    <motion.circle
                        key={p.color}
                        cx="32" cy="32" r={R} fill="none" strokeWidth="8"
                        stroke={p.color}
                        transform={`rotate(${-90 + desde * 360} 32 32)`}
                        strokeDasharray={C}
                        initial={{ strokeDashoffset: C }}
                        animate={{ strokeDashoffset: C * (1 - p.parte) }}
                        transition={{ duration: .7, delay: .25 + i * .18, ease: [0.16,0.84,0.44,1] }}
                    />
                );
            })}
        </svg>
    );
};

/** Linea, para las grasas. */
const Linea = ({ color }) => (
    <svg className="afMac__viz" viewBox="0 0 64 40" fill="none" aria-hidden="true">
        <motion.path
            d="M3 30 L13 22 L23 26 L33 13 L43 19 L53 9 L61 14"
            stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: .9, delay: .3, ease: 'easeOut' }}
        />
    </svg>
);

const LoaderMacros = () => {

    const navigate = useNavigate();
    const { planInfo, removeLocalstorage } = useAuthContext();

    const [datos] = useState(() => {
        try { return JSON.parse(window.localStorage.getItem('needBrm')); }
        catch (e) { return null; }
    });
    const [listo,setListo] = useState(false);

    useEffect(()=>{
        removeLocalstorage();
        const t = setTimeout(()=>setListo(true), MS_CALCULO);
        return ()=>clearTimeout(t);
    },[]) // eslint-disable-line react-hooks/exhaustive-deps

    const seguir = () => navigate(planInfo?.planActive ? '/' : '/planes');

    const kcal = Math.round(datos?.bmr ?? 0);
    const m = datos?.macros || {};

    // El reparto real del dia, para que los anillos digan algo y no sean
    // adornos: proteina y carbos aportan 4 kcal por gramo, la grasa 9.
    const kProt = (m.protein || 0) * 4;
    const kCarb = (m.carbs   || 0) * 4;
    const kGras = (m.fat     || 0) * 9;
    const suma = kProt + kCarb + kGras || 1;

    const tarjetas = [
        { k:'prot', et:'Proteína', v:m.protein, u:'g', color:'#177A4C', tono:'verde',
          viz:<Barras color="#177A4C" />, pie:`${Math.round((kProt/suma)*100)}% del día` },
        { k:'carb', et:'Carbos',   v:m.carbs,   u:'g', color:'#3F9BD8', tono:'azul',
          viz:<Anillo pct={kCarb/suma} color="#3F9BD8" />, pie:`${Math.round((kCarb/suma)*100)}% del día` },
        { k:'gras', et:'Grasas',   v:m.fat,     u:'g', color:'#E0A93F', tono:'ambar',
          viz:<Linea color="#E0A93F" />, pie:`${Math.round((kGras/suma)*100)}% del día` },
    ];

    return (
        <div className="afMacros">
            <motion.div className="afMacros__hoja"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .35, ease: [0.16, 0.84, 0.44, 1] }}
            >

                {!listo ?
                    <div className="afMacros__calc">
                        <div className="afMacros__iso"><IcoIsotipoSvg /></div>
                        <h2>Calculando tu plan</h2>
                        <p>Con tu edad, tu peso, tu estatura y cuánto te mueves.</p>
                        <div className="afMacros__barra"><i /></div>
                    </div>
                :
                    <>
                        <p className="afMacros__et">Tu objetivo diario</p>
                        <h2 className="afMacros__t">Esto necesitas al día</h2>

                        {/* La cifra que manda, con su anillo. Las tres de abajo
                            son el reparto de esta. */}
                        <div className="afMac afMac--hero">
                            <div className="afMac__txt">
                                <b><Contador valor={kcal} /></b>
                                <span>kcal</span>
                            </div>
                            {/* El anillo del total es la suma de los tres de
                                abajo, no un porcentaje decorativo: se ve de
                                que esta hecho el dia. */}
                            <div className="afMac__vizBox">
                                <Dona partes={[
                                    { color:'#177A4C', parte: kProt/suma },
                                    { color:'#3F9BD8', parte: kCarb/suma },
                                    { color:'#E0A93F', parte: kGras/suma },
                                ]} />
                            </div>
                        </div>

                        <div className="afMacros__rej">
                            {tarjetas.map((c)=>(
                                <div className={`afMac afMac--${c.tono}${c.k === 'gras' ? ' afMac--ancha' : ''}`} key={c.k}>
                                    <span className="afMac__et">{c.et}</span>
                                    <div className="afMac__fila">
                                        <div className="afMac__txt">
                                            <b><Contador valor={c.v ?? 0} /></b>
                                            <span>{c.u}</span>
                                        </div>
                                        <div className="afMac__vizBox" style={{ color:c.color }}>
                                            {c.viz}
                                        </div>
                                    </div>
                                    <small className="afMac__pie">{c.pie}</small>
                                </div>
                            ))}
                        </div>

                        <p className="afMacros__nota">
                            Es una guía, no una regla. Los planes de abajo ya están armados
                            alrededor de estos números.
                        </p>

                        <motion.button type="button" className="afBtn afBtn--mint"
                            onClick={seguir} {...alToque}>
                            Ver mis planes
                        </motion.button>
                    </>
                }

            </motion.div>
        </div>
    )
};

export default LoaderMacros;
