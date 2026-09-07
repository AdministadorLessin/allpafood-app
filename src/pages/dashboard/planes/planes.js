import React,{useEffect,useState} from "react";

import './planes.scss';
import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import Skeleton from '@mui/material/Skeleton';

import {useAuthContext} from '../../../context/authContext';

import axios from 'axios';
import { useNavigate } from "react-router-dom";

import { Cascada, Bloque, motion, alToque } from './../../../components/ultil/Motion/Motion';
import PanelNecesidades from './../../../components/dashboard/PanelNecesidades/PanelNecesidades';
import { API_URL } from '../../../config';

const Tick = () => (
  <svg className="afPlanCard__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7.5"/>
  </svg>
);

/**
 * Pantalla de planes: el punto donde el registro se convierte en compra.
 *
 * Antes eran tarjetas con borde arcoiris, precios en verde de 60px y botones
 * degradados: nada que ver con el panel al que aterriza el cliente dos
 * pantallas despues. Aqui se usan las mismas tarjetas, la misma escala y el
 * mismo acento que en el resto de la app, y el plan recomendado se destaca en
 * tinta —igual que el heroe de Mi plan— en vez de con un degradado.
 */
const PlanesPage = (props) => {

  const { token, addItemToCart, removeLocalstorage } = useAuthContext();
  let navigate = useNavigate();

  const [recomendPlans,setRecomendPlans] = useState();
  const [cargando,setCargando] = useState(true);

  const getRecomend = () =>{
    axios.get(`${API_URL}private/catalog/subscription-plans/recommended`,{
      headers: {"Authorization" : `Bearer ${token}`} 
    }).then((resp)=>{

      const planesList = resp.data.data.plans;

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
    }).finally(()=>{
      setCargando(false);
    });
  }

  const paymentNext = (item) =>{
    addItemToCart(item)
    navigate('/checkout')
  }

  const [dataNeedDay,setDataNeedDay] = useState();
  const needDay = () =>{
    try{
      setDataNeedDay(JSON.parse(window.localStorage.getItem('needBrm')));
    }catch(e){ /* sin calculo previo la tarjeta simplemente no aparece */ }
  }

  const [dataUser,setDataUser] = useState();
  const getUserData = () =>{
    try{
      setDataUser(JSON.parse(window.localStorage.getItem('inf')));
    }catch(e){ setDataUser(null); }
  }

  useEffect(()=>{
    getRecomend();
    needDay();
    getUserData();
    removeLocalstorage();
  },[])

  const nombre = dataUser?.profile?.name || dataUser?.name;

  return (
    <LayoutDasboard claseStyle={false}>
      <Cascada className="afPanel">

        <Bloque>
          <h1 className="afPanel__titular">
            <span className="afPanel__t1">
              {nombre ? `Listo, ${String(nombre).split(' ')[0]}.` : 'Ya está tu cálculo.'}
            </span>
            Elige tu plan
          </h1>
        </Bloque>

        {/* Por que estos planes y no otros. El calculo ya existia pero vivia
            en una tarjeta aparte con cuatro anillos de colores, sin decir en
            ningun momento que era la razon de la recomendacion. */}
        {dataNeedDay &&
          <Bloque>
            <div className="afCard">
              <div className="afCard__head">
                <span className="afCard__title">Lo que necesitas al día</span>
              </div>
              <PanelNecesidades datos={dataNeedDay} />
            </div>
          </Bloque>
        }

        {cargando &&
          <Bloque>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius:'22px', mb:'14px' }} />
            <Skeleton variant="rounded" height={300} sx={{ borderRadius:'22px' }} />
          </Bloque>
        }

        {recomendPlans && recomendPlans.map((item)=>{
          const precio = Number(item.price);
          const antes = Number(item.previousPrice);
          const ahorro = antes > precio ? antes - precio : 0;
          // El numero real de envios del plan, no un 20 escrito a mano: si
          // manana se crea un plan de 12, la division seguiria siendo cierta.
          const envios = item?.benefits?.consumptionTotal || 20;
          const porUnidad = precio / envios;
          const destacado = item.id === 3;

          return (
            <Bloque key={item.id}>
              <div className={`afPlanCard${destacado ? ' afPlanCard--top' : ''}`}>

                {destacado && <span className="afPlanCard__cinta">El que más piden</span>}

                <p className="afPlanCard__nivel">{item.level}</p>
                <h2 className="afPlanCard__nombre">{item.description}</h2>

                <div className="afPlanCard__precio">
                  <span className="afPlanCard__pen">S/</span>
                  {/* El precio real. Antes el ".99" iba escrito a mano y el
                      cliente veia 295.99 cuando el plan costaba 295.00. */}
                  <b>{Math.trunc(precio)}</b>
                  <small>.{String(precio.toFixed(2)).split('.')[1]}</small>
                  {ahorro > 0 && <em>antes S/ {antes.toFixed(2)}</em>}
                </div>

                {/* El dato que realmente decide: cuanto sale cada almuerzo. */}
                <p className="afPlanCard__unidad">
                  {envios} envíos · sale a <b>S/ {porUnidad.toFixed(2)}</b> cada uno
                  {ahorro > 0 && ` · ahorras S/ ${ahorro.toFixed(2)}`}
                </p>

                {item.descriptionList && item.descriptionList.length > 0 &&
                  <ul className="afPlanCard__lista">
                    {item.descriptionList.map((d, i)=>(
                      <li key={i}><Tick />{d}</li>
                    ))}
                  </ul>
                }

                {item.properties && item.properties.length > 0 &&
                  <p className="afPlanCard__macros">
                    Cubre aprox. {item.properties.find(p=>p.name==='calorias')?.value} kcal
                    {' · '}{item.properties.find(p=>p.name==='proteinas')?.value} g de proteína al día
                  </p>
                }

                <motion.button
                  type="button"
                  className={`afBtn${destacado ? ' afBtn--mint' : ''}`}
                  onClick={()=>paymentNext(item)}
                  {...alToque}
                >
                  Elegir {item.description}
                </motion.button>
              </div>
            </Bloque>
          );
        })}

        {!cargando && (!recomendPlans || recomendPlans.length === 0) &&
          <Bloque>
            <div className="afCard">
              <p className="afMenu__nota afMenu__nota--suelta">
                No pudimos cargar los planes. Revisa tu conexión y vuelve a entrar.
              </p>
            </div>
          </Bloque>
        }

      </Cascada>
    </LayoutDasboard>
  )
};

export default PlanesPage;
