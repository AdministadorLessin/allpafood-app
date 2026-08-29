import React,{useEffect} from "react"

import * as motion from "motion/react-client";

import './LayoutTransition.scss';

const animationConfiguration = {
    initial: { opacity: 0,translateY: 50 },
    exit: { opacity: 0,translateY: -50},
    animate: { opacity: 1,translateY: 0 }
};

const LayoutTransition = ({children,keytst}) => {

    return (
        <div className="effect-2">
            <motion.div
                key={keytst}
                variants={animationConfiguration}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration:0.5 }}
            >
                {children}
            </motion.div>
        </div>
    )
};

export default LayoutTransition;
