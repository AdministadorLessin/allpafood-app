import React, { useState } from "react";
import moment from 'moment';
import 'moment/locale/es';

import TabBar from './../../components/TabBar/TabBar';
import { PLATOS, DIRECCIONES, dia, objetivo } from './datosEjemplo';

/**
 * SOLO DESARROLLO. Maquetas navegables del flujo de tres pasos para elegir el
 * menu, con la direccion por dia.
 *
 * Todavia no estan conectadas al API: sirven para revisar la interfaz antes de
 * construirla contra los endpoints reales.
 */

const Ico = ({ d, className }) => (
  <svg className={className || 'afIc'} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const PIN = "M12 21.2s6.4-6.2 6.4-11a6.4 6.4 0 1 0-12.8 0c0 4.8 6.4 11 6.4 11Z";
const RELOJ = "M12 12V7.4M12 12l3.1 2";

const DIAS = [
  { n: 0, estado: 'listo',    dir: 0 },
  { n: 1, estado: 'listo',    dir: 0 },
  { n: 2, estado: 'cerrado',  dir: null },
  { n: 3, estado: 'elegir',   dir: 0 },
  { n: 4, estado: 'elegir',   dir: 1 },
];
const TXT = { listo: 'Listo', cerrado: 'Cerrado', elegir: 'Elegir' };

/* ---------- Paso 1: la semana ---------- */
export const PasoSemana = ({ onDia }) => (
  <>
    <p className="afMenu__paso">Paso 1 de 3</p>
    <h1 className="afPanel__titular">¿Qué día quieres elegir?</h1>
    <p className="afMenu__ayuda">
      Los días en verde ya están resueltos. Toca uno en menta para escoger tu plato
      y a dónde te llega.
    </p>

    <div className="afCard">
      <div className="afCard__head">
        <span className="afCard__title">Semana del {moment(dia(0)).format('D')} al {moment(dia(4)).format('D [de] MMMM')}</span>
        <span className="afCard__label">2 de 5</span>
      </div>
      <div className="afSemana__dias">
        {DIAS.map((d) => (
          <button key={d.n} type="button"
            className={`afDia afDia--${d.estado === 'listo' ? 'listo' : d.estado}`}
            onClick={() => d.estado === 'elegir' && onDia(d)}
            disabled={d.estado !== 'elegir'}>
            <span className="afDia__n">{moment(dia(d.n)).format('ddd')}</span>
            <span className="afDia__d">{moment(dia(d.n)).format('D')}</span>
            <span className="afDia__s">{TXT[d.estado]}</span>
            {d.dir !== null && d.estado === 'listo' &&
              <span className="afDia__pin"><Ico d={PIN} className="afDia__pinIc" />{DIRECCIONES[d.dir].description}</span>}
          </button>
        ))}
      </div>
    </div>

    <div className="afCard">
      <div className="afCard__head"><span className="afCard__title">Incluido cada día</span></div>
      <div className="afSrow"><span>Snack</span><b>Mix de frutos secos</b></div>
      <div className="afSrow"><span>Bebida</span><b>Limonada de hierbaluisa</b></div>
      <p className="afMenu__nota">Vienen con tu plan. No hay que elegirlos.</p>
    </div>
  </>
);

/* ---------- Paso 2: plato y direccion ---------- */
export const PasoPlato = ({ onSiguiente }) => {
  const [elegido, setElegido] = useState(0);
  const [dir, setDir] = useState(0);
  const p = PLATOS[elegido];
  const kcal = p.menu.properties[0].value;

  return (
    <>
      <p className="afMenu__paso">Paso 2 de 3</p>
      <h1 className="afPanel__titular">Jueves 3</h1>
      <p className="afMenu__ayuda">Almuerzo · llega entre 14:00 y 16:00</p>

      <p className="afMenu__label">Elige tu plato</p>
      {PLATOS.map((it, i) => (
        <button key={it.menu.name} type="button"
          className={`afPlato${i === elegido ? ' afPlato--sel' : ''}`}
          onClick={() => setElegido(i)}>
          <span className={`afPlato__img afPlato__img--${i}`} />
          <span className="afPlato__txt">
            <b>{it.menu.name}</b>
            <small>{it.menu.properties[0].value} kcal · {it.menu.properties[3].value} P · {it.menu.properties[1].value} C · {it.menu.properties[2].value} G</small>
          </span>
          <span className="afPlato__tick" />
        </button>
      ))}

      <p className="afMenu__label">Entregar este día en</p>
      {DIRECCIONES.map((d, i) => (
        <button key={d.id} type="button"
          className={`afDir${i === dir ? ' afDir--sel' : ''}`}
          onClick={() => setDir(i)}>
          <span className="afDir__ico"><Ico d={PIN} /></span>
          <span className="afDir__txt"><b>{d.description}</b><small>{d.address}</small></span>
          <span className="afPlato__tick" />
        </button>
      ))}
      <p className="afMenu__nota">
        Puedes recibir cada día en un lugar distinto. Esto es lo que usamos para armar la ruta.
      </p>

      <div className="afCard">
        <div className="afCard__head"><span className="afCard__title">Cómo queda tu jueves</span></div>
        <div className="afFila afFila--top"><span>Calorías</span><span><b>{kcal}</b> / {Math.round(objetivo.bmr)}</span></div>
        <div className="afBarra afBarra--sky"><i style={{ width: `${Math.round((kcal / objetivo.bmr) * 100)}%` }} /></div>
      </div>

      <button className="afBtn" type="button" onClick={onSiguiente}>Guardar y seguir al viernes</button>
    </>
  );
};

/* ---------- Paso 3: confirmar ---------- */
export const PasoConfirmar = () => (
  <>
    <p className="afMenu__paso">Paso 3 de 3</p>
    <h1 className="afPanel__titular">Revisa tu semana</h1>
    <p className="afMenu__ayuda">
      Nada llega a cocina hasta que confirmes. Puedes cambiarlo hasta las 10 p.m. del día anterior.
    </p>

    <div className="afCard">
      <div className="afCard__head">
        <span className="afCard__title">Lo que pediste</span><span className="afCard__label">2 días</span>
      </div>
      <div className="afSrow"><span>Jue {moment(dia(3)).format('D MMM')}</span><b>{PLATOS[0].menu.name}</b></div>
      <div className="afSrow afSrow--sub"><span /><span className="afTag"><Ico d={PIN} className="afTag__ic" />Oficina · Lince</span></div>
      <div className="afSrow"><span>Vie {moment(dia(4)).format('D MMM')}</span><b>{PLATOS[2].menu.name}</b></div>
      <div className="afSrow afSrow--sub"><span /><span className="afTag"><Ico d={PIN} className="afTag__ic" />Casa · Miraflores</span></div>
    </div>

    <div className="afCard">
      <div className="afCard__head"><span className="afCard__title">Tus entregas</span></div>
      <div className="afSrow"><span>Oficina · Av. Arequipa 1234</span><b>1 día</b></div>
      <div className="afSrow"><span>Casa · Av. Pardo 480</span><b>1 día</b></div>
      <p className="afMenu__nota">¿Alguna cambió? Edítala antes de confirmar.</p>
    </div>

    <div className="afCard">
      <div className="afCard__head"><span className="afCard__title">Tu plan después de esto</span></div>
      <div className="afBarra afBarra--ok"><i style={{ width: '25%' }} /></div>
      <div className="afFila"><span>Envíos usados</span><span><b>5</b> de 20</span></div>
    </div>

    <button className="afBtn afBtn--mint" type="button">Confirmar mi semana</button>
  </>
);

/* ---------- Pantalla de un día ya programado (reprogramar) ---------- */
export const PantallaDia = () => (
  <>
    <p className="afMenu__paso">Jueves 3 de septiembre</p>
    <h1 className="afPanel__titular">Lomo saltado</h1>

    <div className="afBanner afBanner--urgente">
      <p className="afBanner__kick"><Ico d={RELOJ} className="afBanner__ic" /> Te quedan 4 h 20 min</p>
      <h2 className="afBanner__titulo">Puedes cambiarlo hasta las 10 p.m.</h2>
      <p className="afBanner__detalle">Después de esa hora tu pedido entra a cocina.</p>
    </div>

    <div className="afCard">
      <div className="afCard__head"><span className="afCard__title">Tu pedido</span></div>
      <div className="afSrow"><span>Plato</span><b>Lomo saltado</b></div>
      <div className="afSrow"><span>Entrega</span><span className="afTag"><Ico d={PIN} className="afTag__ic" />Oficina · Lince</span></div>
      <div className="afSrow"><span>Horario</span><b>14:00 a 16:00</b></div>
    </div>

    <div className="afCard afCard--acciones">
      <button type="button" className="afAccion">Elegir otro plato<span>›</span></button>
      <button type="button" className="afAccion">Entregar en otra dirección<span>›</span></button>
      <button type="button" className="afAccion">Mover a otro día<span>›</span></button>
    </div>

    <div className="afCard">
      <div className="afCard__head"><span className="afCard__title">Si lo cancelas</span></div>
      <p className="afMenu__nota afMenu__nota--suelta">
        Tu envío vuelve al saldo y lo puedes usar cualquier otro día antes del vencimiento. No se pierde.
      </p>
    </div>

    <button className="afBtn afBtn--fantasma" type="button">Cancelar este día</button>
  </>
);

export const PANTALLAS_MENU = [
  { nombre: 'Menú · paso 1 · qué día', Comp: () => <PasoSemana onDia={() => {}} /> },
  { nombre: 'Menú · paso 2 · plato y dirección', Comp: () => <PasoPlato onSiguiente={() => {}} /> },
  { nombre: 'Menú · paso 3 · confirmar', Comp: PasoConfirmar },
  { nombre: 'Un día ya programado', Comp: PantallaDia },
];

export { TabBar };
