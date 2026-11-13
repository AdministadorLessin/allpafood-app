import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from 'axios';
import moment from 'moment';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup, MotionConfig } from 'motion/react';

import './MenuFlow.scss';
import Festejo from '../../ultil/Festejo/Festejo';
import Jalar from '../../ultil/Jalar/Jalar';
import './MenuNuevo.scss';
import Hoja from '../../Centro/Hoja';
import Isotipo from '../../ultil/Isotipo';
import { REPARTO } from '../PedidoDeHoy/PedidoDeHoy';
import { useAuthContext } from './../../../context/authContext';
import { HORA_LIMITE, HORA_LIMITE_TEXTO, semanaRelevante } from './../StatusBanner/estadoPlan';
import FranjaEmpresa from './../../empresa/FranjaEmpresa/FranjaEmpresa';
import { API_URL } from '../../../config';
import { resorte, cascada, sube } from '../../../movimiento';
import { vibrar } from '../../../nativo';

const baseUrl = `${API_URL}`;

/* El valor nutricional de un plato. Se busca por el comienzo del nombre:
   el servidor dice "carbo" en unos platos y "carbohidratos" en otros. */
const prop = (menu, nombre) => {
  const p = (menu?.properties || []).find((x) => String(x.name || '').toLowerCase().startsWith(nombre));
  return Number(p?.value) || 0;
};
const ymd = (f) => moment(f).format('YYYY-MM-DD');
const mayus = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
const nombreDia = (f) => moment(f).format('dddd D');

const NOMBRE_COMIDA = { lunch: 'almuerzo', dinner: 'cena', breakfast: 'desayuno' };
const PARA_COMIDA = { lunch: 'Para el almuerzo', dinner: 'Para la cena', breakfast: 'Para el desayuno' };
/* Lo que acompana al plato. La entrada salia como "Plato" a secas. */
const ETIQUETA_EXTRA = { drinks: 'Bebida', snacks: 'Snack', starter: 'Entrada' };
const ORDEN_TIPOS = ['lunch', 'dinner', 'breakfast', 'starter', 'snacks', 'drinks'];

const MARCA = {
  listo: 'Listo', cerrado: 'Listo', viaje: 'No recibe', no: 'No recibe',
  pasado: 'Cerrado', elegir: 'Elegir', falta: 'Falta 1', sinMenu: 'Pronto',
};

const Palomita = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
);
/* El pin a color: circulo menta, pin tinta. */
const Pin = () => (
  <span className="mnu__pin" aria-hidden="true">
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M12 22s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z" fill="#16211B" />
      <circle cx="12" cy="10" r="2.7" fill="#3CFB9F" />
    </svg>
  </span>
);

/* La foto del plato si existe. Hoy casi ningun plato la trae: el respaldo es
   un cuadro sobrio con un cubierto, no una foto inventada. */
const Foto = ({ menu }) => (menu?.imageUrl
  ? <img className="mnu__foto" src={menu.imageUrl} alt="" loading="lazy" />
  : (
    <span className="mnu__foto mnu__foto--sin" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 2v7a2 2 0 0 0 2 2v11" /><path d="M7 2v6" /><path d="M11 2v6" />
        <path d="M17 2c-1.4 0-2.5 2-2.5 4.5S15.600 11 17 11s2.500-2 2.500-4.500S18.400 2 17 2z" /><path d="M17 11v11" />
      </svg>
    </span>
  ));

const datoDe = (menu, respaldo) => {
  const kcal = prop(menu, 'calor');
  const partes = [];
  if (kcal) partes.push(`${kcal} kcal`);
  if (prop(menu, 'prote')) partes.push(`${prop(menu, 'prote')} g de proteína`);
  if (prop(menu, 'carbo')) partes.push(`${prop(menu, 'carbo')} g de carbos`);
  if (prop(menu, 'grasa')) partes.push(`${prop(menu, 'grasa')} g de grasa`);
  return partes.length ? partes.join(' · ') : respaldo;
};

/* Los dibujos de las opciones del dia. */
const G = {
  vaso: ['M7 4h10l-1.200 15a2 2 0 0 1-2 1.800h-3.600a2 2 0 0 1-2-1.800z', 'M7.500 10h9'],
  rayo: 'M13 3 5 13.500h6L10 21l8-10.500h-6z',
  mas: 'M12 5v14M5 12h14',
  no: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8.500 8.500l7 7M15.500 8.500l-7 7'],
  si: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8 12.300l2.700 2.700L16 9.500'],
  ir: 'M9 6l6 6-6 6',
  atras: 'M15 6l-6 6 6 6',
  porMi: ['M3 12a9 9 0 1 0 3-6.700L3 8', 'M3 3v5h5'],
  viaje: ['M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z', 'M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'],
};
const Glifo = ({ d, chico }) => (
  <span className={chico ? 'mnu__glifo mnu__glifo--chico' : 'mnu__glifo'} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {[].concat(d).map((x) => <path key={x} d={x} />)}
    </svg>
  </span>
);

/* Las calorias en negrita y cada macro con su punto de color (los mismos de
   Progreso): se lee de un vistazo, sin recorrer una linea larga. Quien usa
   lector de pantalla escucha la frase completa. */
const Macros = ({ menu, respaldo }) => {
  const kcal = prop(menu, 'calor');
  const tres = [['p', 'prote'], ['c', 'carbo'], ['g', 'grasa']].filter(([, k]) => prop(menu, k));
  if (!kcal && !tres.length) return <small>{respaldo}</small>;
  return (
    <span className="mnu__macros" role="text" aria-label={datoDe(menu, respaldo)}>
      {kcal ? <b aria-hidden="true">{kcal} kcal</b> : null}
      {tres.map(([c, k]) => <i key={c} className={`is-${c}`} aria-hidden="true">{prop(menu, k)} g</i>)}
    </span>
  );
};

/* --- cuentas sobre lo elegido de un dia: { comida: { menuId: cantidad } } --- */
const totalEn = (menus, comida) =>
  Object.values(menus?.[comida] || {}).reduce((a, b) => a + b, 0);

/**
 * Elegir el menu: lo que se toca queda pedido.
 *
 * Antes eran tres pasos —elegir el dia, elegir el plato y "guardar", y despues
 * confirmar la semana—, y un domingo 17 de 59 clientes se fueron creyendo que
 * ya habian pedido. Ahora los dias van arriba, los platos del dia debajo, y
 * tocar un plato manda el pedido de ese dia en el momento, con "Deshacer".
 *
 * Las reglas no cambiaron y las hace cumplir el servidor: el plazo de las
 * 22:00 de la vispera, un envio por dia del plan, almuerzo y cena parejos en
 * Fitfuel, la direccion por dia.
 */
const MenuFlow = ({ plan, alCambiar }) => {

  const { token, empresa } = useAuthContext();
  const cab = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [dias, setDias] = useState(null);
  /* El menu de la semana INCLUYENDO los dias ya pedidos. Hace falta para poder
     cambiar el plato de un dia programado: la lista de arriba los excluye a
     proposito. */
  const [diasTodos, setDiasTodos] = useState([]);
  const [falloCarga, setFalloCarga] = useState(false);
  const [vuelta, setVuelta] = useState(0);

  /* "Me voy de viaje". Sin esto, el cliente que no elegia nada creyendo que
     asi no le llegaba comida se encontraba la semana armada por el proceso
     del domingo —con sus envios descontados— y reclamaba con razon. */
  const [pausas, setPausas] = useState([]);
  const [viaje, setViaje] = useState({ desde: '', hasta: '' });
  const [guardandoPausa, setGuardandoPausa] = useState(false);
  const [avisoPausa, setAvisoPausa] = useState('');
  // Lo que el cliente YA pidio.
  const [pedidos, setPedidos] = useState([]);
  const [cancelando, setCancelando] = useState(false);
  /* Dias que el cliente marco para no recibir: su pedido se cancelo y el envio
     volvio al saldo, o dijo que no antes de pedir. */
  const [reprogramados, setReprogramados] = useState([]);
  const [guardandoDir, setGuardandoDir] = useState(false);
  const [puntos, setPuntos] = useState([]);
  /* { fecha: { menus: { comida: { menuId: cantidad } }, puntoId } }
     Lo elegido que TODAVIA no es un pedido. Con un solo principal casi no se
     usa —tocar ya pide—; con almuerzo y cena guarda la mitad elegida hasta
     que el dia este completo. Tambien guarda la direccion elegida para un dia
     sin pedido. Vive en la sesion del navegador porque desde aqui se puede
     salir a Mis direcciones a crear un lugar nuevo. */
  const [seleccion, setSeleccion] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('af_menu_sel') || '{}'); }
    catch (e) { return {}; }
  });
  const [diaActivo, setDiaActivo] = useState(null);
  const [sentido, setSentido] = useState(1);
  /* Al abrir la pantalla el dia no entra de lado: solo cuando se cambia. */
  const seMovio = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  /* Lo que se acaba de tocar, pintado antes de que responda el servidor. */
  const [optimista, setOptimista] = useState(null);
  /* El aviso de "quedo pedido", con lo necesario para deshacerlo. */
  const [ultimo, setUltimo] = useState(null);
  /* 'direccion' | 'viaje' | 'porMi' */
  const [hoja, setHoja] = useState(null);
  /* Sumar un plato distinto al mismo dia, en vez de reemplazar el elegido. */
  const [sumando, setSumando] = useState(false);

  useEffect(() => {
    try { sessionStorage.setItem('af_menu_sel', JSON.stringify(seleccion)); }
    catch (e) { /* modo privado: no es critico, solo se pierde al navegar */ }
  }, [seleccion]);

  /* Que comidas trae el plan. Fitfuel da almuerzo Y cena, y el servidor
     exige un plato por cada una: isMenuSelectedValid rechaza el pedido si
     menuTypeIds.size() != principalBenefits.size(). */
  const comidas = useMemo(() => {
    const b = plan?.consumption?.principalBenefits;
    const lista = Array.isArray(b) && b.length ? b : ['lunch'];
    // El almuerzo primero: es como el cliente piensa el dia.
    return [...lista].sort((a) => (a === 'lunch' ? -1 : 1));
  }, [plan]);
  const doble = comidas.length > 1;

  /* Aviso al cerrar con una eleccion a medias. Con "un toque" solo puede
     pasar en los planes de dos comidas: eligio el almuerzo y le falta la
     cena, y ese dia todavia no esta pedido. */
  const hayPendiente = doble && Object.keys(seleccion).some(
    (f) => comidas.some((c) => totalEn(seleccion[f]?.menus, c) > 0));
  useEffect(() => {
    if (!hayPendiente) return undefined;
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
    axios.get(`${baseUrl}dashboard/menus?initDate=${desde}`, cab)
      .then((r) => { setDias(Array.isArray(r.data.data) ? r.data.data : []); setFalloCarga(false); })
      .catch(() => { setDias([]); setFalloCarga(true); });

    axios.get(`${baseUrl}dashboard/menus?initDate=${desde}&incluirPedidos=true`, cab)
      .then((r) => setDiasTodos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setDiasTodos([]));

    /* incluirProxima: tambien los dias ya pedidos de la semana siguiente.
       Sin eso, un dia de la proxima semana con pedido no sale ni en la lista
       de dias libres —esta pedido— ni aqui —estaba fuera del rango—, y
       desaparecia de la pantalla. */
    axios.get(`${baseUrl}dashboard/orders?incluirProxima=true`, cab)
      .then((r) => setPedidos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setPedidos([]));

    axios.get(`${baseUrl}plan/pause`, cab)
      .then((r) => setPausas(Array.isArray(r.data?.data) ? r.data.data : (r.data || [])))
      .catch(() => setPausas([]));

    axios.get(`${baseUrl}order/reprogramados`, cab)
      .then((r) => setReprogramados(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
      .catch(() => setReprogramados([]));

    axios.get(`${baseUrl}delivery/find/points`, cab)
      .then((r) => setPuntos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setPuntos([]));
  }, [cab, desde, vuelta]);

  const platosDe = (dia, tipo) =>
    dia?.menuTypeGroups?.find((g) => g.type === tipo)?.menuTypes ?? [];

  /**
   * Un dia esta listo cuando todas las comidas del plan tienen la MISMA
   * cantidad de porciones, y al menos una.
   *
   * Con un solo principal —el caso de casi todos— es simplemente "elegiste
   * algo". Con almuerzo y cena tienen que ir parejos: pedir dos almuerzos y
   * una cena dejaria media racion suelta en cocina y en la bolsa, y el envio
   * extra que se cobra no corresponderia a un dia completo del plan.
   */
  const completoEn = (menus) => {
    const totales = comidas.map((c) => totalEn(menus, c));
    return totales.every((n) => n > 0) && new Set(totales).size === 1;
  };

  /**
   * Los envios que gasta lo elegido de un dia.
   *
   * Un envio es un DIA del plan, no un plato: quien tiene almuerzo y cena
   * gasta un envio por dia, no dos. Solo suma de mas quien pide porciones
   * extra, y suma el de la comida que mas repitio.
   */
  const enviosEn = (menus) => Math.max(...comidas.map((c) => totalEn(menus, c)), 0);

  /* El id repetido tantas veces como porciones: asi viaja la cantidad.
     Dos almuerzos del mismo plato son el mismo id dos veces; dos platos
     distintos, dos ids. El servidor cobra un envio por cada uno. */
  const idsDe = (menus) => comidas.flatMap((c) =>
    Object.entries(menus?.[c] || {}).flatMap(
      ([menuId, cantidad]) => Array(cantidad).fill(Number(menuId))));

  /* Cuantos envios le quedan. El servidor es quien lo valida. */
  const envios = plan?.consumption?.orders;
  const enviosRestantes = envios && Number.isFinite(envios.total) && Number.isFinite(envios.consumed)
    ? envios.total - envios.consumed
    : null;

  const recargar = useCallback(() => {
    alCambiar && alCambiar();
    return Promise.all([
      axios.get(`${baseUrl}dashboard/orders?incluirProxima=true`, cab)
        .then((r) => setPedidos(Array.isArray(r.data.data) ? r.data.data : []))
        .catch(() => {}),
      axios.get(`${baseUrl}dashboard/menus?initDate=${desde}`, cab)
        .then((r) => setDias(Array.isArray(r.data.data) ? r.data.data : []))
        .catch(() => {}),
      axios.get(`${baseUrl}dashboard/menus?initDate=${desde}&incluirPedidos=true`, cab)
        .then((r) => setDiasTodos(Array.isArray(r.data.data) ? r.data.data : []))
        .catch(() => {}),
      axios.get(`${baseUrl}order/reprogramados`, cab)
        .then((r) => setReprogramados(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
        .catch(() => {}),
    ]);
  }, [cab, desde, alCambiar]);

  const cargarPausas = () => {
    axios.get(`${baseUrl}plan/pause`, cab)
      .then((r) => setPausas(Array.isArray(r.data?.data) ? r.data.data : (r.data || [])))
      .catch(() => {});
  };

  /* Mismo plazo que para elegir: hasta las 22:00 de la vispera. */
  const antesDelCierre = (fecha) =>
    moment().isBefore(moment(fecha).subtract(1, 'day').startOf('day').hour(HORA_LIMITE));
  const sePuedeCambiar = (o) => {
    if (['C', 'F', 'X'].includes(o.status)) return false;
    return antesDelCierre(o.date);
  };

  const esReprogramado = (fecha) =>
    reprogramados.some((r) => ymd(r) === ymd(fecha));

  /**
   * Todo lo que se sabe de un dia, en un solo sitio.
   *
   * El mismo dia puede venir en tres listas —dias libres, pedidos y dias sin
   * envio— y antes cada parte de la pantalla las cruzaba por su cuenta.
   */
  const infoDia = (fecha) => {
    const pedido = pedidos.find((o) => ymd(o.date) === fecha) || null;
    /* Se busca en la lista completa: cuando el cliente esta CAMBIANDO el plato
       de un dia ya pedido, ese dia no aparece en la de dias por elegir. */
    const carta = diasTodos.find((d) => d.localDate === fecha)
               || (dias || []).find((d) => d.localDate === fecha) || null;
    /* Cerrado se mide por la HORA, no por si el pedido ya tiene motorizado. */
    const abierto = antesDelCierre(fecha);
    const finalizado = pedido ? ['C', 'F', 'X'].includes(pedido.status) : false;
    const pausa = pausas.find((p) => fecha >= ymd(p.start_date) && fecha <= ymd(p.end_date)) || null;
    const hayPlatos = !!carta && comidas.some((c) => platosDe(carta, c).length > 0);
    /* Solo con dos comidas puede haber un dia a medias: con una, tocar ya pide. */
    const aMedias = doble ? comidas.filter((c) => totalEn(seleccion[fecha]?.menus, c) > 0).length : 0;

    let estado;
    if (pedido) estado = sePuedeCambiar(pedido) ? 'listo' : 'cerrado';
    else if (pausa) estado = 'viaje';
    else if (esReprogramado(fecha)) estado = 'no';
    else if (!abierto) estado = 'pasado';
    else if (hayPlatos) estado = aMedias > 0 ? 'falta' : 'elegir';
    else estado = 'sinMenu';

    const marca = estado === 'falta' ? `Falta ${Math.max(1, comidas.length - aMedias)}` : MARCA[estado];
    return { fecha, pedido, carta, abierto, finalizado, pausa, hayPlatos, estado, marca };
  };

  /** Lo elegido de un dia: del pedido si ya existe, de la eleccion a medias si no. */
  const menusDe = (info, sinOptimista) => {
    if (!sinOptimista && optimista && optimista.fecha === info.fecha) return optimista.menus;
    if (info.pedido) {
      /* Repetidos incluidos: si tenia dos almuerzos, salen dos. Solo los
         platos del plan: la bebida viaja en el pedido pero no se elige. */
      const menus = {};
      comidas.forEach((c) => { menus[c] = {}; });
      (info.pedido.items || []).forEach((i) => {
        if (!i?.id || !comidas.includes(i.type)) return;
        menus[i.type][i.id] = (menus[i.type][i.id] || 0) + 1;
      });
      return menus;
    }
    /* Con una sola comida no existe "elegido sin pedir": si quedo algo
       guardado de una sesion vieja, no se pinta como si estuviera pedido. */
    return doble ? (seleccion[info.fecha]?.menus || {}) : {};
  };

  /* ---------- la ventana de semanas ---------- */
  /* La semana que le importa al cliente y la siguiente, de lunes a viernes.
     Si llega algun dato mas alla (o en fin de semana), tambien entra. */
  const semanas = (() => {
    const base = semanaRelevante().lunes.clone().startOf('day');
    /* Sabado y domingo no hay reparto: solo entran si de verdad hay un
       pedido ese dia, no porque la carta traiga algo publicado. */
    const habil = (f) => moment(f).isoWeekday() <= 5;
    const conDatos = [
      ...(dias || []).map((d) => d.localDate).filter(habil),
      ...diasTodos.map((d) => d.localDate).filter(habil),
      ...pedidos.map((o) => ymd(o.date)),
      ...reprogramados.map(ymd).filter(habil),
    ].filter((f) => f >= base.format('YYYY-MM-DD'));
    const ultima = conDatos.reduce((m, f) => (f > m ? f : m), '');
    const cuantas = Math.min(4, Math.max(2,
      ultima ? moment(ultima).startOf('isoWeek').diff(base, 'weeks') + 1 : 2));
    return Array.from({ length: cuantas }, (_, i) => {
      const lunes = base.clone().add(i, 'weeks');
      const fechas = new Set([0, 1, 2, 3, 4].map((n) => lunes.clone().add(n, 'days').format('YYYY-MM-DD')));
      const fin = lunes.clone().add(6, 'days').format('YYYY-MM-DD');
      conDatos.forEach((f) => { if (f >= lunes.format('YYYY-MM-DD') && f <= fin) fechas.add(f); });
      return { lunes, fechas: [...fechas].sort() };
    });
  })();

  const indiceSemana = Math.max(0, semanas.findIndex((s) => s.fechas.includes(diaActivo)));
  const semana = semanas[indiceSemana];
  const infos = semana.fechas.map(infoDia);
  const porElegir = infos.filter((i) => i.estado === 'elegir' || i.estado === 'falta');

  /* El momento de completar la semana se celebra: papelitos y vibracion. Solo
     cuando el ultimo dia se resuelve estando en esa misma semana, no al
     cambiar de semana ni al abrir una que ya estaba completa. */
  const [festejo, setFestejo] = useState(0);
  const antesFaltaban = useRef({ semana: null, faltan: null });
  const semanaVista = infos[0]?.fecha || null;
  const cuantosFaltan = porElegir.length;
  const hayAlgunoPedido = infos.some((i) => i.estado === 'listo');
  useEffect(() => {
    const a = antesFaltaban.current;
    if (a.semana === semanaVista && a.faltan > 0 && cuantosFaltan === 0 && hayAlgunoPedido) {
      setFestejo((n) => n + 1);
      vibrar.exito();
    }
    antesFaltaban.current = { semana: semanaVista, faltan: cuantosFaltan };
  }, [semanaVista, cuantosFaltan, hayAlgunoPedido]);
  const listos = infos.filter((i) => ['listo', 'cerrado', 'no', 'viaje'].includes(i.estado)).length;
  const sinPublicar = infos.every((i) => i.estado === 'sinMenu');

  /* El dia con el que conviene abrir una semana: el primero por elegir; si no
     hay, el primero que todavia se puede cambiar; si no, el primero. */
  const mejorDia = (s) => {
    const lista = s.fechas.map(infoDia);
    return (lista.find((i) => i.estado === 'elegir' || i.estado === 'falta')
         || lista.find((i) => i.estado === 'listo')
         || lista.find((i) => i.abierto)
         || lista[0]).fecha;
  };

  /* Mueve la pantalla a otro dia, sabiendo hacia que lado va. */
  const saltar = (fecha) => {
    seMovio.current = true;
    setSentido(fecha > (diaActivo || '') ? 1 : -1);
    setDiaActivo(fecha);
  };

  const irADia = (fecha) => {
    if (!fecha || fecha === diaActivo) return;
    saltar(fecha);
    setSumando(false);
    setError('');
    vibrar.toque();
  };

  /* Desde el inicio del app se toca un dia y "Elegir mi plato del viernes":
     llega con ese dia y se abre directo en sus platos. Si no viene ninguno,
     se abre en el primer dia que falta elegir. Una sola vez. */
  const location = useLocation();
  const diaPedido = location.state?.dia;
  const diaYaAbierto = useRef(false);
  useEffect(() => {
    if (diaYaAbierto.current || dias === null) return;
    diaYaAbierto.current = true;
    const todas = semanas.flatMap((s) => s.fechas);
    if (diaPedido && todas.includes(diaPedido)) { setDiaActivo(diaPedido); return; }
    const libres = dias.map((d) => d.localDate).filter((f) => todas.includes(f)).sort();
    setDiaActivo(libres[0] || mejorDia(semanas[0]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias, diaPedido]);

  /* El aviso de "quedo pedido" se va solo; "Deshacer" no tiene que quedarse
     en pantalla para siempre. */
  useEffect(() => {
    if (!ultimo) return undefined;
    const t = setTimeout(() => setUltimo(null), 9000);
    return () => clearTimeout(t);
  }, [ultimo]);

  /* ---------- guardar ---------- */
  const quitarDeSeleccion = (fechas, conservarPunto) => setSeleccion((s) => {
    const r = { ...s };
    fechas.forEach((f) => {
      if (conservarPunto && r[f]?.puntoId) r[f] = { puntoId: r[f].puntoId };
      else delete r[f];
    });
    return r;
  });

  const mensajeDe = (e, respaldo) => e?.response?.data?.message || respaldo;

  /**
   * Deja el dia con esos platos.
   *
   * Si el dia ya tiene pedido es un cambio (PUT sobre ese pedido); si no lo
   * tiene y quedo completo, se crea (POST, el mismo que antes mandaba la
   * semana entera al confirmar, ahora con un solo dia). Si el plan trae dos
   * comidas y solo hay una elegida, todavia no se manda nada.
   */
  const aplicar = (fecha, menus, texto) => {
    const info = infoDia(fecha);
    const antes = menusDe(info, true);

    if (!info.pedido && !completoEn(menus)) {
      setSeleccion((s) => ({ ...s, [fecha]: { ...s[fecha], menus } }));
      setUltimo(null);
      setError('');
      vibrar.toque();
      return;
    }

    setEnviando(true);
    setSumando(false);
    setError('');
    setUltimo(null);
    setOptimista({ fecha, menus });
    vibrar.toque();

    const menuTypeIds = idsDe(menus);
    const puntoId = info.pedido ? info.pedido.deliveryPointId : seleccion[fecha]?.puntoId;
    const base = { scheduleDate: fecha, menuTypeIds };
    const llamada = info.pedido
      ? axios.put(`${baseUrl}order/scheduled`,
          { orderId: info.pedido.id, menuTypeIds, deliveryPointId: puntoId }, cab)
      // La direccion solo se manda si el cliente eligio una: el backend usa
      // la de siempre cuando llega nula.
      : axios.post(`${baseUrl}order/scheduled`,
          [puntoId ? { ...base, deliveryPointId: puntoId } : base], cab);

    llamada
      .then(() => recargar())
      .then(() => {
        quitarDeSeleccion([fecha]);
        vibrar.exito();
        setUltimo({
          fecha,
          texto: texto || (info.pedido
            ? `Listo. Cambiaste tu pedido del ${nombreDia(fecha)}.`
            : (doble ? `Listo. Tu almuerzo y tu cena del ${nombreDia(fecha)} quedaron pedidos.` : `Listo. Tu almuerzo del ${nombreDia(fecha)} quedó pedido.`)),
          tipo: info.pedido ? 'cambio' : 'pedido',
          antes,
          /* Si el dia estaba en "no recibe", deshacer lo devuelve ahi. */
          eraNo: info.estado === 'no',
        });
        /* Recien pedido: pasa solo al siguiente dia que falta. */
        if (!info.pedido) {
          const faltan = porElegir.map((i) => i.fecha).filter((f) => f !== fecha);
          const sigue = faltan.find((f) => f > fecha) || faltan[0];
          if (sigue) saltar(sigue);
        }
      })
      .catch((e) => setError(mensajeDe(e, info.pedido
        ? 'No pudimos cambiar tu plato. Vuelve a intentarlo.'
        : 'No pudimos guardar tu pedido. Vuelve a intentarlo.')))
      .finally(() => { setEnviando(false); setOptimista(null); });
  };

  /** Tocar un plato. */
  const elegir = (fecha, comida, id) => {
    if (enviando || cancelando) return;
    const info = infoDia(fecha);
    const menus = menusDe(info);
    const deLaComida = menus[comida] || {};
    const cantidad = deLaComida[id] || 0;
    let nueva;

    if (sumando) {
      /* El tope de 5 por plato no es una regla del negocio, es un freno al
         dedo torpe: la cuenta real la lleva el plan. */
      nueva = { ...deLaComida, [id]: Math.min(5, cantidad + 1) };
    } else if (cantidad > 0 && Object.keys(deLaComida).length === 1) {
      /* Ya es el elegido. Con dos comidas y sin pedido todavia, tocarlo de
         nuevo lo suelta; con pedido no hay nada que hacer: para no recibir
         esta "No recibir este día". */
      if (!doble || info.pedido) return;
      nueva = {};
    } else {
      /* Reemplaza. Con dos comidas conserva cuantas porciones llevaba, para
         que almuerzo y cena sigan parejos. */
      nueva = { [id]: doble ? Math.max(totalEn(menus, comida), 1) : 1 };
    }
    aplicar(fecha, { ...menus, [comida]: nueva });
  };

  /** Porciones de un plato ya elegido. Cada una gasta un envio del plan. */
  const ponerCantidad = (fecha, comida, id, cantidad) => {
    if (enviando || cancelando) return;
    const info = infoDia(fecha);
    const menus = menusDe(info);
    const deLaComida = { ...(menus[comida] || {}) };
    const n = Math.max(0, Math.min(5, cantidad));
    if (n === 0) delete deLaComida[id];
    else deLaComida[id] = n;
    if (!Object.keys(deLaComida).length) return;
    const nuevos = { ...menus, [comida]: deLaComida };
    const total = enviosEn(nuevos);
    aplicar(fecha, nuevos,
      `${total} ${total === 1 ? 'porción' : 'porciones'} para el ${nombreDia(fecha)}.`);
  };

  /**
   * Cambia a que direccion va un dia ya pedido.
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
    }, cab)
      .then(() => recargar())
      .then(() => setHoja(null))
      .catch((e) => setError(mensajeDe(e, 'No pudimos cambiar la dirección de este día.')))
      .finally(() => setGuardandoDir(false));
  };

  /** La direccion de un dia: sobre el pedido si existe, anotada si aun no. */
  const elegirDireccion = (info, puntoId) => {
    if (info.pedido) {
      if (info.pedido.deliveryPointId !== puntoId) cambiarDireccion(info.pedido, puntoId);
      else setHoja(null);
      return;
    }
    setSeleccion((s) => ({ ...s, [info.fecha]: { ...s[info.fecha], puntoId } }));
    setHoja(null);
  };

  const guardarViaje = () => {
    if (!viaje.desde || !viaje.hasta) { setError('Elige desde cuándo y hasta cuándo.'); return; }

    setGuardandoPausa(true);
    setError('');
    setAvisoPausa('');

    axios.post(`${baseUrl}plan/pause`, { desde: viaje.desde, hasta: viaje.hasta }, cab)
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
        setHoja(null);
        setViaje({ desde: '', hasta: '' });
        cargarPausas();
        recargar();
      })
      .catch((e) => setError(mensajeDe(e, 'No pudimos guardar tu viaje.')))
      .finally(() => setGuardandoPausa(false));
  };

  const volviAntes = (pausaId) => {
    axios.delete(`${baseUrl}plan/pause/${pausaId}`, cab)
      .then(() => { setAvisoPausa('Listo, volvemos a prepararte tus días.'); cargarPausas(); recargar(); })
      .catch(() => setError('No pudimos reactivar tu plan.'));
  };

  // Cancelar devuelve el envio al saldo: el backend descuenta uno del consumo.
  // Solo se puede hasta las 22:00 del dia anterior, la misma regla que aplica
  // al programar; pasada esa hora el servidor responde con su motivo.
  const reprogramarDia = (pedido) => {
    const fecha = ymd(pedido.date);
    const antes = menusDe(infoDia(fecha), true);
    setCancelando(true);
    setError('');
    setUltimo(null);
    axios.post(`${baseUrl}order/reprogram?orderId=${pedido.id}`, null, cab)
      .then(() => recargar())
      .then(() => {
        /* Si quedaba una eleccion a medias para ese dia, se va con el pedido. */
        quitarDeSeleccion([fecha]);
        setUltimo({
          fecha, tipo: 'no', antes, puntoId: pedido.deliveryPointId,
          texto: `El ${nombreDia(fecha)} no recibes. Tu entrega vuelve a tu saldo.`,
        });
      })
      .catch((e) => setError(mensajeDe(e, 'No pudimos guardar que no recibes este día. Vuelve a intentarlo.')))
      .finally(() => setCancelando(false));
  };

  /* "No recibir este dia" sobre un dia sin pedido. Quien entra por primera
     vez ve toda la semana por elegir y cree que tiene que pedir todos los
     dias; esto le deja decir que no a uno sin gastar nada de su plan. */
  const marcarSinEnvio = (fecha) => {
    setCancelando(true);
    setError('');
    setUltimo(null);
    axios.post(`${baseUrl}order/sin-envio?fecha=${fecha}`, null, cab)
      .then(() => recargar())
      .then(() => {
        quitarDeSeleccion([fecha]);
        setUltimo({
          fecha, tipo: 'no', antes: null,
          texto: `El ${nombreDia(fecha)} no recibes. No se descuenta de tu plan.`,
        });
      })
      .catch((e) => setError(mensajeDe(e, 'No pudimos guardar. Vuelve a intentarlo.')))
      .finally(() => setCancelando(false));
  };

  /* Se arrepintio de decir que no: el dia vuelve a estar por elegir, sin
     crear pedido. */
  const siQuiero = (fecha) => {
    setCancelando(true);
    setError('');
    setUltimo(null);
    return axios.delete(`${baseUrl}order/sin-envio?fecha=${fecha}`, cab)
      .then(() => recargar())
      .catch((e) => setError(mensajeDe(e, 'No pudimos guardar. Vuelve a intentarlo.')))
      .finally(() => setCancelando(false));
  };

  /** Deja el dia como estaba antes del ultimo toque. */
  const deshacer = () => {
    const u = ultimo;
    if (!u || enviando || cancelando) return;
    const pedido = pedidos.find((o) => ymd(o.date) === u.fecha);
    setUltimo(null);
    setError('');
    if (u.fecha !== diaActivo) saltar(u.fecha);

    let llamada;
    if (u.tipo === 'pedido' && pedido) {
      /* Recien creado: se cancela, y como cancelar deja el dia marcado como
         "no recibe", se le quita esa marca para que vuelva a "Elegir". */
      llamada = axios.post(`${baseUrl}order/reprogram?orderId=${pedido.id}`, null, cab)
        .then(() => (u.eraNo ? null
          : axios.delete(`${baseUrl}order/sin-envio?fecha=${u.fecha}`, cab).catch(() => {})));
    } else if (u.tipo === 'cambio' && pedido) {
      llamada = axios.put(`${baseUrl}order/scheduled`,
        { orderId: pedido.id, menuTypeIds: idsDe(u.antes), deliveryPointId: pedido.deliveryPointId }, cab);
    } else if (u.tipo === 'no' && u.antes) {
      const base = { scheduleDate: u.fecha, menuTypeIds: idsDe(u.antes) };
      llamada = axios.post(`${baseUrl}order/scheduled`,
        [u.puntoId ? { ...base, deliveryPointId: u.puntoId } : base], cab);
    } else if (u.tipo === 'no') {
      llamada = axios.delete(`${baseUrl}order/sin-envio?fecha=${u.fecha}`, cab);
    } else return;

    setEnviando(true);
    llamada
      .then(() => recargar())
      .catch((e) => setError(mensajeDe(e, 'No pudimos deshacerlo. Vuelve a intentarlo.')))
      .finally(() => setEnviando(false));
  };

  /* ---------- "Elegir por mi": el primer plato de cada dia que falta ---------- */
  const porMi = porElegir.map((i) => {
    const previos = seleccion[i.fecha]?.menus || {};
    const menus = {};
    const nombres = [];
    comidas.forEach((c, k) => {
      const lista = platosDe(i.carta, c);
      if (totalEn(previos, c) > 0) menus[c] = previos[c];
      else {
        /* Con dos comidas, la segunda toma el siguiente plato de la carta
           para no repetir lo mismo en el almuerzo y en la cena. */
        const p = lista[Math.min(k, lista.length - 1)];
        if (p) menus[c] = { [p.id]: 1 };
      }
      Object.keys(menus[c] || {}).forEach((id) => {
        const p = lista.find((x) => String(x.id) === String(id));
        if (p?.menu?.name) nombres.push(doble ? `${mayus(NOMBRE_COMIDA[c] || c)}: ${p.menu.name}` : p.menu.name);
      });
    });
    return { fecha: i.fecha, menus, nombres };
  }).filter((x) => completoEn(x.menus));
  const topePorMi = (enviosRestantes === null || plan?.credits)
    ? porMi.length
    : Math.max(0, Math.min(porMi.length, enviosRestantes));
  const porMiPedir = porMi.slice(0, topePorMi);

  const pedirPorMi = () => {
    if (!porMiPedir.length || enviando) return;
    setEnviando(true);
    setError('');
    setUltimo(null);
    const lote = porMiPedir.map((x) => {
      const base = { scheduleDate: x.fecha, menuTypeIds: idsDe(x.menus) };
      const puntoId = seleccion[x.fecha]?.puntoId;
      return puntoId ? { ...base, deliveryPointId: puntoId } : base;
    });
    axios.post(`${baseUrl}order/scheduled`, lote, cab)
      .then(() => recargar())
      .then(() => {
        quitarDeSeleccion(porMiPedir.map((x) => x.fecha));
        vibrar.exito();
        setHoja(null);
        setUltimo({
          fecha: porMiPedir[0].fecha, tipo: 'lote', antes: null,
          texto: porMiPedir.length === 1
            ? `Pedido para el ${nombreDia(porMiPedir[0].fecha)}.`
            : `Pedimos ${porMiPedir.length} días por ti. Puedes cambiar cualquiera.`,
        });
      })
      .catch((e) => setError(mensajeDe(e, 'No pudimos guardar tu semana. Vuelve a intentarlo.')))
      .finally(() => setEnviando(false));
  };

  const cerrarHoja = useCallback(() => { setHoja(null); setError(''); }, []);

  /* ---------- cargando ---------- */
  /* Tambien mientras no se sabe en que dia abrir: asi no se ve un dia y, un
     instante despues, otro. */
  if (dias === null || (diaActivo === null && !falloCarga)) {
    return (
      <div className="nPant mnu" aria-busy="true" aria-label="Cargando tu menú">
        <span className="nMenta mnu__menta" aria-hidden="true" />
        <div className="mnu__dentro">
          <span className="mnu__hueso" style={{ width: '46%', height: 16 }} />
          <span className="mnu__hueso" style={{ width: '78%', height: 40, marginTop: 14 }} />
          <div className="mnu__dias" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span className="mnu__hueso mnu__hueso--dia" key={i} />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <div className="mnu__plato" key={i}>
              <span className="mnu__platoBtn">
                <span className="mnu__hueso mnu__hueso--foto" />
                <span className="mnu__platoTxt">
                  <span className="mnu__hueso" style={{ width: '82%', height: 15 }} />
                  <span className="mnu__hueso" style={{ width: '54%', height: 12, marginTop: 8 }} />
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- no se pudo cargar ---------- */
  if (falloCarga) {
    return (
      <div className="nPant mnu">
        <span className="nMenta mnu__menta" aria-hidden="true" />
        <div className="mnu__dentro mnu__vacio">
          <Isotipo size={34} />
          <h1>No pudimos cargar el menú</h1>
          <p>Revisa tu conexión y vuelve a intentarlo. Tus pedidos no cambiaron.</p>
          <motion.button type="button" className="mnu__boton" whileTap={{ scale: 0.97 }} transition={resorte.toque}
            onClick={() => { setDias(null); setFalloCarga(false); setVuelta((v) => v + 1); }}>
            Reintentar
          </motion.button>
        </div>
      </div>
    );
  }

  /* ---------- la pantalla ---------- */
  const activo = diaActivo && semana.fechas.includes(diaActivo) ? diaActivo : semana.fechas[0];
  const info = infoDia(activo);
  const menus = menusDe(info);
  const editable = ['listo', 'elegir', 'falta', 'no'].includes(info.estado) && info.abierto && info.hayPlatos;
  const ocupado = enviando || cancelando;

  const ini = semana.lunes;
  const fin = moment(semana.fechas[semana.fechas.length - 1]);
  const rango = ini.month() === fin.month()
    ? `${ini.format('D')} al ${fin.format('D [de] MMMM')}`
    : `${ini.format('D [de] MMMM')} al ${fin.format('D [de] MMMM')}`;

  const faltan = porElegir.length;
  const titular = sinPublicar ? 'Aún no hay menú'
    : faltan === 0 ? (listos > 0 ? 'Tu semana está lista' : 'Semana cerrada')
    : listos === 0 ? 'Elige tu semana'
    : `Te ${faltan === 1 ? 'falta 1 día' : `faltan ${faltan} días`}`;

  /* El plazo, dicho con el dia: "el dia anterior" obliga a hacer la cuenta. */
  const limite = moment(activo).subtract(1, 'day').startOf('day').hour(HORA_LIMITE);
  const cuandoCierra = limite.isSame(moment(), 'day') ? 'hoy'
    : limite.isSame(moment().add(1, 'day'), 'day') ? 'mañana'
    : `el ${limite.format('dddd')}`;

  /* A donde llega ese dia. */
  const habitual = puntos.find((p) => p.assigned) || (puntos.length === 1 ? puntos[0] : null);
  const idPunto = info.pedido ? info.pedido.deliveryPointId : seleccion[activo]?.puntoId;
  const punto = puntos.find((p) => p.id === idPunto) || (info.pedido ? null : habitual);
  const esHabitual = !!punto && !!habitual && punto.id === habitual.id;

  /* Lo que acompana al plato, segun SU plan: los extras que trae el paquete
     mas los adicionales que se le hayan marcado en el panel. No se lista lo
     que ese dia esta programado y ya: la entrada del dia es del paquete de
     una empresa, y mostrarsela a todos seria ofrecer algo que no les llega. */
  const fijos = [...new Set([
    ...(plan?.consumption?.extraBenefits || []),
    ...(plan?.consumption?.additional || []),
  ])].flatMap((t) => platosDe(info.carta, t).map((x) => ({ ...x, tipo: t })))
    .filter((x) => !comidas.includes(x.tipo));

  // Las calorias del dia: cada porcion suma, tambien la segunda del mismo plato.
  const kcal = comidas.reduce((suma, c) => suma + platosDe(info.carta, c).reduce(
    (s, p) => s + prop(p.menu, 'calor') * (menus[c]?.[p.id] || 0), 0), 0);
  const meta = plan?.needDay?.bmr ? Math.round(plan.needDay.bmr) : null;

  /* Con dos comidas, la misma carta sirve para el almuerzo y para la cena:
     una fila por plato y un boton por comida. */
  const filasDobles = (() => {
    if (!doble) return [];
    const mapa = new Map();
    comidas.forEach((c) => platosDe(info.carta, c).forEach((p) => {
      const clave = String(p.menu?.name || p.id).trim().toLowerCase();
      const fila = mapa.get(clave) || { clave, menu: p.menu, por: {} };
      fila.por[c] = p;
      mapa.set(clave, fila);
    }));
    return [...mapa.values()];
  })();
  const nombreElegido = (c) => {
    const ids = Object.keys(menus[c] || {});
    if (!ids.length) return 'falta elegir';
    return ids.map((id) => {
      const p = platosDe(info.carta, c).find((x) => String(x.id) === String(id));
      const n = menus[c][id];
      return (p?.menu?.name || 'plato elegido') + (n > 1 ? ` x${n}` : '');
    }).join(' y ');
  };

  const cojas = (() => {
    const totales = comidas.map((c) => totalEn(menus, c));
    return doble && totales.every((n) => n > 0) && new Set(totales).size > 1;
  })();

  const unaSola = !doble ? Object.keys(menus[comidas[0]] || {}).length === 1 : false;

  /* Lo que trae un pedido ya cerrado, con su comida delante. */
  const delPedido = (info.pedido?.items || [])
    .filter((i) => i?.menu?.name)
    .map((i) => ({ tipo: i.type, menu: i.menu }))
    .sort((a, b) => ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo));
  const etiquetaTipo = (t) => (NOMBRE_COMIDA[t] ? mayus(NOMBRE_COMIDA[t]) : (ETIQUETA_EXTRA[t] || 'Plato'));

  const usadasSemana = infos.reduce((t, i) => t + (i.pedido ? enviosEn(menusDe(i)) : 0), 0);

  return (
    <MotionConfig reducedMotion="user">
    <div className="nPant mnu">
      <span className="nMenta mnu__menta" aria-hidden="true" />
      <motion.div className="mnu__dentro" variants={cascada(0.05)} initial="oculto" animate="visible">

        {/* Va antes del titular a proposito: lo primero que tiene que registrar
            el colaborador al abrir es quien le esta pagando el almuerzo. */}
        {empresa?.corporativo &&
          <motion.div className="mnu__empresa" variants={sube}><FranjaEmpresa empresa={empresa} /></motion.div>}

        {/* Arriba, la semana que se esta viendo, con sus flechas para pasar a
            la anterior o a la siguiente. */}
        <motion.div className="mnu__cab" variants={sube}>
          <div className="mnu__semana">
            <button type="button" aria-label="Semana anterior" disabled={indiceSemana <= 0}
              onClick={() => irADia(mejorDia(semanas[indiceSemana - 1]))}><Glifo d={G.atras} chico /></button>
            <span>{rango}</span>
            <button type="button" aria-label="Semana siguiente" disabled={indiceSemana >= semanas.length - 1}
              onClick={() => irADia(mejorDia(semanas[indiceSemana + 1]))}><Glifo d={G.ir} chico /></button>
          </div>
          {doble && plan?.planName && <span className="mnu__plan">Plan {plan.planName}</span>}
        </motion.div>
        <motion.h1 className="mnu__titular" variants={sube}>{titular}</motion.h1>

        {/* El avance de la semana: un tramo por dia, lleno cuando ese dia ya
            esta resuelto. */}
        <motion.div className="mnu__avance" variants={sube}>
          <span className="mnu__tramos" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${infos.length}, minmax(0, 1fr))` }}>
            {infos.map((d, i) => (
              <i key={d.fecha}><motion.i initial={false} animate={{ scaleX: ['listo', 'cerrado', 'no', 'viaje'].includes(d.estado) ? 1 : 0 }}
                transition={{ ...resorte.suave, delay: i * 0.05 }} /></i>
            ))}
          </span>
          <span className="mnu__listos"><b>{listos}</b> de {infos.length} días listos</span>
        </motion.div>

        <LayoutGroup id="mnu-dias">
          <motion.div role="tablist" aria-label="Días de la semana" className="mnu__dias" variants={sube}
            style={{ gridTemplateColumns: `repeat(${infos.length}, minmax(0, 1fr))` }}>
            {infos.map((d) => {
              const on = d.fecha === activo;
              return (
                <button type="button" role="tab" key={d.fecha} aria-selected={on}
                  aria-label={`${mayus(nombreDia(d.fecha))}, ${d.marca}`}
                  className={`mnu__diaTab is-${d.estado}${on ? ' is-on' : ''}`}
                  onClick={() => irADia(d.fecha)}>
                  <small>{moment(d.fecha).format('ddd').replace('.', '')}</small>
                  <b>
                    {on && <motion.i layoutId="mnu-dia-on" className="mnu__diaOn" transition={resorte.toque} />}
                    <span>{moment(d.fecha).format('D')}</span>
                  </b>
                  <small className="mnu__marca">{d.marca}</small>
                </button>
              );
            })}
          </motion.div>
        </LayoutGroup>

        <motion.div variants={sube}>
        {/* El dia que llega entra desde el lado hacia el que se avanzo. No se
            espera a que salga el anterior: lo que se ve y se toca es siempre
            el dia elegido. */}
          <motion.div key={sinPublicar ? `sem-${indiceSemana}` : activo} className="mnu__dia"
            initial={seMovio.current ? { opacity: 0, x: 26 * sentido } : false} animate={{ opacity: 1, x: 0 }} transition={resorte.entra}>

            {sinPublicar ?
              <div className="mnu__aviso">
                <b>Esta semana aún no está publicada</b>
                <p>Los viernes publicamos el menú de la próxima semana y te avisamos para que elijas.</p>
              </div>
            :
            <>
              <div className="mnu__diaCab">
                <b>{mayus(nombreDia(activo))}</b>
                {info.abierto && ['listo', 'elegir', 'falta', 'no'].includes(info.estado)
                  ? <span className="mnu__cierra">Cierra {cuandoCierra}, {HORA_LIMITE_TEXTO}</span>
                  : info.estado !== 'sinMenu' && info.estado !== 'viaje' && <span className="mnu__cerro">Ya cerró</span>}
              </div>

              {doble && editable &&
                <p className="mnu__resumen">
                  {comidas.map((c) => `${mayus(NOMBRE_COMIDA[c] || c)}: ${nombreElegido(c)}.`).join(' ')}
                </p>}

              {info.estado === 'no' &&
                <p className="mnu__resumen">
                  Marcaste que no recibes este día.{info.abierto && info.hayPlatos ? ' Si eliges un plato, vuelve a quedar activo.' : ''}
                </p>}

              {info.estado === 'viaje' &&
                <div className="mnu__aviso">
                  <b>Estás de viaje</b>
                  <p>
                    Del {moment(info.pausa.start_date).format('D [de] MMMM')} al {moment(info.pausa.end_date).format('D [de] MMMM')} no
                    te preparamos nada. Tu plan vence más tarde.
                  </p>
                  <button type="button" className="mnu__enlace" onClick={() => volviAntes(info.pausa.id)}>Ya volví</button>
                </div>}

              {info.estado === 'sinMenu' &&
                <div className="mnu__aviso">
                  <b>Aún no publicamos este día</b>
                  <p>Los viernes publicamos el menú de la próxima semana y te avisamos.</p>
                </div>}

              {info.estado === 'pasado' &&
                <div className="mnu__aviso">
                  <b>Este día ya cerró</b>
                  <p>No quedó pedido para este día. Los pedidos cierran a las {HORA_LIMITE_TEXTO} del día anterior.</p>
                </div>}

              {info.estado === 'no' && !(info.abierto && info.hayPlatos) &&
                <div className="mnu__aviso">
                  <b>No recibes este día</b>
                  <p>Tu entrega volvió a tu saldo. Puedes usarla otro día.</p>
                </div>}

              {/* Dia con pedido que ya no se puede cambiar. */}
              {info.estado === 'cerrado' &&
                <>
                  <div className="mnu__lista">
                    {delPedido.length === 0 &&
                      <div className="mnu__plato"><span className="mnu__platoBtn">
                        <Foto /><span className="mnu__platoTxt"><b>Plato elegido</b></span>
                      </span></div>}
                    {delPedido.map((p, i) => (
                      <div className="mnu__plato" key={i}>
                        <span className="mnu__platoBtn">
                          <Foto menu={p.menu} />
                          <span className="mnu__platoTxt">
                            <b>{p.menu.name}</b>
                            <small>{etiquetaTipo(p.tipo)}{prop(p.menu, 'calor') ? ` · ${prop(p.menu, 'calor')} kcal` : ''}</small>
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mnu__nota">
                    {info.finalizado
                      ? 'Este pedido ya se cerró y no se puede cambiar.'
                      : `Ya está en cocina: se cerró a las ${HORA_LIMITE_TEXTO} del día anterior. Para cambios, escríbenos.`}
                  </p>
                </>}

              {/* Un plan, una comida: tocar el plato lo pide. */}
              {editable && !doble &&
                <LayoutGroup id={`mnu-platos-${activo}`}>
                  <div className="mnu__lista" role="radiogroup" aria-label="Platos del día">
                    {platosDe(info.carta, comidas[0]).map((p) => {
                      const cantidad = menus[comidas[0]]?.[p.id] || 0;
                      const on = cantidad > 0;
                      return (
                        <motion.div layout="position" transition={resorte.entra}
                          className={`mnu__plato${on ? ' is-on' : ''}`} key={p.id}>
                          {on && <motion.span className="mnu__marco" aria-hidden="true"
                            layoutId={unaSola ? 'mnu-marco' : undefined} transition={resorte.entra} />}
                          <motion.button type="button" role="radio" aria-checked={on} className="mnu__platoBtn"
                            whileTap={{ scale: 0.985 }} transition={resorte.toque}
                            onClick={() => elegir(activo, comidas[0], p.id)}>
                            <Foto menu={p.menu} />
                            <span className="mnu__platoTxt">
                              <b>{p.menu?.name}</b>
                              <Macros menu={p.menu} respaldo={mayus(NOMBRE_COMIDA[comidas[0]] || 'Plato')} />
                            </span>
                            <span className={`mnu__radio${on ? ' is-on' : ''}`}>
                              {on
                                ? <motion.span initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={resorte.toque}><Palomita /></motion.span>
                                : sumando && <span className="mnu__mas" aria-hidden="true">+</span>}
                            </span>
                          </motion.button>
                          {on && info.pedido &&
                            <motion.div className="mnu__cant" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                              transition={resorte.entra}>
                              <span className="mnu__paso">
                                <button type="button" aria-label={`Quitar una porción de ${p.menu?.name}`}
                                  disabled={ocupado || (cantidad <= 1 && unaSola)}
                                  onClick={() => ponerCantidad(activo, comidas[0], p.id, cantidad - 1)}>−</button>
                                <b aria-live="polite">{cantidad}</b>
                                <button type="button" aria-label={`Agregar una porción de ${p.menu?.name}`}
                                  disabled={ocupado || cantidad >= 5}
                                  onClick={() => ponerCantidad(activo, comidas[0], p.id, cantidad + 1)}>+</button>
                              </span>
                              <small>Usa {cantidad} {cantidad === 1 ? 'entrega' : 'entregas'} de tu plan</small>
                            </motion.div>}
                        </motion.div>
                      );
                    })}
                  </div>
                </LayoutGroup>}

              {/* Almuerzo y cena: la misma carta, y el cliente dice que va con que. */}
              {editable && doble &&
                <div className="mnu__lista" aria-label="Platos del día">
                  {filasDobles.map((f) => (
                    <div className="mnu__plato mnu__plato--doble" key={f.clave}>
                      <span className="mnu__platoBtn">
                        <Foto menu={f.menu} />
                        <span className="mnu__platoTxt">
                          <b>{f.menu?.name}</b>
                          <Macros menu={f.menu} respaldo="Viene con tu plan" />
                        </span>
                      </span>
                      <span className="mnu__para">
                        {comidas.filter((c) => f.por[c]).map((c) => {
                          const on = (menus[c]?.[f.por[c].id] || 0) > 0;
                          return (
                            <motion.button type="button" key={c} aria-pressed={on}
                              className={`mnu__paraBtn${on ? ' is-on' : ''}`}
                              whileTap={{ scale: 0.96 }} transition={resorte.toque}
                              onClick={() => elegir(activo, c, f.por[c].id)}>
                              {on ? `Es tu ${NOMBRE_COMIDA[c] || c}` : (PARA_COMIDA[c] || `Para ${c}`)}
                            </motion.button>
                          );
                        })}
                      </span>
                    </div>
                  ))}
                </div>}

              {/* Que significa cada punto de color de los platos. */}
              {editable &&
                <p className="mnu__macros mnu__leyenda" aria-hidden="true">
                  <i className="is-p">Proteína</i><i className="is-c">Carbohidratos</i><i className="is-g">Grasa</i>
                </p>}

              {/* Lo que resulta de la eleccion, en dos pastillas: que mas llega
                  ese dia y cuanto suma frente a su meta. Sin parrafos. */}
              {editable && (fijos.length > 0 || (kcal > 0 && meta)) &&
                <div className="mnu__pastillas">
                  {fijos.length > 0 &&
                    <span><Glifo d={G.vaso} chico />{fijos.map((x) => x.menu?.name).filter(Boolean).join(', ')} incluido</span>}
                  {kcal > 0 && meta &&
                    <span><Glifo d={G.rayo} chico /><b>{kcal}</b> de {meta} kcal</span>}
                </div>}

              {/* Almuerzo y cena viajan juntos: si no van parejos, el dia no
                  cierra y quedaria media racion suelta en cocina. */}
              {editable && cojas &&
                <p className="mnu__nota">
                  Tu plan entrega {comidas.map((c) => NOMBRE_COMIDA[c] || c).join(' y ')} el
                  mismo día, así que las cantidades tienen que ir parejas.
                  Pediste {comidas.map((c) => `${totalEn(menus, c)} ${NOMBRE_COMIDA[c] || c}`).join(' y ')}.
                </p>}

              {sumando &&
                <p className="mnu__sumando" role="status">
                  <span>Toca arriba el plato que quieres agregar. Usa 1 entrega más.</span>
                  <button type="button" className="mnu__enlace" onClick={() => setSumando(false)}>Cancelar</button>
                </p>}
            </>}
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {ultimo &&
            <motion.div role="status" className="mnu__hecho" key={ultimo.fecha + ultimo.texto}
              initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={resorte.entra}>
              <span className="mnu__hechoIc"><Palomita size={14} /></span>
              <span className="mnu__hechoTxt">{ultimo.texto}</span>
              {ultimo.tipo !== 'lote' &&
                <button type="button" onClick={deshacer} disabled={ocupado}>Deshacer</button>}
            </motion.div>}
        </AnimatePresence>

        {avisoPausa && <p className="mnu__ok" role="status">{avisoPausa}</p>}
        {error && !hoja && <p className="mnu__error" role="alert">{error}</p>}

        {/* A donde llega ese dia. */}
        {!sinPublicar && !['pasado', 'viaje', 'sinMenu'].includes(info.estado) &&
          <motion.div className="mnu__dir" variants={sube}>
            <Pin />
            <span className="mnu__dirTxt">
              <b>
                {punto
                  ? (punto.name ? `${punto.name} · ${punto.address}` : punto.address)
                  : (puntos.length ? 'Tu dirección habitual' : 'Agrega dónde recibir tu almuerzo')}
              </b>
              <small>{punto && !esHabitual ? 'Solo este día · ' : ''}Entre las {REPARTO.desde} y la {REPARTO.hasta}</small>
            </span>
            {puntos.length === 0
              ? <Link className="mnu__enlace" to="/ubicaciones">Agregar</Link>
              : info.abierto && info.estado !== 'cerrado' &&
                <button type="button" className="mnu__enlace" onClick={() => { setError(''); setHoja('direccion'); }}>
                  Cambiar
                </button>}
          </motion.div>}

        {/* Lo que se puede hacer, en botones cortos: el nombre basta. Lo que
            pasa con las entregas lo dice el aviso al tocar o la hoja que abre. */}
        <motion.div className="mnu__botones" variants={sube}>
          {editable && !doble && info.pedido && platosDe(info.carta, comidas[0]).length > 1 && !sumando &&
            <button type="button" disabled={ocupado} onClick={() => setSumando(true)}>
              <Glifo d={G.mas} /><b>Agregar plato</b>
            </button>}
          {editable && info.estado !== 'no' &&
            <button type="button" disabled={ocupado}
              onClick={() => (info.pedido ? reprogramarDia(info.pedido) : marcarSinEnvio(activo))}>
              <Glifo d={G.no} /><b>{cancelando ? 'Guardando…' : 'No recibir'}</b>
            </button>}
          {info.estado === 'no' && info.abierto &&
            <button type="button" disabled={ocupado} onClick={() => siQuiero(activo)}>
              <Glifo d={G.si} /><b>{cancelando ? 'Guardando…' : 'Sí recibir'}</b>
            </button>}
          {porMi.length > 0 &&
            <button type="button" disabled={ocupado} onClick={() => { setError(''); setHoja('porMi'); }}>
              <Glifo d={G.porMi} /><b>Elegir por mí</b>
            </button>}
          <button type="button" onClick={() => { setError(''); setAvisoPausa(''); setHoja('viaje'); }}>
            <Glifo d={G.viaje} /><b>Me voy de viaje</b>
          </button>
        </motion.div>

        {pausas.length > 0 &&
          <motion.div className="mnu__pausas" variants={sube}>
            {pausas.map((p) => (
              <div key={p.id}>
                <span>No estarás del {moment(p.start_date).format('D MMM')} al {moment(p.end_date).format('D MMM')}</span>
                <button type="button" className="mnu__enlace" onClick={() => volviAntes(p.id)}>Ya volví</button>
              </div>
            ))}
          </motion.div>}

        {/* El saldo en una linea. Las reglas, a un toque. */}
        <motion.div className="mnu__saldoFila" variants={sube}>
          {usadasSemana > 0 && enviosRestantes !== null
            ? <span><b>{Math.max(enviosRestantes, 0)}</b> {enviosRestantes === 1 ? 'entrega por usar' : 'entregas por usar'}</span>
            : <span />}
          <button type="button" className="mnu__enlace" onClick={() => setHoja('reglas')}>¿Cómo funciona?</button>
        </motion.div>
      </motion.div>

      {festejo > 0 && <Festejo key={festejo} />}
      <Jalar alSoltar={recargar} />

      {/* ---------- hojas ---------- */}
      <Hoja abierta={hoja === 'direccion'} alCerrar={cerrarHoja} etiqueta="¿Dónde te lo dejamos?" clase="mnuHoja">
        <span className="mnuHoja__etiqueta">{mayus(nombreDia(activo))}</span>
        <h1>¿Dónde te lo dejamos?</h1>
        <p className="mnuHoja__ayuda">Puedes recibir cada día en un lugar distinto.</p>
        <div role="radiogroup" aria-label="Tus direcciones">
          {puntos.map((d) => {
            const on = punto?.id === d.id;
            return (
              <button type="button" role="radio" aria-checked={on} key={d.id} className="mnuHoja__fila"
                disabled={guardandoDir} onClick={() => elegirDireccion(info, d.id)}>
                <Pin />
                <span className="mnuHoja__filaTxt">
                  {/* El nombre si existe; si no, la calle. */}
                  <b>{d.name || d.address}</b>
                  <small>{d.name ? d.address : d.description}</small>
                </span>
                <span className={`mnu__radio${on ? ' is-on' : ''}`}>{on && <Palomita />}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="mnu__error" role="alert">{error}</p>}
        <div className="mnuHoja__pie">
          <Link className="nHoja__btn mnuHoja__claro" to="/ubicaciones">
            Agregar {puntos.length === 0 ? 'una' : 'otra'} dirección
          </Link>
          <button type="button" className="nHoja__cerrar" onClick={cerrarHoja}>
            {guardandoDir ? 'Guardando…' : 'Listo'}
          </button>
        </div>
      </Hoja>

      <Hoja abierta={hoja === 'viaje'} alCerrar={cerrarHoja} etiqueta="¿Qué días no estarás?" clase="mnuHoja">
        <span className="mnuHoja__etiqueta">Me voy de viaje</span>
        <h1>¿Qué días no estarás?</h1>
        <p className="mnuHoja__ayuda">
          No te preparamos nada esos días, te devolvemos los envíos que ya
          estuvieran programados y tu plan vence más tarde.
        </p>
        <div className="mnuHoja__fechas">
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
        {error && <p className="mnu__error" role="alert">{error}</p>}
        <div className="mnuHoja__pie">
          <motion.button type="button" className="nHoja__btn" whileTap={{ scale: 0.97 }} transition={resorte.toque}
            disabled={guardandoPausa} onClick={guardarViaje}>
            {guardandoPausa ? 'Guardando…' : 'Avisar mi viaje'}
          </motion.button>
          <button type="button" className="nHoja__cerrar" onClick={cerrarHoja}>Ahora no</button>
        </div>
      </Hoja>

      <Hoja abierta={hoja === 'reglas'} alCerrar={cerrarHoja} etiqueta="Cómo funciona tu menú" clase="mnuHoja">
        <span className="mnuHoja__etiqueta">Tu menú</span>
        <h1>Cómo funciona</h1>
        <ul className="mnu__reglasHoja">
          <li><Glifo d={G.si} /><span><b>{doble ? 'Elige almuerzo y cena' : 'Toca un plato y queda pedido'}</b>
            <small>{doble ? 'El día queda pedido cuando eliges los dos, y gasta una sola entrega.' : 'No hay que confirmar nada más.'}</small></span></li>
          <li><Glifo d={G.porMi} /><span><b>Puedes cambiarlo</b><small>Hasta las {HORA_LIMITE_TEXTO} del día anterior.</small></span></li>
          <li><Glifo d={G.no} /><span><b>Si un día no quieres recibir</b><small>Marca "No recibir": no se prepara y no gasta entrega.</small></span></li>
          <li><Glifo d={G.mas} /><span><b>Si no eliges nada</b><small>Te armamos la semana con el plato del día, para que no te quedes sin almuerzo.</small></span></li>
        </ul>
        <div className="mnuHoja__pie">
          <button type="button" className="nHoja__btn" onClick={cerrarHoja}>Entendido</button>
        </div>
      </Hoja>

      <Hoja abierta={hoja === 'porMi'} alCerrar={cerrarHoja} etiqueta="Elegir por mí" clase="mnuHoja">
        <span className="mnuHoja__etiqueta">Elegir por mí</span>
        <h1>{porMiPedir.length === 1 ? 'Pedimos este día por ti' : 'Pedimos estos días por ti'}</h1>
        <p className="mnuHoja__ayuda">
          Te ponemos el primer plato de la carta en cada día que te falta. Después puedes cambiar cualquiera.
        </p>
        <div>
          {porMiPedir.map((x) => (
            <div className="mnuHoja__fila mnuHoja__fila--quieta" key={x.fecha}>
              <span className="mnuHoja__filaTxt">
                <small>{mayus(nombreDia(x.fecha))}</small>
                {x.nombres.map((n) => <b key={n}>{n}</b>)}
              </span>
            </div>
          ))}
        </div>
        {porMiPedir.length < porMi.length &&
          <p className="mnu__nota">
            {porMiPedir.length === 0
              ? 'No te quedan entregas en tu plan. Renueva para seguir pidiendo.'
              : `Te quedan ${porMiPedir.length} ${porMiPedir.length === 1 ? 'entrega' : 'entregas'}: pedimos solo ${porMiPedir.length === 1 ? 'el primer día' : `los primeros ${porMiPedir.length} días`}.`}
          </p>}
        {error && <p className="mnu__error" role="alert">{error}</p>}
        <div className="mnuHoja__pie">
          <motion.button type="button" className="nHoja__btn" whileTap={{ scale: 0.97 }} transition={resorte.toque}
            disabled={enviando || porMiPedir.length === 0} onClick={pedirPorMi}>
            {enviando ? 'Guardando…'
              : porMiPedir.length === 1 ? 'Pedir este día' : `Pedir estos ${porMiPedir.length} días`}
          </motion.button>
          <button type="button" className="nHoja__cerrar" onClick={cerrarHoja}>Ahora no</button>
        </div>
      </Hoja>
    </div>
    </MotionConfig>
  );
};

export default MenuFlow;
