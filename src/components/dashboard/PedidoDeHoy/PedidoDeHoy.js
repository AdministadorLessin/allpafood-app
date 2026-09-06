import React from "react";
import moment from 'moment';

import './PedidoDeHoy.scss';
import { motion, alToque } from './../../ultil/Motion/Motion';

/* Horario de reparto. Si cambia la operacion, se cambia aqui y en el mensaje
   de WhatsApp: hoy el cliente solo se entera por la difusion de las 11. */
export const REPARTO = {
  desde: '11:00',
  hasta: '1:30 p.m.',
  horaCierre: 13.5,      // 1:30 p.m. en horas decimales
  margenGracia: 0.5,     // media hora antes de reconocer el retraso
};

/* Numero de atencion. El enlace lleva el pedido escrito para que quien
   responde no tenga que preguntar "¿cual es tu nombre?". */
const WHATSAPP = '51999999999';

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
// forzarRetraso solo lo usa /preview-ux, para ver el estado sin esperar
// a que sean las 1:30 de la tarde.
const PedidoDeHoy = ({ ordenes, direccion, forzarRetraso, aviso }) => {

  const hoy = moment().format('YYYY-MM-DD');
  const pedido = (ordenes || []).find((o) => moment(o.date).format('YYYY-MM-DD') === hoy);

  if (!pedido) return null;

  const estado = pedido.status || 'P';
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
  const retrasado = forzarRetraso || avisoActivo
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
          queda con las 11:00 en la cabeza, a las 11:15 ya se siente tarde. */}
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
