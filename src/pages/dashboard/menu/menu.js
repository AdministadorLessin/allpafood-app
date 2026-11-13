import React, { useCallback, useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import MenuFlow from './../../../components/dashboard/MenuFlow/MenuFlow';
import { useAuthContext } from './../../../context/authContext';
import { API_URL } from '../../../config';
import { motion } from 'motion/react';
import Isotipo from '../../../components/ultil/Isotipo';
import { cascada, sube, resorte } from '../../../movimiento';

const baseUrl = `${API_URL}`;

/**
 * Pantalla propia para elegir el menu.
 *
 * Antes esto vivia dentro del panel, compitiendo con cuatro tarjetas mas, y la
 * unica entrada desde el menu lateral abria un modal que no hacia nada.
 */
const MenuPage = () => {

  const { token } = useAuthContext();
  const navigate = useNavigate();
  const [plan, setPlan] = useState();
  /* null mientras no se sabe; 'sin' nunca tuvo plan; 'vencido' se le acabo. */
  const [sinPlan, setSinPlan] = useState(null);

  useEffect(() => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(baseUrl + 'dashboard/plan', cab)
      .then((r) => {
        const datos = r.data.data;
        setPlan(datos);
        const vence = datos?.expirationDate ?? datos?.planExpirationDate;
        const venceStr = Array.isArray(vence)
          ? `${vence[0]}-${String(vence[1]).padStart(2, '0')}-${String(vence[2]).padStart(2, '0')}`
          : (typeof vence === 'string' ? vence.slice(0, 10) : null);
        const d = new Date();
        const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!venceStr) setSinPlan('sin');
        else if (venceStr < hoy) setSinPlan('vencido');
      })
      .catch((e) => {
        /* El servidor respondio que no hay plan. Si lo que fallo fue la red
           no se afirma nada: decirle "no tienes plan" a quien si lo tiene
           seria peor que el error de siempre. */
        if (e?.response) setSinPlan('sin');
      });

    // Las calorias objetivo viven en otro endpoint; se adjuntan al plan para
    // que el paso 2 pueda decir como queda el dia.
    axios.get(baseUrl + 'plan/user/need-day', cab)
      .then((r) => {
        const needDay = JSON.parse(r.data.data.needDay);
        setPlan((p) => ({ ...(p || {}), needDay }));
      })
      .catch((e) => console.log(e));
  }, [token]);

  /* Con "lo que tocas queda pedido" el saldo cambia sin salir de la pantalla:
     se vuelve a leer el plan para que las entregas que quedan sean las de
     verdad. Si falla, se queda con lo que ya tenia. */
  const releerPlan = useCallback(() => {
    axios.get(baseUrl + 'dashboard/plan', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setPlan((p) => ({ ...(p || {}), ...(r.data.data || {}), needDay: p?.needDay ?? r.data.data?.needDay })))
      .catch(() => {});
  }, [token]);

  /* Sin plan no hay nada que elegir. Antes aqui salia "Tu semana esta
     completa" junto a "No pudimos cargar el menu": dos mensajes que no eran
     verdad y ninguna pista de que hacer. */
  if (sinPlan) {
    return (
      <LayoutDasboard claseStyle="nCaja">
        <div className="nPant mnu">
          <span className="nMenta mnu__menta" aria-hidden="true" />
          <motion.div className="mnu__dentro mnu__vacio" variants={cascada(0.07)} initial="oculto" animate="visible">
            <motion.div variants={sube}><Isotipo size={34} /></motion.div>
            <motion.h1 variants={sube}>
              {sinPlan === 'vencido' ? 'Tu plan terminó' : 'Aún no tienes un plan'}
            </motion.h1>
            <motion.p variants={sube}>
              {sinPlan === 'vencido'
                ? 'Aquí eliges tus platos de cada día. Renueva tu plan y sigue donde lo dejaste.'
                : 'Aquí vas a elegir tus platos de cada día. Primero elige tu plan: te toma un minuto.'}
            </motion.p>
            <motion.div variants={sube}>
              <motion.button type="button" className="mnu__boton" whileTap={{ scale: 0.97 }} transition={resorte.toque}
                onClick={() => navigate('/planes')}>
                {sinPlan === 'vencido' ? 'Renovar mi plan' : 'Ver los planes'}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </LayoutDasboard>
    );
  }

  return (
    <LayoutDasboard claseStyle="nCaja">
      <MenuFlow plan={plan} alCambiar={releerPlan} />
    </LayoutDasboard>
  );
};

export default MenuPage;
