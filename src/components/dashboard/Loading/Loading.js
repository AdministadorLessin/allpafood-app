import React from "react"
import Isotipo from './../../ultil/Isotipo';
import './Loading.scss';
import { useAuthContext } from "context/authContext";

/* El velo de "estamos guardando": la pantalla se desenfoca y el isotipo late
   en el centro. No recibe toques: solo avisa. */
const DashLoadState = () => {

    const { loadResp } = useAuthContext();

    return (
        <div
            data-estate={loadResp}
            className={loadResp ? 'dashLoading dashLoadingAct' : 'dashLoading '}
            aria-hidden="true"
        >
            <figure>
                <Isotipo size={44} />
            </figure>
        </div>
    )
};

export default DashLoadState;
