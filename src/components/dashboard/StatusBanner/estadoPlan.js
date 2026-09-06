import moment from 'moment';

// Debe coincidir con schedule.order.max_hour del backend.
export const HORA_LIMITE = 22;

const DIAS_HABILES = [1, 2, 3, 4, 5]; // lunes a viernes

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
    if (DIAS_HABILES.includes(cursor.isoWeekday()) && !conOrden.has(cursor.format('YYYY-MM-DD'))) {
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
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const restantes = Math.max(total - usados, 0);
  const vence = plan?.expirationDate ? moment(plan.expirationDate) : null;
  const diasParaVencer = vence ? vence.startOf('day').diff(ahora.clone().startOf('day'), 'days') : null;

  if (restantes === 0) {
    return {
      tono: 'dark',
      titularPrefijo: 'Ya usaste ', titularFuerte: 'todos tus envíos',
      encabezado: 'Tu plan',
      titulo: 'Renueva y sigue sin interrupción',
      detalle: 'Renueva para seguir recibiendo tus almuerzos sin interrupción.',
      accion: { texto: 'Renovar mi plan', a: '/planes' },
    };
  }

  if (restantes <= 3 || (diasParaVencer !== null && diasParaVencer <= 5)) {
    return {
      tono: 'dark',
      encabezado: vence ? `Tu plan vence el ${vence.format('D [de] MMMM')}` : 'Tu plan',
      titularPrefijo: restantes <= 3 ? 'Te quedan ' : 'Tu plan está ',
      titularFuerte: restantes <= 3 ? `${restantes} ${restantes === 1 ? 'envío' : 'envíos'}` : 'por vencer',
      titulo: 'Renueva y no pierdas lo que te sobra',
      detalle: 'Si renuevas ahora, los envíos que te sobran se suman al plan nuevo. No se pierden.',
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
        : `Cierra a las ${HORA_LIMITE}:00 del día anterior`,
      titularPrefijo: pendientes.length === 1 ? 'Te falta ' : 'Te faltan ',
      titularFuerte: pendientes.length === 1 ? '1 almuerzo' : `${pendientes.length} almuerzos`,
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

    if (cursor.isBefore(hoy)) estado = orden ? 'entregado' : 'pasado';
    else if (cursor.isSame(hoy)) estado = orden ? 'enRuta' : 'pasado';
    else if (orden) estado = 'listo';
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
  entregado: 'Entregado',
  enRuta: 'En ruta',
  listo: 'Listo',
  elegir: 'Elegir',
  cerrado: 'Cerrado',
  pasado: 'Sin pedido',
};
