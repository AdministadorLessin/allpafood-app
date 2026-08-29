import React from "react";
import './Backdrop.scss';

const Backdrop = (props) => {
  return (
    <div className="authDetails">
      {true &&
        <div className="adDet adDet1"></div>
      }
      {true &&
        <div className="adDet adDet2"></div>
      }
      {true &&
        <div className="adDet adDet3"></div>
      }
      {true &&
        <div className="adDet adDet4"></div>
      }
      {true &&
        <div className="adDet adDet5"></div>
      }
      {true &&
        <div className="adDet adDet6"></div>
      }

    </div>
  )
};

export default Backdrop;
