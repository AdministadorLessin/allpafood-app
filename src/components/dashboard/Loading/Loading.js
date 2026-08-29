import React from "react"
import IcoIsotipoSvg from './../../ultil/iconSvg/icoIsotipoSvg';
import './Loading.scss';
import { useAuthContext } from "context/authContext";

const DashLoadState = () => {

    const { loadResp } = useAuthContext();

    return (
        <div 
            data-estate={loadResp}
            className={loadResp ? 'dashLoading dashLoadingAct' : 'dashLoading '}
            
        >
            <figure>
                <IcoIsotipoSvg />
            </figure>
        </div>
    )
};

export default DashLoadState;
