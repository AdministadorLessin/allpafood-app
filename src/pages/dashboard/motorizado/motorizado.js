import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import Skeleton from '@mui/material/Skeleton';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

import './motorizado.scss';
import { useAuthContext } from '../../../context/authContext';
import { Cascada, Bloque, motion, alToque } from './../../../components/ultil/Motion/Motion';
import { API_URL, MAPS_KEY, MAPS_ID } from '../../../config';
import { Reorder, useDragControls } from 'framer-motion';

/* Numero de la oficina, por si el cliente no responde. */
const OFICINA = '51955797697';

/* Minutos que se espera al cliente antes de poder dar la entrega por fallida.
   Es politica de Allpa, y la app la sostiene: sin la hora de llegada, "espere
   y no salio nadie" es la palabra del motorizado contra la del cliente. */
const ESPERA_MIN = 8;

/* Por que no se pudo entregar. Se eligen de una lista y no se escriben: en la
   calle, con una mano, nadie redacta. Y ademas asi se pueden contar despues:
   si "nadie contesto" es la mitad de los fallos, eso se arregla avisando
   antes, no cambiando de motorizado.

   'espera' marca los motivos que solo valen despues de los 8 minutos.
   Quien decide si el envio se devuelve es el servidor, no esta lista. */
const MOTIVOS = [
  { cod:'NO_ANSWER',   txt:'Nadie contestó',                espera:true  },
  { cod:'NOT_THERE',   txt:'El cliente no estaba',          espera:true  },
  { cod:'REJECTED',    txt:'El cliente rechazó el pedido',  espera:false },
  { cod:'NO_ACCESS',   txt:'No me dejaron entrar',          espera:false },
  { cod:'BAD_ADDRESS', txt:'La dirección está mal',         espera:false },
  { cod:'OUR_ISSUE',   txt:'Problema mío, no pude llegar',  espera:false },
];

const Ico = ({ d, c }) => (
  <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const PIN   = "M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z";
const TEL   = "M6.6 3.5h3l1.5 3.8-2 1.4a12 12 0 0 0 5.2 5.2l1.4-2 3.8 1.5v3a1.7 1.7 0 0 1-1.9 1.7C10.6 17.6 6.4 13.4 4.9 5.4A1.7 1.7 0 0 1 6.6 3.5z";
const CHECK = "m5 12.5 4.5 4.5L19 7.5";
const MAPA  = "M9 3.6 3.6 5.9v14.5L9 18.1m0-14.5 6 2.3m-6-2.3v14.5m6-12.2 5.4-2.3v14.5L15 20.4m0-14.5v14.5m0 0-6-2.3";
const RELOJ = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2";


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
/* Una fila del recorrido que se arrastra desde el asa (≡). El arrastre sale
   solo del asa para que desplazar la lista con el dedo no mueva paradas sin
   querer. Las flechas siguen para un ajuste fino con guantes. */
const FilaOrden = ({ id, k, total, e, mover }) => {
  const controles = useDragControls();
  const p2 = e.userProfile || {};
  const dp2 = e.orderEntity.deliveryPoint || {};
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controles} className="afOrden__fila"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>
      <span className="afOrden__asa" onPointerDown={(ev) => controles.start(ev)} aria-label="Arrastrar">≡</span>
      <span className="afOrden__n">{k + 1}</span>
      <span className="afOrden__txt">
        <b>{[p2.name, p2.lastname].filter(Boolean).join(' ') || 'Cliente'}</b>
        <small>{dp2.address || 'Sin dirección'}</small>
      </span>
      <span className="afOrden__flechas">
        <button type="button" disabled={k === 0} onClick={() => mover(id, -1)}>▲</button>
        <button type="button" disabled={k === total - 1} onClick={() => mover(id, 1)}>▼</button>
      </span>
    </Reorder.Item>
  );
};

const DashboardMotorizado = () => {

  const { token, planInfo, logout } = useAuthContext();
  const navegar = useNavigate();

  const salir = () => {
    logout();
    navegar('/ingresar', { replace: true });
  };

  const [entregas, setEntregas] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(null);
  const [verMapa, setVerMapa] = useState(false);
  const [fallando, setFallando] = useState(null);
  /* Doble confirmacion al cerrar: un toque sin querer marcaba entregado y el
     cliente recibia el aviso con la comida todavia en la moto. */
  const [confirmando, setConfirmando] = useState(null); // { id, modo: 'mano' | 'recepcion' }
  // { [orderId]: horaDeLlegada } y un tic para redibujar la cuenta atras.
  const [llegadas, setLlegadas] = useState({});
  const [, setTic] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTic((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  /* Hoy o mañana.
     La ruta del dia siguiente ya esta armada la noche anterior —el reparto
     corre a las 22:30—, asi que poder verla sirve para llegar sabiendo por
     donde se empieza. Se mira, se ordena, pero no se entrega: eso es de
     mañana. */
  const [dia, setDia] = useState('hoy');
  const fecha = moment().add(dia === 'manana' ? 1 : 0, 'day').format('YYYY-MM-DD');
  const esManana = dia === 'manana';

  const cargar = () => {
    setEntregas(null);
    axios.get(`${API_URL}delivery/motorized/find-my-orders?date=${fecha}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setEntregas(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => { setEntregas([]); setError('No pudimos cargar tu ruta. Revisa tu señal e intenta de nuevo.'); });
  };

  useEffect(cargar, [token, fecha]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* Dejado en la recepcion del edificio.
     Es el desenlace mas comun en Lima y hasta ahora no existia en la pantalla:
     el motorizado dejaba la bolsa con el portero y marcaba "Entregado en
     mano". Cuando el cliente reclamaba que nunca la recibio, el registro decia
     que se la habian dado a el. Ahora cada caso queda como lo que fue, y el
     cliente recibe un aviso distinto: "esta en tu recepcion". */
  const marcarRecepcion = (orderId) => {
    setGuardando(orderId);
    setError('');
    axios.post(`${API_URL}delivery/motorized/reception-order`, [orderId], {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setEntregas((lista) => lista.map((e) =>
          e.orderEntity.id === orderId
            ? { ...e, orderEntity: { ...e.orderEntity, status: 'COMPLETED', entregadoEn: 'recepcion' } }
            : e));
      })
      .catch(() => setError('No se pudo guardar. Inténtalo otra vez.'))
      .finally(() => setGuardando(null));
  };

  /* --- Ordenar la ruta a mano ---
     El coordinador arma el reparto, pero quien sabe por donde conviene entrar,
     que edificio tiene cochera y a que hora abre cada recepcion es el que
     maneja. Aqui mueve sus paradas y el orden queda guardado: al dia siguiente
     el tablero y su pantalla arrancan con el recorrido que el dejo. */
  const [ordenando, setOrdenando] = useState(false);
  const [ordenLocal, setOrdenLocal] = useState(null);
  const [guardandoOrden, setGuardandoOrden] = useState(false);

  const abrirOrden = (lista) => { setOrdenLocal(lista.map((e) => e.orderEntity.id)); setOrdenando(true); };

  const mover = (id, paso) => setOrdenLocal((l) => {
    const i = l.indexOf(id);
    const j = i + paso;
    if (i < 0 || j < 0 || j >= l.length) return l;
    const copia = [...l];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    return copia;
  });

  const guardarOrden = () => {
    setGuardandoOrden(true);
    setError('');
    axios.post(`${API_URL}delivery/motorized/my-route/reorder`, ordenLocal, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => { setOrdenando(false); setPospuestas([]); cargar(); })
      .catch(() => setError('No pudimos guardar el orden. Revisa tu señal.'))
      .finally(() => setGuardandoOrden(false));
  };

  /* --- Sus numeros --- */
  const [numeros, setNumeros] = useState(null);
  const [verPerfil, setVerPerfil] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}delivery/motorized/my-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setNumeros(r.data?.data || r.data || null))
      .catch(() => {});
  }, [token]);

  /* Dejar una parada para el final sin cerrarla.
     Antes, un cliente que no bajaba obligaba a elegir entre esperar parado o
     marcar la entrega como fallida. Posponer no toca nada en el servidor: solo
     cambia el orden en la pantalla, para poder seguir y volver despues. */
  const [pospuestas, setPospuestas] = useState([]);
  const posponer = (orderId) => setPospuestas((l) => [...l.filter((x) => x !== orderId), orderId]);

  /* El motorizado llego al punto: arranca la espera. La hora se guarda tambien
     en el servidor, que es lo que sirve si despues hay un reclamo. */
  const marcarLlegada = (orderId) => {
    setLlegadas((l) => ({ ...l, [orderId]: Date.now() }));
    axios.post(`${API_URL}delivery/motorized/arrive-order`, { orderId }, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const segundosRestantes = (orderId) => {
    const desde = llegadas[orderId];
    if (!desde) return null;
    return Math.max(0, Math.ceil((desde + ESPERA_MIN * 60000 - Date.now()) / 1000));
  };

  /* No se pudo entregar. Antes esto no existia: el motorizado llamaba a la
     oficina y quedaba de palabra, sin rastro. */
  const marcarFallida = (orderId, motivo) => {
    setGuardando(orderId);
    setError('');
    axios.post(`${API_URL}delivery/motorized/fail-order`, { orderId, reason: motivo.cod }, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setEntregas((lista) => lista.map((e) =>
          e.orderEntity.id === orderId
            ? { ...e, orderEntity: { ...e.orderEntity, status: 'FAILED', deliveryNote: motivo.txt } }
            : e));
        setFallando(null);
      })
      .catch(() => setError('No se pudo guardar. Inténtalo otra vez.'))
      .finally(() => setGuardando(null));
  };

  /* El orden del recorrido, con lo pospuesto al final y lo cerrado despues.
     Lo que ya no hay que hacer no puede seguir ocupando el centro de la
     pantalla mientras se maneja. */
  const enOrden = useMemo(() => {
    const cerrada = (e) => ['COMPLETED','FAILED'].includes(e.orderEntity.status);
    return [...(entregas || [])].sort((a, b) => {
      const ca = cerrada(a) ? 1 : 0, cb = cerrada(b) ? 1 : 0;
      if (ca !== cb) return ca - cb;
      const pa = pospuestas.indexOf(a.orderEntity.id), pb = pospuestas.indexOf(b.orderEntity.id);
      if ((pa === -1) !== (pb === -1)) return pa === -1 ? -1 : 1;
      if (pa !== -1 && pb !== -1) return pa - pb;
      return 0;
    });
  }, [entregas, pospuestas]);

  /* El numero de cada parada es el de su lugar en la ruta y no cambia al
     entregar. Antes se numeraba por posicion en la lista —que manda lo
     entregado al final— y los numeros del mapa se corrian con cada entrega. */
  const numeroDe = useMemo(() => {
    const m = {};
    (entregas || []).forEach((e, i) => { m[e.orderEntity.id] = i + 1; });
    return m;
  }, [entregas]);

  const pendientes = useMemo(
    () => enOrden.filter((e) => !['COMPLETED','FAILED'].includes(e.orderEntity.status)),
    [enOrden]);

  /* Los tapers que tiene que cargar. Es con lo que cuadra la bolsa en cocina
     antes de salir: si le dan 22 y la pantalla dice 24, se entera ahi y no en
     la ultima puerta. */
  const tapers = (entregas || []).reduce((n, e) => n + (e.orderEntity.portions || 1), 0);

  /* Toda la ruta en Google Maps de un toque, en el orden del recorrido.
     Maps admite hasta nueve paradas intermedias; si la ruta es mas larga se
     abren las primeras y al cerrarlas el resto queda arriba. */
  const rutaEnMaps = useMemo(() => {
    const coords = pendientes
      .map((e) => e.orderEntity.deliveryPoint?.geoLocation)
      .filter((g) => g && g.latitude)
      .map((g) => `${g.latitude},${g.longitude}`);
    if (coords.length === 0) return null;
    const destino = coords[Math.min(coords.length, 10) - 1];
    const intermedias = coords.slice(0, Math.min(coords.length, 10) - 1);
    return `https://www.google.com/maps/dir/?api=1&destination=${destino}`
         + (intermedias.length ? `&waypoints=${intermedias.join('|')}` : '')
         + '&travelmode=driving';
  }, [pendientes]);
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
          <button type="button" className="afMoto__hola afMoto__hola--btn"
            onClick={() => setVerPerfil((v) => !v)}>
            {planInfo?.profile?.name ? `Hola, ${planInfo.profile.name.split(' ')[0]}` : 'Tu ruta'}
            <i className="afMoto__holaIc">{verPerfil ? '▴' : '▾'}</i>
          </button>
          <span className="afMoto__fecha">{moment(fecha).format('ddd D MMM')}</span>
        </Bloque>

        {/* Su perfil y sus numeros. Antes la pantalla se acababa con la ultima
            entrega del dia y no le quedaba nada suyo; sobre estos numeros se
            arma despues el incentivo. */}
        {verPerfil &&
          <Bloque>
            <div className="afMoto__perfil">
              <div className="afMoto__perfilCab">
                <span className="afMoto__avatar">
                  {(planInfo?.profile?.name || '?').trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <b>{[planInfo?.profile?.name, planInfo?.profile?.lastname].filter(Boolean).join(' ') || 'Motorizado'}</b>
                  <small>{planInfo?.profile?.district || planInfo?.log || 'Allpa Food'}</small>
                </div>
              </div>

              {numeros &&
                <div className="afMoto__numeros">
                  <div>
                    <b>{numeros.mes?.entregadas ?? 0}</b>
                    <span>entregas este mes</span>
                  </div>
                  <div>
                    <b>{numeros.mes?.dias ?? 0}</b>
                    <span>días en ruta</span>
                  </div>
                  <div>
                    <b>{numeros.hoy?.entregadas ?? 0}</b>
                    <span>entregas hoy</span>
                  </div>
                </div>
              }

              <p className="afMoto__perfilNota">
                Estos números son los que cuentan. Marca cada entrega apenas la
                hagas: lo que no se marca, no suma.
              </p>

              {/* Cerrar sesion no existia en esta pantalla. El motorizado entra
                  aqui y esta pantalla no tiene el menu lateral del cliente, asi
                  que el que se metia con la cuenta equivocada, o el que entraba
                  en un telefono prestado, no tenia forma de salir. */}
              {/* Borrar la sesion no alcanza: hay que sacarlo de la pantalla.
                  El guardia de rutas lee el token una sola vez al montar, asi
                  que sin navegar el motorizado se queda mirando su ruta con la
                  sesion ya cerrada y parece que el boton no hizo nada. */}
              <button type="button" className="afMoto__salir" onClick={salir}>
                Cerrar sesión
              </button>
            </div>
          </Bloque>
        }

        {/* Hoy o mañana. Se ve siempre, tambien cuando hoy ya esta cerrado:
            terminar la ruta y poder mirar la del dia siguiente es justo
            cuando sirve. */}
        <Bloque>
          <div className="afMoto__dias">
            <button type="button"
              className={!esManana ? 'afMoto__dia afMoto__dia--on' : 'afMoto__dia'}
              onClick={() => { setDia('hoy'); setOrdenando(false); setPospuestas([]); }}>
              Hoy
            </button>
            <button type="button"
              className={esManana ? 'afMoto__dia afMoto__dia--on' : 'afMoto__dia'}
              onClick={() => { setDia('manana'); setOrdenando(false); setPospuestas([]); }}>
              Mañana
            </button>
          </div>
        </Bloque>

        {/* Lo primero: cuanto falta. Es la unica pregunta que el motorizado
            trae en la cabeza al abrir la pantalla. */}
        <Bloque>
          <div className="afMoto__marcador">
            <div className="afMoto__cifra">
              <b>{esManana ? total : pendientes.length}</b>
              <span>
                {esManana
                  ? (total === 1 ? 'entrega para mañana' : 'entregas para mañana')
                  : (pendientes.length === 1 ? 'entrega por hacer' : 'entregas por hacer')}
              </span>
            </div>
            {total > 0 && !esManana &&
              <div className="afMoto__aro">
                <span>{cerradas}/{total}</span>
              </div>
            }
          </div>
        </Bloque>

        {/* Una barra que se llena: en la calle se mira de reojo, y decir
            "vas por la 3 de 5" es mas util que cualquier numero suelto. */}
        {total > 0 && !esManana &&
          <Bloque>
            <div className="afMoto__barra">
              <i style={{ width: `${(cerradas / total) * 100}%` }} />
            </div>
            <p className="afMoto__carga">
              {tapers} {tapers === 1 ? 'táper' : 'tápers'} en total
            </p>
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
              <b>{esManana ? 'Mañana todavía no tienes ruta' : 'Sin entregas asignadas para hoy'}</b>
              <p>
                {esManana
                  ? 'El reparto se arma cada noche. Vuelve más tarde y la vas a ver acá.'
                  : 'Cuando la oficina asigne tu ruta, aparecerá aquí.'}
              </p>
            </div>
          </Bloque>
        }

        {/* Toda la ruta de un toque, en el orden del recorrido. Antes habia que
            abrir Maps parada por parada, doce veces al dia. */}
        {rutaEnMaps &&
          <Bloque>
            <a className="afMoto__ruta" href={rutaEnMaps} target="_blank" rel="noreferrer">
              <Ico d={MAPA} c="afMoto__rutaIc" />
              Abrir mi ruta en Google Maps
            </a>
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
                <APIProvider apiKey={MAPS_KEY}>
                  <Map mapId={MAPS_ID} defaultCenter={centro} defaultZoom={13}
                       gestureHandling={'cooperative'} disableDefaultUI={true}
                       style={{ width:'100%', height:'100%' }}>
                    {(entregas || []).map((e, i) => {
                      const g = e.orderEntity.deliveryPoint?.geoLocation;
                      if (!g || !g.latitude) return null;
                      const listo = e.orderEntity.status === 'COMPLETED';
                      return (
                        <AdvancedMarker key={e.orderEntity.id}
                          position={{ lat: g.latitude, lng: g.longitude }}>
                          <span className={`afMoto__pin${listo ? ' afMoto__pin--listo' : ''}`}>{numeroDe[e.orderEntity.id]}</span>
                        </AdvancedMarker>
                      );
                    })}
                  </Map>
                </APIProvider>
              </div>
            }
          </Bloque>
        }

        {/* Ordenar la ruta: lista apilada y corta, con las paradas pendientes.
            Se mueve con flechas y no arrastrando: se usa de pie, con una mano
            y a veces con guantes, y un arrastre fallido deja la lista peor. */}
        {pendientes.length > 1 && !ordenando &&
          <Bloque>
            <button type="button" className="afMoto__ordenar" onClick={() => abrirOrden(pendientes)}>
              {esManana ? 'Ordenar la ruta de mañana' : 'Cambiar el orden de mi ruta'}
            </button>
          </Bloque>
        }

        {ordenando &&
          <Bloque>
            <div className="afOrden">
              <p className="afOrden__tit">Tu recorrido</p>
              <p className="afOrden__ayuda">Mantén presionado ≡ y arrastra para cambiar el orden.</p>
              <Reorder.Group axis="y" values={ordenLocal} onReorder={setOrdenLocal} className="afOrden__lista">
                {ordenLocal.map((id, k) => {
                  const e = pendientes.find((x) => x.orderEntity.id === id);
                  if (!e) return null;
                  return <FilaOrden key={id} id={id} k={k} total={ordenLocal.length} e={e} mover={mover} />;
                })}
              </Reorder.Group>

              <button type="button" className="afOrden__guardar"
                disabled={guardandoOrden} onClick={guardarOrden}>
                {guardandoOrden ? 'Guardando…' : 'Guardar este orden'}
              </button>
              <button type="button" className="afOrden__cancelar" onClick={() => setOrdenando(false)}>
                Dejarlo como estaba
              </button>
            </div>
          </Bloque>
        }

        {!ordenando && enOrden.map((e, i) => {
          const o = e.orderEntity;
          const p = e.userProfile || {};
          const dp = o.deliveryPoint || {};
          const listo = o.status === 'COMPLETED';
          const fallida = o.status === 'FAILED';
          const esSiguiente = o.id === siguiente;
          const esPospuesta = pospuestas.includes(o.id);
          const g = dp.geoLocation;
          const tel = (p.phoneNumber || '').replace(/\D/g, '');

          return (
            <Bloque key={o.id}>
              <div className={`afParada${listo ? ' afParada--listo' : ''}${fallida ? ' afParada--fallida' : ''}${esSiguiente ? ' afParada--siguiente' : ''}`}>

                {esSiguiente && !esPospuesta && <span className="afParada__toca">Tu siguiente parada</span>}
                {esPospuesta && !listo && !fallida &&
                  <span className="afParada__toca afParada__toca--espera">Para el final</span>}

                <div className="afParada__cab">
                  <span className="afParada__n">
                    {listo ? <Ico d={CHECK} c="afParada__nIc" />
                      : fallida ? '!' : numeroDe[o.id]}
                  </span>
                  <div className="afParada__quien">
                    <b>{[p.name, p.lastname].filter(Boolean).join(' ') || 'Cliente'}</b>
                    {dp.district && <small>{dp.district}</small>}
                  </div>
                  {/* Una sola parada, varios tapers. Va arriba y en grande
                      porque se lee con el casco puesto y antes de bajarse: si
                      se entera abajo, sube de nuevo a la moto.

                      Solo aparece cuando lleva mas de lo normal para ese plan:
                      quien tiene almuerzo y cena siempre lleva dos, y marcarlo
                      todos los dias haria que se deje de mirar. */}
                  {o.portions > o.portionsBase &&
                    <span className="afParada__tapers">{o.portions} tápers</span>}
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
                  {/* Llamar primero: en la calle, con casco, nadie escribe. */}
                  <a className="afParada__btn" href={`tel:+${tel || OFICINA}`}>
                    <Ico d={TEL} c="afParada__btnIc" /> {tel ? 'Llamar' : 'Oficina'}
                  </a>
                  {tel &&
                    <a className="afParada__btn"
                       href={`https://wa.me/${tel}`}
                       target="_blank" rel="noreferrer">
                      <Ico d={TEL} c="afParada__btnIc" /> WhatsApp
                    </a>
                  }
                </div>

                {/* Mañana no se entrega: los botones de cierre no salen.
                    Marcar hoy una entrega de mañana no es un error que se
                    pueda deshacer desde la calle. */}
                {esManana &&
                  <p className="afParada__futuro">Para mañana · aún no se entrega</p>
                }

                {!esManana && !listo && !fallida && confirmando?.id === o.id &&
                  <div className="afParada__confirma">
                    <p className="afParada__confirmaT">
                      {confirmando.modo === 'mano'
                        ? `¿Ya le entregaste el pedido a ${p.name || 'el cliente'}?`
                        : '¿Ya lo dejaste en recepción?'}
                    </p>
                    <small>Le avisamos al cliente apenas confirmes.</small>
                    <motion.button type="button" className="afParada__hecho"
                      disabled={guardando === o.id}
                      onClick={() => {
                        const modo = confirmando.modo;
                        setConfirmando(null);
                        if (modo === 'mano') marcarEntregado(o.id); else marcarRecepcion(o.id);
                      }} {...alToque}>
                      {guardando === o.id ? 'Guardando…' : 'Sí, ya lo entregué'}
                    </motion.button>
                    <button type="button" className="afParada__cancelar" onClick={() => setConfirmando(null)}>
                      No, todavía no
                    </button>
                  </div>
                }

                {!esManana && !listo && !fallida && fallando !== o.id && confirmando?.id !== o.id &&
                  <>
                    {/* Dos desenlaces distintos, no uno.
                        "En mano" y "en recepcion" no son lo mismo cuando el
                        cliente reclama, y el aviso que recibe tampoco: uno
                        dice que ya lo tiene, el otro que baje a buscarlo. */}
                    <motion.button type="button" className="afParada__hecho"
                      disabled={guardando === o.id}
                      onClick={() => setConfirmando({ id: o.id, modo: 'mano' })} {...alToque}>
                      {guardando === o.id ? 'Guardando…' : 'Se lo di en mano'}
                    </motion.button>

                    <motion.button type="button" className="afParada__recepcion"
                      disabled={guardando === o.id}
                      onClick={() => setConfirmando({ id: o.id, modo: 'recepcion' })} {...alToque}>
                      Lo dejé en recepción
                    </motion.button>

                    {/* La espera de 8 minutos, cronometrada. Marcar la llegada
                        deja la hora registrada: si despues el cliente reclama
                        que nadie toco, hay con que responder. */}
                    {llegadas[o.id] === undefined ?
                      <button type="button" className="afParada__llegue"
                        onClick={() => marcarLlegada(o.id)}>
                        Llegué — empezar los {ESPERA_MIN} min
                      </button>
                    :
                      <div className="afParada__espera">
                        {segundosRestantes(o.id) > 0 ?
                          <>
                            <span className="afParada__reloj">
                              {String(Math.floor(segundosRestantes(o.id) / 60)).padStart(2,'0')}
                              :{String(segundosRestantes(o.id) % 60).padStart(2,'0')}
                            </span>
                            <span className="afParada__esperaT">Esperando al cliente</span>
                          </>
                        :
                          <span className="afParada__esperaOk">
                            Esperaste los {ESPERA_MIN} minutos
                          </span>
                        }
                      </div>
                    }

                    {/* Dejarla para el final sin cerrarla. Antes, un cliente
                        que no bajaba obligaba a elegir entre esperar parado o
                        darla por fallida. */}
                    {!esPospuesta &&
                      <button type="button" className="afParada__despues"
                        onClick={() => posponer(o.id)}>
                        <Ico d={RELOJ} c="afParada__despuesIc" /> Vuelvo después
                      </button>
                    }

                    <button type="button" className="afParada__nope"
                      onClick={() => setFallando(o.id)}>
                      No pude entregar
                    </button>
                  </>
                }

                {/* El motivo se elige, no se escribe: en la calle nadie redacta. */}
                {!esManana && fallando === o.id &&
                  <div className="afParada__motivos">
                    <p className="afParada__motivosT">¿Qué pasó?</p>
                    {MOTIVOS.map((m) => {
                      // Los motivos de espera solo se habilitan cumplidos los
                      // 8 minutos: es la politica, y asi no depende de que el
                      // motorizado se acuerde.
                      const falta = m.espera && segundosRestantes(o.id) !== 0;
                      return (
                        <button type="button" key={m.cod}
                          className={`afParada__motivo${falta ? ' afParada__motivo--bloq' : ''}`}
                          disabled={falta || guardando === o.id}
                          onClick={() => marcarFallida(o.id, m)}>
                          {m.txt}
                          {falta &&
                            <small>
                              {llegadas[o.id] === undefined
                                ? `Marca "Llegué" y espera ${ESPERA_MIN} min`
                                : `Faltan ${Math.ceil(segundosRestantes(o.id) / 60)} min de espera`}
                            </small>
                          }
                        </button>
                      );
                    })}
                    <button type="button" className="afParada__cancelar"
                      onClick={() => setFallando(null)}>
                      Volver
                    </button>
                  </div>
                }

                {listo &&
                  <p className="afParada__ok">
                    {o.entregadoEn === 'recepcion' ? 'Dejado en recepción' : 'Entregado'}
                  </p>}
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
