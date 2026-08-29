import React from "react";
import './CardNoticiaLoad.scss';

import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';

import Skeleton from '@mui/material/Skeleton';

const CardNoticiaLoad = (props) => {
  return (
    <div className="cardNoticaLoad">
      <figure>
        <PhotoCameraBackIcon />
      </figure>
      <h3><Skeleton variant="text" /></h3>
      <div className="txt">
        <p>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        </p>
      </div>
    </div>
  )
};

export default CardNoticiaLoad;
