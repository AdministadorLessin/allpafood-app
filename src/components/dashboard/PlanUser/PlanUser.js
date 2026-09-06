import moment from 'moment';
import 'moment/locale/es';
import React,{useState,useEffect} from "react";
import './PlanUser.scss';
import Moment from 'react-moment';

import Skeleton from '@mui/material/Skeleton';

import BlockAnimate from './../../ultil/BlockAnimate/BlockAnimate';

const PlanUser = ({data}) => {

    const [plan,setPlan] = useState(false);

    useEffect(()=>{
        if(data){
            setTimeout(() => {
                setPlan(data);
            }, 1000);
        }else{
            setPlan(data);
        }
    },[data])

    return (
        <div className="dashPlanUser">
            <BlockAnimate
                claseStyle={'inlineBlock'}
                stateParam={plan}
                unicId={'dashPlanUserAnim'}
            >
                { plan  ?
                    <div className={'dashPlanUserBox'}>
                        
                        {/* Antes decia "Creditos: 1" con el 1 escrito a mano: siempre 1,
                            compraras uno o cinco planes. Ahora dice cuantos envios tiene
                            esperando, que es lo que el cliente acaba de pagar. */}
                        {plan.credits && plan.credits.orders &&
                            <div className="dpubCredits">
                                {plan.credits.orders.total} envíos esperando
                            </div>
                        }
                        <h2>
                            {plan.planName}
                        </h2>
                        {/* Decia "45 dias calendario" fijo, mientras el plan real dura
                            los dias que marque su vencimiento (hoy 30). Prometia dos
                            semanas que el sistema no da. */}
                        <div className="dpubNote">
                            <p>Puedes usar tu plan hasta el {plan.expirationDate ? moment(plan.expirationDate).format('D [de] MMMM') : 'vencimiento'}.</p>
                        </div>
                        {plan.consumption.orders.consumed === plan.consumption.orders.total ? 
                            <ul>
                                <li>
                                    <small>Desde:</small>
                                    <p>
                                        <Moment format="D MMM">
                                            {plan.initDate}
                                        </Moment>
                                    </p>
                                </li>
                                <li>
                                    <small>Hasta:</small>
                                    <p>
                                        <Moment format="D MMM">
                                            {plan.expirationDate}
                                        </Moment>
                                    </p>
                                </li>
                                <li>
                                    <small>Envíos:</small>
                                    <p>{plan.credits.orders.consumed}/{plan.credits.orders.total}</p>
                                </li>
                            </ul>
                        :
                            <ul>
                                <li>
                                    <small>Desde:</small>
                                    <p>
                                        <Moment format="D MMM">
                                            {plan.initDate}
                                        </Moment>
                                    </p>
                                </li>
                                <li>
                                    <small>Hasta:</small>
                                    <p>
                                        <Moment format="D MMM">
                                            {plan.expirationDate}
                                        </Moment>
                                    </p>
                                </li>
                                <li>
                                    <small>Envíos:</small>
                                    <p>{plan.consumption.orders.consumed}/{plan.consumption.orders.total}</p>
                                </li>
                            </ul>
                        }
                    </div>
                :
                    <div className={'dashPlanUserBox'}>
                        <Skeleton variant="text" sx={{ fontSize: '1.5em' }} />
                        <ul>
                            <li>
                                <small>Desde:</small>
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            </li>
                            <li>
                                <small>Hasta:</small>
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            </li>
                            <li>
                                <small>Envíos:</small>
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            </li>
                        </ul>
                    </div>
                }

            </BlockAnimate>
        </div>
        
    )
};

export default PlanUser;
