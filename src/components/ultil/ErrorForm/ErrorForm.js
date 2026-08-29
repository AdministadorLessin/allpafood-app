import React from "react";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import './ErrorForm.scss';

const ErrorForm = ({text}) => {
  return (
    <div className="inlineFlex barValidation">
      <ErrorOutlineIcon /><p>{text}</p>
    </div>
  )
};

export default ErrorForm;
