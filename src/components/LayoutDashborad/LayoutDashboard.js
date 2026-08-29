import React,{useState} from "react"
import Sidebar from '../sidebar/sidebar';
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
            <div className="mainLayout">
                <span className="mlDetalle mlDetalle1"></span>
                <span className="mlDetalle mlDetalle2"></span>
                <span className="mlDetalle mlDetalle3"></span>
                <span className="mlDetalle mlDetalle4"></span>
                <span className="mlDetalle mlDetalle5"></span>
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
