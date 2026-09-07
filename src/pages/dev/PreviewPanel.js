import React from "react";
import moment from 'moment';
import 'moment/locale/es';

import StatusBanner from './../../components/dashboard/StatusBanner/StatusBanner';
import PanelSemana from './../../components/dashboard/PanelSemana/PanelSemana';
import { TarjetaPlan, TarjetaHoy } from './../../components/dashboard/TarjetasResumen/TarjetasResumen';
import { estadoDelPanel } from './../../components/dashboard/StatusBanner/estadoPlan';
import TabBar from './../../components/TabBar/TabBar';
import AccesosRapidos from './../../components/dashboard/AccesosRapidos/AccesosRapidos';
import PanelKpis from './../../components/dashboard/PanelKpis/PanelKpis';
import PedidoDeHoy from './../../components/dashboard/PedidoDeHoy/PedidoDeHoy';

import { ESCENARIOS_PANEL, objetivo, AHORA, FACTURAS_EJEMPLO } from './datosEjemplo';
import { PANTALLAS_MENU } from './PantallasMenu';
import MiPlanVista from './MiPlanVista';
// SOLO DESARROLLO: para revisar la pantalla de exito sin cobrar de verdad.
import PagoListo from './../../components/checkout/PagoListo/PagoListo';

/**
 * SOLO DESARROLLO. Ruta /preview-ux, sin sesion.
 *
 * Todas las pantallas del rediseño en una sola vista, para poder revisarlas sin
 * fabricar cada situacion en la base ni pasar por el login. No se enlaza desde
 * ningun lado. Borrar esta carpeta y su ruta antes de desplegar.
 */

const Telefono = ({ titulo, children, activa }) => (
  <div className="afPreview__tel">
    <p className="afPreview__cap">{titulo}</p>
    <div className="afPreview__pantalla">
      <div className="afPanel">
        <div className="afPanel__top">
          <span className="afChipUser">
            <span className="afChipUser__ava"><img src="assets/img/avatars/avatar_8.jpg" alt="" /></span>
            Hola, <b>Ana</b>
          </span>
          <span className="afChipFecha">{AHORA.format('ddd D MMM')}</span>
        </div>
        {children}
      </div>
      <TabBar activa={activa || '/'} />
    </div>
  </div>
);

const PreviewPanel = () => {
  moment.locale('es');

  return (
    <div className="afPreview">
      <p className="afPreview__aviso">
        Vista de desarrollo · <code>/preview-ux</code> · sin sesión · borrar antes de desplegar
      </p>

      <h2 className="afPreview__seccion">Panel · según la situación del cliente</h2>
      <div className="afPreview__rail">
        {ESCENARIOS_PANEL.map((e) => {
          const estado = estadoDelPanel({ plan: e.plan, ordenes: e.ordenes, creditos: e.plan && e.plan.credits, ahora: AHORA.clone() });
          return (
            <Telefono titulo={e.nombre} key={e.nombre}>
              <h1 className="afPanel__titular">
                <span className="afPanel__t1">{estado.titularPrefijo}</span>{estado.titularFuerte}
              </h1>
              <StatusBanner plan={e.plan} ordenes={e.ordenes} creditos={e.plan && e.plan.credits} ahora={AHORA.clone()} />
              {e.plan &&
                <>
                  <PanelKpis plan={e.plan} ordenes={e.ordenes} facturas={FACTURAS_EJEMPLO} ahora={AHORA.clone()} />
                  <AccesosRapidos />
                  <PanelSemana ordenes={e.ordenes} ahora={AHORA.clone()} />
                  <TarjetaPlan plan={e.plan} />
                  <TarjetaHoy ordenes={e.ordenes} metricas={e.metricas} objetivo={objetivo} />
                </>
              }
            </Telefono>
          );
        })}
      </div>

      <h2 className="afPreview__seccion">Tu pedido de hoy · los tres estados</h2>
      <div className="afPreview__rail">
        {[
          { n: 'En preparación', st: 'P' },
          { n: 'En camino',      st: 'I' },
          { n: 'Entregado',      st: 'C' },
          { n: 'Retrasado (detectado solo)', st: 'I', tarde: true },
          { n: 'Aviso publicado desde el panel', st: 'I', tarde: true, aviso: {
              nuevaHora: '3:00 p.m.',
              mensaje: 'Hoy tuvimos un retraso en cocina y el reparto salió más tarde. Tu almuerzo va en camino y llega antes de las 3:00 p.m. Lo sentimos mucho.' } },
        ].map(({ n, st, tarde, aviso }) => (
          <div className="afPreview__tel" key={n}>
            <p className="afPreview__cap">{n}</p>
            <div className="afPreview__pantalla">
              <div className="afPanel">
                <PedidoDeHoy
                  ordenes={[{ id: 244, date: moment().format('YYYY-MM-DD'), status: st,
                              items: [{ menu: { name: 'Lomo saltado' } }] }]}
                  direccion={{ description: 'Oficina', address: 'Av. Arequipa 1234, Lince' }}
                  forzarRetraso={tarde}
                  aviso={aviso}
                />
              </div>
              <TabBar activa="/" />
            </div>
          </div>
        ))}
      </div>

      <h2 className="afPreview__seccion">Mi plan</h2>
      <div className="afPreview__rail">
        {MiPlanVista.map(({ nombre, Comp }) => (
          <div className="afPreview__tel" key={nombre}>
            <p className="afPreview__cap">{nombre}</p>
            <div className="afPreview__pantalla">
              <div className="afPanel"><Comp /></div>
              <TabBar activa="/mi-plan" />
            </div>
          </div>
        ))}
      </div>

      <h2 className="afPreview__seccion">Elegir el menú · los tres pasos y el día</h2>
      <div className="afPreview__rail">
        {PANTALLAS_MENU.map(({ nombre, Comp }) => (
          <div className="afPreview__tel" key={nombre}>
            <p className="afPreview__cap">{nombre}</p>
            <div className="afPreview__pantalla">
              <div className="afPanel"><Comp /></div>
              <TabBar activa="/menu" />
            </div>
          </div>
        ))}
      </div>
      {window.location.search.includes('pago') &&
        <PagoListo total={508.90} plan={'Nutrivital Plus'} adicionales={1} />}
    </div>
  );
};

export default PreviewPanel;
