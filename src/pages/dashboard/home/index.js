import React,{useState,useEffect} from "react"

import './index.scss';
import Grid from '@mui/material/Grid';

// Iconos
import icoMenu from '../../../assets/img/icon_notify.svg';
import icoObjetivo from '../../../assets/img/ico_objetivo.svg';
import icoFecha from '../../../assets/img/icon_fecha.svg';

// Charts
import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import HelloPaper from './../../../components/dashboard/HelloPaper/HelloPapper';
import PlanUser from './../../../components/dashboard/PlanUser/PlanUser';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';
import ObjetivosCharts from './../../../components/dashboard/ObjetivosCharts/ObjetivosCharts';
import MenuWeek from './../../../components/dashboard/MenuWeek/MenuWeek';
import ProgramMenu from './../../../components/dashboard/ProgramMenu/ProgramMenu';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';

import moment from 'moment';

import { useNavigate } from "react-router-dom";

const DashboadHome = (props) => {
  
  const { token, planInfo ,handleUpdateToken, setLoadResp, removeLocalstorage } = useAuthContext();
  let navigate = useNavigate();

  const [menuList,setMenuList] = useState();
  const todayDate = new Date();
  const [metricsDay,setMetricsDay] = useState({
    calorias:0,
    proteinas:0,
    carbo:0,
    grasas:0
  });
  
  const getMenus = () =>{
      axios.get('https://api.allpafood.com/dev/api-af/v1/dashboard/orders',
          {headers: {"Authorization" : `Bearer ${token}`} }
      ).then((resp)=>{
          //console.log('======>',resp.data.data)
          setMenuList(resp.data.data);
          let caloriasTMP = 0;
          let carbTMP = 0;
          let grasasTMP = 0;
          let protTmp = 0;
          
          resp.data.data.map((item)=>{

            if(moment(item.date).format('dddd') === moment(todayDate).format('dddd')){
              item.items.map((subItems) =>{
                caloriasTMP = caloriasTMP + subItems.menu.properties[0].value;
                carbTMP = carbTMP + subItems.menu.properties[1].value;
                grasasTMP = grasasTMP + subItems.menu.properties[2].value;
                protTmp = protTmp + subItems.menu.properties[3].value;
              })
            }

          })

          setMetricsDay({
            calorias:caloriasTMP,
            carbo:carbTMP,
            grasas:grasasTMP,
            proteinas:protTmp
          })


      }).catch((error)=>{
          console.log(error)
      })
  }

  const [objetMEtrics,setObjetMetrics] = useState();
  const getExpData = () =>{
    axios.get('https://api.allpafood.com/dev/api-af/v1/plan/user/need-day',
      {
          headers: {"Authorization" : `Bearer ${token}`} 
      }
    )
        .then((resp)=>{
            const calcFitStorage=JSON.parse(resp.data.data.needDay);
            setObjetMetrics(calcFitStorage);
            window.localStorage.setItem('needBrm',JSON.stringify(calcFitStorage))
            
        }).catch((error)=>{
            console.log(error);
        })
  }

  const [plan,setPlan] = useState();
  const [helloCard,setHelloCard] = useState();

  const getPlan = ()=>{
      axios.get('https://api.allpafood.com/dev/api-af/v1/dashboard/plan',{
          headers: {"Authorization" : `Bearer ${token}`} 
      })
      .then((resp)=>{
          const reultTmp = resp.data.data;
          const infTmp = JSON.parse(window.localStorage.getItem('inf'));
          infTmp.plan = reultTmp;
          handleUpdateToken(token,infTmp);
          setHelloCard(infTmp);

          setPlan(resp.data.data);
          
      }).catch((error)=>{
          console.log(error);
          //navigate('/planes');

      })
  }

  const [orderPass,setOrderPass] = useState();
  const [lastDateProgram,setLastDateProgram] = useState();
  const sendOrder = ()=>{
    setLoadResp(true);
    axios.post('https://api.allpafood.com/dev/api-af/v1/order/scheduled',
      orderPass,
      {
        headers: {"Authorization" : `Bearer ${token}`} 
      }
    ).then((resp)=>{
      const orderPassLengt = orderPass[orderPass.length - 1]
      setLastDateProgram(orderPassLengt)
      getMenus();
      getPlan();
      setLoadResp(false);
    }).catch((error)=>{
      console.log('maldito puerco',error)
      setLoadResp(false);
    })
  }

  const reproOrder = (id)=>{
    setLoadResp(true);
    axios.delete(
      'https://api.allpafood.com/dev/api-af/v1/order?orderId='+id,
      {
        headers: {"Authorization" : `Bearer ${token}`} 
      }
    ).then((resp)=>{
      
      getMenus();
      getPlan();
      setLoadResp(false);
    }).catch((eeerr)=>{
      console.log(eeerr);
      setLoadResp(false);
    })
  }

  // 1. Cargar datos al montar el componente
  useEffect(() => {
    getExpData();
    getPlan();
    getMenus();
  }, []);

  useEffect(() => {
    if (!planInfo) return;

    const hasProfile = planInfo.profile !== null; // o Array.isArray(planInfo.profile)
    const isPlanActive = planInfo.planActive === true;

    // 1. SI AMBOS TIENEN DATA: No hace nada (se queda en la ruta actual)
    if (hasProfile && isPlanActive ) {
      removeLocalstorage();
      return;
    }

    // 2. Si le falta el perfil, redirige a perfil
    if (!hasProfile) {
      removeLocalstorage();
      return navigate('/registro/perfil');
    }

    // 3. Si tiene perfil pero el plan no está activo, redirige a planes
    if (!isPlanActive) {
      return navigate('/planes');
    }
  }, [planInfo, navigate]);

  return (
    <LayoutDasboard claseStyle={false}>
      <Grid container spacing={2}>

        <Grid item xs={12} sm={12} md={7}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={6}>
              <HelloPaper data={helloCard} />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <PlanUser data={plan} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
              <CardPaper
                data={
                  {
                    titulo:'Programe su menú:',
                    ico:icoFecha,
                    className:false
                  }
                } 
              >
                <ProgramMenu 
                  data={plan} 
                  sendOrder={sendOrder} 
                  setOrderPass={setOrderPass} 
                  lastDateProgram={lastDateProgram}
                />
              </CardPaper>
              
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={5}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={12}>
              <CardPaper
                data={
                  {
                    titulo:'Objetivo diario:',
                    ico:icoObjetivo,
                    className:false
                  }
                } 
              >
                <ObjetivosCharts data={metricsDay} objetive={objetMEtrics} />
              </CardPaper>
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
              <CardPaper
                data={
                  {
                    titulo:'El menú de esta semana es:',
                    ico:icoMenu,
                    className:false
                  }
                } 
              >
                <MenuWeek 
                  data={menuList} 
                  reproOrder={reproOrder} 
                  getMenus={getMenus}
                />
              </CardPaper>
            </Grid>
          </Grid>
        </Grid>

      </Grid>
    </LayoutDasboard>
  )
};

export default DashboadHome;
