import React from "react";
import moment from 'moment';

import './PedidoDeHoy.scss';
import { motion, alToque } from './../../ultil/Motion/Motion';

/* Horario de reparto: una sola fuente para toda la app. De aqui salen el menu
   semanal, los avisos de la campana, el pedido de hoy y la pantalla de
   inscripcion, asi que cambiarlo aqui alcanza.
   Lo que NO sale de aqui son las plantillas de WhatsApp aprobadas en Meta: si
   alguna menciona la hora, hay que corregirla en Meta Business Manager. */
export const REPARTO = {
  desde: '10:30',
  hasta: '1:30 p.m.',
  horaCierre: 13.5,      // 1:30 p.m. en horas decimales
  margenGracia: 0.5,     // media hora antes de reconocer el retraso
};

/* Numero de atencion. El enlace lleva el pedido escrito para que quien
   responde no tenga que preguntar "¿cual es tu nombre?". */
const WHATSAPP = '51955797697';

// El pie de "En camino" depende de la hora vigente: con un aviso publicado, la
// hora original ya no es cierta y dejarla ahi contradice al titular.
const pasos = (horaVigente) => ([
  { clave: 'P', titulo: 'En preparación', pie: 'La cocina lo está armando' },
  { clave: 'I', titulo: 'En camino',      pie: `Llega antes de las ${horaVigente}` },
  { clave: 'C', titulo: 'Entregado',      pie: 'Que lo disfrutes' },
]);

const Marca = ({ hecho, actual }) => (
  <span className={`afPaso__marca${hecho ? ' afPaso__marca--hecho' : ''}${actual ? ' afPaso__marca--actual' : ''}`}>
    {hecho &&
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
           strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>}
  </span>
);

/**
 * El pedido de hoy, con su estado real.
 *
 * Existe para responder sin intermediarios las tres preguntas que hoy llegan
 * todas por WhatsApp: ¿ya salio?, ¿a que hora llega?, ¿que pedi?. El estado
 * viene de tbl_order y ya se escribia; solo no se mostraba.
 */
const PedidoDeHoy = ({ ordenes, direccion, aviso }) => {

  const hoy = moment().format('YYYY-MM-DD');
  const pedido = (ordenes || []).find((o) => moment(o.date).format('YYYY-MM-DD') === hoy);

  if (!pedido) return null;

  /* El estado que se muestra, no el crudo.
     - A partir de la hora de reparto, un pedido "en preparacion" ya salio: las
       rutas parten antes de las 10:30 y la pantalla no puede seguir diciendo
       que la cocina lo esta armando mientras va en la moto.
     - Un pedido que no se pudo entregar, o cancelado, no es "en preparacion":
       antes caia ahi por defecto y el cliente esperaba algo que ya no iba a
       llegar. */
  const [hDesde, mDesde] = REPARTO.desde.split(':').map(Number);
  const yaSalio = moment().isSameOrAfter(moment().hour(hDesde).minute(mDesde).second(0));
  const crudo = pedido.status || 'P';
  const estado = crudo === 'P' && yaSalio ? 'I' : crudo;

  if (estado === 'F' || estado === 'X') {
    return (
      <div className="afHoyPedido afHoyPedido--retraso">
        <div className="afHoyPedido__cab">
          <span className="afHoyPedido__et">Tu pedido de hoy</span>
        </div>
        <p className="afHoyPedido__promesa">
          {estado === 'F' ? <>Hoy <b>no pudimos entregarlo</b></> : <>Este pedido <b>se canceló</b></>}
        </p>
        {estado === 'F' && pedido.deliveryNote &&
          <p className="afHoyPedido__nota">Motivo: {pedido.deliveryNote}</p>}
        <a className="afHoyPedido__ayuda"
           href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido #${pedido.id} del ${moment(pedido.date).format('D [de] MMMM')}.`)}`}
           target="_blank" rel="noreferrer">
          Escríbenos por WhatsApp
        </a>
      </div>
    );
  }

  /* Entregado: ya no hay nada que seguir. Queda una linea corta de
     confirmacion durante el reparto —por si abre la app a preguntar "¿ya
     llego?"— y desde las 2 p.m. la tarjeta desaparece del panel. */
  if (estado === 'C') {
    if (moment().hour() >= 14) return null;
    return (
      <div className="afHoyPedido afHoyPedido--listo">
        <p className="afHoyPedido__promesa">
          Tu pedido de hoy <b>ya fue entregado</b>. ¡Que lo disfrutes!
        </p>
      </div>
    );
  }

  const indice = Math.max(pasos(REPARTO.hasta).findIndex((p) => p.clave === estado), 0);
  const platos = (pedido.items || []).map((i) => i?.menu?.name).filter(Boolean).join(' · ');

  // Si pasa la hora prometida y el pedido sigue en ruta, la pantalla lo
  // reconoce sola. El objetivo es que el cliente NUNCA descubra el retraso por
  // su cuenta: un retraso avisado cuesta la mitad que uno que se nota solo.
  const ahoraHoras = moment().hour() + moment().minute() / 60;

  // El aviso del panel gana sobre el reloj: el equipo suele saber que va tarde
  // horas antes de que se note. Si lo publicaron, se muestra desde ese momento
  // aunque todavia no sean las 1:30.
  const avisoActivo = !!aviso && estado !== 'C';
  const retrasado = avisoActivo
    || (estado !== 'C' && ahoraHoras > REPARTO.horaCierre);
  const porRetrasarse = !retrasado && estado !== 'C'
    && ahoraHoras > REPARTO.horaCierre - REPARTO.margenGracia;

  const mensaje = encodeURIComponent(
    `Hola, tengo una consulta sobre mi pedido #${pedido.id} del ${moment(pedido.date).format('D [de] MMMM')}.`
  );

  return (
    <div className={`afHoyPedido${retrasado ? ' afHoyPedido--retraso' : ''}`}>
      <div className="afHoyPedido__cab">
        <span className="afHoyPedido__et">Tu pedido de hoy</span>
        {platos && <span className="afHoyPedido__plato">{platos}</span>}
      </div>

      {/* La frase ancla en la hora final, no en la inicial: si el cliente se
          queda con las 10:30 en la cabeza, a las 10:45 ya se siente tarde. */}
      <p className="afHoyPedido__promesa">
        {estado === 'C' && 'Entregado'}
        {estado !== 'C' && retrasado && (
          aviso && aviso.nuevaHora
            ? <>Hoy llega <b>hasta las {aviso.nuevaHora}</b></>
            : <>Vamos <b>retrasados</b></>
        )}
        {estado !== 'C' && !retrasado && <>Llega <b>antes de la {REPARTO.hasta}</b></>}
      </p>

      {/* Reconocerlo con nombre propio, sin rodeos ni disculpa larga: el cliente
          ya sabe que es tarde, negarlo o adornarlo lo enoja mas. */}
      {retrasado &&
        <p className="afHoyPedido__aviso">
          {aviso && aviso.mensaje
            ? aviso.mensaje
            : `Tu almuerzo sigue en ruta y va a llegar después de la hora que te
               prometimos. Lo sentimos: ya está en manos del repartidor y es la
               siguiente parada que tiene pendiente.`}
        </p>
      }

      {porRetrasarse &&
        <p className="afHoyPedido__aviso afHoyPedido__aviso--suave">
          Estamos en la última media hora del reparto. Si algo se retrasa, te
          avisamos aquí mismo.
        </p>
      }

      <ol className="afPasos">
        {pasos(aviso && aviso.nuevaHora ? aviso.nuevaHora : REPARTO.hasta).map((p, i) => (
          <li key={p.clave} className={`afPaso${i <= indice ? ' afPaso--activo' : ''}`}>
            <Marca hecho={i < indice || (i === indice && estado === 'C')} actual={i === indice} />
            <span className="afPaso__txt">
              <b>{p.titulo}</b>
              <small>{p.pie}</small>
            </span>
          </li>
        ))}
      </ol>

      {direccion &&
        <p className="afHoyPedido__dir">
          Entregamos en <b>{direccion.description}</b> · {direccion.address}
        </p>
      }

      {/* Solo aparece cuando ya salio: antes de eso no hay nada que consultar,
          y ofrecer el boton invita a escribir sin motivo. */}
      {/* Devolverle una decision es lo que desactiva la molestia: la rabia
          viene de no poder hacer nada, no de la espera. Casi nadie lo usa —
          quiere su comida— pero tener la salida cambia como se siente. */}
      {retrasado &&
        <p className="afHoyPedido__salida">
          Si ya no lo necesitas hoy, escríbenos y te devolvemos el envío a tu
          saldo para que lo uses otro día.
        </p>
      }

      {(estado === 'I' || retrasado) &&
        <motion.a
          className="afHoyPedido__ayuda"
          href={`https://wa.me/${WHATSAPP}?text=${mensaje}`}
          target="_blank" rel="noreferrer" {...alToque}
        >
          {retrasado ? 'Escribirnos sobre mi entrega' : '¿Algo no va bien con tu entrega?'}
        </motion.a>
      }
    </div>
  );
};

export default PedidoDeHoy;
