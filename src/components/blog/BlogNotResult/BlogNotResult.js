import React from "react";
import './BlogNotResult.scss'

import iconLose from '../../../assets/img/ico_renewplan.png'

const BlogNotResult = (props) => {
  return (
    <div className="blogNotResult">
        <figure>
            <img src={iconLose} alt="" />
        </figure>
        <div className="txt">
            <h3>Lo sentimos no encontramos articulos relacionados.</h3>
        </div>
    </div>
  )
};

export default BlogNotResult;
