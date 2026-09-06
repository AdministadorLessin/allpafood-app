import React, { useEffect, useState } from "react";
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import { useAuthContext } from './../../../context/authContext';
import { Cascada, Bloque, BarraAnimada, motion, alToque } from './../../../components/ultil/Motion/Motion';
import './miplan.scss';
import { API_URL } from '../../../config';

const baseUrl = `${API_URL}`;

/**
 * Pantalla "Mi plan".
 *
 * No existia: el cliente no tenia donde ver que compro, cuanto le queda ni sus
 * facturas, y el unico enlace para renovar aparecia dentro del saludo solo
 * despues de consumir 15 de sus 20 envios.
 */
const MiPlanPage = () => {

  const { token } = useAuthContext();
  const navigate = useNavigate();

  const [plan, setPlan] = useState();
  const [facturas, setFacturas] = useState([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const cabecera = { headers: { Authorization: `Bearer ${token}` } };

    axios.get(baseUrl + 'dashboard/plan', cabecera)
      .then((r) => setPlan(r.data.data))
      .catch((e) => console.log(e))
      .finally(() => setListo(true));

    axios.get(baseUrl + 'invoice/list', cabecera)
      .then((r) => setFacturas(Array.isArray(r.data.data) ? r.data.data : []))
      .catch((e) => console.log(e));
  }, [token]);

  const total = plan?.consumption?.orders?.total ?? 0;
  const usados = plan?.consumption?.orders?.consumed ?? 0;
  const restantes = Math.max(total - usados, 0);
  const creditos = plan?.credits?.orders?.total;
  const vence = plan?.expirationDate ? moment(plan.expirationDate) : null;
  const diasRestantes = vence ? vence.diff(moment().startOf('day'), 'days') : null;
  const pocos = restantes <= 3 || (diasRestantes !== null && diasRestantes <= 5);

  if (!listo) {
    return (
      <LayoutDasboard claseStyle={false}>
        <div className="afPanel">
          <Skeleton variant="text" width="55%" height={40} />
          <Skeleton variant="rounded" height={150} sx={{ borderRadius: '20px', mt: 2 }} />
        </div>
      </LayoutDasboard>
    );
  }

  return (
    <LayoutDasboard claseStyle={false}>
      <Cascada className="afPanel">

        <Bloque><h1 className="afPanel__titular">Mi plan</h1></Bloque>

        {plan ?
          <>
            <Bloque>
              <div className="afCard afPlanHero">
                <p className="afPlanHero__nombre">{plan.planName}</p>

                <div className="afPlanHero__cifra">
                  <span className="afPlanHero__n">{restantes}</span>
                  <span className="afPlanHero__u">
                    {restantes === 1 ? 'envío disponible' : 'envíos disponibles'}
                  </span>
                </div>

                <BarraAnimada
                  className={`afBarra afBarra--${pocos ? 'bajo' : 'ok'}`}
                  porcentaje={total ? Math.round((usados / total) * 100) : 0}
                />
                <div className="afFila">
                  <span>Usados</span><span><b>{usados}</b> de {total}</span>
                </div>

                {vence &&
                  <p className="afPlanHero__vence">
                    Vence el <b>{vence.format('D [de] MMMM')}</b>
                    {diasRestantes >= 0 && ` · quedan ${diasRestantes} días`}
                  </p>
                }
              </div>
            </Bloque>

            {creditos > 0 &&
              <Bloque>
                <div className="afCard afCredito">
                  <p className="afCredito__t">Tienes otro plan esperando</p>
                  <p className="afCredito__d">
                    {creditos} envíos más. Empiezan solos cuando termines el plan actual,
                    sin que tengas que hacer nada.
                  </p>
                </div>
              </Bloque>
            }

            <Bloque>
              <motion.button
                type="button"
                className={`afBtn${pocos ? ' afBtn--mint' : ''}`}
                onClick={() => navigate('/planes')}
                {...alToque}
              >
                {pocos ? 'Renovar mi plan' : 'Ver otros planes'}
              </motion.button>
            </Bloque>
          </>
        :
          <Bloque>
            <div className="afCard afSinPlan">
              <p className="afSinPlan__t">No tienes un plan activo</p>
              <p className="afSinPlan__d">Elige uno y empieza a recibir tus almuerzos esta semana.</p>
              <motion.button type="button" className="afBtn afBtn--mint"
                onClick={() => navigate('/planes')} {...alToque}>
                Ver planes
              </motion.button>
            </div>
          </Bloque>
        }

        <Bloque>
          <div className="afCard">
            <div className="afCard__head">
              <span className="afCard__title">Tus compras</span>
              <span className="afCard__label">{facturas.length}</span>
            </div>

            {facturas.length > 0 ?
              facturas.map((f) => (
                <div className="afSrow" key={f.id}>
                  <span>{f.emissionDate ? moment(f.emissionDate).format('D MMM YYYY') : '—'}</span>
                  <b>S/ {Number(f.totalPrice ?? 0).toFixed(2)}</b>
                </div>
              ))
            :
              <p className="afMenu__nota afMenu__nota--suelta">
                Aquí aparecerán tus compras cuando tengas la primera.
              </p>
            }
          </div>
        </Bloque>

      </Cascada>
    </LayoutDasboard>
  );
};

export default MiPlanPage;
