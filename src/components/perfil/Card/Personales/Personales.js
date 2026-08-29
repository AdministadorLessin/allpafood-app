import React from "react";
import perfilPrivacidad from '../../../../assets/img/perfil_privacidad.png';

import Skeleton from '@mui/material/Skeleton';
import BlockAnimate from './../../../ultil/BlockAnimate/BlockAnimate';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';

const CardProfilePersonal = ({data,imgProfile,setSwitch}) => {



    return (
        <div className="displayFlex perfilBox">
            <BlockAnimate
                claseStyle={'perfilAvatar'}
                stateParam={data}
                unicId={'CardProfilePersonaldasd564ad56a4sdIcon'}
            >
                {true ?
                    <div onClick={()=>console.log(data)} className={'perfilAvatarFig'}>
                        {data && data.image ?
                            <img src={'../assets/img/avatars/avatar_'+data.image+'.jpg' } />
                        : data && !data.image && data && data.gender === "M" ?
                            <img src={'../assets/img/avatars/avatar_5.jpg' } />
                        : data && !data.image && data && data.gender === "F" ?
                            <img src={'../assets/img/avatars/avatar_6.jpg' } />
                        :
                            <Skeleton variant="circular" width={125} height={125} />
                        }
                    </div>
                :
                    <Skeleton variant="circular" width={100} height={100} />
                }
                <button className={'perfilAvatarButton'} onClick={()=>setSwitch(3)}>
                    Cambiar <ReplayOutlinedIcon />
                </button>
                
                
            </BlockAnimate>
            <BlockAnimate
                claseStyle={'txt'}
                stateParam={data}
                unicId={'CardProfilePersonaldasd564ad56a4sd'}
            >
            {data ?
                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                        <small>Nombres y apellidos:</small>
                        <p>{data.name} {data.lastname}</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Sexo:</small>
                        <p>{data.gender ? data.gender === 'M' ? 'Masculino':'Femenino' : '--'}</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Fecha de inscripción:</small>
                        <p>{data.registerDate ? data.registeDate : '00/00/00'}</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Correo:</small>
                        <p>{data.email ? data.email: '--'}</p>
                    </div>
                </div>
            :
                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                        <small>Nombres y apellidos:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                    <div className="perfilLblField">
                        <small>Sexo:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                    <div className="perfilLblField">
                        <small>Fecha de inscripción:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                    <div className="perfilLblField">
                        <small>Correo:</small>
                        <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                    </div>
                </div>
            }
            </BlockAnimate>
        </div>
    )
};

export default CardProfilePersonal;
