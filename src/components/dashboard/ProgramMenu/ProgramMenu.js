import React,{useState,useEffect} from "react";
import './ProgramMenu.scss';

import icoRenewplan from '../../../assets/img/ico_renewplan.png';
import icoProgram from '../../../assets/img/ico_noprogram.png';
import platoImg1 from '../../../assets/img/menu_animado.gif';
import icoMenuList from '../../../assets/img/ico_factrura.svg';
import ObjetivosCalc from './../ObjetivosCalc/ObjetivosCalc';
import Moment from 'react-moment';

import {useAuthContext} from '../../../context/authContext';
import Modal from '@mui/material/Modal';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import { Link } from 'react-router-dom';
import ReplyIcon from '@mui/icons-material/Reply';
import moment from 'moment';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import AddIcon from '@mui/icons-material/Add';

import Skeleton from '@mui/material/Skeleton';

import axios from 'axios';
import MenuDayValid from './../MenuDay/MenuDayValid';

import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';

import RoomIcon from '@mui/icons-material/Room';
import ProgramMenuMap from './ubicacion/ubicacion';
import { API_URL } from '../../../config';

// Debe coincidir con schedule.order.max_hour del backend. Si alla cambia, aqui
// tambien: hoy el cliente puede elegir para manana hasta esta hora.
export const HORA_LIMITE = 22;

const ProgramMenu = ({data,sendOrder,setOrderPass,lastDateProgram}) => {

  const { token } = useAuthContext();
  const [dateItem,setDateItem] = useState(0);
  const [listMenu,setListMenu] = useState();
  const [programMenuWeek,setProgramMenuWeek] = useState([]);
  const [validOrder, setValidOrder] = useState();
  const [comidaItem,setComidaItem] = useState(1);

  const changeDay = (item) =>{
    setDateItem(item);
    setValidOrder();
    verifyDayOrder(programMenuWeek);
  }

  const changeComida = (item) =>{
    setComidaItem(item)
  }

  /*
  const getMenuProgram = ()=>{
    
    if(data){
      
      const planNameFnc = data.planName;
      if(lastDateProgram){
        axios.get(`${API_URL}dashboard/menus?initDate=`+moment(lastDateProgram).add(1,'days').format('YYYY-MM-DD'),
            {
              headers: {"Authorization" : `Bearer ${token}`} 
            }
          ).then((resp)=>{
            
            setListMenu(resp.data.data);
            const listTmp = [];
            if(resp.data.data){
              resp.data.data.map((item,index)=>{
                if(planNameFnc ==='Fitfuel'){

                  listTmp.push({
                    scheduleDate:item.localDate,
                    menusId:[],
                    lunch:[],
                    dinner:[],
                    count:{
                      calorias:0,
                      proteinas:0,
                      carbo:0,
                      grasas:0
                    }
                  });
                }else if(planNameFnc ==='Nutrivital'){
                  listTmp.push({
                    scheduleDate:item.localDate,
                    menusId:[],
                    lunch:[],
                    count:{
                      calorias:0,
                      proteinas:0,
                      carbo:0,
                      grasas:0
                    }
                  });
                }else{
                  listTmp.push({
                    scheduleDate:item.localDate,
                    menusId:[],
                    lunch:[],
                    count:{
                      calorias:0,
                      proteinas:0,
                      carbo:0,
                      grasas:0
                    }
                  });
                }
              })
            }
            setProgramMenuWeek(listTmp)
          }).catch((error)=>{
            console.log(error)
          })
      }else{
        
        // Misma regla que el camino de arriba: antes este else sumaba siempre 1
        // dia, asi que segun por donde entrara el cliente veia una ventana
        // distinta de dias disponibles.
        axios.get(`${API_URL}dashboard/menus?initDate=`+moment().add(moment().hour() >= HORA_LIMITE ? 2 : 1,'days').format('YYYY-MM-DD'),
            {
              headers: {"Authorization" : `Bearer ${token}`} 
            }
          ).then((resp)=>{
            //console.log('else',resp.data.data)
            setListMenu(resp.data.data);
            const listTmp = [];
            if(resp.data.data){
              resp.data.data.map((item,index)=>{
                if(planNameFnc ==='Fitfuel'){
                  listTmp.push({
                    scheduleDate:item.localDate,
                    menusId:[],
                    lunch:null,
                    dinner:null,
                    count:{
                      calorias:0,
                      proteinas:0,
                      carbo:0,
                      grasas:0
                    }
                  });
                }else if(planNameFnc ==='Nutrivital'){
                  listTmp.push({
                    scheduleDate:item.localDate,
                    menusId:[],
                    lunch:[],
                    count:{
                      calorias:0,
                      proteinas:0,
                      carbo:0,
                      grasas:0
                    }
                  });
                }else{
                  listTmp.push({
                    scheduleDate:item.localDate,
                    menusId:[],
                    lunch:[],
                    count:{
                      calorias:0,
                      proteinas:0,
                      carbo:0,
                      grasas:0
                    }
                  });
                }

              })
            }
            setProgramMenuWeek(listTmp)
          }).catch((error)=>{
            console.log(error)
          })
      }
    }
  }
    */

  const getMenuProgram = async () => {
    if (!data) return;

    const planNameFnc = data.planName;

    // 1. Determinar la fecha base (lastDateProgram o la fecha actual)
    const baseDate = lastDateProgram ? moment(lastDateProgram) : moment();

    // El servidor acepta pedidos para el dia siguiente hasta las 22:00
    // (schedule.order.max_hour). Aqui estaba escrito 9, con un comentario que
    // decia 16: se cerraba la ventana trece horas antes de tiempo y el cliente
    // perdia un dia entero de eleccion sin motivo.
    const daysToAdd = moment().hour() >= HORA_LIMITE ? 2 : 1;
    const initDate = baseDate.add(daysToAdd, 'days').format('YYYY-MM-DD');

    try {
      const resp = await axios.get(
        `${API_URL}dashboard/menus?initDate=${initDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const menuData = resp.data?.data || [];
      setListMenu(menuData);

      // 3. Mapeo simplificado de los ítems
      const listTmp = menuData.map((item) => {
        const isFitfuel = planNameFnc === 'Fitfuel';
        const defaultLunchDinner = lastDateProgram 
          ? [] 
          : (isFitfuel ? null : []);

        return {
          scheduleDate: item.localDate,
          menusId: [],
          lunch: defaultLunchDinner,
          ...(isFitfuel && { dinner: defaultLunchDinner }),
          count: {
            calorias: 0,
            proteinas: 0,
            carbo: 0,
            grasas: 0
          }
        };
      });

      setProgramMenuWeek(listTmp);
    } catch (error) {
      console.error('Error al obtener el menú:', error);
    }
  };

  const getDayTmp = (date) =>{
    // getDay() devuelve 0 para DOMINGO, no para lunes. El arreglo empezaba en
    // 'LUN', asi que todas las etiquetas salian corridas un dia: el jueves se
    // rotulaba VIE y el cliente pedia su plato para el dia equivocado.
    var days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    var d = new Date(date);
    var dayName = days[d.getDay()];
    return dayName;
  }

  const paramProgramMenu = (list,indx) =>{


    let sendMenusList =[];
    if(list[indx]){
      let tmpItem = [];

      if(list[indx].lunch){
        if(list[indx].lunch){
          tmpItem.push(list[indx].lunch.id);
        }
      }

      if(list[indx].dinner){
        if(list[indx].dinner){
          tmpItem.push(list[indx].dinner.id);
        }
      }

      if(pointSelect.data){
        sendMenusList.push({
          scheduleDate: list[indx].scheduleDate,
          menuTypeIds: tmpItem,
          deliveryPointId: pointSelect.data.id
        })
      }else{
        sendMenusList.push({
          scheduleDate:list[indx].scheduleDate,
          menuTypeIds:tmpItem
        })
      }
      
    }
    
    return sendMenusList;
  }

  const verifyDayOrder = (list)=>{
    
    const paramSchuled = paramProgramMenu(list,dateItem);

    //console.log(list);
    setOrderPass(paramSchuled);
    let activeTmp = false;
    const menu = list?.[dateItem];

    if (menu) {
      const hasLunch = menu.hasOwnProperty('lunch');
      const hasDinner = menu.hasOwnProperty('dinner');

      if (hasLunch && hasDinner) {
        if (menu.lunch != null && menu.dinner != null) {
          activeTmp = true;
        }
      }

      else if (hasLunch) {
        if (menu.lunch != null) {
          activeTmp = true;
        }
      }

      else if (hasDinner) {
        if (menu.dinner != null) {
          activeTmp = true;
        }
      }
    }
    setValidOrder(activeTmp);
  }

  const selectMenu = (item,date,typeMenu) =>{
    const inListMenu = programMenuWeek.find(
      (menuInList) => menuInList.scheduleDate ===  date
    )


    if(inListMenu){
      
      const programMenuTmp = programMenuWeek.map((menuInList) =>{
        if(date === menuInList.scheduleDate){
          
          const arrTmpMenuWeek = menuInList.menusId;
          const arrTmpList = [];
          arrTmpMenuWeek.push(item.menu.id);
          arrTmpList.push(item);

          //console.log('--->',arrTmpMenuWeek)

          let breakCalorias = 0;
          let breakCarbo = 0;
          let breakGrasas = 0;
          let breakProt = 0;

          /*
          if(data && menuInList.breakfast){
            breakCalorias = menuInList.breakfast ? menuInList.breakfast.properties[0].value : 0;  
            breakCarbo = menuInList.breakfast ? menuInList.breakfast.properties[1].value : 0;
            breakGrasas = menuInList.breakfast ? menuInList.breakfast.properties[2].value : 0;
            breakProt = menuInList.breakfast ? menuInList.breakfast.properties[3].value : 0;
          }
            */

          const lunchCalorias = menuInList.lunch && menuInList.lunch > 0 ? menuInList.lunch.properties[0].value : 0;
          const lunchCarbo = menuInList.lunch  && menuInList.lunch > 0 ? menuInList.lunch.properties[1].value : 0;
          const lunchGrasas = menuInList.lunch  && menuInList.lunch > 0 ? menuInList.lunch.properties[2].value : 0;
          const lunchProt = menuInList.lunch  && menuInList.lunch > 0 ? menuInList.lunch.properties[3].value : 0;

          let dinnerCalorias = 0;
          let dinnerCarbo = 0;
          let dinnerGrasas = 0;
          let dinnerProt = 0;
          if(data && menuInList.dinner){
            dinnerCalorias = menuInList.dinner && menuInList.dinner > 0 ? menuInList.dinner.properties[0].value : 0;
            dinnerCarbo = menuInList.dinner && menuInList.dinner > 0 ? menuInList.dinner.properties[1].value : 0;
            dinnerGrasas = menuInList.dinner && menuInList.dinner > 0 ? menuInList.dinner.properties[2].value : 0;
            dinnerProt = menuInList.dinner && menuInList.dinner > 0 ? menuInList.dinner.properties[3].value : 0;
          }

          if(typeMenu === 'breakfast'){
            return {
              ...inListMenu,
              menusId:arrTmpMenuWeek,
              breakfast:arrTmpList[0],
              count:{
                calorias: item.menu.properties[0].value + lunchCalorias + dinnerCalorias,
                carbo: item.menu.properties[1].value + lunchCarbo + dinnerCarbo,
                grasas: item.menu.properties[2].value + lunchGrasas + dinnerGrasas,
                proteinas: item.menu.properties[3].value + lunchProt + dinnerProt,
              }
            };
          }else if(typeMenu === 'lunch'){
            return {
              ...inListMenu,
              menusId:arrTmpMenuWeek,
              lunch:arrTmpList[0],
              count:{
                calorias: item.menu.properties[0].value + breakCalorias + dinnerCalorias,
                carbo: item.menu.properties[1].value + breakCarbo + dinnerCarbo,
                grasas: item.menu.properties[2].value + breakGrasas + dinnerGrasas,
                proteinas: item.menu.properties[3].value + breakProt + dinnerProt,
              }
            };
          }else if(typeMenu === 'dinner'){
            return {
              ...inListMenu,
              menusId:arrTmpMenuWeek,
              dinner:arrTmpList[0],
              count:{
                calorias: item.menu.properties[0].value + breakCalorias + lunchCalorias,
                carbo: item.menu.properties[1].value + breakCarbo + lunchCarbo,
                grasas: item.menu.properties[2].value + breakGrasas + lunchGrasas,
                proteinas: item.menu.properties[3].value + breakProt + lunchProt,
              }
            };
          }
        }else{
          return {...menuInList}
        }
      });

      setProgramMenuWeek(programMenuTmp)
      
      // Validar que escoja todos sus opciones
      verifyDayOrder(programMenuTmp);
    }
  };

  const validOrderMenu = () => {
    handleResumenOrderOpen();
  };

  const [openResumenOrder, setOpenResumenOrder] = useState(false);
  const handleResumenOrderOpen = () => setOpenResumenOrder(true);
  const handleResumenOrderClose = () => setOpenResumenOrder(false);

  const [openResumenMap, setOpenResumenMap] = useState(false);
  const handleResumenMapOpen = () => setOpenResumenMap(true);
  const handleResumenMapClose = () => setOpenResumenMap(false);

  const [ dataPlan, setDataPlan ] = useState();

  // Ubicaciones
  const [pointList,setPointList] = useState();
  const [loadPl,setLoadPl] = useState(false);
  const [pointSelect,setPointSelect] = useState({
    id:null,
    data:null
  });

  const getDirections = () => {
      setLoadPl(true)
      axios.get(`${API_URL}delivery/find/points`,{
        headers: {"Authorization" : `Bearer ${token}`} 
      }).then((resp)=>{
        
        setPointList(resp.data.data);

        setTimeout(() => {
            setLoadPl(false)    
        }, 1500);
        
      }).catch((error)=>{
      })
  }

  const updateUbi = (item,index) =>{
    setPointSelect({
      id:index,
      data:item
    })
  }

  const removeUbi = (item) =>{
      axios.delete(`${API_URL}delivery/delete/point?deliveryPointId=`+item.id,{
          headers: {"Authorization" : `Bearer ${token}`} 
      }).then((resp)=>{
          getDirections();
      }).catch((error)=>{
          console.log(error)
      })
  }

  useEffect(()=>{
    getDirections();
    setDataPlan(JSON.parse(window.localStorage.getItem('inf')));
    getMenuProgram();

  },[data]);

  return (
    <div className="inlineBlock dashProgramMenuWeek ">
      {dataPlan && dataPlan.plan && dataPlan.plan.consumption && dataPlan.plan.consumption.orders.consumed === dataPlan.plan.consumption.orders.total && dataPlan.credits  &&
        <div className="dashProgramMenuWeekDisable" >
          <div className="inlineFlex note">
            <figure>
              <img src={icoRenewplan} alt="" />
            </figure>
            <div className="txt">
              <h3>¡Lo sentimos!</h3>
              <p>Ya usaste todos tus creditos y/o finalizo tu plan</p>
              <Link to={'/checkout'} className='btnPrimary'>
                Renueva tu plan
              </Link>
            </div>
          </div>
        </div>
      }

      {listMenu ?
        <div className="inlineFlex dpmDays">
          {listMenu.length > 0 && listMenu.map((item,index)=>{
            return (
              <div onClick={()=>changeDay(index)} className={dateItem === index ? "inlineFlex dpmDaysItem dpmDaysItemAct" : "inlineFlex dpmDaysItem"}>
                <svg className={'det det1'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="#CDF6FF"/>
                </svg>
                <p><Moment format="DD">{item.localDate}</Moment></p>
                <small>{getDayTmp(item.localDate)}</small>
                <svg className={'det det2'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="#CDF6FF"/>
                </svg>
              </div>
            )
          })}
        </div>
      :
        <div className="inlineFlex dpmDays">
          
          <div className={"inlineFlex dpmDaysItem"}>
            <Skeleton variant="circular" width={90} height={90} />
          </div>
          <div className={ "inlineFlex dpmDaysItem"}>
            <Skeleton variant="circular" width={90} height={90} />
          </div>
          <div className={"inlineFlex dpmDaysItem"}>
            <Skeleton variant="circular" width={90} height={90} />
          </div>
          <div className={"inlineFlex dpmDaysItem"}>
            <Skeleton variant="circular" width={90} height={90} />
          </div>
          <div className={"inlineFlex dpmDaysItem"}>
            <Skeleton variant="circular" width={90} height={90} />
          </div>
          
        </div>
      }

      {listMenu && listMenu.length > 0 ?
        <div className="inlineFlex dpmResults">
          <div className="inlineFlex dpmResultsCont">
            {dataPlan && dataPlan.plan &&
            <div className="inlineFlex dpmMenu">

              
              <div onClick={()=>changeComida(1)} className={comidaItem === 1 ? "inlineFlex dpmMenuItem dpmMenuItemActive": "inlineFlex dpmMenuItem"}>
                <svg className={'det det1'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
                Almuerzo
                <svg className={'det det2'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
              </div>

              { dataPlan.plan.planName ==='Fitfuel' &&
                <div onClick={()=>changeComida(2)} className={comidaItem === 2 ? "inlineFlex dpmMenuItem dpmMenuItemActive dpmMenuItemActive3": "inlineFlex dpmMenuItem"}>
                  <svg className={'det det1'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                  </svg>
                  Cena
                  <svg className={'det det2'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                  </svg>
                </div>
              }
              
            </div>
            }
            {listMenu[dateItem].menuTypeGroups && listMenu[dateItem].menuTypeGroups.length > 0 &&
              <div className="dpmMenuResp">
                
                {listMenu[dateItem].menuTypeGroups.map((subItem,indexxx)=>{
                  if(comidaItem === 0 && subItem.type==='breakfast'){
                    return (
                      <div>
                        <ObjetivosCalc data={programMenuWeek[dateItem].count} />
                        {subItem.menuTypes && subItem.menuTypes.length >= 0 && subItem.menuTypes.map((menuItem)=>{
                            return (
                              <div 
                                className={'inlineFlex dpmrMenuItem dpmrMenuItemAct'} 
                              >
                                <figure>
                                  <img src={menuItem.menu.imageUrl ? menuItem.menu.imageUrl : platoImg1 } alt="" />
                                </figure>
                                <div className="txt">
                                  <h4>{menuItem.menu.name}</h4>
                                  <p>{menuItem.menu.description}</p>
                                </div>
                                <ul>
                                  <li>
                                    <p>{menuItem.menu.properties[0] && menuItem.menu.properties[0].value}</p>
                                    <small>kcal</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[3] && menuItem.menu.properties[3].value}</p>
                                    <small>Prot.</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[2] && menuItem.menu.properties[2].value}</p>
                                    <small>Grasas</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[1] && menuItem.menu.properties[1].value}</p>
                                    <small>Carbo.</small>
                                  </li>
                                </ul>
                              </div>
                            )
                          })
                        }
                      </div>
                    )
                    
                  }else if(comidaItem === 1 && subItem.type==='lunch'){
                    return (
                      <div>
                        <ObjetivosCalc data={programMenuWeek[dateItem].count} />
                        {subItem.menuTypes && subItem.menuTypes.length >= 0 && subItem.menuTypes.map((menuItem)=>{
                            let activeItemMenu = false;
                            if(programMenuWeek[dateItem].lunch){
                              if(menuItem.id===programMenuWeek[dateItem].lunch.id){
                                activeItemMenu=true;
                              }
                            }

                            return (
                              <div 
                                className={activeItemMenu ?'inlineFlex dpmrMenuItem dpmrMenuItemAct':'inlineFlex dpmrMenuItem'} 
                                onClick={()=>selectMenu(menuItem,listMenu[dateItem].localDate,'lunch')}>
                                <figure>
                                  <img src={menuItem.menu.imageUrl ? menuItem.menu.imageUrl : platoImg1 } alt="" />
                                </figure>
                                <div className="txt">
                                  <h4>{menuItem.menu.name}</h4>
                                  <p>{menuItem.menu.description}</p>
                                </div>
                                <ul>
                                  <li>
                                    <p>{menuItem.menu.properties[0] && menuItem.menu.properties[0].value}</p>
                                    <small>kcal</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[3] && menuItem.menu.properties[3].value}</p>
                                    <small>Prot.</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[2] && menuItem.menu.properties[2].value}</p>
                                    <small>Grasas</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[1] && menuItem.menu.properties[1].value}</p>
                                    <small>Carbo.</small>
                                  </li>
                                </ul>
                              </div>
                            )
                          })
                        }                     
                      </div>
                    )
                  }else if(comidaItem === 2 && subItem.type==='dinner'){
                    return (
                      <div>
                        <ObjetivosCalc data={programMenuWeek[dateItem].count} />
                        {subItem.menuTypes && subItem.menuTypes.length >= 0 && subItem.menuTypes.map((menuItem)=>{
                            let activeItemMenu = false;
                            if(programMenuWeek[dateItem]?.dinner){
                              if(menuItem?.menu?.id===programMenuWeek[dateItem]?.dinner?.menu?.id){
                                activeItemMenu=true;
                              }
                            }

                            return (
                              <div 
                                className={activeItemMenu ?'inlineFlex dpmrMenuItem dpmrMenuItemAct':'inlineFlex dpmrMenuItem'} 
                                onClick={()=>selectMenu(menuItem,listMenu[dateItem].localDate,'dinner')}>
                                <figure>
                                  <img src={menuItem.menu.imageUrl ? menuItem.menu.imageUrl : platoImg1 } alt="" />
                                </figure>
                                <div className="txt">
                                  <h4>{menuItem.menu.name}</h4>
                                  <p>{menuItem.menu.description}</p>
                                </div>
                                <ul>
                                  <li>
                                    <p>{menuItem.menu.properties[0].value}</p>
                                    <small>kcal</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[3].value}</p>
                                    <small>Prot.</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[2].value}</p>
                                    <small>Grasas</small>
                                  </li>
                                  <li>
                                    <p>{menuItem.menu.properties[1].value}</p>
                                    <small>Carbo.</small>
                                  </li>
                                </ul>
                              </div>
                            )
                          })
                        }

                      </div>
                    )
                  }

                })}
                <div 
                  className="inlineFlex dpmBtnBox"
                >
                  {validOrder === false &&
                    <div className="inlineFlex dpmError">
                      <p> <ErrorIcon /> Seleccione todos sus menus por favor.</p>
                    </div>
                  }
                  <button 
                    className={validOrder === true ? 'btnPrimary ':'btnPrimary btnDisabled'} 
                    onClick={()=>validOrderMenu()}
                  >
                    Ordenar <ArrowForwardIosIcon />
                  </button>
                </div>
              </div>
            }

            
          </div>
        </div>
      : listMenu && listMenu.length === 0 ?
        <div className="inlineFlex dpmNotResults">
          <div className="ico">
            <figure>
              <img src={icoProgram} alt="" />
            </figure>
          </div>
          <p>
            Ya elegiste todos los días disponibles. Los viernes publicamos el menú de la próxima semana.
          </p>
        </div>
      :
        <div className="inlineFlex dpmResults">
          <div className="inlineFlex dpmResultsCont">
            <div className="inlineFlex dpmMenu">

              <div className={'inlineFlex dpmMenuItem'}>
                <svg className={'det det1'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
                <Skeleton variant="text" sx={{ fontSize: '1rem',width:'100%' }} />
                <svg className={'det det2'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
              </div>
            
              <div className={"inlineFlex dpmMenuItem dpmMenuItemActive"}>
                <svg className={'det det1'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
                <Skeleton variant="text" sx={{ fontSize: '1rem',width:'100%' }} />
                <svg className={'det det2'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
              </div>

              <div className={'inlineFlex dpmMenuItem'}>
                <svg className={'det det1'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
                <Skeleton variant="text" sx={{ fontSize: '1rem',width:'100%' }} />
                <svg className={'det det2'} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 15C0.812183 10.5106 0 0 0 0V20H20C20 20 10.0149 19.3239 5.5 15Z" fill="white"/>
                </svg>
              </div>
              
            </div>
          
            <div className="dpmMenuResp">
              <div 
                className={'inlineFlex dpmrMenuItem dpmrMenuItemLoad'} >
                <figure>
                  <Skeleton variant="circular" width={90} height={90} />
                </figure>
                <div className="txt">
                  <h4><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></h4>
                  <p><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                </div>
                <ul>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                </ul>
              </div>

              <div 
                className={'inlineFlex dpmrMenuItem dpmrMenuItemLoad'} >
                <figure>
                  <Skeleton variant="circular" width={90} height={90} />
                </figure>
                <div className="txt">
                  <h4> <Skeleton variant="text" sx={{ fontSize: '1rem' }} /></h4>
                  <p> <Skeleton variant="text" sx={{ fontSize: '1rem' }} /></p>
                </div>
                <ul>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                  <li>
                    <Skeleton variant="circular" width={40} height={40} />
                  </li>
                </ul>
              </div>
            </div>

            <div className="inlineFlex dpmBtnBox">
              <button className={'btnPrimary'}>
                <Skeleton variant="text" sx={{ fontSize: '1rem',width:'100px' }} /> <ArrowForwardIosIcon />
              </button>
            </div>
            
          </div>
        </div>
      }

      <Modal
        open={openResumenOrder}
        onClose={handleResumenOrderClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="dpmResumenOrder">
          <div className="title">
            <div className="ico">
                <img src={icoMenuList} alt="" />
            </div>
            <h3>Confirmar orden</h3>
          </div>

          <MenuDayValid data={programMenuWeek[dateItem]} />

          <div className="inlineFlex dpmRoDelivery">

            <div className="inlineFlex dpmrdTitle">
              <h4>
                <DeliveryDiningIcon /> Delivery
              </h4>  
              <div onClick={handleResumenMapOpen} className="dpmRoDeliveryBtn">
                Agregar <AddIcon />
              </div>
            </div>

            {!loadPl && pointList && pointList.length > 0 ?
              <div className="ubiPageMapListBox">
                  {pointList.length > 0 && pointList.map((item,index)=>{
                      
                    return (
                      <div 
                        className={pointSelect.id === index ? 'dpmRoDeliveryItem dpmRoDeliveryItemAct':'dpmRoDeliveryItem'}
                      >
                        <div className="icon">
                          <RoomIcon />
                        </div>
                        <div className="txt">
                          <h3>{item.description}</h3>
                          <p>{item.address}</p>
                        </div>
                        { pointSelect.id !== index &&
                          <div className="actions inlineFlex">
                            <div onClick={()=>updateUbi(item,index)} className="check">
                              <CheckIcon />
                            </div>
                            <div onClick={()=>removeUbi(item)} className="remove">
                              <DeleteIcon />
                            </div>
                          </div>
                        }
                      </div>
                    )
                  })}
                  
              </div>
              :
              <div className="ubiPageMapListBox">
                  {pointList && pointList.length > 0 && pointList.map((item)=>(
                      <Skeleton variant="rounded" width={'100%'} sx={{mb:1,borderRadius:4}} height={60} />
                  ))}
              </div>
            }
          </div>

          <div className="inlineFlex dpmroBtn">
            <button className={validOrder === false ? 'holaaaa' : pointSelect.id === null ? 'btnPrimary btnDisabled' : 'btnPrimary '} onClick={()=>{sendOrder();handleResumenOrderClose();}}>
              <SaveIcon /> Guardar orden
            </button>
            <button className={'btnPrimary'} onClick={()=>handleResumenOrderClose()}>
              <ReplyIcon /> Volver
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={openResumenMap}
        onClose={handleResumenMapClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="inlineBlock dpmResumenMapCont">
          <ProgramMenuMap setPointList={setPointList} updateUbi={updateUbi} handleResumenMapClose={handleResumenMapClose} />
        </div>
      </Modal>

    </div>
  )
};

export default ProgramMenu;
