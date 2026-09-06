import React from "react";
import './MenuWeek.scss';

import icoMenuEmpty from '../../../assets/img/ico_week_empty.png';
import MenuDay from './../MenuDay/MenuDay';
import { Link } from 'react-router-dom';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const MenuWeek = ({data,reproOrder,getMenus}) => {
    

    return (
        <div className="inlineFlex dashMweekCont">
            <div className="inlineFlex dmwaTerm">
                <Link to={'https://allpafood.com/terminos-y-condiciones/'} target={'_blank'}> <OpenInNewIcon /> Términos y condiciones</Link>
                <Link to={'https://allpafood.com/politicas-de-privacidad/'} target={'_blank'}> <OpenInNewIcon /> Politicas de privacidad</Link>
            </div>
            {data && data.length ?
                <div className={'inlineFlex dashMweekBox'}>
                    {data.map((item)=>{
                        return (
                            <MenuDay 
                                data={item} 
                                reproOrder={reproOrder}
                                getMenus={getMenus}
                            />
                        )
                    })}

                </div>
            :
                <div className="inlineFlex dmwaNotfound">
                    <figure>
                        <img src={icoMenuEmpty} alt="" />
                    </figure>
                    {/* Antes: "¡Lo sentimos! Aun no tiene ordenes programadas" con una
                        carita triste. Pedirle perdon al cliente por algo que depende de
                        el, y sin darle la salida, no ayuda: un estado vacio guia. */}
                    <div className="txt">
                        <h5>Todavía no eliges tus platos</h5>
                        <p>Elige tus almuerzos en «Programa tu menú» y aparecerán aquí.</p>
                    </div>
                    
                </div>
            }
            

        </div>
    )
};

export default MenuWeek;
