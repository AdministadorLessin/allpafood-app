import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import MenuFlow from './../../../components/dashboard/MenuFlow/MenuFlow';
import { useAuthContext } from './../../../context/authContext';
import { API_URL } from '../../../config';

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

  useEffect(() => {
    const cab = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(baseUrl + 'dashboard/plan', cab)
      .then((r) => setPlan(r.data.data))
      .catch((e) => console.log(e));

    // Las calorias objetivo viven en otro endpoint; se adjuntan al plan para
    // que el paso 2 pueda decir como queda el dia.
    axios.get(baseUrl + 'plan/user/need-day', cab)
      .then((r) => {
        const needDay = JSON.parse(r.data.data.needDay);
        setPlan((p) => ({ ...(p || {}), needDay }));
      })
      .catch((e) => console.log(e));
  }, [token]);

  return (
    <LayoutDasboard claseStyle={false}>
      <MenuFlow plan={plan} alTerminar={() => navigate('/')} />
    </LayoutDasboard>
  );
};

export default MenuPage;
