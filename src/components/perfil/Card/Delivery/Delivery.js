import React,{useEffect} from "react";
import perfilMarcador from '../../../../assets/img/perfil_marcador.png';

import Skeleton from '@mui/material/Skeleton';
import BlockAnimate from './../../../ultil/BlockAnimate/BlockAnimate';

const CardProfileDelivery = ({data}) => {
    
    useEffect(()=>{
        //console.log(data);
    },[]);
    
    return (
        <div className="displayFlex perfilBox perfilBox2">
            <BlockAnimate
                claseStyle={'figureIcon'}
                stateParam={data}
                unicId={'CardProfileDeliveryasd65d1a56dIcon'}
            >
                {data ?
                    <img src={perfilMarcador} alt="" />
                :
                    <Skeleton variant="circular" width={100} height={100} />
                }
                
            </BlockAnimate>
            <BlockAnimate
                claseStyle={'txt'}
                stateParam={data}
                unicId={'CardProfileDeliveryasdad65as4da65d45a4s6d'}
            >
            {data ?
                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                        <small>Direccion:</small>
                        <p>{data.description}</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Lugar:</small>
                        <p>{data.address}</p>
                    </div>
                </div>
            :
                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                        <small>Direccion:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                    <div className="perfilLblField">
                        <small>Lugar:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                </div>
            }
            </BlockAnimate>
        </div>
    )
};

export default CardProfileDelivery;
