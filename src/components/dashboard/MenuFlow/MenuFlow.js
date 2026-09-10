import React, { useEffect, useMemo, useState } from "react";
import FotoPlato from '../../ultil/FotoPlato';
import axios from 'axios';
import { REPARTO } from '../PedidoDeHoy/PedidoDeHoy';
import moment from 'moment';
import Skeleton from '@mui/material/Skeleton';

import './MenuFlow.scss';
import { useAuthContext } from './../../../context/authContext';
import { HORA_LIMITE, tiempoRestante } from './../StatusBanner/estadoPlan';
import { Cascada, Bloque, BarraAnimada, motion, alToque } from './../../ultil/Motion/Motion';
import { API_URL } from '../../../config';

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

  const { token } = useAuthContext();

  const [paso, setPaso] = useState(1);
  const [dias, setDias] = useState(null);
  // Lo que el cliente YA pidio. El endpoint de menus excluye esos dias, asi que
  // sin esto la pantalla decia "no hay dias para elegir" y nada mas: el cliente
  // no veia lo que habia pedido ni podia cambiarlo.
  const [pedidos, setPedidos] = useState([]);
  const [diaAbierto, setDiaAbierto] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [guardandoDir, setGuardandoDir] = useState(false);
  const [puntos, setPuntos] = useState([]);
  const [seleccion, setSeleccion] = useState({});   // { fecha: { menuId, puntoId } }
  const [diaActivo, setDiaActivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const desde = useMemo(() => {
    const ahora = moment();
    return ahora.clone().add(ahora.hour() >= HORA_LIMITE ? 2 : 1, 'days').format('YYYY-MM-DD');
  }, []);

  useEffect(() => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };

    axios.get(`${baseUrl}dashboard/menus?initDate=${desde}`, cab)
      .then((r) => setDias(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => { setDias([]); setError('No pudimos cargar el menú. Vuelve a intentarlo.'); });

    axios.get(`${baseUrl}dashboard/orders`, cab)
      .then((r) => setPedidos(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setPedidos([]));

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

  /** Un dia esta listo cuando tiene elegido un plato por cada comida. */
  const diaCompleto = (fecha) => {
    const m = seleccion[fecha]?.menus || {};
    return comidas.every((c) => m[c]);
  };

  const elegidos = Object.keys(seleccion).filter(diaCompleto);
  const restan = tiempoRestante();

  /* ---------- guardar ---------- */
  const confirmar = () => {
    setEnviando(true);
    setError('');

    const pedidos = elegidos.map((fecha) => {
      const s = seleccion[fecha];
      const base = { scheduleDate: fecha, menuTypeIds: comidas.map((c) => s.menus[c]) };
      // Solo se manda si el cliente eligio una: el backend conserva la
      // direccion anterior cuando llega nula.
      return s.puntoId ? { ...base, deliveryPointId: s.puntoId } : base;
    });

    axios.post(`${baseUrl}order/scheduled`, pedidos, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => { setEnviando(false); alTerminar && alTerminar(); })
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
    const menuTypeIds = (pedido.items || []).map((i) => i.id).filter(Boolean);

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

  // Cancelar devuelve el envio al saldo: el backend descuenta uno del consumo.
  // Solo se puede hasta las 22:00 del dia anterior, la misma regla que aplica
  // al programar; pasada esa hora el servidor responde con su motivo.
  const cancelarDia = (pedido) => {
    setCancelando(true);
    setError('');
    axios.delete(`${baseUrl}order?orderId=${pedido.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => { setDiaAbierto(null); recargar(); })
      .catch((e) => setError(
        e?.response?.data?.message || 'No pudimos cancelar este día. Vuelve a intentarlo.'))
      .finally(() => setCancelando(false));
  };

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
    const platos = (diaAbierto.items || []).map((i) => i?.menu?.name).filter(Boolean).join(' · ');
    const cerrado = diaAbierto.status && diaAbierto.status !== 'P';

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
            Almuerzo · llega entre las {REPARTO.desde} y la {REPARTO.hasta}
          </p>
        </Bloque>

        <Bloque>
          <div className="afCard">
            <div className="afCard__head"><span className="afCard__title">Lo que pediste</span></div>
            <div className="afSrow"><span>Plato</span><b>{platos || '—'}</b></div>
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
                Este pedido ya salió de cocina y no se puede cambiar.
              </p>
            </div>
          </Bloque>
        :
          <>
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
                  Si cancelas, tu envío vuelve al saldo y lo puedes usar otro día antes
                  de que venza tu plan. No se pierde.
                </p>
              </div>
            </Bloque>
            <Bloque>
              <motion.button type="button" className="afBtn afBtn--fantasma"
                onClick={() => cancelarDia(diaAbierto)} disabled={cancelando} {...alToque}>
                {cancelando ? 'Cancelando…' : 'Cancelar este día'}
              </motion.button>
            </Bloque>
          </>
        }
      </Cascada>
    );
  }

  /* ---------- la semana: lo pedido y lo que falta ---------- */
  if (dias.length === 0) {
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
            {pedidos.map((o) => {
              const punto = puntos.find((x) => x.id === o.deliveryPointId);
              const platos = (o.items || []).map((i) => i?.menu?.name).filter(Boolean).join(' · ');
              return (
                <motion.button type="button" className="afPedidoFila" key={o.id}
                  onClick={() => { setError(''); setDiaAbierto(o); }} {...alToque}>
                  <span className="afPedidoFila__txt">
                    <b>{moment(o.date).format('dddd D')}</b>
                    <small>{platos}{punto ? ` · ${punto.name || punto.address}` : ''}</small>
                  </span>
                  <span className="afPedidoFila__ir">›</span>
                </motion.button>
              );
            })}
          </div>
        </Bloque>
      </Cascada>
    );
  }

  /* ---------- paso 1: que dia ---------- */
  if (paso === 1) return (
    <Cascada className="afPanel">
      <Bloque><p className="afMenu__paso">Paso 1 de 3</p></Bloque>
      <Bloque><h1 className="afPanel__titular">¿Qué día quieres elegir?</h1></Bloque>
      <Bloque>
        <p className="afMenu__ayuda">
          Toca un día para escoger tu plato y a dónde te llega.
          {restan && ` Puedes hacerlo hasta las ${HORA_LIMITE}:00 de hoy.`}
        </p>
      </Bloque>

      <Bloque>
        <div className="afCard">
          <div className="afCard__head">
            <span className="afCard__title">Días disponibles</span>
            <span className="afCard__label">{elegidos.length} de {dias.length}</span>
          </div>
          <div className="afSemana__dias">
            {dias.map((d) => {
              const hecho = diaCompleto(d.localDate);
              return (
                <motion.button key={d.localDate} type="button"
                  className={`afDia afDia--${hecho ? 'listo' : 'elegir'}`}
                  onClick={() => { setDiaActivo(d.localDate); setPaso(2); }}
                  {...alToque}>
                  <span className="afDia__n">{moment(d.localDate).format('ddd')}</span>
                  <span className="afDia__d">{moment(d.localDate).format('D')}</span>
                  <span className="afDia__s">{hecho ? 'Listo' : 'Elegir'}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </Bloque>

      {/* Lo ya pedido, tambien aqui: antes solo se veia cuando la semana estaba
          completa, asi que a mitad de semana el cliente no tenia donde mirar
          —ni cambiar— lo que ya habia elegido. */}
      {pedidos.length > 0 &&
        <Bloque>
          <div className="afCard">
            <div className="afCard__head">
              <span className="afCard__title">Ya pediste</span>
              <span className="afCard__label">{pedidos.length} días</span>
            </div>
            {pedidos.map((o) => {
              const punto = puntos.find((x) => x.id === o.deliveryPointId);
              const platos = (o.items || []).map((i) => i?.menu?.name).filter(Boolean).join(' · ');
              return (
                <motion.button type="button" className="afPedidoFila" key={o.id}
                  onClick={() => { setError(''); setDiaAbierto(o); }} {...alToque}>
                  <span className="afPedidoFila__txt">
                    <b>{moment(o.date).format('dddd D')}</b>
                    <small>{platos}{punto ? ` · ${punto.name || punto.address}` : ''}</small>
                  </span>
                  <span className="afPedidoFila__ir">›</span>
                </motion.button>
              );
            })}
          </div>
        </Bloque>
      }

      <Bloque>
        <div className="afCard">
          <div className="afCard__head"><span className="afCard__title">Incluido cada día</span></div>
          <p className="afMenu__nota afMenu__nota--suelta">
            Tu snack y tu bebida vienen con el plan. No hay que elegirlos.
          </p>
        </div>
      </Bloque>

      {elegidos.length > 0 &&
        <Bloque>
          <motion.button type="button" className="afBtn" onClick={() => setPaso(3)} {...alToque}>
            Revisar y confirmar ({elegidos.length})
          </motion.button>
        </Bloque>
      }
    </Cascada>
  );

  /* ---------- paso 2: plato y direccion ---------- */
  if (paso === 2) {
    const dia = dias.find((d) => d.localDate === diaActivo);
    const sel = seleccion[diaActivo] || {};
    const menusSel = sel.menus || {};

    // Las calorias del dia son la suma de lo elegido en cada comida.
    const kcal = comidas.reduce((suma, c) => {
      const p = platosDe(dia, c).find((x) => x.id === menusSel[c]);
      return suma + (p ? prop(p.menu, 'calorias') : 0);
    }, 0);
    const meta = plan?.needDay?.bmr ? Math.round(plan.needDay.bmr) : null;

    const marcar = (campo, valor) =>
      setSeleccion((s) => ({ ...s, [diaActivo]: { ...s[diaActivo], [campo]: valor } }));

    const marcarPlato = (comida, id) =>
      setSeleccion((s) => ({
        ...s,
        [diaActivo]: { ...s[diaActivo], menus: { ...(s[diaActivo]?.menus || {}), [comida]: id } },
      }));

    const faltan = comidas.filter((c) => !menusSel[c]);

    return (
      <Cascada className="afPanel">
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
                </p>
              </Bloque>

              {platos.length === 0 &&
                <Bloque>
                  <p className="afMenu__nota afMenu__nota--suelta">
                    Todavía no hay {NOMBRE_COMIDA[comida] || comida} publicada para este día.
                  </p>
                </Bloque>
              }

              {platos.map((p) => (
                <Bloque key={comida + '-' + p.id}>
                  <motion.button type="button"
                    className={`afPlato${menusSel[comida] === p.id ? ' afPlato--sel' : ''}`}
                    onClick={() => marcarPlato(comida, p.id)} {...alToque}>
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
                </Bloque>
              ))}
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

        {puntos.length > 0 &&
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
            <Bloque>
              <p className="afMenu__nota">
                Puedes recibir cada día en un lugar distinto.
              </p>
            </Bloque>
          </>
        }

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

        <Bloque>
          <motion.button type="button" className="afBtn"
            disabled={faltan.length > 0}
            onClick={() => setPaso(1)} {...alToque}>
            {faltan.length === 0
              ? 'Guardar y volver a los días'
              : `Elige tu ${NOMBRE_COMIDA[faltan[0]] || faltan[0]} para continuar`}
          </motion.button>
        </Bloque>
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
          las {HORA_LIMITE}:00 del día anterior.
        </p>
      </Bloque>

      <Bloque>
        <div className="afCard">
          <div className="afCard__head">
            <span className="afCard__title">Lo que pediste</span>
            <span className="afCard__label">{elegidos.length} días</span>
          </div>
          {elegidos.map((f) => {
            const dia = dias.find((d) => d.localDate === f);
            const platosDelDia = comidas
              .map((c) => platosDe(dia, c).find((x) => x.id === seleccion[f].menus?.[c]))
              .filter(Boolean);
            const punto = puntos.find((x) => x.id === seleccion[f].puntoId);
            return (
              <React.Fragment key={f}>
                <div className="afSrow">
                  <span>{moment(f).format('ddd D MMM')}</span>
                  <b>{platosDelDia.map((x) => x.menu.name).join(' · ')}</b>
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

      {error && <Bloque><p className="afMenu__error">{error}</p></Bloque>}

      <Bloque>
        <motion.button type="button" className="afBtn afBtn--mint"
          onClick={confirmar} disabled={enviando} {...alToque}>
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
