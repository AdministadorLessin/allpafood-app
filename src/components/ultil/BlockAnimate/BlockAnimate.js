import React from "react";

import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";

import { faker } from '@faker-js/faker';


const BlockAnimate = ({children,claseStyle,stateParam,unicId}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
          key={stateParam ? unicId + faker.string.uuid() : unicId + faker.string.uuid()}
          initial={{ x: 3, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -3, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={claseStyle}
      >
        {children}
      </motion.div>
  </AnimatePresence >
  )
};

export default BlockAnimate;
