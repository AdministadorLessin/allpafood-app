import React, { useEffect, useMemo, useState } from "react";
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import Skeleton from '@mui/material/Skeleton';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

import './motorizado.scss';
import { useAuthContext } from '../../../context/authContext';
import { Cascada, Bloque, motion, alToque } from './../../../components/ultil/Motion/Motion';
import { API_URL } from '../../../config';

/* Numero de la oficina, por si el cliente no responde. */
const OFICINA = '51999999999';

/* Por que no se pudo entregar. Se eligen de una lista y no se escriben: en la
   calle, con una mano, nadie redacta. Y ademas asi se pueden contar despues:
   si "nadie contesto" es la mitad de los fallos, eso se arregla avisando
   antes, no cambiando de motorizado. */
const MOTIVOS = [
  'Nadie contestó',
  'No encontré la dirección',
  'El cliente no estaba',
  'El cliente rechazó el pedido',
  'No me dejaron entrar',
];

const Ico = ({ d, c }) => (
  <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const PIN   = "M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z";
const TEL   = "M6.6 3.5h3l1.5 3.8-2 1.4a12 12 0 0 0 5.2 5.2l1.4-2 3.8 1.5v3a1.7 1.7 0 0 1-1.9 1.7C10.6 17.6 6.4 13.4 4.9 5.4A1.7 1.7 0 0 1 6.6 3.5z";
const CHECK = "m5 12.5 4.5 4.5L19 7.5";
const MAPA  = "M9 3.6 3.6 5.9v14.5L9 18.1m0-14.5 6 2.3m-6-2.3v14.5m6-12.2 5.4-2.3v14.5L15 20.4m0-14.5v14.5m0 0-6-2.3";

/**
 * La pantalla del motorizado.
 *
 * Antes era una maqueta: un mapa sin puntos y una lista escrita a mano con
 * "Irvin Vivanco - Av. 28 de julio 156". No consultaba nada. Los endpoints
 * existian y nadie los usaba.
 *
 * Esta pensada para usarse en la calle, con una mano y sin tiempo: primero
 * cuantas entregas quedan, despues la siguiente, y el resto en una lista donde
 * cada parada se cierra con un toque.
 */
const DashboardMotorizado = () => {

  const { token, planInfo } = useAuthContext();

  const [entregas, setEntregas] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(null);
  const [verMapa, setVerMapa] = useState(false);
  const [fallando, setFallando] = useState(null);

  const hoy = moment().format('YYYY-MM-DD');

  const cargar = () => {
    axios.get(`${API_URL}delivery/motorized/find-my-orders?date=${hoy}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setEntregas(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => { setEntregas([]); setError('No pudimos cargar tu ruta. Revisa tu señal e intenta de nuevo.'); });
  };

  useEffect(cargar, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Se completa una parada. La lista se actualiza al instante y despues se
     confirma con el servidor: en la calle la señal va y viene, y esperar el
     ida y vuelta hace sentir la app trabada. */
  const marcarEntregado = (orderId) => {
    setGuardando(orderId);
    setError('');
    axios.post(`${API_URL}delivery/motorized/complete-order`, [orderId], {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setEntregas((lista) => lista.map((e) =>
          e.orderEntity.id === orderId
            ? { ...e, orderEntity: { ...e.orderEntity, status: 'COMPLETED' } }
            : e));
      })
      .catch(() => setError('No se pudo marcar como entregado. Inténtalo otra vez.'))
      .finally(() => setGuardando(null));
  };

  /* No se pudo entregar. Antes esto no existia: el motorizado llamaba a la
     oficina y quedaba de palabra, sin rastro. */
  const marcarFallida = (orderId, motivo) => {
    setGuardando(orderId);
    setError('');
    axios.post(`${API_URL}delivery/motorized/fail-order`, { orderId, reason: motivo }, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setEntregas((lista) => lista.map((e) =>
          e.orderEntity.id === orderId
            ? { ...e, orderEntity: { ...e.orderEntity, status: 'FAILED', deliveryNote: motivo } }
            : e));
        setFallando(null);
      })
      .catch(() => setError('No se pudo guardar. Inténtalo otra vez.'))
      .finally(() => setGuardando(null));
  };

  const pendientes = useMemo(
    () => (entregas || []).filter((e) => !['COMPLETED','FAILED'].includes(e.orderEntity.status)),
    [entregas]);
  const total = (entregas || []).length;
  const cerradas = total - pendientes.length;
  const fallidas = (entregas || []).filter((e) => e.orderEntity.status === 'FAILED').length;
  // La siguiente parada: es lo unico que importa mientras se maneja.
  const siguiente = pendientes[0]?.orderEntity?.id;

  const puntos = (entregas || [])
    .map((e) => e.orderEntity.deliveryPoint?.geoLocation)
    .filter((g) => g && g.latitude);
  const centro = puntos.length
    ? { lat: puntos[0].latitude, lng: puntos[0].longitude }
    : { lat: -12.089, lng: -77.03 };

  if (entregas === null) {
    return (
      <main className="afMoto">
        <div className="afMoto__col">
          <Skeleton variant="text" width="55%" height={38} />
          <Skeleton variant="rounded" height={92} sx={{ borderRadius:'20px', mt:2 }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius:'20px', mt:1.5 }} />
        </div>
      </main>
    );
  }

  return (
    <main className="afMoto">
      <Cascada className="afMoto__col">

        <Bloque className="afMoto__top">
          <span className="afMoto__hola">
            {planInfo?.profile?.name ? `Hola, ${planInfo.profile.name.split(' ')[0]}` : 'Tu ruta'}
          </span>
          <span className="afMoto__fecha">{moment().format('ddd D MMM')}</span>
        </Bloque>

        {/* Lo primero: cuanto falta. Es la unica pregunta que el motorizado
            trae en la cabeza al abrir la pantalla. */}
        <Bloque>
          <div className="afMoto__marcador">
            <div className="afMoto__cifra">
              <b>{pendientes.length}</b>
              <span>{pendientes.length === 1 ? 'entrega por hacer' : 'entregas por hacer'}</span>
            </div>
            {total > 0 &&
              <div className="afMoto__aro">
                <span>{cerradas}/{total}</span>
              </div>
            }
          </div>
        </Bloque>

        {/* Una barra que se llena: en la calle se mira de reojo, y decir
            "vas por la 3 de 5" es mas util que cualquier numero suelto. */}
        {total > 0 &&
          <Bloque>
            <div className="afMoto__barra">
              <i style={{ width: `${(cerradas / total) * 100}%` }} />
            </div>
            {fallidas > 0 &&
              <p className="afMoto__fallidas">
                {fallidas} sin entregar · la oficina ya lo ve
              </p>
            }
          </Bloque>
        }

        {error && <Bloque><p className="afMoto__error">{error}</p></Bloque>}

        {entregas.length === 0 &&
          <Bloque>
            <div className="afMoto__vacio">
              <Ico d={CHECK} c="afMoto__vacioIc" />
              <b>Sin entregas asignadas para hoy</b>
              <p>Cuando la oficina asigne tu ruta, aparecerá aquí.</p>
            </div>
          </Bloque>
        }

        {puntos.length > 0 &&
          <Bloque>
            <button type="button" className="afMoto__verMapa" onClick={() => setVerMapa((v) => !v)}>
              <Ico d={MAPA} c="afMoto__verMapaIc" />
              {verMapa ? 'Ocultar el mapa' : `Ver las ${puntos.length} paradas en el mapa`}
            </button>
            {verMapa &&
              <div className="afMoto__mapa">
                <APIProvider apiKey={'AIzaSyAAx9xj-TsHleju-u37DgxHohxXJv4d-uo'}>
                  <Map mapId={"bf51a910020fa25a"} defaultCenter={centro} defaultZoom={13}
                       gestureHandling={'cooperative'} disableDefaultUI={true}
                       style={{ width:'100%', height:'100%' }}>
                    {(entregas || []).map((e, i) => {
                      const g = e.orderEntity.deliveryPoint?.geoLocation;
                      if (!g || !g.latitude) return null;
                      const listo = e.orderEntity.status === 'COMPLETED';
                      return (
                        <AdvancedMarker key={e.orderEntity.id}
                          position={{ lat: g.latitude, lng: g.longitude }}>
                          <span className={`afMoto__pin${listo ? ' afMoto__pin--listo' : ''}`}>{i + 1}</span>
                        </AdvancedMarker>
                      );
                    })}
                  </Map>
                </APIProvider>
              </div>
            }
          </Bloque>
        }

        {(entregas || []).map((e, i) => {
          const o = e.orderEntity;
          const p = e.userProfile || {};
          const dp = o.deliveryPoint || {};
          const listo = o.status === 'COMPLETED';
          const fallida = o.status === 'FAILED';
          const esSiguiente = o.id === siguiente;
          const g = dp.geoLocation;
          const tel = (p.phoneNumber || '').replace(/\D/g, '');

          return (
            <Bloque key={o.id}>
              <div className={`afParada${listo ? ' afParada--listo' : ''}${fallida ? ' afParada--fallida' : ''}${esSiguiente ? ' afParada--siguiente' : ''}`}>

                {esSiguiente && <span className="afParada__toca">Tu siguiente parada</span>}

                <div className="afParada__cab">
                  <span className="afParada__n">
                    {listo ? <Ico d={CHECK} c="afParada__nIc" />
                      : fallida ? '!' : i + 1}
                  </span>
                  <div className="afParada__quien">
                    <b>{[p.name, p.lastname].filter(Boolean).join(' ') || 'Cliente'}</b>
                    {dp.district && <small>{dp.district}</small>}
                  </div>
                </div>

                <p className="afParada__dir">
                  <Ico d={PIN} c="afParada__dirIc" />
                  {dp.address || 'Sin dirección'}
                </p>
                {dp.description &&
                  <p className="afParada__ref">{dp.description}</p>}

                <div className="afParada__acciones">
                  {g && g.latitude &&
                    <a className="afParada__btn"
                       href={`https://www.google.com/maps/dir/?api=1&destination=${g.latitude},${g.longitude}`}
                       target="_blank" rel="noreferrer">
                      <Ico d={MAPA} c="afParada__btnIc" /> Cómo llegar
                    </a>
                  }
                  <a className="afParada__btn"
                     href={`https://wa.me/${tel || OFICINA}`}
                     target="_blank" rel="noreferrer">
                    <Ico d={TEL} c="afParada__btnIc" /> {tel ? 'Escribir' : 'Oficina'}
                  </a>
                </div>

                {!listo && !fallida && fallando !== o.id &&
                  <>
                    <motion.button type="button" className="afParada__hecho"
                      disabled={guardando === o.id}
                      onClick={() => marcarEntregado(o.id)} {...alToque}>
                      {guardando === o.id ? 'Guardando…' : 'Entregado'}
                    </motion.button>
                    <button type="button" className="afParada__nope"
                      onClick={() => setFallando(o.id)}>
                      No pude entregar
                    </button>
                  </>
                }

                {/* El motivo se elige, no se escribe: en la calle nadie redacta. */}
                {fallando === o.id &&
                  <div className="afParada__motivos">
                    <p className="afParada__motivosT">¿Qué pasó?</p>
                    {MOTIVOS.map((m) => (
                      <button type="button" key={m} className="afParada__motivo"
                        disabled={guardando === o.id}
                        onClick={() => marcarFallida(o.id, m)}>
                        {m}
                      </button>
                    ))}
                    <button type="button" className="afParada__cancelar"
                      onClick={() => setFallando(null)}>
                      Volver
                    </button>
                  </div>
                }

                {listo && <p className="afParada__ok">Entregado</p>}
                {fallida &&
                  <p className="afParada__nook">
                    No entregado{o.deliveryNote ? ` · ${o.deliveryNote}` : ''}
                  </p>
                }
              </div>
            </Bloque>
          );
        })}

      </Cascada>
    </main>
  );
};

export default DashboardMotorizado;
