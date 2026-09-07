import React,{useEffect, useState} from "react";
import './registro.scss';

import {useAuthContext} from '../../../context/authContext';

import MarcoAuth from './../../../components/auth/Marco/MarcoAuth';
import FormPerfilStep1 from './../../../components/auth/FormPerfil/FormStep1';
import FormPerfilStep2 from './../../../components/auth/FormPerfil/FormStep2';
import FormPerfilStep3 from './../../../components/auth/FormPerfil/FormStep3';

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"
import LoaderMacros from './../../../components/auth/FormPerfil/LoaderMacros/LoaderMacros';

// Claves para el localStorage
const STEP_CACHE_KEY = 'registro_step_cache';
const DATA_CACHE_KEY = 'registro_data_cache';

const RegistroPage = (props) => {
    const { token } = useAuthContext();

    // 1. Cargar el paso guardado de localStorage (o 0 por defecto)
    const [stepProfile, setStepProfile] = useState(() => {
        const savedStep = localStorage.getItem(STEP_CACHE_KEY);
        return savedStep !== null ? Number(savedStep) : 0;
    });

    // 2. Cargar la data acumulada de los subformularios (o undefined/objeto por defecto)
    const [dataAxios, setDataAxios] = useState(() => {
        const savedData = localStorage.getItem(DATA_CACHE_KEY);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Error al parsear datos guardados:", e);
            }
        }
        return undefined;
    });

    const [showLoader, setShowLoader] = useState(false);

    // 3. Sincronizar el paso actual en localStorage
    useEffect(() => {
        localStorage.setItem(STEP_CACHE_KEY, stepProfile.toString());
    }, [stepProfile]);

    // 4. Sincronizar los datos acumulados en localStorage
    useEffect(() => {
        if (dataAxios) {
            localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(dataAxios));
        }
    }, [dataAxios]);

    // 5. Función auxiliar para limpiar la caché al finalizar todo el flujo de registro
    const clearRegistrationCache = () => {
        localStorage.removeItem(STEP_CACHE_KEY);
        localStorage.removeItem(DATA_CACHE_KEY);
    };

    /* Que se le esta preguntando y por que. Antes las tres pantallas solo
       tenian una fila de iconos sin explicacion: el cliente daba su peso y su
       altura sin saber para que servian. */
    const TITULOS = [
        { t1: 'Cuéntanos', fuerte: 'qué buscas',
          bajada: 'Con esto calculamos cuántas calorías necesitas al día y qué plan te queda mejor.' },
        { t1: 'Ahora,', fuerte: 'tu actividad física',
          bajada: 'Cuánto te mueves cambia bastante el cálculo de calorías.' },
        { t1: 'Por último,', fuerte: '¿dónde te entregamos?',
          bajada: 'Marca el punto en el mapa. Es la dirección a la que llegará tu almuerzo.' },
    ];
    const titulo = TITULOS[stepProfile] || TITULOS[0];

    return (
        <MarcoAuth
            fase="perfil"
            paso={stepProfile}
            volver={stepProfile > 0 ? () => setStepProfile(stepProfile - 1) : undefined}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={stepProfile + 'profileFormRegistro'}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <h1 className="afAuth__titular">
                        <span className="t1">{titulo.t1}</span>
                        {titulo.fuerte}
                    </h1>
                    <p className="afAuth__bajada">{titulo.bajada}</p>

                    {stepProfile === 0 ? (
                        <FormPerfilStep1
                            stepForm={stepProfile}
                            setStepForm={setStepProfile}
                            data={dataAxios}
                            setData={setDataAxios}
                        />
                    ) : stepProfile === 1 ? (
                        <FormPerfilStep2
                            stepForm={stepProfile}
                            setStepForm={setStepProfile}
                            data={dataAxios}
                            setData={setDataAxios}
                        />
                    ) : (
                        <FormPerfilStep3
                            stepForm={stepProfile}
                            setStepForm={setStepProfile}
                            data={dataAxios}
                            setData={setDataAxios}
                            loadStatus={setShowLoader}
                            clearCache={clearRegistrationCache}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
            {showLoader && <LoaderMacros />}
        </MarcoAuth>
    );
};

export default RegistroPage;