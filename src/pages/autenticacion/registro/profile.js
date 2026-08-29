import React,{useEffect, useState} from "react";
import './registro.scss';

import logoAllpafood2 from '../../../assets/img/logo_allpafood.png';

import IconCondicionSvg from '../../../components/ultil/iconSvg/iconCondicionSvg';
import IconObjetivoSvg from './../../../components/ultil/iconSvg/iconObjetivoSvg';
import IconProfileSvg from './../../../components/ultil/iconSvg/iconProfileSvg';

import {useAuthContext} from '../../../context/authContext';

import LayoutTransition from './../../../components/LayoutTransition/LayoutTransition';
import FormPerfilStep1 from './../../../components/auth/FormPerfil/FormStep1';
import FormPerfilStep2 from './../../../components/auth/FormPerfil/FormStep2';
import FormPerfilStep3 from './../../../components/auth/FormPerfil/FormStep3';

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"
import Backdrop from './../../../components/ultil/Backdrop/Backdrop';
import LoaderMacros from './../../../components/auth/FormPerfil/LoaderMacros/LoaderMacros';
import RegistroSidebar from './../../../components/Registro/Sidebar/Sidebar';

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

    return (
        <LayoutTransition keytst={'123123asdada'}>
            <Backdrop />

            <main className="inlineFlex registerPage">
                <RegistroSidebar />
                <div className="registerPageResp registerPageResp">
                    <img src={logoAllpafood2} alt="" />
                </div>
                <div className="regCont">
                    <div className="inlineFlex regSteps ">
                        <div className="regStepsBox regStepsBox2">
                            <ul className="regStepMenu">
                                <li className={stepProfile === 0 ? 'active' : null}>
                                    <span>
                                        <IconObjetivoSvg color={'#000'} />
                                        Objetivos
                                    </span>
                                </li>
                                <li className={stepProfile === 1 ? 'active' : null}>
                                    <span>
                                        <IconCondicionSvg color={'#000'} />
                                        Condición física
                                    </span>
                                </li>
                                <li className={stepProfile === 2 ? 'active' : null}>
                                    <span>
                                        <IconProfileSvg color={'#000'} />
                                        Perfil
                                    </span>
                                </li>
                            </ul>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={stepProfile + 'profileFormRegistroasdada'}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
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
                                            clearCache={clearRegistrationCache} // Se pasa por si se necesita limpiar tras completar
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
            {showLoader && <LoaderMacros />}
        </LayoutTransition>
    );
};

export default RegistroPage;