import React from "react";
import './Sidebar.scss';

import logoAllpafood from '../../../assets/img/allpafood_dark_green.svg';
import logoAllpafood2 from '../../../assets/img/registro_img.jpeg';


const RegistroSidebar = (props) => {
    return (
        <div className="regSide">
            <img src={logoAllpafood2} alt="" />
            {false &&
                <figure>
                    <img src={logoAllpafood} alt="" />
                </figure>
            }
        </div>
    )
};

export default RegistroSidebar;
