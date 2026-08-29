import React,{useEffect,useState} from "react";
import './HelloPapper.scss';

import moment from 'moment';
import 'moment/locale/es';

import Skeleton from '@mui/material/Skeleton';
import BlockAnimate from './../../ultil/BlockAnimate/BlockAnimate';

import caritaFelis from '../../../assets/img/dash_emoticon_1.png';
import caritaTriste from '../../../assets/img/ico_renewplan.png';
import { Link } from 'react-router-dom';

const HelloPaper = ({data}) => {

  
  const today = moment(new Date()).format('MMMM Do YYYY');
  moment.locale('es');

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
              <h1><strong>Buen dia, {userData && userData.profile.name.split(" ")[0]}</strong></h1>
              {userData && userData.plan && userData.plan.consumption && parseFloat(userData.plan.consumption.orders.consumed) >= 15 ?
                <p> <strong>Tu plan esta por acabarse</strong><br /> <Link to={'/planes'}>Renovar</Link> </p>
              :
                <p>¡Bienvenido a tu panel <br />de control!</p>
              }
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
