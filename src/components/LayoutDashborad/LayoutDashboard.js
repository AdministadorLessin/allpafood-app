import React,{useState} from "react"
import Sidebar from '../sidebar/sidebar';
import TabBar from '../TabBar/TabBar';
import ReprogramarMenu from '../ReprogramarMenu/ReprogramarMenu';

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
            
            <DashLoadState />
        </main>
    )
};

export default LayoutDasboard;
