import React,{useState} from "react"
import Sidebar from '../sidebar/sidebar';
import TabBar from '../TabBar/TabBar';
import NavLateral from '../NavLateral/NavLateral';
import CargaAllpa from '../ultil/CargaAllpa/CargaAllpa';
import ReprogramarMenu from '../ReprogramarMenu/ReprogramarMenu';
import Centro from '../Centro/Centro';

import './LayoutDashboard.scss';

import * as motion from "motion/react-client";
import DashLoadState from './../dashboard/Loading/Loading';

const animationConfiguration = {
    initial: { opacity: 0,translateY: 50 },
    exit: { opacity: 0,translateY: -50},
    animate: { opacity: 1,translateY: 0 }
};

const LayoutDasboard = ({children,claseStyle}) => {

    const [openReprogramar,setOpenReprogramar] = useState(false);
    const [menuActive,setMenuActive] = useState(0);

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
                    //key={keytst}
                    variants={animationConfiguration}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration:0.5 }}
                    className={claseStyle ? 'mainLayoutBox ' +claseStyle :'mainLayoutBox'}
                >
                    {children}
                </motion.div>
            </div>

            <ReprogramarMenu setOpenReprogramar={setOpenReprogramar} openReprogramar={openReprogramar} />

            {/* Avisos y ayuda, en todas las pantallas del panel. */}
            <Centro />
            
            <DashLoadState />

            {/* La marca, dibujandose, mientras llegan los datos del cliente.
                Una vez por visita. */}
            <CargaAllpa />
        </main>
    )
};

export default LayoutDasboard;
