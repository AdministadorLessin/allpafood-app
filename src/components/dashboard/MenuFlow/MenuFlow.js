import React, { useEffect, useMemo, useState } from "react";
import FotoPlato from '../../ultil/FotoPlato';
import axios from 'axios';
import { REPARTO } from '../PedidoDeHoy/PedidoDeHoy';
import moment from 'moment';
import Skeleton from '@mui/material/Skeleton';

import './MenuFlow.scss';
import { useAuthContext } from './../../../context/authContext';
import { HORA_LIMITE, HORA_LIMITE_TEXTO, tiempoRestante } from './../StatusBanner/estadoPlan';
import { Cascada, Bloque, BarraAnimada, motion, alToque } from './../../ultil/Motion/Motion';
import FranjaEmpresa from './../../empresa/FranjaEmpresa/FranjaEmpresa';
import { API_URL } from '../../../config';
import { Link } from 'react-router-dom';

const baseUrl = `${API_URL}`;

const Ico = ({ d, c }) => (
  <svg className={c || 'afIc'} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const PIN = "M12 21.2s6.4-6.2 6.4-11a6.4 6.4 0 1 0-12.8 0c0 4.8 6.4 11 6.4 11Z";

const prop = (menu, nombre) =>
  menu?.properties?.find((p) => p.name === nombre)?.value ?? 0;

/**
 * Elegir el menu, en tres pasos.
 *
 * Reemplaza el programador de una sola pantalla, que mostraba a la vez el
 * selector de dias, las pestañas de comidas, la lista de platos y el resumen.
 *
 * Lo importante: la direccion se elige POR DIA. El campo deliveryPointId ya
 * viajaba por pedido y tbl_order ya lo guarda —es de donde sale la ruta—, pero
 * la pantalla anterior aplicaba una sola direccion a toda la semana.
 */
const MenuFlow = ({ plan, alTerminar }) => {

  const { token, empresa } = useAuthContext();

  const [paso, setPaso] = useState(1);
  const [dias, setDias] = useState(null);
  /* El menu de la semana INCLUYENDO los dias ya pedidos. Hace falta para poder
     cambiar el plato de un dia programado: la lista de arriba los excluye a
     proposito, porque sirve para elegir lo que falta. */
  const [diasTodos, setDiasTodos] = useState([]);
  /* El pedido que se esta editando. Cuando esta puesto, guardar hace un PUT
     sobre ese pedido en vez de crear uno nuevo. */
  const [editando, setEditando] = useState(null);

  /* "Me voy de viaje". Sin esto, el cliente que no elegia nada creyendo que
     asi no le llegaba comida se encontraba la semana armada por el proceso
     del domingo —con sus envios descontados— y reclamaba con razon. */
  const [pausas, setPausas] = useState([]);
  const [pausando, setPausando] = useState(false);
  const [viaje, setViaje] = useState({ desde: '', hasta: '' });
  const [guardandoPausa, setGuardandoPausa] = useState(false);
  const [avisoPausa, setAvisoPausa] = useState('');
  // Lo que el cliente YA pidio. El endpoint de menus excluye esos dias, asi que
  // sin esto la pantalla decia "no hay dias para elegir" y nada mas: el cliente
  // no veia lo que habia pedido ni podia cambiarlo.
  const [pedidos, setPedidos] = useState([]);
  const [diaAbierto, setDiaAbierto] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  /* Dias que el cliente reprogramo: su pedido se cancelo y el envio volvio al
     saldo. Se muestran con nombre propio para que no crea que se "perdio" el
     pedido ni que le va a llegar igual. */
  const [reprogramados, setReprogramados] = useState([]);
  const [confirmando, setConfirmando] = useState(null);
  const [avisoReprog, setAvisoReprog] = useState('');
  const [guardandoDir, setGuardandoDir] = useState(false);
  const [puntos, setPuntos] = useState([]);
  /* { fecha: { menus: { comida: { menuId: cantidad } }, puntoId } }
     La cantidad existe porque hay clientes que piden dos o tres almuerzos el
     mismo dia, casi siempre el viernes. Cada porcion gasta un envio del plan,
     y pueden ser del mismo plato o de platos distintos. */
  /* Se guarda en la sesion del navegador porque desde aqui se puede salir a
     Mis direcciones a crear un lugar nuevo. Sin esto, el que iba a agregar su
     oficina volvia y encontraba la semana en blanco. */
  const [seleccion, setSeleccion] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('af_menu_sel') || '{}'); }
    catch (e) { return {}; }
  });
  const [diaActivo, setDiaActivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try { sessionStorage.setItem('af_menu_sel', JSON.stringify(seleccion)); }
    catch (e) { /* modo privado: no es critico, solo se pierde al navegar */ }
  }, [seleccion]);

  /* Aviso al cerrar con una eleccion sin confirmar.
     El domingo 27, 59 clientes abrieron el menu y solo 42 confirmaron: 17
     eligieron sus platos, se salieron creyendo que ya estaba pedido, y esa
     noche el automatico les armo la semana con el plato del dia. Desde su
     lado habian elegido; desde el nuestro no habia llegado nada. */
  const hayPendiente = Object.keys(seleccion).length > 0;
  useEffect(() => {
    if (!hayPendiente) return;
    const avisar = (e) => { e.preventDefault(); e.returnValue = ''; return ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [hayPendiente]);

  useEffect(() => {
    if (!diasTodos.length) return;
    const vigentes = new Set(diasTodos.map((d) => d.localDate));
    setSeleccion((s) => {
      const limpio = Object.fromEntries(
        Object.entries(s).filter(([fecha]) => vigentes.has(fecha)));
      return Object.keys(limpio).length === Object.keys(s).length ? s : limpio;
    });
  }, [diasTodos]);

  const desde = useMemo(() => {
    const ahora = moment();
    return ahora.clone().add(ahora.hour() >= HORA_LIMITE ? 2 : 1, 'days').format('YYYY-MM-DD');
  }, []);

  useEffect(() => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };

    axios.get(`${baseUrl}dashboard/menus?initDate=${desde}`, cab)
      .then((r) => setDias(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => { setDias([]); setError('No pudimos cargar el menú. Vuelve a intentarlo.'); });

    axios.get(`${baseUrl}dashboard/menus?initDate=${desde}&incluirPedidos=true`, cab)
      .then((r) => setDiasTodos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setDiasTodos([]));

    axios.get(`${baseUrl}dashboard/orders`, cab)
      .then((r) => setPedidos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setPedidos([]));

    axios.get(`${baseUrl}plan/pause`, cab)
      .then((r) => setPausas(Array.isArray(r.data?.data) ? r.data.data : (r.data || [])))
      .catch(() => setPausas([]));

    axios.get(`${baseUrl}order/reprogramados`, cab)
      .then((r) => setReprogramados(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
      .catch(() => setReprogramados([]));

    axios.get(`${baseUrl}delivery/find/points`, cab)
      .then((r) => {
        const lista = Array.isArray(r.data.data) ? r.data.data : [];
        setPuntos(lista);
      })
      .catch(() => setPuntos([]));
  }, [token, desde]);

  /* Que comidas trae el plan. Fitfuel da almuerzo Y cena, y el servidor
     exige un plato por cada una: isMenuSelectedValid rechaza el pedido si
     menuTypeIds.size() != principalBenefits.size(). Antes esto asumia
     'lunch' siempre, asi que quien compraba Fitfuel —el plan mas caro— no
     podia programar un solo dia. */
  const comidas = useMemo(() => {
    const b = plan?.consumption?.principalBenefits;
    const lista = Array.isArray(b) && b.length ? b : ['lunch'];
    // El almuerzo primero: es como el cliente piensa el dia.
    return [...lista].sort((a) => (a === 'lunch' ? -1 : 1));
  }, [plan]);

  const NOMBRE_COMIDA = { lunch: 'almuerzo', dinner: 'cena', breakfast: 'desayuno' };

  const platosDe = (dia, tipo) =>
    dia?.menuTypeGroups?.find((g) => g.type === tipo)?.menuTypes ?? [];

  /** Cuantas porciones de ese plato lleva ese dia. */
  const cantidadDe = (fecha, comida, menuId) =>
    seleccion[fecha]?.menus?.[comida]?.[menuId] || 0;

  /** Cuantas porciones de esa comida lleva ese dia, sumando platos distintos. */
  const totalDe = (fecha, comida) =>
    Object.values(seleccion[fecha]?.menus?.[comida] || {}).reduce((a, b) => a + b, 0);

  /**
   * Un dia esta listo cuando todas las comidas del plan tienen la MISMA
   * cantidad de porciones, y al menos una.
   *
   * Con un solo principal —el caso de casi todos— es simplemente "elegiste
   * algo". Con almuerzo y cena tienen que ir parejos: pedir dos almuerzos y
   * una cena dejaria media racion suelta en cocina y en la bolsa, y el envio
   * extra que se cobra no corresponderia a un dia completo del plan.
   */
  const diaCompleto = (fecha) => {
    const totales = comidas.map((c) => totalDe(fecha, c));
    return totales.every((n) => n > 0) && new Set(totales).size === 1;
  };

  /* Los dias marcados "no recibo" se descartan aunque tengan plato elegido.
     El cliente reprogramaba jueves y viernes, apretaba "Revisar y confirmar" y
     ahi seguian los dos platos esperando confirmacion: la eleccion vieja se
     quedaba guardada y el resumen la contaba igual. Confirmar habria vuelto a
     pedir —y a cobrar— los dos dias que acababa de cancelar. */
  const elegidos = Object.keys(seleccion).filter(diaCompleto);

  /* Dias con algo elegido pero incompleto: el plan trae almuerzo y cena y
     solo se marco uno de los dos. No cuentan para confirmar, pero el cliente
     tiene que saber que estan ahi o no entiende por que no puede seguir. */
  const aMedias = Object.keys(seleccion).filter((f) => !diaCompleto(f)
    && comidas.some((c) => totalDe(f, c) > 0));

  /**
   * Los envios que gasta todo lo elegido.
   *
   * Un envio es un DIA del plan, no un plato: quien tiene almuerzo y cena
   * gasta un envio por dia, no dos. Solo suma de mas quien pide porciones
   * extra, y suma el de la comida que mas repitio —dos almuerzos y una cena
   * son dos envios: el dia completo y un almuerzo suelto—.
   */
  const enviosDe = (fecha) =>
    Math.max(...comidas.map((c) => totalDe(fecha, c)), 0);

  /** Las comidas del plan que no estan parejas con el resto. */
  const desparejas = (fecha) => {
    const totales = comidas.map((c) => totalDe(fecha, c));
    const tope = Math.max(...totales, 0);
    return comidas.filter((c, i) => totales[i] < tope);
  };

  const enviosElegidos = elegidos.reduce((suma, f) => suma + enviosDe(f), 0);

  /* Cuantos envios le quedan. El servidor tambien lo valida, pero rebotar la
     semana entera al final —despues de elegir cinco dias— es la peor forma de
     enterarse. */
  const envios = plan?.consumption?.orders;
  const enviosRestantes = envios && Number.isFinite(envios.total) && Number.isFinite(envios.consumed)
    ? envios.total - envios.consumed
    : null;
  const seExcede = enviosRestantes !== null && enviosElegidos > enviosRestantes;
  const restan = tiempoRestante();

  /* ---------- guardar ---------- */
  const confirmar = () => {
    setEnviando(true);
    setError('');

    const pedidos = elegidos.map((fecha) => {
      const s = seleccion[fecha];
      /* El id repetido tantas veces como porciones: asi viaja la cantidad.
         Dos almuerzos del mismo plato son el mismo id dos veces; dos platos
         distintos, dos ids. El servidor cobra un envio por cada uno. */
      const menuTypeIds = comidas.flatMap((c) =>
        Object.entries(s.menus?.[c] || {}).flatMap(
          ([menuId, cantidad]) => Array(cantidad).fill(Number(menuId))));
      const base = { scheduleDate: fecha, menuTypeIds };
      // Solo se manda si el cliente eligio una: el backend conserva la
      // direccion anterior cuando llega nula.
      return s.puntoId ? { ...base, deliveryPointId: s.puntoId } : base;
    });

    axios.post(`${baseUrl}order/scheduled`, pedidos, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setEnviando(false);
        setSeleccion({});
        alTerminar && alTerminar();
      })
      .catch((e) => {
        setEnviando(false);
        setError(e?.response?.data?.message || 'No pudimos guardar tu semana. Vuelve a intentarlo.');
      });
  };

  const recargar = () => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(`${baseUrl}dashboard/orders`, cab)
      .then((r) => setPedidos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => {});
    axios.get(`${baseUrl}dashboard/menus?initDate=${desde}`, cab)
      .then((r) => setDias(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => {});
    axios.get(`${baseUrl}dashboard/menus?initDate=${desde}&incluirPedidos=true`, cab)
      .then((r) => setDiasTodos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => {});
    axios.get(`${baseUrl}order/reprogramados`, cab)
      .then((r) => setReprogramados(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
      .catch(() => {});
  };

  /**
   * Cambia a que direccion va un dia ya pedido.
   *
   * Es lo unico que los clientes cambian de verdad —se mueven—, asi que no se
   * ofrece cambiar el plato aunque el endpoint lo permita.
   *
   * menuTypeIds va con los mismos platos: el servidor valida que el menu siga
   * siendo valido para ese dia, y omitirlos haria fallar la peticion.
   */
  const cambiarDireccion = (pedido, puntoId) => {
    setGuardandoDir(true);
    setError('');
    /* Solo los platos del plan: la bebida viaja en el pedido guardado pero no
       se elige, y mandarla hacia que el servidor contara una porcion de mas. */
    const menuTypeIds = (pedido.items || [])
      .filter((i) => comidas.includes(i.type))
      .map((i) => i.id)
      .filter(Boolean);

    axios.put(`${baseUrl}order/scheduled`, {
      orderId: pedido.id,
      menuTypeIds,
      deliveryPointId: puntoId,
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setDiaAbierto((d) => (d ? { ...d, deliveryPointId: puntoId } : d));
        recargar();
      })
      .catch((e) => setError(
        e?.response?.data?.message || 'No pudimos cambiar la dirección de este día.'))
      .finally(() => setGuardandoDir(false));
  };

  /**
   * Abre el dia ya pedido en la pantalla de platos, con lo que pidio marcado.
   *
   * Hasta ahora, un dia programado solo se podia cancelar entero y volver a
   * pedirlo. Eso bastaba mientras el cliente elegia siempre, pero desde que la
   * semana puede venir armada por defecto —el domingo por la noche, o cuando
   * operaciones la prepara— el plato que aparece no lo eligio el, y cancelar
   * para volver a pedir es un rodeo que ademas le mueve el consumo.
   */
  const editarPlatos = (pedido) => {
    const dia = diasTodos.find((d) => d.localDate === pedido.date);
    if (!dia) {
      setError('El menú de ese día ya no está disponible para cambios.');
      return;
    }

    /* Se precarga lo que pidio, repetidos incluidos: si tenia dos almuerzos,
       la pantalla se abre con dos. */
    const menus = {};
    comidas.forEach((c) => { menus[c] = {}; });
    (pedido.items || []).forEach((i) => {
      if (!i?.id || !comidas.includes(i.type)) return;
      menus[i.type][i.id] = (menus[i.type][i.id] || 0) + 1;
    });

    setError('');
    setSeleccion((s) => ({ ...s, [pedido.date]: { menus, puntoId: pedido.deliveryPointId } }));
    setEditando(pedido);
    setDiaAbierto(null);
    setDiaActivo(pedido.date);
    setPaso(2);
  };

  const cargarPausas = () => {
    axios.get(`${baseUrl}plan/pause`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setPausas(Array.isArray(r.data?.data) ? r.data.data : (r.data || [])))
      .catch(() => {});
  };

  const guardarViaje = () => {
    if (!viaje.desde || !viaje.hasta) { setError('Elige desde cuándo y hasta cuándo.'); return; }

    setGuardandoPausa(true);
    setError('');
    setAvisoPausa('');

    axios.post(`${baseUrl}plan/pause`, { desde: viaje.desde, hasta: viaje.hasta },
      { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const d = r.data?.data || r.data || {};
        /* Se le dice exactamente que paso con sus envios y con su
           vencimiento: es lo que la gente pregunta despues por WhatsApp. */
        const partes = [];
        if (d.enviosDevueltos > 0)
          partes.push(`Te devolvimos ${d.enviosDevueltos} ${d.enviosDevueltos === 1 ? 'envío' : 'envíos'} que ya estaban programados.`);
        if (d.diasAgregados > 0)
          partes.push(`Tu plan vence ${d.diasAgregados} ${d.diasAgregados === 1 ? 'día' : 'días'} más tarde.`);
        setAvisoPausa(partes.join(' ') || 'Listo, no te enviamos nada esos días.');
        setPausando(false);
        setViaje({ desde: '', hasta: '' });
        cargarPausas();
        recargar();
      })
      .catch((e) => setError(e?.response?.data?.message || 'No pudimos guardar tu viaje.'))
      .finally(() => setGuardandoPausa(false));
  };

  const volviAntes = (pausaId) => {
    axios.delete(`${baseUrl}plan/pause/${pausaId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { setAvisoPausa('Listo, volvemos a prepararte tus días.'); cargarPausas(); recargar(); })
      .catch(() => setError('No pudimos reactivar tu plan.'));
  };

  /**
   * Saca el dia de la seleccion al terminar de editarlo.
   *
   * Si se quedara, ese dia contaria como "elegido" en la pantalla de la semana
   * y "Confirmar mi semana" intentaria crearlo de nuevo: el servidor lo
   * rechazaria por duplicado y el cliente veria un error por algo que ya
   * estaba bien guardado.
   */
  const salirDeEdicion = (fecha) => {
    setSeleccion((s) => {
      const resto = { ...s };
      delete resto[fecha];
      return resto;
    });
    setEditando(null);
    setPaso(1);
  };

  /** Guarda el cambio de platos de un dia ya programado. */
  const guardarPlatos = () => {
    const s = seleccion[diaActivo];
    const menuTypeIds = comidas.flatMap((c) =>
      Object.entries(s?.menus?.[c] || {}).flatMap(
        ([menuId, cantidad]) => Array(cantidad).fill(Number(menuId))));

    setEnviando(true);
    setError('');

    axios.put(`${baseUrl}order/scheduled`, {
      orderId: editando.id,
      menuTypeIds,
      deliveryPointId: s?.puntoId,
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        salirDeEdicion(diaActivo);
        recargar();
      })
      .catch((e) => setError(
        e?.response?.data?.message || 'No pudimos cambiar tu plato. Vuelve a intentarlo.'))
      .finally(() => setEnviando(false));
  };

  // Cancelar devuelve el envio al saldo: el backend descuenta uno del consumo.
  // Solo se puede hasta las 22:00 del dia anterior, la misma regla que aplica
  // al programar; pasada esa hora el servidor responde con su motivo.
  const reprogramarDia = (pedido) => {
    setCancelando(true);
    setError('');
    setAvisoReprog('');
    axios.post(`${baseUrl}order/reprogram?orderId=${pedido.id}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setAvisoReprog(`Listo: el ${moment(pedido.date).format('dddd D')} no te llega nada. `
          + 'Tu envío volvió a tu saldo y puedes usarlo otro día.');
        /* Igual que en "No lo quiero": si quedaba una eleccion a medias para
           ese dia, se va con el pedido. */
        setSeleccion((sel) => {
          const limpio = { ...sel };
          delete limpio[moment(pedido.date).format('YYYY-MM-DD')];
          return limpio;
        });
        setConfirmando(null);
        setDiaAbierto(null);
        recargar();
      })
      .catch((e) => setError(
        e?.response?.data?.message || 'No pudimos reprogramar este día. Vuelve a intentarlo.'))
      .finally(() => setCancelando(false));
  };

  /* "No quiero este dia" sobre un dia sin pedido. Quien entra por primera
     vez ve toda la semana por elegir y cree que tiene que pedir todos los
     dias; esto le deja decir que no a uno sin gastar nada de su plan. */
  const marcarSinEnvio = (fecha) => {
    setCancelando(true);
    setError('');
    setAvisoReprog('');
    axios.post(`${baseUrl}order/sin-envio?fecha=${fecha}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setSeleccion((s) => { const r = { ...s }; delete r[fecha]; return r; });
        setAvisoReprog(`Listo: el ${moment(fecha).format('dddd D')} no te llega nada y no se descuenta de tu plan.`);
        setPaso(1);
        recargar();
      })
      .catch((e) => setError(e?.response?.data?.message || 'No pudimos guardar. Vuelve a intentarlo.'))
      .finally(() => setCancelando(false));
  };

  /* Mismo plazo que para elegir: hasta las 22:00 de la vispera. */
  const sePuedeCambiar = (o) => {
    if (['C', 'F', 'X'].includes(o.status)) return false;
    const limite = moment(o.date).subtract(1, 'day').startOf('day').hour(HORA_LIMITE);
    return moment().isBefore(limite);
  };

  const esReprogramado = (fecha) =>
    reprogramados.some((r) => moment(r).format('YYYY-MM-DD') === moment(fecha).format('YYYY-MM-DD'));

  /* Una fila por dia pedido: tocarla abre el detalle; "Reprogramar" a un lado,
     con confirmacion en la misma fila para que no se cancele de un toque. */
  const filaPedido = (o) => {
    const punto = puntos.find((x) => x.id === o.deliveryPointId);
    const platos = (o.items || []).map((i) => i?.menu?.name).filter(Boolean).join(' · ');
    const abierto = sePuedeCambiar(o);

    if (confirmando === o.id) {
      return (
        <div className="afPedidoFila afPedidoFila--confirmar" key={o.id}>
          <span className="afPedidoFila__txt">
            <b>¿Reprogramar el {moment(o.date).format('dddd D')}?</b>
            <small>Ese día no te llega nada y el envío vuelve a tu saldo.</small>
          </span>
          <span className="afPedidoFila__acciones">
            <button type="button" className="afMenu__mini afMenu__mini--si"
              disabled={cancelando} onClick={() => reprogramarDia(o)}>
              {cancelando ? '…' : 'Sí'}
            </button>
            <button type="button" className="afMenu__mini" onClick={() => setConfirmando(null)}>
              No
            </button>
          </span>
        </div>
      );
    }

    return (
      <div className="afPedidoFila" key={o.id}>
        <motion.button type="button" className="afPedidoFila__abrir"
          onClick={() => { setError(''); setDiaAbierto(o); }} {...alToque}>
          <span className="afPedidoFila__txt">
            <b>{moment(o.date).format('dddd D')}</b>
            <small>{platos}{punto ? ` · ${punto.name || punto.address}` : ''}</small>
          </span>
        </motion.button>
        {abierto
          ? <button type="button" className="afMenu__mini"
              onClick={() => { setError(''); setAvisoReprog(''); setConfirmando(o.id); }}>
              Reprogramar
            </button>
          : <span className="afPedidoFila__ir">›</span>}
      </div>
    );
  };

  const tarjetaReprogramados = reprogramados.length > 0 && (
    <Bloque>
      <div className="afCard">
        <div className="afCard__head"><span className="afCard__title">Reprogramaste</span></div>
        {reprogramados.map((f) => (
          <div className="afSrow" key={f}>
            <span>{moment(f).format('dddd D')}</span>
            <b className="afMenu__cancelado">Cancelado · envío devuelto</b>
          </div>
        ))}
      </div>
    </Bloque>
  );

  /* "Me voy de viaje" va a un lado y al final: lo del dia a dia es
     reprogramar un dia puntual, el viaje es para rangos largos. */
  const viajeUI = (
        <Bloque>
          {!pausando ?
            <button type="button" className="afMenu__viaje" onClick={() => { setPausando(true); setAvisoPausa(''); }}>
              Me voy de viaje
            </button>
          :
            <div className="afCard">
              <div className="afCard__head"><span className="afCard__title">¿Qué días no estarás?</span></div>
              <p className="afMenu__nota afMenu__nota--suelta">
                No te preparamos nada esos días, te devolvemos los envíos que ya
                estuvieran programados y tu plan vence más tarde.
              </p>
              <div className="afViaje">
                <label>
                  Desde
                  <input type="date" value={viaje.desde}
                    min={moment().add(1, 'day').format('YYYY-MM-DD')}
                    onChange={(e) => setViaje((v) => ({ ...v, desde: e.target.value }))} />
                </label>
                <label>
                  Hasta
                  <input type="date" value={viaje.hasta}
                    min={viaje.desde || moment().add(1, 'day').format('YYYY-MM-DD')}
                    onChange={(e) => setViaje((v) => ({ ...v, hasta: e.target.value }))} />
                </label>
              </div>
              <motion.button type="button" className="afBtn afBtn--mint"
                disabled={guardandoPausa} onClick={guardarViaje} {...alToque}>
                {guardandoPausa ? 'Guardando…' : 'Avisar mi viaje'}
              </motion.button>
              <button type="button" className="afBtn afBtn--fantasma" onClick={() => setPausando(false)}>
                Volver
              </button>
            </div>
          }
        </Bloque>
  );

  if (dias === null) {
    return (
      <div className="afPanel">
        <Skeleton variant="text" width="60%" height={38} />
        <Skeleton variant="rounded" height={110} sx={{ borderRadius: '20px', mt: 2 }} />
        <Skeleton variant="rounded" height={70} sx={{ borderRadius: '18px', mt: 1.5 }} />
      </div>
    );
  }

  /* ---------- detalle de un dia ya pedido ---------- */
  if (diaAbierto) {
    const punto = puntos.find((x) => x.id === diaAbierto.deliveryPointId);

    /* Los platos con su comida delante y no todos pegados con puntos.
       Un cliente de almuerzo y cena veia el mismo nombre dos veces seguidas
       —el menu del dia es el mismo para las dos— y parecia un error del
       sistema en vez de su almuerzo y su cena. */
    const porTipo = [];
    (diaAbierto.items || []).forEach((i) => {
      if (!i?.menu?.name) return;
      porTipo.push({ tipo: i.type, nombre: i.menu.name });
    });
    const ORDEN = ['lunch', 'dinner', 'breakfast', 'snacks', 'drinks'];
    porTipo.sort((a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo));

    /* Cerrado se mide por la HORA, no por si el pedido ya tiene motorizado.
       Asignar la ruta es trabajo interno y ocurre la noche anterior: cuando
       eso marcaba el pedido, el cliente abria el lunes desde el sabado y leia
       que ya habia salido de cocina. La regla real es la misma que para
       pedir: hasta las 22:00 del dia anterior. */
    const limite = moment(diaAbierto.date).subtract(1, 'day').startOf('day').hour(HORA_LIMITE);
    const finalizado = ['C', 'F', 'X'].includes(diaAbierto.status);
    const cerrado = finalizado || moment().isSameOrAfter(limite);

    return (
      <Cascada className="afPanel">
        <Bloque>
          <button type="button" className="afVolver" onClick={() => setDiaAbierto(null)}>
            ← Tu semana
          </button>
        </Bloque>
        <Bloque>
          <h1 className="afPanel__titular">{moment(diaAbierto.date).format('dddd D')}</h1>
        </Bloque>
        <Bloque>
          <p className="afMenu__ayuda">
            Llega entre las {REPARTO.desde} y la {REPARTO.hasta}
          </p>
        </Bloque>

        <Bloque>
          <div className="afCard">
            <div className="afCard__head"><span className="afCard__title">Lo que pediste</span></div>
            {porTipo.length === 0 &&
              <div className="afSrow"><span>Plato</span><b>—</b></div>}
            {porTipo.map((p, i) => (
              <div className="afSrow" key={i}>
                <span>{NOMBRE_COMIDA[p.tipo] ? NOMBRE_COMIDA[p.tipo].charAt(0).toUpperCase() + NOMBRE_COMIDA[p.tipo].slice(1) : (p.tipo === 'drinks' ? 'Bebida' : p.tipo === 'snacks' ? 'Snack' : 'Plato')}</span>
                <b>{p.nombre}</b>
              </div>
            ))}
            {punto &&
              <div className="afSrow">
                <span>Entrega</span>
                <span className="afTag"><Ico d={PIN} c="afTag__ic" />{punto.name || punto.address}</span>
              </div>}
          </div>
        </Bloque>

        {error && <Bloque><p className="afMenu__error">{error}</p></Bloque>}

        {cerrado ?
          <Bloque>
            <div className="afCard">
              <p className="afMenu__nota afMenu__nota--suelta">
                {finalizado
                  ? 'Este pedido ya se cerró y no se puede cambiar.'
                  : `Se cerró ayer a las ${HORA_LIMITE_TEXTO} Para cambios, escríbenos.`}
              </p>
            </div>
          </Bloque>
        :
          <>
            {/* Primero de todo: es lo que viene a hacer quien abre un dia que
                no eligio el. La direccion y la cancelacion quedan debajo. */}
            <Bloque>
              <motion.button type="button" className="afBtn afBtn--mint"
                onClick={() => editarPlatos(diaAbierto)} {...alToque}>
                Cambiar mi plato
              </motion.button>
            </Bloque>

            {puntos.length > 1 &&
              <>
                <Bloque><p className="afMenu__label">Cambiar a otra dirección</p></Bloque>
                {puntos.map((d) => (
                  <Bloque key={d.id}>
                    <motion.button type="button"
                      className={`afDir${diaAbierto.deliveryPointId === d.id ? ' afDir--sel' : ''}`}
                      onClick={() => diaAbierto.deliveryPointId !== d.id && cambiarDireccion(diaAbierto, d.id)}
                      disabled={guardandoDir} {...alToque}>
                      <span className="afDir__ico"><Ico d={PIN} /></span>
                      <span className="afDir__txt">
                        <b>{d.name || d.address}</b>
                        <small>{d.name ? d.address : d.description}</small>
                      </span>
                      <span className="afPlato__tick" />
                    </motion.button>
                  </Bloque>
                ))}
                <Bloque>
                  <p className="afMenu__nota">
                    {guardandoDir ? 'Guardando…' : 'El cambio se guarda al tocar.'}
                  </p>
                </Bloque>
              </>
            }

            <Bloque>
              <div className="afCard">
                <p className="afMenu__nota afMenu__nota--suelta">
                  Si reprogramas, ese día no te llega nada y tu envío vuelve al saldo
                  para que lo uses otro día. No se pierde.
                </p>
              </div>
            </Bloque>
            <Bloque>
              <motion.button type="button" className="afBtn afBtn--fantasma"
                onClick={() => reprogramarDia(diaAbierto)} disabled={cancelando} {...alToque}>
                {cancelando ? 'Reprogramando…' : 'Reprogramar este día'}
              </motion.button>
            </Bloque>
          </>
        }
      </Cascada>
    );
  }

  /* ---------- la semana: lo pedido y lo que falta ---------- */
  /* La pantalla de "semana completa" NO puede adelantarse a la edicion.
     Quien esta cambiando el plato de un dia ya pedido tiene, por definicion,
     ese dia fuera de la lista de dias por elegir; con la semana entera pedida
     esa lista queda vacia y este corte se llevaba por delante al paso 2: el
     cliente tocaba "Cambiar mi plato", la pantalla volvia a "Tu semana esta
     completa" y parecia que el boton no hacia nada. */
  if (dias.length === 0 && !editando) {
    return (
      <Cascada className="afPanel">
        <Bloque><h1 className="afPanel__titular">Tu semana está completa</h1></Bloque>
        <Bloque>
          <p className="afMenu__ayuda">
            Ya elegiste todos los días disponibles. Los viernes publicamos el menú
            de la próxima semana y te avisamos.
          </p>
        </Bloque>

        {error && <Bloque><p className="afMenu__error">{error}</p></Bloque>}
        {avisoPausa && <Bloque><p className="afMenu__ok">{avisoPausa}</p></Bloque>}
        {avisoReprog && <Bloque><p className="afMenu__ok">{avisoReprog}</p></Bloque>}

        {/* Tambien aqui: quien tiene la semana entera pedida es justo quien
            necesita avisar que se va, y antes este boton solo existia en la
            pantalla de elegir dias —a la que ya no llega—. */}
        {pausas.length > 0 &&
          <Bloque>
            <div className="afCard">
              <div className="afCard__head"><span className="afCard__title">No estarás</span></div>
              {pausas.map((p) => (
                <div className="afSrow" key={p.id}>
                  <span>{moment(p.start_date).format('D MMM')} al {moment(p.end_date).format('D MMM')}</span>
                  <button type="button" className="afMenu__mini" onClick={() => volviAntes(p.id)}>
                    Ya volví
                  </button>
                </div>
              ))}
            </div>
          </Bloque>
        }


        <Bloque>
          <div className="afCard">
            <div className="afCard__head">
              <span className="afCard__title">Lo que pediste</span>
              <span className="afCard__label">{pedidos.length} días</span>
            </div>
            {pedidos.length === 0 &&
              <p className="afMenu__nota afMenu__nota--suelta">
                Todavía no tienes pedidos esta semana.
              </p>}
            {pedidos.map(filaPedido)}
          </div>
        </Bloque>

        {tarjetaReprogramados}
        {viajeUI}
      </Cascada>
    );
  }

  /* ---------- paso 1: que dia ---------- */
  /* Una sola lista con toda la semana.
     Antes habia tres tarjetas —"Dias disponibles", "Ya pediste" y
     "Reprogramaste"— y el mismo dia podia aparecer en una u otra segun su
     estado: el cliente tenia que juntar las piezas para saber que le llega
     cada dia. Aqui cada fila es un dia, con lo que tiene y lo que puede
     hacer. */
  const diasSemana = (() => {
    const mapa = new Map();
    (dias || []).forEach((d) => mapa.set(d.localDate, { fecha: d.localDate }));
    (pedidos || []).forEach((o) => {
      const f = moment(o.date).format('YYYY-MM-DD');
      mapa.set(f, { ...(mapa.get(f) || {}), fecha: f, pedido: o });
    });
    (reprogramados || []).forEach((r) => {
      const f = moment(r).format('YYYY-MM-DD');
      mapa.set(f, { ...(mapa.get(f) || {}), fecha: f, sinEnvio: true });
    });
    return [...mapa.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
  })();

  const platosDelPedido = (o) =>
    (o.items || []).map((i) => i?.menu?.name).filter(Boolean).join(' · ');

  if (paso === 1) return (
    <Cascada className="afPanel afPanel--menu">
      {/* Va antes del titular a proposito: lo primero que tiene que registrar
          el colaborador al abrir es quien le esta pagando el almuerzo. */}
      {empresa?.corporativo && <Bloque><FranjaEmpresa empresa={empresa} /></Bloque>}

      <Bloque><h1 className="afPanel__titular">Tu semana</h1></Bloque>
      <Bloque>
        <p className="afMenu__ayuda">
          Cada día puede llegarte un almuerzo. Elige el plato del día que quieras
          y marca los que no.
          {/* Dentro de su propio <span> y no suelto entre el texto: un nodo
              de texto condicional pegado a otro es justo lo que React no
              puede reconciliar si el traductor del navegador toco el parrafo. */}
          {restan && <span> Los cambios para mañana cierran hoy a las {HORA_LIMITE_TEXTO}</span>}
        </p>
      </Bloque>

      <div className="afMenu__col afMenu__col--principal">
        <Bloque>
          <div className="afCard">
            <div className="afCard__head">
              <span className="afCard__title">Tus días</span>
              <span className="afCard__label">
                {diasSemana.filter((d) => d.pedido).length} con plato elegido
              </span>
            </div>

            {diasSemana.length === 0 &&
              <p className="afMenu__nota afMenu__nota--suelta">
                No hay días por elegir ahora. Los viernes publicamos el menú de la
                próxima semana y te avisamos.
              </p>
            }

            {diasSemana.map(({ fecha, pedido, sinEnvio }) => {
              const elegidoSinGuardar = !pedido && diaCompleto(fecha);
              const abierto = pedido ? sePuedeCambiar(pedido) : true;
              return (
                <div className={`afDiaFila${pedido ? ' afDiaFila--listo' : ''}${sinEnvio && !elegidoSinGuardar ? ' afDiaFila--sin' : ''}`} key={fecha}>
                  <div className="afDiaFila__fecha">
                    <b>{moment(fecha).format('ddd')}</b>
                    <span>{moment(fecha).format('D')}</span>
                  </div>

                  <div className="afDiaFila__txt">
                    {pedido &&
                      <>
                        <b>{platosDelPedido(pedido) || 'Plato elegido'}</b>
                        <small>Te llega ese día entre las {REPARTO.desde} y la {REPARTO.hasta}</small>
                      </>
                    }
                    {/* Si ya eligio plato, eso es lo que manda: aunque el dia
                        siga marcado como "no recibo", la eleccion pendiente es
                        lo ultimo que hizo y lo que va a pasar al confirmar. */}
                    {elegidoSinGuardar &&
                      <>
                        <b>Plato elegido, falta confirmar</b>
                        <small>Confirma tu semana para que entre a cocina.</small>
                      </>
                    }
                    {!pedido && !elegidoSinGuardar && sinEnvio &&
                      <>
                        <b>No recibes este día</b>
                        <small>Tu envío volvió a tu saldo. Puedes usarlo otro día.</small>
                      </>
                    }
                    {!pedido && !elegidoSinGuardar && !sinEnvio &&
                      <>
                        <b>Sin elegir</b>
                        <small>Elige tu plato o marca que no quieres este día.</small>
                      </>
                    }
                  </div>

                  <div className="afDiaFila__acciones">
                    {pedido && abierto && confirmando !== pedido.id &&
                      <>
                        <button type="button" className="afMenu__mini"
                          onClick={() => { setError(''); editarPlatos(pedido); }}>
                          Cambiar plato
                        </button>
                        <button type="button" className="afMenu__mini afMenu__mini--no"
                          onClick={() => { setError(''); setAvisoReprog(''); setConfirmando(pedido.id); }}>
                          No recibir
                        </button>
                      </>
                    }

                    {pedido && confirmando === pedido.id &&
                      <span className="afDiaFila__confirma">
                        <b>¿Seguro?</b>
                        <button type="button" className="afMenu__mini afMenu__mini--si"
                          disabled={cancelando} onClick={() => reprogramarDia(pedido)}>
                          {cancelando ? '…' : 'Sí, no lo quiero'}
                        </button>
                        <button type="button" className="afMenu__mini" onClick={() => setConfirmando(null)}>
                          Volver
                        </button>
                      </span>
                    }

                    {pedido && !abierto &&
                      <span className="afDiaFila__cerrado">Ya en cocina</span>
                    }

                    {!pedido &&
                      <>
                        <button type="button" className="afMenu__mini afMenu__mini--si"
                          onClick={() => { setError(''); setAvisoReprog(''); setDiaActivo(fecha); setPaso(2); }}>
                          {elegidoSinGuardar ? 'Cambiar' : sinEnvio ? 'Sí quiero este día' : 'Elegir plato'}
                        </button>
                        {!sinEnvio && !elegidoSinGuardar &&
                          <button type="button" className="afMenu__mini afMenu__mini--no"
                            disabled={cancelando} onClick={() => marcarSinEnvio(fecha)}>
                            No lo quiero
                          </button>
                        }
                      </>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </Bloque>

        {avisoPausa && <Bloque><p className="afMenu__ok">{avisoPausa}</p></Bloque>}
        {avisoReprog && <Bloque><p className="afMenu__ok">{avisoReprog}</p></Bloque>}
        {error && !diaAbierto && <Bloque><p className="afMenu__error">{error}</p></Bloque>}
      </div>

      <div className="afMenu__col afMenu__col--lateral">
        {elegidos.length > 0 &&
          <Bloque>
            {/* El aviso va ANTES del boton y no debajo: lo que hay que
                entender es que todavia no esta pedido. */}
            <p className="afMenu__pendiente">
              <b>Todavía no está pedido.</b> Elegiste {elegidos.length} día{elegidos.length === 1 ? '' : 's'};
              falta confirmar para que entre a cocina.
            </p>
            <motion.button type="button" className="afBtn" onClick={() => setPaso(3)} {...alToque}>
              {elegidos.length === 1 ? 'Confirmar mi día' : `Confirmar mis ${elegidos.length} días`}
            </motion.button>
          </Bloque>
        }

        {/* Eligio algo pero le falta la otra comida del dia. Sin esto la
            pantalla simplemente no muestra el boton y el cliente no sabe por que. */}
        {elegidos.length === 0 && aMedias.length > 0 &&
          <Bloque>
            <p className="afMenu__pendiente afMenu__pendiente--falta">
              Te falta completar {aMedias.length === 1 ? 'un día' : `${aMedias.length} días`}:
              tu plan trae {comidas.map((c) => NOMBRE_COMIDA[c] || c).join(' y ')} el mismo día
              y hay que elegir los dos para poder confirmar.
            </p>
          </Bloque>
        }

        <Bloque>
          <div className="afCard">
            <div className="afCard__head"><span className="afCard__title">Cómo funciona</span></div>
            <p className="afMenu__nota afMenu__nota--suelta">
              <b>No tienes que pedir todos los días.</b> El día que marques
              “No lo quiero” no se prepara y no gasta envío de tu plan.
            </p>
            <p className="afMenu__nota afMenu__nota--suelta">
              Si una semana no eliges nada, te la armamos nosotros con el plato
              del día para que no te quedes sin almuerzo.
            </p>
            <p className="afMenu__nota afMenu__nota--suelta">
              Tu snack y tu bebida vienen con el plan: no hay que elegirlos.
            </p>
          </div>
        </Bloque>

        {pausas.length > 0 &&
          <Bloque>
            <div className="afCard">
              <div className="afCard__head"><span className="afCard__title">No estarás</span></div>
              {pausas.map((p) => (
                <div className="afSrow" key={p.id}>
                  <span>{moment(p.start_date).format('D MMM')} al {moment(p.end_date).format('D MMM')}</span>
                  <button type="button" className="afMenu__mini" onClick={() => volviAntes(p.id)}>
                    Ya volví
                  </button>
                </div>
              ))}
            </div>
          </Bloque>
        }

        {viajeUI}
      </div>

      {/* Barra fija abajo mientras haya algo sin confirmar.
          El boton vivia en la columna lateral: en el telefono queda debajo de
          la lista de dias, o sea fuera de la pantalla mientras el cliente
          elige. Aqui no se puede perder de vista. */}
      {elegidos.length > 0 && paso === 1 &&
        <div className="afConfirmaFija">
          <span>
            <b>{elegidos.length} día{elegidos.length === 1 ? '' : 's'} sin confirmar</b>
            <small>Si sales ahora, no queda pedido</small>
          </span>
          <button type="button" onClick={() => setPaso(3)}>Confirmar</button>
        </div>
      }
    </Cascada>
  );

  /* ---------- paso 2: plato y direccion ---------- */
  if (paso === 2) {
    /* Se busca en la lista completa: cuando el cliente esta CAMBIANDO el plato
       de un dia ya pedido, ese dia no aparece en la de dias por elegir. */
    const dia = diasTodos.find((d) => d.localDate === diaActivo)
             || dias.find((d) => d.localDate === diaActivo);
    const sel = seleccion[diaActivo] || {};

    // Las calorias del dia: cada porcion suma, tambien la segunda del mismo plato.
    const kcal = comidas.reduce((suma, c) => suma + platosDe(dia, c).reduce(
      (s, p) => s + prop(p.menu, 'calorias') * cantidadDe(diaActivo, c, p.id), 0), 0);
    const meta = plan?.needDay?.bmr ? Math.round(plan.needDay.bmr) : null;

    const marcar = (campo, valor) =>
      setSeleccion((s) => ({ ...s, [diaActivo]: { ...s[diaActivo], [campo]: valor } }));

    /**
     * Pone en cuantas porciones queda ese plato. Cero lo saca de la eleccion.
     *
     * El tope de 5 por plato no es una regla del negocio, es un freno al dedo
     * torpe: la cuenta real la lleva el plan y cada porcion le gasta un envio.
     */
    const ponerCantidad = (comida, id, cantidad) =>
      setSeleccion((s) => {
        const delDia = s[diaActivo] || {};
        const deLaComida = { ...(delDia.menus?.[comida] || {}) };
        const n = Math.max(0, Math.min(5, cantidad));
        if (n === 0) delete deLaComida[id];
        else deLaComida[id] = n;
        return { ...s, [diaActivo]: { ...delDia, menus: { ...(delDia.menus || {}), [comida]: deLaComida } } };
      });

    const faltan = comidas.filter((c) => totalDe(diaActivo, c) === 0);
    /* Las que estan elegidas pero por debajo de otra: ahi el cliente ya
       entendio como funciona y solo le falta emparejar. */
    const cojas = desparejas(diaActivo).filter((c) => !faltan.includes(c));
    const listo = faltan.length === 0 && cojas.length === 0;

    return (
      <Cascada className="afPanel afPanel--menu">
        {!editando &&
          <Bloque>
            <button type="button" className="afVolver" onClick={() => { setError(''); setPaso(1); }}>
              ← Tus días
            </button>
          </Bloque>
        }
        <Bloque><p className="afMenu__paso">Paso 2 de 3</p></Bloque>
        <Bloque>
          <h1 className="afPanel__titular">{moment(diaActivo).format('dddd D')}</h1>
        </Bloque>
        {/* El horario sale de REPARTO, no escrito a mano. Aqui decia "entre
            14:00 y 16:00", un rango inventado que contradecia al resto de la
            app —el panel y los avisos ya usaban la constante— y prometia al
            cliente una hora que la operacion no cumple. */}
        <Bloque>
          <p className="afMenu__ayuda">
            Llega entre las {REPARTO.desde} y la {REPARTO.hasta}
          </p>
        </Bloque>

        {/* En computadora: los platos a la izquierda y, a la derecha, a donde
            va, como queda el dia y el boton de guardar —siempre a la vista,
            sin bajar—. En el telefono es la misma lista de siempre. */}
        <div className="afMenu__col afMenu__col--principal">
        {/* Un bloque por comida del plan. Con un solo principal se ve igual que
            antes; con dos aparecen "Tu almuerzo" y "Tu cena". */}
        {comidas.map((comida) => {
          const platos = platosDe(dia, comida);
          return (
            <React.Fragment key={comida}>
              <Bloque>
                <p className="afMenu__label">
                  {comidas.length > 1
                    ? `Tu ${NOMBRE_COMIDA[comida] || comida}`
                    : 'Elige tu plato'}
                  {totalDe(diaActivo, comida) > 1 &&
                    ` · ${totalDe(diaActivo, comida)} porciones`}
                </p>
              </Bloque>

              {platos.length === 0 &&
                <Bloque>
                  <p className="afMenu__nota afMenu__nota--suelta">
                    Todavía no hay {NOMBRE_COMIDA[comida] || comida} publicada para este día.
                  </p>
                </Bloque>
              }

              {platos.map((p) => {
                const cantidad = cantidadDe(diaActivo, comida, p.id);
                return (
                  <Bloque key={comida + '-' + p.id}>
                    <div className={`afPlato${cantidad ? ' afPlato--sel' : ''}`}>
                      {/* Tocar el plato lo elige o lo saca. El contador solo
                          aparece cuando ya esta elegido: quien pide uno —casi
                          todos— no tiene que ver ningun control nuevo. */}
                      <motion.button type="button" className="afPlato__cuerpo"
                        onClick={() => ponerCantidad(comida, p.id, cantidad ? 0 : 1)} {...alToque}>
                        <FotoPlato menu={p.menu} tipo={comida} />
                        <span className="afPlato__txt">
                          <b>{p.menu.name}</b>
                          <small>
                            {prop(p.menu, 'calorias')} kcal · {prop(p.menu, 'proteinas')} P
                            · {prop(p.menu, 'carbo')} C · {prop(p.menu, 'grasas')} G
                          </small>
                        </span>
                        <span className="afPlato__tick" />
                      </motion.button>

                      {cantidad > 0 &&
                        <div className="afCant">
                          <button type="button" className="afCant__btn"
                            aria-label={`Quitar una porción de ${p.menu.name}`}
                            onClick={() => ponerCantidad(comida, p.id, cantidad - 1)}>−</button>
                          <span className="afCant__n">
                            {cantidad} {cantidad === 1 ? 'porción' : 'porciones'}
                          </span>
                          <button type="button" className="afCant__btn"
                            aria-label={`Agregar una porción de ${p.menu.name}`}
                            disabled={cantidad >= 5}
                            onClick={() => ponerCantidad(comida, p.id, cantidad + 1)}>+</button>
                        </div>
                      }
                    </div>
                  </Bloque>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Lo que viene fijo con el plan.
            Antes solo se leia "tu snack y tu bebida vienen con el plan", sin
            decir cuales, y encima en la pantalla anterior —donde todavia no
            hay un dia elegido, asi que no se podia saber—. Como la bebida y
            el snack ya estan programados por dia, mostrarlos es gratis y
            "Refresco de Jamaica" da mas ganas que una frase generica. */}
        {(() => {
          const fijos = ['drinks', 'snacks']
            .flatMap((t) => platosDe(dia, t))
            .filter((x) => !comidas.includes(x.type));
          if (!fijos.length) return null;
          return (
            <>
              <Bloque><p className="afMenu__label">Incluido este día</p></Bloque>
              {fijos.map((x) => (
                <Bloque key={'fijo-' + x.id}>
                  <div className="afPlato afPlato--fijo">
                    <FotoPlato menu={x.menu} tipo={x.type} />
                    <span className="afPlato__txt">
                      <b>{x.menu.name}</b>
                      <small>{prop(x.menu, 'calorias')} kcal · viene con tu plan</small>
                    </span>
                  </div>
                </Bloque>
              ))}
            </>
          );
        })()}

        </div>

        <div className="afMenu__col afMenu__col--lateral">
        {/* Arriba, antes de los platos: quien no quiere este dia no tiene que
            recorrer la carta para descubrir que puede decir que no. */}
        {!editando &&
          <Bloque>
            {esReprogramado(diaActivo) ?
              <p className="afMenu__nota afMenu__nota--suelta">
                Marcaste que no quieres este día. Si eliges un plato, vuelve a quedar activo.
              </p>
            :
              <button type="button" className="afMenu__noDia"
                disabled={cancelando} onClick={() => marcarSinEnvio(diaActivo)}>
                {cancelando ? 'Guardando…' : 'No quiero este día'}
              </button>
            }
          </Bloque>
        }


        <>
            <Bloque><p className="afMenu__label">Entregar este día en</p></Bloque>
            {puntos.map((d) => (
              <Bloque key={d.id}>
                <motion.button type="button"
                  className={`afDir${sel.puntoId === d.id ? ' afDir--sel' : ''}`}
                  onClick={() => marcar('puntoId', d.id)} {...alToque}>
                  <span className="afDir__ico"><Ico d={PIN} /></span>
                  {/* El nombre si existe; si no, la calle. Antes se mostraba la
                      referencia, asi que la etiqueta decia "Frente al parque". */}
                  <span className="afDir__txt">
                    <b>{d.name || d.address}</b>
                    <small>{d.name ? d.address : d.description}</small>
                  </span>
                  <span className="afPlato__tick" />
                </motion.button>
              </Bloque>
            ))}
            {puntos.length === 0 &&
              <Bloque>
                <p className="afMenu__nota">
                  Todavía no tienes ningún lugar guardado. Agrega uno para que el
                  motorizado sepa dónde dejarte el almuerzo.
                </p>
              </Bloque>
            }

            {/* Antes, quien queria recibir en la oficina tenia que adivinar que
                la direccion se crea en otra pantalla, salir del menu y volver a
                empezar. Lo que lleva elegido se conserva. */}
            <Bloque>
              <Link className="afMenu__nuevaDir" to="/ubicaciones">
                + Agregar {puntos.length === 0 ? 'una' : 'otra'} dirección
              </Link>
            </Bloque>

            {puntos.length > 0 &&
              <Bloque>
                <p className="afMenu__nota">
                  Puedes recibir cada día en un lugar distinto.
                </p>
              </Bloque>
            }
          </>

        {kcal > 0 && meta &&
          <Bloque>
            <div className="afCard">
              <div className="afCard__head">
                <span className="afCard__title">Cómo queda tu día</span>
              </div>
              <div className="afFila afFila--top">
                <span>Calorías</span><span><b>{kcal}</b> / {meta}</span>
              </div>
              <BarraAnimada className="afBarra afBarra--sky"
                porcentaje={Math.min(Math.round((kcal / meta) * 100), 100)} />
            </div>
          </Bloque>
        }

        {/* Almuerzo y cena viajan juntos: si no van parejos, el dia no cierra
            y quedaria media racion suelta en cocina. Se explica aqui, donde el
            cliente todavia puede arreglarlo, y no al confirmar la semana. */}
        {cojas.length > 0 &&
          <Bloque>
            <p className="afMenu__nota afMenu__nota--suelta">
              Tu plan entrega {comidas.map((c) => NOMBRE_COMIDA[c] || c).join(' y ')} el
              mismo día, así que las cantidades tienen que ir parejas.
              Pediste {comidas.map((c) =>
                `${totalDe(diaActivo, c)} ${NOMBRE_COMIDA[c] || c}`).join(' y ')}.
            </p>
          </Bloque>
        }

        <Bloque>
          <motion.button type="button" className={editando ? 'afBtn afBtn--mint' : 'afBtn'}
            disabled={!listo || enviando}
            onClick={() => (editando ? guardarPlatos() : setPaso(1))} {...alToque}>
            {!listo
              ? (faltan.length > 0
                  ? `Elige tu ${NOMBRE_COMIDA[faltan[0]] || faltan[0]} para continuar`
                  : `Agrega ${enviosDe(diaActivo) - totalDe(diaActivo, cojas[0])} ${NOMBRE_COMIDA[cojas[0]] || cojas[0]} más`)
              : editando
                ? (enviando ? 'Guardando…' : 'Guardar este día')
                : 'Guardar y volver a los días'}
          </motion.button>
        </Bloque>

        {/* Salida sin guardar. Sin esto, alguien que entra a cambiar su plato y
            quita el que tenia se queda encerrado en esta pantalla: el boton de
            arriba esta bloqueado hasta que el dia vuelva a estar completo. */}
        {editando &&
          <Bloque>
            <button type="button" className="afBtn afBtn--fantasma"
              onClick={() => { setError(''); salirDeEdicion(diaActivo); recargar(); }}>
              Volver sin cambiar
            </button>
          </Bloque>
        }
        </div>

      </Cascada>
    );
  }

  /* ---------- paso 3: confirmar ---------- */
  const porDireccion = {};
  elegidos.forEach((f) => {
    const p = puntos.find((x) => x.id === seleccion[f].puntoId);
    const clave = p ? (p.name || p.address) : 'Tu dirección habitual';
    porDireccion[clave] = (porDireccion[clave] || 0) + 1;
  });

  return (
    <Cascada className="afPanel">
      <Bloque><p className="afMenu__paso">Paso 3 de 3</p></Bloque>
      <Bloque><h1 className="afPanel__titular">Revisa tu semana</h1></Bloque>
      <Bloque>
        <p className="afMenu__ayuda">
          Nada llega a cocina hasta que confirmes. Puedes cambiarlo hasta
          las {HORA_LIMITE_TEXTO} del día anterior.
        </p>
      </Bloque>

      <Bloque>
        <div className="afCard">
          <div className="afCard__head">
            <span className="afCard__title">Lo que pediste</span>
            <span className="afCard__label">
              {elegidos.length} {elegidos.length === 1 ? 'día' : 'días'}
              {enviosElegidos !== elegidos.length && ` · ${enviosElegidos} envíos`}
            </span>
          </div>
          {elegidos.map((f) => {
            const dia = dias.find((d) => d.localDate === f);
            /* "Ají de gallina x2" cuando pidio dos. Sin el numero, el resumen
               de un viernes doble se lee igual que el de uno simple y el
               cliente confirma sin darse cuenta de lo que gasta. */
            const platosDelDia = comidas.flatMap((c) =>
              platosDe(dia, c)
                .filter((x) => cantidadDe(f, c, x.id) > 0)
                .map((x) => {
                  const n = cantidadDe(f, c, x.id);
                  return n > 1 ? `${x.menu.name} x${n}` : x.menu.name;
                }));
            const punto = puntos.find((x) => x.id === seleccion[f].puntoId);
            return (
              <React.Fragment key={f}>
                <div className="afSrow">
                  <span>{moment(f).format('ddd D MMM')}</span>
                  <b>{platosDelDia.join(' · ')}</b>
                </div>
                {punto &&
                  <div className="afSrow afSrow--sub">
                    <span />
                    <span className="afTag"><Ico d={PIN} c="afTag__ic" />{punto.name || punto.address}</span>
                  </div>
                }
              </React.Fragment>
            );
          })}
        </div>
      </Bloque>

      {Object.keys(porDireccion).length > 0 &&
        <Bloque>
          <div className="afCard">
            <div className="afCard__head"><span className="afCard__title">Tus entregas</span></div>
            {Object.entries(porDireccion).map(([nombre, n]) => (
              <div className="afSrow" key={nombre}>
                <span>{nombre}</span><b>{n} {n === 1 ? 'día' : 'días'}</b>
              </div>
            ))}
          </div>
        </Bloque>
      }

      {seExcede &&
        <Bloque>
          <p className="afMenu__error">
            Te quedan {enviosRestantes} {enviosRestantes === 1 ? 'envío' : 'envíos'} y
            estás pidiendo {enviosElegidos}. Quita alguna porción o renueva tu plan.
          </p>
        </Bloque>
      }

      {error && <Bloque><p className="afMenu__error">{error}</p></Bloque>}

      <Bloque>
        <motion.button type="button" className="afBtn afBtn--mint"
          onClick={confirmar} disabled={enviando || seExcede} {...alToque}>
          {enviando ? 'Guardando…' : 'Confirmar mi semana'}
        </motion.button>
      </Bloque>
      <Bloque>
        <button type="button" className="afBtn afBtn--fantasma" onClick={() => setPaso(1)}>
          Volver a los días
        </button>
      </Bloque>
    </Cascada>
  );
};

export default MenuFlow;
