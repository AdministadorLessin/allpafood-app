import React,{useState,useEffect} from "react"

import './index.scss';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

// Iconos
import StatusBanner from './../../../components/dashboard/StatusBanner/StatusBanner';
import PanelSemana from './../../../components/dashboard/PanelSemana/PanelSemana';
import { TarjetaPlan, TarjetaHoy } from './../../../components/dashboard/TarjetasResumen/TarjetasResumen';
import { estadoDelPanel, fijarDiasLibres } from './../../../components/dashboard/StatusBanner/estadoPlan';
import { Cascada, Bloque } from './../../../components/ultil/Motion/Motion';
import AccesosRapidos from './../../../components/dashboard/AccesosRapidos/AccesosRapidos';
import PanelKpis from './../../../components/dashboard/PanelKpis/PanelKpis';
import PedidoDeHoy from './../../../components/dashboard/PedidoDeHoy/PedidoDeHoy';
import { useCentro } from './../../../components/Centro/CentroContext';
import icoObjetivo from '../../../assets/img/ico_objetivo.svg';
import icoFecha from '../../../assets/img/icon_fecha.svg';
import Bienvenida, { bienvenidaYaVista } from '../../../components/dashboard/Bienvenida/Bienvenida';
import AvisosCliente from '../../../components/dashboard/AvisosCliente/AvisosCliente';
import Tarjetas from '../../../components/dashboard/Tarjetas/Tarjetas';
import ActivarAvisos from '../../../components/dashboard/ActivarAvisos/ActivarAvisos';

// Charts
import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import HelloPaper from './../../../components/dashboard/HelloPaper/HelloPapper';
import PlanUser from './../../../components/dashboard/PlanUser/PlanUser';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';
import ObjetivosCharts from './../../../components/dashboard/ObjetivosCharts/ObjetivosCharts';
import MenuWeek from './../../../components/dashboard/MenuWeek/MenuWeek';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';

import moment from 'moment';
import 'moment/locale/es';

import { useNavigate } from "react-router-dom";
import { API_URL } from '../../../config';

const DashboadHome = (props) => {
  
  const { token, planInfo ,handleUpdateToken, setLoadResp, removeLocalstorage } = useAuthContext();
  let navigate = useNavigate();

  // Un motorizado no es cliente: su pantalla es la ruta del dia.
  useEffect(()=>{
    if(planInfo?.role === 'DELIVERY') navigate('/motorizado', { replace: true });
  },[planInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // No se muestra hasta saber DE VERDAD si el perfil tiene avatar: mostrarla
  // un instante y taparla en cuanto llega el perfil se ve como un parpadeo.
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);

  /* Los dias que el cliente reprogramo o en que viaja: el banner y la tira de
     la semana no deben pedirle que los elija. */
  const [, setDiasLibresListos] = useState(0);
  useEffect(()=>{
    if (!token) return;
    const cab = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get(`${API_URL}order/reprogramados`, cab).then((r) => r.data?.data ?? r.data).catch(() => []),
      axios.get(`${API_URL}plan/pause`, cab).then((r) => r.data?.data || r.data).catch(() => []),
    ]).then(([reprog, pausas]) => {
      fijarDiasLibres(Array.isArray(reprog) ? reprog : [], Array.isArray(pausas) ? pausas : []);
      setDiasLibresListos((n) => n + 1);
    });
  },[token]);

  const [menuList,setMenuList] = useState();
  const todayDate = new Date();
  const [metricsDay,setMetricsDay] = useState({
    calorias:0,
    proteinas:0,
    carbo:0,
    grasas:0
  });
  
  const getMenus = () =>{
      axios.get(`${API_URL}dashboard/orders`,
          {headers: {"Authorization" : `Bearer ${token}`} }
      ).then((resp)=>{
          //console.log('======>',resp.data.data)
          setMenuList(resp.data.data);
          let caloriasTMP = 0;
          let carbTMP = 0;
          let grasasTMP = 0;
          let protTmp = 0;
          
          resp.data.data.map((item)=>{

            if(moment(item.date).format('dddd') === moment(todayDate).format('dddd')){
              item.items.map((subItems) =>{
                caloriasTMP = caloriasTMP + subItems.menu.properties[0].value;
                carbTMP = carbTMP + subItems.menu.properties[1].value;
                grasasTMP = grasasTMP + subItems.menu.properties[2].value;
                protTmp = protTmp + subItems.menu.properties[3].value;
              })
            }

          })

          setMetricsDay({
            calorias:caloriasTMP,
            carbo:carbTMP,
            grasas:grasasTMP,
            proteinas:protTmp
          })


      }).catch((error)=>{
          console.log(error)
      })
  }

  const [objetMEtrics,setObjetMetrics] = useState();
  const getExpData = () =>{
    axios.get(`${API_URL}plan/user/need-day`,
      {
          headers: {"Authorization" : `Bearer ${token}`} 
      }
    )
        .then((resp)=>{
            const calcFitStorage=JSON.parse(resp.data.data.needDay);
            setObjetMetrics(calcFitStorage);
            window.localStorage.setItem('needBrm',JSON.stringify(calcFitStorage))
            
        }).catch((error)=>{
            console.log(error);
        })
  }

  const [plan,setPlan] = useState();
  const [helloCard,setHelloCard] = useState();

  useEffect(() => {
    if (!helloCard || bienvenidaYaVista(token)) return;
    if (!helloCard.profile?.image) setMostrarBienvenida(true);
  }, [helloCard, token]);
  // Marca que /dashboard/plan ya respondio. Sin esto el efecto de redireccion
  // corre al montar con el planActive viejo de localStorage y saca al cliente
  // antes de que llegue el dato fresco.
  const [planChecked,setPlanChecked] = useState(false);
  // Las facturas alimentan el ahorro acumulado del panel de KPIs.
  const [facturas,setFacturas] = useState([]);
  // Aviso de retraso publicado desde el panel administrativo. Null casi siempre.
  const [avisoEntrega,setAvisoEntrega] = useState(null);

  const getPlan = ()=>{
      axios.get(`${API_URL}dashboard/plan`,{
          headers: {"Authorization" : `Bearer ${token}`} 
      })
      .then((resp)=>{
          const reultTmp = resp.data.data;
          const infTmp = JSON.parse(window.localStorage.getItem('inf'));
          infTmp.plan = reultTmp;

          // planActive solo se calculaba al iniciar sesion y quedaba congelado en
          // localStorage. Despues de comprar seguia en false, y el efecto de abajo
          // devolvia al cliente a /planes como si el pago no hubiera ocurrido: su
          // plan solo aparecia si cerraba sesion y volvia a entrar.
          // Aqui se recalcula con la fecha de vencimiento que responde el servidor.
          // El JSON de /dashboard/plan lo expone como expirationDate (ver PlanDTO).
          const vence = reultTmp?.expirationDate ?? reultTmp?.planExpirationDate;
          const venceStr = Array.isArray(vence)
              ? `${vence[0]}-${String(vence[1]).padStart(2,'0')}-${String(vence[2]).padStart(2,'0')}`
              : vence;
          const hoy = new Date();
          const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
          // Solo se pisa el valor del login cuando el servidor dio una fecha
          // utilizable. Si algun dia deja de venir, se conserva lo que decia el
          // login en vez de declarar sin plan a un cliente que si lo tiene: el
          // costo de equivocarse hacia false es mandarlo a comprar de nuevo.
          if (typeof venceStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(venceStr)) {
              infTmp.planActive = venceStr >= hoyStr;
          }

          handleUpdateToken(token,infTmp);
          setHelloCard(infTmp);

          setPlan(resp.data.data);
          setPlanChecked(true);

      }).catch((error)=>{
          console.log(error);
          // Sin respuesta del servidor no se puede afirmar que no tenga plan,
          // pero hay que desbloquear el efecto para no dejar la pantalla colgada.
          setPlanChecked(true);
      })
  }

  const [orderPass,setOrderPass] = useState();
  const [lastDateProgram,setLastDateProgram] = useState();
  const sendOrder = ()=>{
    setLoadResp(true);
    axios.post(`${API_URL}order/scheduled`,
      orderPass,
      {
        headers: {"Authorization" : `Bearer ${token}`} 
      }
    ).then((resp)=>{
      // Se guardaba el objeto del pedido entero, y ProgramMenu hace
      // moment(lastDateProgram) esperando una fecha: la ventana de dias
      // disponibles se calculaba desde una fecha que no era la ultima
      // programada. Aqui va solo la fecha.
      const ultimoPedido = orderPass[orderPass.length - 1]
      setLastDateProgram(ultimoPedido && ultimoPedido.scheduleDate)
      getMenus();
      getPlan();
      setLoadResp(false);
    }).catch((error)=>{
      console.log('maldito puerco',error)
      setLoadResp(false);
    })
  }

  const reproOrder = (id)=>{
    setLoadResp(true);
    axios.delete(
      `${API_URL}order?orderId=`+id,
      {
        headers: {"Authorization" : `Bearer ${token}`} 
      }
    ).then((resp)=>{
      
      getMenus();
      getPlan();
      setLoadResp(false);
    }).catch((eeerr)=>{
      console.log(eeerr);
      setLoadResp(false);
    })
  }

  // 1. Cargar datos al montar el componente
  useEffect(() => {
    getExpData();
    axios.get(`${API_URL}delivery/notice`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setAvisoEntrega(r.data && r.data.data ? r.data.data : null))
      .catch(() => setAvisoEntrega(null));

    axios.get(`${API_URL}invoice/list`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setFacturas(Array.isArray(r.data.data) ? r.data.data : []))
      .catch((e) => console.log(e));
    getPlan();
    getMenus();
  }, []);

  useEffect(() => {
    if (!planInfo) return;
    if (!planChecked) return;

    const hasProfile = planInfo.profile !== null; // o Array.isArray(planInfo.profile)
    const isPlanActive = planInfo.planActive === true;

    /* Clave que le pusimos nosotros en la carga masiva: elige la suya antes
       que nada. */
    if (planInfo.mustChangePassword) {
      return navigate('/cambiar-clave');
    }

    /* Quien ya pago manda al candado de la direccion, no al cuestionario.
       Antes el orden era al reves y ganaba el cuestionario: un cliente
       migrado, que ya come con nosotros, entraba y lo primero que veia eran
       tres pantallas preguntandole su objetivo. Si el plan esta activo, lo
       unico que puede faltarle es donde entregarle. */
    if (isPlanActive) {
      axios.get(`${API_URL}delivery/find/points`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then((resp) => {
        const puntos = resp?.data?.data;
        if (!puntos || puntos.length === 0) navigate('/registro/direccion');
        else removeLocalstorage();
      }).catch(() => { /* si falla la consulta no se traba al cliente */ });
      return;
    }

    // Sin plan activo: o le falta el perfil, o le falta comprar.
    if (!hasProfile) {
      removeLocalstorage();
      return navigate('/registro/perfil');
    }

    return navigate('/planes');
  }, [planInfo, planChecked, navigate]);

  // El titular sale del mismo calculo que el banner: una sola fuente de verdad
  // para lo que le pasa al cliente.
  moment.locale('es');
  // Fecha corta: en la pildora del encabezado el nombre completo del mes
  // desbordaba en pantallas angostas.
  const fechaDeHoy = moment().format('ddd D MMM');

  // El encabezado se vuelve vidrio cuando el contenido pasa por detras. Antes
  // de eso queda plano: el desenfoque permanente pesa y no significa nada.
  const [pegado, setPegado] = useState(false);
  useEffect(() => {
    // El documento entero es el que hace scroll: los contenedores del layout
    // solo crecen. Antes se escuchaba .mainLayoutBox, que nunca dispara.
    const alScroll = () => setPegado(window.scrollY > 12);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  /* Los avisos salen de estos tres datos, y esta es la unica pantalla que los
     pide. Se publican al centro para que el boton de la barra siga sirviendo
     cuando el cliente se va a "Mi menu" o a su cuenta. */
  const { setDatos } = useCentro();
  useEffect(() => {
    setDatos({ plan, ordenes: menuList, aviso: avisoEntrega });
  }, [plan, menuList, avisoEntrega]); // eslint-disable-line react-hooks/exhaustive-deps

  const estado = planChecked ? estadoDelPanel({ plan, ordenes: menuList, creditos: plan && plan.credits }) : null;

  return (
    <LayoutDasboard claseStyle={false}>

      {/* Estructura nueva: primero QUE tengo que hacer, despues QUE me llega,
          al final COMO voy. Antes eran cinco tarjetas del mismo peso y ninguna
          decia por donde empezar. */}
      {/* La cascada entra de abajo hacia arriba en el orden de lectura: quien
          llega ve primero que tiene que hacer y despues el detalle. */}
      <Cascada className="afPanel afPanel--inicio">

        {/* Nombre y fecha en una linea, como encabezado. Antes ocupaban una
            tarjeta de 190px con una ilustracion, en el lugar donde ahora va lo
            que el cliente tiene que hacer. */}
        <Bloque className={`afPanel__top${pegado ? ' afPanel__top--pegado' : ''}`}>
          <span className="afChipUser">
            <span className="afChipUser__ava">
              {/* Antes la condicion era "!== undefined": un perfil sin avatar
                  tiene image_url en NULL, y null !== undefined es verdadero,
                  asi que intentaba cargar "avatar_null.jpg" y salia el icono
                  de imagen rota junto al nombre. Con inicial de respaldo en
                  vez de un hueco roto. */}
              {helloCard && helloCard.profile && helloCard.profile.image
                ? <img src={`assets/img/avatars/avatar_${helloCard.profile.image}.jpg`} alt="" />
                : <span className="afChipUser__inicial">
                    {(helloCard?.profile?.name || '?').charAt(0).toUpperCase()}
                  </span>}
            </span>
            {helloCard && helloCard.profile && helloCard.profile.name
              ? <>Hola, <b>{helloCard.profile.name.split(' ')[0]}</b></>
              : <Skeleton variant="text" width={90} />}
          </span>
          <span className="afPanel__topDer">
            <span className="afChipFecha">{fechaDeHoy}</span>
          </span>
        </Bloque>

        {/* Titular a dos tonos: la primera linea situa, la segunda es el dato.
            Leerlo entero toma menos que leer una tarjeta. */}
        <Bloque className="afInicio__titular">
          <h1 className="afPanel__titular">
            {estado
              ? <><span className="afPanel__t1">{estado.titularPrefijo}</span>{estado.titularFuerte}</>
              : <Skeleton variant="text" width="70%" />}
          </h1>
        </Bloque>

        {/* Va primero cuando hay entrega hoy: es la pregunta que el cliente
            trae en la cabeza al abrir la app, y la que hoy termina en WhatsApp. */}
        {/* En computadora son dos columnas: a la izquierda lo de hoy y la
            semana, a la derecha el plan, los atajos y las cifras. En el
            telefono los envoltorios desaparecen —display:contents— y queda la
            misma lista de siempre, en el mismo orden. */}
        <div className="afInicio__col afInicio__col--principal">
          <Bloque className="afInicio__hoy"><PedidoDeHoy ordenes={menuList} aviso={avisoEntrega} /></Bloque>

          <Bloque className="afInicio__banner"><StatusBanner
            plan={plan}
            ordenes={menuList}
            creditos={plan && plan.credits}
            cargando={!planChecked}
          /></Bloque>

          {/* Sin plan no hay semana que mostrar ni objetivo que seguir: repetir
              tarjetas vacias solo aleja del unico paso que importa, comprar. */}
          {(plan || !planChecked) &&
            <>
              <Bloque className="afInicio__semana"><PanelSemana ordenes={menuList} cargando={!planChecked} /></Bloque>
              <Bloque className="afInicio__macros"><TarjetaHoy
                ordenes={menuList}
                metricas={metricsDay}
                objetivo={objetMEtrics}
                cargando={!planChecked}
              /></Bloque>

              {/* Los tips van despues de lo suyo —su pedido, su semana, sus
                  macros—, no antes. El cliente entra a hacer algo; primero se
                  le resuelve eso y recien despues se le cuenta algo. */}
              {/* Solo en el app instalado y solo si aun no se le pregunto. */}
              <ActivarAvisos />
              <Bloque><Tarjetas lugar="inicio" titulo="Para ti" /></Bloque>
            </>
          }
        </div>

        {(plan || !planChecked) &&
          <div className="afInicio__col afInicio__col--lateral">
            <Bloque className="afInicio__kpis"><PanelKpis plan={plan} ordenes={menuList} facturas={facturas} cargando={!planChecked} /></Bloque>
            <Bloque className="afInicio__accesos"><AccesosRapidos /></Bloque>
            <Bloque className="afInicio__plan"><TarjetaPlan plan={plan} cargando={!planChecked} /></Bloque>
          </div>
        }

        {/* El programador completo vive en su propia pestana (/menu). Tenerlo
            tambien aqui duplicaba la pantalla mas pesada del panel y era lo que
            quedaba tapado por la barra de navegacion. Desde aqui se llega por
            el boton del banner o tocando un dia de la tira. */}

      </Cascada>

      {/* Despues de la bienvenida, nunca encima: dos hojas a la vez no se leen. */}
      <AvisosCliente oculto={mostrarBienvenida || planInfo?.role === 'DELIVERY'} />

      {mostrarBienvenida &&
        <Bienvenida
          nombre={helloCard?.profile?.name?.split(' ')[0]}
          onListo={(avatarElegido) => {
            setMostrarBienvenida(false);
            // Sin esto el circulo de la cabecera seguia con la inicial hasta
            // recargar: helloCard es un estado propio de esta pantalla,
            // separado del que Bienvenida actualiza en el contexto.
            if (avatarElegido !== undefined && avatarElegido !== null) {
              setHelloCard((h) => h?.profile
                ? { ...h, profile: { ...h.profile, image: String(avatarElegido) } }
                : h);
            }
          }}
        />
      }
    </LayoutDasboard>
  )
};

export default DashboadHome;
