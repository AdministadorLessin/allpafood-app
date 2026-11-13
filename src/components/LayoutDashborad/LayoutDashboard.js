import React,{useState} from "react"
import { useLocation, useNavigationType } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import TabBar from '../TabBar/TabBar';
import NavLateral from '../NavLateral/NavLateral';
import ReprogramarMenu from '../ReprogramarMenu/ReprogramarMenu';
import Centro from '../Centro/Centro';

import './LayoutDashboard.scss';

import * as motion from "motion/react-client";
import DashLoadState from './../dashboard/Loading/Loading';

/* Como entra cada pantalla, igual que en un telefono:
   - una pestaña (Inicio, Menu, Progreso, Bienestar, Yo) aparece con un
     fundido corto, sin desplazarse;
   - una pantalla hija (Mi plan, Mis pagos...) llega desde la derecha;
   - al volver atras, la pantalla llega desde la izquierda. */
const PESTANAS = ['/', '/menu', '/progreso', '/bienestar', '/perfil'];
const entradaDe = (ruta, tipo) => {
    if (tipo === 'POP') return { opacity: 0, x: -26 };
    if (PESTANAS.includes(ruta)) return { opacity: 0, y: 6 };
    return { opacity: 0, x: 30 };
};

const LayoutDasboard = ({children,claseStyle}) => {

    const [openReprogramar,setOpenReprogramar] = useState(false);
    const [menuActive,setMenuActive] = useState(0);
    const { pathname } = useLocation();
    const tipo = useNavigationType();

    return (
        <main className="displayFlex pageLayout">
            <Sidebar setOpenReprogramar={setOpenReprogramar}  openReprogramar={openReprogramar} menuActive={menuActive} setMenuActive={setMenuActive}/>
            {/* Las cuatro secciones siempre a la vista. El menu hamburguesa sigue
                montado para no romper nada mientras se prueba, pero la navegacion
                real pasa por aqui. */}
            <TabBar />
            {/* En computadora, la navegacion con nombres. Se muestra desde
                993px; debajo de eso manda la barra de abajo. */}
            <NavLateral />
            <div className="mainLayout">
                {/* Aqui habia cinco manchas radiales de 1000px en verde y cian.
                    Aun bajadas de opacidad tenian la fuerza suficiente para
                    teñir el centro de la pantalla: el degradado del body ya
                    aporta la profundidad que hacia falta. */}
                <motion.div
                    initial={entradaDe(pathname, tipo)}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 34, opacity: { duration: 0.18 } }}
                    className={claseStyle ? 'mainLayoutBox ' +claseStyle :'mainLayoutBox'}
                >
                    {children}
                </motion.div>
            </div>

            <ReprogramarMenu setOpenReprogramar={setOpenReprogramar} openReprogramar={openReprogramar} />

            {/* Avisos y ayuda, en todas las pantallas del panel. */}
            <Centro />
            
            <DashLoadState />

{/* Aqui salia una animacion de la marca despues de iniciar sesion. Con la
                apertura nueva y las siluetas de espera ya no hace falta. */}
        </main>
    )
};

export default LayoutDasboard;
