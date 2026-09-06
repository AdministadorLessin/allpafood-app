import React,{useEffect,useState} from "react";

import './planes.scss';
import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import CardPaperGreen from './../../../components/ultil/CardPaperGreen/CardPaperGreen';

import Grid from '@mui/material/Grid';
import CardInfoCalorias from './../../../components/dashboard/CardInfoCalorias/CardInfoCalorias';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

import icoMenu from '../../../assets/img/icon_notify.svg';

import {useAuthContext} from '../../../context/authContext';

import axios from 'axios';
import { useNavigate } from "react-router-dom";

import icoProte from '../../../assets/img/ico_prote.png';
import icoCarbo from '../../../assets/img/ico_carbo.png';
import icoGrasas from '../../../assets/img/ico_grasas.png';

import icoCalorias from '../../../assets/img/ico_cal.png';
import { API_URL } from '../../../config';

const PlanesPage = (props) => {

  const { token, addItemToCart, removeLocalstorage } = useAuthContext();
  let navigate = useNavigate();

  const [recomendPlans,setRecomendPlans] = useState();
  const getRecomend = () =>{
    axios.get(`${API_URL}private/catalog/subscription-plans/recommended`,{
      headers: {"Authorization" : `Bearer ${token}`} 
    }).then((resp)=>{

      const planesList = resp.data.data.plans;
      console.log(resp.data.data.plans)
      if(planesList){
        planesList.map((item)=>{
          if(item.id === 1 ){

            const aproxNeed = {
              calorias:1000,
              proteinas:145,
              carbo:190,
              grasas:28,
            }
            item.needAprox = aproxNeed;

          }else if(item.id === 2 ){
            const aproxNeed = {
              calorias:1200,
              proteinas:175,
              carbo:210,
              grasas:35,
            }
            item.needAprox = aproxNeed;
          }else if(item.id === 3 ){
            const aproxNeed = {
              calorias:1400,
              proteinas:190,
              carbo:230,
              grasas:40,
            }
            item.needAprox = aproxNeed;
          }
        })
      }

      // Orden de presentacion preferido. Los planes que no esten en esta
      // lista se muestran igual al final: antes, crear un plan nuevo en el
      // panel admin hacia que no apareciera aqui.
      const order = [2, 1, 3];
      const lista = Array.isArray(planesList) ? planesList : [];

      const preferidos = order
        .map(id => lista.find(item => item && item.id === id))
        .filter(Boolean);

      const resto = lista.filter(
        item => item && !order.includes(item.id)
      );

      // .filter(Boolean) evita los undefined que antes tumbaban la pantalla
      // cuando un id de la lista no existia en la base.
      setRecomendPlans([...preferidos, ...resto]);

    }).catch((error)=>{
      console.log(error);
    });
  }

  const paymentNext = (item) =>{
    addItemToCart(item)
    navigate('/checkout')
  }

  const [dataNeedDay,setDataNeedDay] = useState();
  const needDay = () =>{
    setDataNeedDay(JSON.parse(window.localStorage.getItem('needBrm')));
  }

  const [dataUser,setDataUser] = useState();
  const getUserData = () =>{
    setDataUser(JSON.parse(window.localStorage.getItem('inf')));
  }

  useEffect(()=>{
    getRecomend();
    needDay();
    getUserData();
    removeLocalstorage();
  },[])

  return (
    <LayoutDasboard claseStyle={false}>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={5}>
              <CardPaperGreen data={dataUser} planes={true}  />
            </Grid>
            <Grid item xs={12} sm={12} md={7}>
              <CardInfoCalorias data={dataNeedDay} />
            </Grid>

            <Grid item xs={12}>
              <CardPaper
                data={
                  {
                    titulo:'Te recomendamos:',
                    ico:icoMenu,
                    className:false
                  }
                }
              >
                <div 
                  className="inlineFlex sPlanesList"
                >
                  {recomendPlans && recomendPlans.length  && recomendPlans.map((item)=>(
                    <div 
                      //className={item.id === 2 ? 'sPlanesItem': item.id===1 ? 'sPlanesItem sPlanesItemActive' : ' sPlanesItem'}
                      className={  item.id===3 ? 'sPlanesItem sPlanesItemActive' : ' sPlanesItem'}
                    >
                      
                      <div className="tag">{item.level}</div>

                      <div className="title">
                        <h4>{item.description}</h4>
                        {/* El precio real, no uno inventado: antes el ".99" iba escrito a mano
                            y el cliente veia 295.99 cuando el plan costaba 295.00. */}
                        <h3><small className="pen">S/.</small>{Math.trunc(Number(item.price))} <small>.{String(Number(item.price).toFixed(2)).split(".")[1]}</small></h3>
                        <p>Antes s/. {item.previousPrice}</p>
                      </div>

                      <div className="sPlanesItemAcum sPlanesItemAcum2">
                        {item.id===3 && <h5>Plan recomendado</h5>}
                        <div className="txt">
                          
                          <p>Con este plan cubres aproximadamente:</p>

                          {false && 
                            <ul>
                              <li><span><img src={icoCalorias} alt="" /></span><p>{item.needAprox.calorias} <small>kcal</small> <strong>Calorías</strong></p></li>
                              <li><span><img src={icoProte} alt="" /></span><p>{item.needAprox.proteinas} <small>Gr.</small> <strong>Proteinas</strong></p></li>
                              <li><span><img src={icoCarbo} alt="" /></span><p>{item.needAprox.carbo} <small>Carbs.</small> <strong>Carbohidratos</strong></p></li>
                              <li><span><img src={icoGrasas} alt="" /></span><p>{item.needAprox.grasas} <small>gr.</small> <strong>grasas</strong></p></li>
                            </ul>
                          }

                          {item.properties && item.properties.length && 
                            <ul>
                              {item.properties?.map((propItem)=>{
                                if( propItem.name === 'calorias' ){
                                  return (
                                    <li><span><img src={icoCalorias} alt="" /></span><p>{propItem.value} <small>kcal</small> <strong>Calorías</strong></p></li>
                                  )
                                }
                                if( propItem.name === 'carbo' ){
                                  return (
                                    <li><span><img src={icoCarbo} alt="" /></span><p>{propItem.value} <small>Carbs</small> <strong>Carbohidratos</strong></p></li>
                                  )
                                }
                                if( propItem.name === 'grasas' ){
                                  return (
                                    <li><span><img src={icoGrasas} alt="" /></span><p>{propItem.value} <small>Gr</small> <strong>Grasas</strong></p></li>
                                  )
                                }
                                if( propItem.name === 'proteinas' ){
                                  return (
                                    <li><span><img src={icoProte} alt="" /></span><p>{propItem.value} <small>Gr</small> <strong>Proteinas</strong></p></li>
                                  )
                                }
                              })}
                            </ul>
                          }
                        </div>
                      </div>

                      
                      {item.descriptionList && item.descriptionList.length &&
                        <ul className={'list'}>
                          {item.descriptionList?.map((descItem)=>(
                            <li>{descItem}</li>
                          ))}
                        </ul>
                      }

                      <a onClick={()=>paymentNext(item)} className="btnPrimary">
                        <span>Pagar</span>
                      </a>
                    </div>
                  ))}


                </div>
              </CardPaper>
            </Grid>
        </Grid>
    </LayoutDasboard>
  )
};

export default PlanesPage;
