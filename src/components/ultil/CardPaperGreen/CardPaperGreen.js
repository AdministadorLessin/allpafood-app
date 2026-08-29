import React,{useEffect,useState} from "react"
import './CardPaperGreen.scss'

import dashHello from '../../../assets/img/dash_emoticon_1.png';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';

const CardPaperGreen = ({planes,data}) => {

  const [planData,setPlanData] = useState();
  const [expireDate,setExpireDate] = useState();
  const { token } = useAuthContext();

  const formatDate = (date) => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
    const newDate = new Date(date);
    const day = String(newDate.getDate()).padStart(2, '0');
    return `${monthNames[newDate.getMonth()]}/${day}`;
  };

  const getPlandData = () =>{
    axios.get('https://api.allpafood.com/dev/api-af/v1/dashboard/plan',{
      headers: {"Authorization" : `Bearer ${token}`} 
    }).then((resp)=>{
      setPlanData(resp.data.data);
      //console.log('info perfil ====>',resp.data.data);
      setExpireDate(formatDate(resp.data.data.expirationDate))
    }).catch((error)=>{
      console.log(error);
    })
  }

  useEffect(()=>{
    //getPlandData();
  },[])

  return (
    <div className="paperGreen">
        <div className="homeHello">
            <figure>
                <img src={dashHello} />
            </figure>
            {data ?
                <div className="txt">
                  <h1>Hola <strong>{data.profile?.name}</strong></h1>
                  <p>Bienvenido a allpafood,<br /> Estamos para ayudarte a lograr tu objetivo</p>
                </div>
            :
              <div className="txt">
                <h1>Hola</h1>
                <p>Bienvenido a allpafood, Lorem Ipsum is <br /> simply dummy text of the printing and types</p>
              </div>
            }

        </div>
        {!planes &&
          <div className="homePlan">
            
            {planData &&
            <ul className="hPlanList">
              <li>
                <small>Plan</small>
                <p>{planData.planName}</p>
              </li>
              <li>
                <small>Almuerzos</small>
                <p>{planData.consumption?.orders?.consume}/{planData.consumption?.orders?.total}</p>
              </li>
              <li>
                <small>Expira</small>
                <p>{expireDate}  </p>
              </li>
            </ul>
            }
          </div>
        }
    </div>
  )
};

export default CardPaperGreen;
