import moment from 'moment';

// Debe coincidir con schedule.order.max_hour del backend.
export const HORA_LIMITE = 22;

/* Como se le dice al cliente. "22:00" se lee como hora de oficina; la
   gente dice "10 de la noche". */
export const HORA_LIMITE_TEXTO = '10:00 p.m.';

const DIAS_HABILES = [1, 2, 3, 4, 5]; // lunes a viernes

/* Dias en que el cliente pidio NO recibir: los que reprogramo y los de sus
   viajes. Sin esto el panel le decia "te falta elegir el martes" justo
   despues de que el cancelo el martes, y parecia que no se habia guardado. */
const diasLibres = new Set();
export function fijarDiasLibres(reprogramados, pausas) {
  diasLibres.clear();
  (reprogramados || []).forEach((f) => diasLibres.add(moment(f).format('YYYY-MM-DD')));
  (pausas || []).forEach((p) => {
    const c = moment(p.start_date);
    const fin = moment(p.end_date);
    while (c.isSameOrBefore(fin, 'day')) { diasLibres.add(c.format('YYYY-MM-DD')); c.add(1, 'day'); }
  });
}
export const esDiaLibre = (fecha) => diasLibres.has(moment(fecha).format('YYYY-MM-DD'));

/**
 * Primer dia que el cliente todavia puede elegir. El servidor acepta pedidos
 * para manana hasta las 22:00; pasada esa hora el primer dia libre es pasado
 * manana.
 */
export function primerDiaElegible(ahora = moment()) {
  return ahora.clone().add(ahora.hour() >= HORA_LIMITE ? 2 : 1, 'days').startOf('day');
}

/** Cuantas horas y minutos faltan para que cierre la ventana de hoy. */
export function tiempoRestante(ahora = moment()) {
  const cierre = ahora.clone().hour(HORA_LIMITE).minute(0).second(0);
  if (ahora.isAfter(cierre)) return null;
  const mins = cierre.diff(ahora, 'minutes');
  return { horas: Math.floor(mins / 60), minutos: mins % 60 };
}

/**
 * La semana que le importa al cliente, con la misma regla que usa el servidor
 * en getOrdersOfWeek: en sabado y domingo la semana en curso ya termino, asi
 * que se mira la siguiente.
 *
 * Sin esto la tira pintaba el lunes anterior y los pedidos recien guardados
 * para la semana entrante no coincidian con ningun dia: todos salian "sin
 * pedido".
 */
export function semanaRelevante(ahora) {
  const hoy = (ahora || moment()).clone();
  const finDeSemana = hoy.isoWeekday() >= 6;
  const lunes = finDeSemana
    ? hoy.clone().add(1, 'week').startOf('isoWeek')
    : hoy.clone().startOf('isoWeek');
  return { lunes, viernes: lunes.clone().add(4, 'days') };
}

function diasHabilesPendientes(ordenes, ahora = moment()) {
  const desde = primerDiaElegible(ahora);
  const hastaViernes = semanaRelevante(ahora).viernes.startOf('day');
  if (desde.isAfter(hastaViernes)) return [];

  const conOrden = new Set(
    (ordenes || []).map((o) => moment(o.date || o.deliveryDate).format('YYYY-MM-DD'))
  );

  const pendientes = [];
  const cursor = desde.clone();
  while (cursor.isSameOrBefore(hastaViernes)) {
    if (DIAS_HABILES.includes(cursor.isoWeekday()) && !conOrden.has(cursor.format('YYYY-MM-DD'))
        && !diasLibres.has(cursor.format('YYYY-MM-DD'))) {
      pendientes.push(cursor.clone());
    }
    cursor.add(1, 'day');
  }
  return pendientes;
}

/** "del jueves y viernes", "del jueves" — para que el titulo diga cuales. */
function listaDias(dias) {
  const nombres = dias.map((d) => d.format('dddd'));
  if (nombres.length === 1) return `del ${nombres[0]}`;
  if (nombres.length === 2) return `del ${nombres[0]} y ${nombres[1]}`;
  return `de tus ${nombres.length} días pendientes`;
}

/**
 * Decide que decirle al cliente. Devuelve siempre un objeto con tono, titulo,
 * detalle y accion: la pantalla solo pinta, no decide.
 *
 * El orden importa: gana la situacion mas urgente.
 */
export function estadoDelPanel({ plan, ordenes, creditos, ahora = moment() }) {
  if (!plan) {
    return {
      tono: 'dark',
      titularPrefijo: 'Todavía no tienes ', titularFuerte: 'un plan activo',
      encabezado: 'Tu cuenta',
      titulo: 'Elige tu plan y empieza esta semana',
      detalle: 'Elige un plan y empieza a recibir tus almuerzos esta semana.',
      accion: { texto: 'Ver planes', a: '/planes' },
    };
  }

  const total = plan?.consumption?.orders?.total ?? 0;

  /* Envios que el cliente YA RECIBIO, no los que tiene elegidos.
     El plan descuenta el envio al elegir, asi que quien arma la semana el
     lunes queda con cinco descontados de golpe. El cliente no cuenta asi:
     para el, un envio es un almuerzo que le llego a la puerta. Con el
     contador de elegidos, a 92 de 253 clientes les diriamos "se te acaba el
     plan" cuando en promedio les faltan nueve almuerzos por comer, y el
     aviso se quema para cuando de verdad haga falta. */
  const entregados = (ordenes || []).filter((o) => o.status === 'C').length;
  const restantes = Math.max(total - entregados, 0);

  /* Los que ya estan pedidos y todavia no llegan. Sirven para no decirle
     "renueva" a quien tiene la semana entera por delante. */
  const porLlegar = (ordenes || []).filter(
    (o) => o.status !== 'X' && o.status !== 'C' && moment(o.date).isSameOrAfter(ahora, 'day')
  ).length;

  const vence = plan?.expirationDate ? moment(plan.expirationDate) : null;
  const diasParaVencer = vence ? vence.startOf('day').diff(ahora.clone().startOf('day'), 'days') : null;

  if (restantes === 0) {
    /* "Ya usaste" a quien todavia tiene almuerzos por recibir esta semana
       sonaba a que no le iba a llegar nada. */
    const porRecibir = (ordenes || []).some((o) => moment(o.date).isSameOrAfter(ahora, 'day'));
    return {
      tono: 'dark',
      titularPrefijo: porRecibir ? 'Ya programaste ' : 'Ya usaste ', titularFuerte: 'todos tus envíos',
      encabezado: 'Tu plan',
      titulo: 'Renueva y sigue sin interrupción',
      detalle: 'Renueva para seguir recibiendo tus almuerzos sin interrupción.',
      accion: { texto: 'Renovar mi plan', a: '/planes' },
    };
  }

  /* Tres almuerzos por recibir, o cinco dias para vencer. Es el momento en
     que todavia hay margen para renovar sin que se le corte la semana: de 30
     renovaciones, 29 ocurrieron ANTES de que venciera el plan y ninguna
     despues de una semana. Si no se le avisa aqui, se pierde. */
  if (restantes <= 3 || (diasParaVencer !== null && diasParaVencer <= 5)) {
    const porEnvios = restantes <= 3;
    return {
      tono: 'dark',
      encabezado: vence ? `Tu plan vence el ${vence.format('D [de] MMMM')}` : 'Tu plan',
      titularPrefijo: porEnvios ? 'Te quedan ' : 'Tu plan está ',
      titularFuerte: porEnvios
        ? `${restantes} ${restantes === 1 ? 'almuerzo' : 'almuerzos'}`
        : 'por vencer',
      titulo: 'Renueva y sigue sin cortes',
      detalle: porLlegar > 0
        ? `Tienes ${porLlegar} ${porLlegar === 1 ? 'almuerzo pedido' : 'almuerzos pedidos'} por llegar. `
          + 'Si renuevas ahora, lo que te sobre se suma al plan nuevo.'
        : 'Si renuevas ahora, los envíos que te sobran se suman al plan nuevo. No se pierden.',
      accion: { texto: 'Renovar mi plan', a: '/planes' },
    };
  }

  const pendientes = diasHabilesPendientes(ordenes, ahora);

  if (pendientes.length > 0) {
    const restan = tiempoRestante(ahora);
    const cierraHoy = restan && pendientes[0].isSame(ahora.clone().add(1, 'day'), 'day');
    return {
      tono: cierraHoy ? 'urgente' : 'accion',
      encabezado: cierraHoy
        ? `Te quedan ${restan.horas} h ${restan.minutos} min`
        : `Se elige hasta las ${HORA_LIMITE_TEXTO} del día anterior`,
      titularPrefijo: 'Te falta elegir ',
      titularFuerte: pendientes.length === 1 ? '1 día' : `${pendientes.length} días`,
      titulo: `Elige tus platos ${listaDias(pendientes)}`,
      detalle: 'Después de esa hora tu pedido entra a cocina y ya no se puede cambiar.',
      accion: { texto: 'Elegir mis platos', a: '/menu' },
    };
  }

  if (creditos) {
    return {
      tono: 'calmo',
      titularPrefijo: 'Todo listo, ', titularFuerte: 'tu semana está lista',
      encabezado: 'Todo en orden',
      titulo: 'Tu semana está completa',
      detalle: 'Tienes además un plan comprado esperando: empieza solo cuando termines el actual.',
      accion: { texto: 'Ver mi plan', a: '/facturacion' },
    };
  }

  return {
    tono: 'calmo',
    titularPrefijo: 'Todo listo, ', titularFuerte: 'no tienes nada pendiente',
    encabezado: 'Todo en orden',
    titulo: 'Tu semana está completa',
    detalle: 'Los viernes publicamos el menú de la próxima semana y te avisamos.',
    accion: null,
  };
}


/**
 * Estado de cada dia habil de la semana en curso, para la tira del panel.
 *
 * /dashboard/orders no devuelve el estado del pedido, asi que se deriva de las
 * fechas: es informacion honesta y no obliga a tocar el backend.
 */
export function semanaDelCliente(ordenes, ahora) {
  ahora = ahora || moment();
  const conOrden = new Map(
    (ordenes || []).map((o) => [moment(o.date).format('YYYY-MM-DD'), o])
  );
  const primeroElegible = primerDiaElegible(ahora);
  const hoy = ahora.clone().startOf('day');

  const dias = [];
  const cursor = semanaRelevante(ahora).lunes.clone();
  for (let i = 0; i < 5; i += 1) {
    const clave = cursor.format('YYYY-MM-DD');
    const orden = conOrden.get(clave);
    let estado;

    /* 'F' es una entrega que salio y no se pudo dejar. El cliente tiene que
       verla: cuando el fallo es suyo —no estaba, no contesto— el envio se le
       descuenta igual, y enterarse de eso sin explicacion es exactamente lo
       que termina en un reclamo. */
    if (orden && orden.status === 'F') estado = 'noEntregado';
    else if (cursor.isBefore(hoy)) estado = orden ? 'entregado' : 'pasado';
    /* Hoy: "en ruta" solo desde la salida de las 10:30, igual que la tarjeta
       del pedido de hoy. Antes decia "En ruta" a las 8 a.m. mientras la
       tarjeta de arriba decia "en preparacion". */
    else if (cursor.isSame(hoy)) {
      if (!orden) estado = 'pasado';
      else if (orden.status === 'C') estado = 'entregado';
      else estado = ahora.clone().hour(10).minute(30).isAfter(ahora) && orden.status !== 'I' ? 'hoy' : 'enRuta';
    }
    else if (orden) estado = 'listo';
    else if (diasLibres.has(clave)) estado = 'reprogramado';
    else if (cursor.isBefore(primeroElegible)) estado = 'cerrado';
    else estado = 'elegir';

    dias.push({
      fecha: cursor.clone(),
      etiqueta: cursor.format('ddd'),
      numero: cursor.format('D'),
      estado,
      orden,
    });
    cursor.add(1, 'day');
  }
  return dias;
}

export const TEXTO_ESTADO = {
  noEntregado: 'No entregado',
  entregado: 'Entregado',
  enRuta: 'En ruta',
  hoy: 'Llega hoy',
  reprogramado: 'Sin envío',
  listo: 'Listo',
  elegir: 'Elegir',
  cerrado: 'Cerrado',
  pasado: 'Sin pedido',
};
