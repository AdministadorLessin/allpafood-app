import React,{useEffect,useState} from "react";

import './planes.scss';
import Pantalla, { Tramo } from './../../../components/perfil/Pantalla/Pantalla';
import Skeleton from '@mui/material/Skeleton';

import {useAuthContext} from '../../../context/authContext';

import axios from 'axios';
import { useNavigate } from "react-router-dom";

import { motion, useReducedMotion } from 'motion/react';
import { resorte } from '../../../movimiento';
import { vibrar } from '../../../nativo';
import PanelNecesidades from './../../../components/dashboard/PanelNecesidades/PanelNecesidades';
import { API_URL } from '../../../config';

const Tick = () => (
  <svg className="pln__tick" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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

  const { token, addItemToCart, removeLocalstorage, planInfo } = useAuthContext();
  const quieto = useReducedMotion();
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

  /* Cual esta marcado. Solo es lo que se ve: la compra sigue siendo
     paymentNext(plan), igual que antes con un boton por tarjeta. */
  const [elegidoId, setElegidoId] = useState(null);
  const planes = recomendPlans || [];
  const suyo = planInfo?.plan?.planName
    ? planes.find((p) => String(p.description).toLowerCase() === String(planInfo.plan.planName).toLowerCase())
    : null;
  const elegido = planes.find((p) => p.id === elegidoId) || suyo || planes[0] || null;
  const precioDe = (n) => (Number.isInteger(Number(n)) ? `S/ ${Number(n)}` : `S/ ${Number(n).toFixed(2)}`);

  return (
    <Pantalla
      etiqueta={nombre ? `Listo, ${String(nombre).split(' ')[0]}.` : 'Planes'}
      titulo="Elige tu plan"
      bajada="Marca uno para ver qué trae y cuánto sale cada almuerzo."
      volver="/" clase="pln">

      {/* Por que estos planes y no otros: lo que necesita al dia. */}
      {Number(dataNeedDay?.bmr) > 0 && dataNeedDay?.macros &&
        <Tramo as="section" className="cuP__papel pln__necesitas">
          <span className="pln__et">Lo que necesitas al día</span>
          <PanelNecesidades datos={dataNeedDay} />
        </Tramo>
      }

      {cargando &&
        <Tramo>
          <Skeleton variant="rounded" height={84} sx={{ borderRadius:'22px', mt:'20px' }} />
          <Skeleton variant="rounded" height={84} sx={{ borderRadius:'22px', mt:'8px' }} />
          <Skeleton variant="rounded" height={84} sx={{ borderRadius:'22px', mt:'8px' }} />
        </Tramo>
      }

      {planes.length > 0 &&
        <Tramo className="pln__lista" role="radiogroup" aria-label="Planes">
          {planes.map((item)=>{
            const precio = Number(item.price);
            const antes = Number(item.previousPrice);
            const ahorro = antes > precio ? antes - precio : 0;
            // El numero real de envios del plan, no un 20 escrito a mano: si
            // manana se crea un plan de 12, la division seguiria siendo cierta.
            const envios = item?.benefits?.consumptionTotal || 20;
            const porUnidad = precio / envios;
            const destacado = item.id === 3;
            const on = elegido && elegido.id === item.id;

            return (
              <motion.button type="button" role="radio" aria-checked={!!on} key={item.id}
                className={`pln__plan${on ? ' is-on' : ''}`}
                whileTap={{ scale: 0.985 }} transition={resorte.toque}
                onClick={() => { vibrar.toque(); setElegidoId(item.id); }}>
                <span className="pln__cab">
                  <span className="pln__radio" aria-hidden="true">{on && <Tick />}</span>
                  <span className="pln__txt">
                    <b>
                      {item.description}
                      {suyo && suyo.id === item.id && <span className="cuP__chip">El tuyo</span>}
                      {destacado && <span className="cuP__chip cuP__chip--gris">El que más piden</span>}
                    </b>
                    <small>{item.level}</small>
                  </span>
                  <span className="pln__precio">
                    <b>{precioDe(precio)}</b>
                    {ahorro > 0 && <small>antes {precioDe(antes)}</small>}
                  </span>
                </span>

                {/* El dato que realmente decide: cuanto sale cada almuerzo. */}
                {on &&
                  <motion.span className="pln__detalle"
                    initial={quieto ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={quieto ? { duration: 0 } : resorte.entra}>
                    <span className="pln__unidad">
                      {envios} envíos · sale a <b>S/ {porUnidad.toFixed(2)}</b> cada uno
                      {ahorro > 0 && ` · ahorras S/ ${ahorro.toFixed(2)}`}
                    </span>
                    {item.descriptionList && item.descriptionList.length > 0 &&
                      <span className="pln__incluye">
                        {item.descriptionList.map((d, i)=>(
                          <span key={i}><Tick />{d}</span>
                        ))}
                      </span>
                    }
                    {item.properties && item.properties.length > 0 &&
                      <span className="pln__macros">
                        Cubre aprox. {item.properties.find(p=>p.name==='calorias')?.value} kcal
                        {' · '}{item.properties.find(p=>p.name==='proteinas')?.value} g de proteína al día
                      </span>
                    }
                  </motion.span>}
              </motion.button>
            );
          })}
        </Tramo>}

      {elegido &&
        <Tramo className="pln__pie">
          <motion.button
            type="button"
            className="cuP__btn"
            onClick={()=>paymentNext(elegido)}
            whileTap={{ scale: 0.97 }} transition={resorte.toque}
          >
            Elegir {elegido.description} · {precioDe(elegido.price)}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </motion.button>
          <p className="cuP__nota pln__nota">El pago lo confirmas en la siguiente pantalla.</p>
        </Tramo>}

      {!cargando && planes.length === 0 &&
        <Tramo>
          <p className="cuP__vacio">
            No pudimos cargar los planes. Revisa tu conexión y vuelve a entrar.
          </p>
        </Tramo>
      }

    </Pantalla>
  )
};

export default PlanesPage;
