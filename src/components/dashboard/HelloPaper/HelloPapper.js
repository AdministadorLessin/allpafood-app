import React,{useEffect,useState} from "react";
import './HelloPapper.scss';

import moment from 'moment';
import 'moment/locale/es';

import Skeleton from '@mui/material/Skeleton';
import BlockAnimate from './../../ultil/BlockAnimate/BlockAnimate';

import caritaFelis from '../../../assets/img/dash_emoticon_1.png';
import caritaTriste from '../../../assets/img/ico_renewplan.png';

const HelloPaper = ({data}) => {

  
  // El locale se fijaba DESPUES de formatear, y el patron era el ingles
  // ('MMMM Do YYYY'), asi que salia "Septiembre 3o 2026".
  moment.locale('es');
  const today = moment(new Date()).format('dddd D [de] MMMM');

  const [userData,setUserData] = useState();
  useEffect(()=>{
    if(data){
      setTimeout(() => {
        setUserData(data);
      }, 600);
    }else{
      setUserData(data);
    }
  },[data])

  return (
    <div className="helloPaper">
      <BlockAnimate
        claseStyle={'inlineBlock'}
        stateParam={userData}
        unicId={'helloPaperAnim1'}
      >
        {userData ?
          <div className="txtCont inlineFlex">

            <div className="txt">
              <small>{today}</small>
              <h1><strong>Buen día, {userData && userData.profile && userData.profile.name ? userData.profile.name.split(" ")[0] : ''}</strong></h1>
              {/* El aviso de renovacion y el saludo generico se fueron al banner
                  de estado, que decide segun la situacion real del cliente.
                  Aqui quedaba ademas "Bienvenido" en masculino para todos. */}
              <p>Aquí ves tu semana y tu plan.</p>
            </div>
            <figure>
              {userData && userData.plan && userData.plan.consumption && parseFloat(userData.plan.consumption.orders.consumed) >= 15 ?
                <img src={ caritaTriste} alt="" />
              :
                <img src={caritaFelis} alt="" />
              }
              
            </figure>
          </div>
          :
          <div className="txt">
            <small><Skeleton variant="text" sx={{ fontSize: '1rem',width:'100%' }} /></small>
            <h1><Skeleton variant="text" sx={{ fontSize: '1rem',width:'100%' }} /></h1>
            <p><Skeleton variant="text" sx={{ fontSize: '1rem',width:'100%' }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem',width:'100%' }} /></p>
          </div>
        }
      </BlockAnimate>
    </div>
  )
};

export default HelloPaper;
