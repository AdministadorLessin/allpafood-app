import React from "react";
import perfilPrivacidad from '../../../../assets/img/perfil_privacidad.png';

import Skeleton from '@mui/material/Skeleton';
import BlockAnimate from './../../../ultil/BlockAnimate/BlockAnimate';

const CardProfilePrivacidad = ({data}) => {
    return (
        <div className="displayFlex perfilBox perfilBox3">
            <BlockAnimate
                claseStyle={'figureIcon'}
                stateParam={data}
                unicId={'CardPasswordasd564ad56a4sd'}
            >
                {data ?
                    <img src={perfilPrivacidad} alt="" />
                :
                    <Skeleton variant="circular" width={100} height={100} />
                }
                
            </BlockAnimate>
            <BlockAnimate
                claseStyle={'txt'}
                stateParam={data}
                unicId={'CardPasswordasd564ad56a4sd'}
            >
            {data ?
                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                        <small>DNI:</small>
                        <p>{data.documentNumber}</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Numero de whatsapp:</small>
                        <p>{data.phoneNumber}</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Fecha de nacimiento:</small>
                        <p>{data.bornDate}</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Direccion:</small>
                        <p>{data.address}</p>
                    </div>
                </div>
            :
                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                        <small>DNI:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                    <div className="perfilLblField">
                        <small>Numero de whatsapp:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                    <div className="perfilLblField">
                        <small>Fecha de nacimiento:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                    <div className="perfilLblField">
                        <small>Direccion:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                </div>
            }
            </BlockAnimate>
        </div>
    )
};

export default CardProfilePrivacidad;
