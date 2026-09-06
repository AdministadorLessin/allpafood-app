import moment from 'moment';
import { primerDiaElegible, tiempoRestante, semanaDelCliente } from './../StatusBanner/estadoPlan';
import { REPARTO } from './../PedidoDeHoy/PedidoDeHoy';

/**
 * De donde salen los avisos.
 *
 * De ningun endpoint nuevo: los cuatro hechos que le importan al cliente ya
 * viajan en las respuestas que el panel pide al abrir. Lo unico que faltaba
 * era un sitio donde se acumulen, porque hasta hoy los tres primeros solo
 * llegaban por la difusion de WhatsApp de las 11 y el cuarto no llegaba nunca.
 *
 * Cada aviso lleva un id que describe el hecho, no el momento en que se
 * genero: "retraso-2026-09-06" es el mismo aviso aunque el cliente recargue
 * diez veces, asi que marcarlo como leido lo calla de verdad. Cuando cambia el
 * hecho —otro dia, otra cifra— cambia el id y vuelve a sonar.
 */
export function avisosDelCliente({ plan, ordenes, aviso, ahora = moment() }) {

  const lista = [];
  const hoy = ahora.clone().startOf('day');
  const claveHoy = hoy.format('YYYY-MM-DD');

  // 1. Retraso publicado desde el panel administrativo. Manda sobre todo lo
  //    demas: es la unica situacion en la que el cliente esta esperando.
  if (aviso && aviso.fecha && moment(aviso.fecha).format('YYYY-MM-DD') === claveHoy) {
    lista.push({
      id: `retraso-${claveHoy}`,
      tono: 'alerta',
      titulo: 'Tu entrega de hoy va con retraso',
      texto: aviso.mensaje
        ? aviso.mensaje
        : `Estamos entregando hasta las ${aviso.nuevaHora}. Tu pedido sigue en ruta.`,
      cuando: 'Hoy',
      ruta: '/',
      accion: 'Ver mi pedido',
    });
  }

  const pedidoHoy = (ordenes || []).find(
    (o) => moment(o.date).format('YYYY-MM-DD') === claveHoy
  );

  // 2. Salio a ruta. Reemplaza a la difusion de las 11: el cliente lo ve al
  //    abrir la app en vez de tener que buscar el mensaje en el chat.
  if (pedidoHoy && pedidoHoy.status === 'I' && !lista.some((a) => a.tono === 'alerta')) {
    lista.push({
      id: `ruta-${claveHoy}`,
      tono: 'ruta',
      titulo: 'Tu almuerzo salió a ruta',
      texto: `Llega entre las ${REPARTO.desde} y la ${REPARTO.hasta}. No hace falta que estés pendiente.`,
      cuando: 'Hoy',
      ruta: '/',
      accion: 'Seguir mi pedido',
    });
  }

  if (pedidoHoy && pedidoHoy.status === 'C') {
    lista.push({
      id: `entregado-${claveHoy}`,
      tono: 'ruta',
      titulo: 'Entregado',
      texto: 'Tu almuerzo de hoy ya llegó. Que lo disfrutes.',
      cuando: 'Hoy',
      ruta: '/',
      accion: 'Ver el detalle',
    });
  }

  if (plan) {
    // 3. Dias sin elegir con la ventana todavia abierta. Es el aviso que evita
    //    el "no me llegó nada" del dia siguiente.
    const porElegir = semanaDelCliente(ordenes, ahora).filter((d) => d.estado === 'elegir');
    if (porElegir.length > 0) {
      const queda = tiempoRestante(ahora);
      const manana = primerDiaElegible(ahora);
      lista.push({
        id: `programar-${claveHoy}-${porElegir.length}`,
        tono: 'aviso',
        titulo: porElegir.length === 1
          ? `Te falta elegir el ${porElegir[0].fecha.format('dddd')}`
          : `Te faltan ${porElegir.length} días por elegir`,
        texto: queda
          ? `Para recibir el ${manana.format('dddd')} tienes hasta las 10 p.m. de hoy` +
            ` — quedan ${queda.horas} h ${String(queda.minutos).padStart(2, '0')} min.`
          : 'La ventana de hoy ya cerró. Puedes elegir los días siguientes.',
        cuando: 'Esta semana',
        ruta: '/menu',
        accion: 'Elegir mis días',
      });
    }

    // 4. El plan se acaba. Por envios o por fecha, lo que llegue primero: son
    //    dos relojes distintos y el cliente solo suele mirar uno.
    const total = plan?.consumption?.orders?.total ?? 0;
    const usados = plan?.consumption?.orders?.consumed ?? 0;
    const restantes = Math.max(total - usados, 0);
    const vence = plan?.expirationDate ? moment(plan.expirationDate).startOf('day') : null;
    const dias = vence ? vence.diff(hoy, 'days') : null;
    const creditos = plan?.credits?.orders?.total ?? 0;

    if (creditos === 0 && restantes > 0 && restantes <= 3) {
      lista.push({
        id: `pocos-${restantes}`,
        tono: 'alerta',
        titulo: restantes === 1 ? 'Te queda 1 almuerzo' : `Te quedan ${restantes} almuerzos`,
        texto: 'Renueva antes de que se acaben para no cortar la semana.',
        cuando: 'Tu plan',
        ruta: '/planes',
        accion: 'Renovar mi plan',
      });
    }

    if (creditos === 0 && dias !== null && dias >= 0 && dias <= 5) {
      lista.push({
        id: `vence-${vence.format('YYYY-MM-DD')}`,
        tono: 'alerta',
        titulo: dias === 0 ? 'Tu plan vence hoy' : `Tu plan vence en ${dias} días`,
        texto: restantes > 0
          ? `Todavía tienes ${restantes} almuerzos sin usar. Después de esa fecha se pierden.`
          : `Vence el ${vence.format('D [de] MMMM')}.`,
        cuando: 'Tu plan',
        ruta: '/mi-plan',
        accion: 'Ver mi plan',
      });
    }

    if (creditos > 0 && restantes <= 3) {
      lista.push({
        id: `credito-${creditos}`,
        tono: 'bien',
        titulo: 'Tienes otro plan esperando',
        texto: `${creditos} almuerzos más que arrancan solos cuando termines el actual.`,
        cuando: 'Tu plan',
        ruta: '/mi-plan',
        accion: 'Ver mi plan',
      });
    }
  }

  return lista;
}

/* Los leidos viven en el navegador. Un aviso leido no es un dato de negocio:
   no vale la pena una tabla ni un endpoint para que el punto rojo se apague. */
const LLAVE = 'af_avisos_leidos';

export function leerLeidos() {
  try {
    const crudo = window.localStorage.getItem(LLAVE);
    return new Set(crudo ? JSON.parse(crudo) : []);
  } catch (e) {
    return new Set();
  }
}

export function guardarLeidos(conjunto) {
  try {
    // Solo se guardan los ids vigentes: si no, la lista crece para siempre con
    // avisos de meses que ya pasaron.
    window.localStorage.setItem(LLAVE, JSON.stringify([...conjunto].slice(-40)));
  } catch (e) { /* modo privado: el punto rojo vuelve, nada mas */ }
}
