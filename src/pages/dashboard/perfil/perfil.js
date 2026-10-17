import React,{useState,useEffect} from "react"

import "./perfil.scss";
import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';

import icoPrivacidad from '../../../assets/img/ico_datos_privacidad.svg';
import icoInfoPersonal from '../../../assets/img/ico_informacion_personal.svg';

import Modal from '@mui/material/Modal';
import Skeleton from '@mui/material/Skeleton';
import ProfileChangePassword from '../../../components/perfil/Edit/Password/Password';

import axios from 'axios';
import moment from 'moment';

import {useAuthContext} from '../../../context/authContext';
import CloseIcon from '@mui/icons-material/Close';
import ProfileChangePerson from './../../../components/perfil/Edit/Personales/Personales';
import ProfileChangePrivacity from './../../../components/perfil/Edit/Privacidad/Privacidad';
import ProfileEditAvatar from './../../../components/perfil/Edit/Avatars/Avatars';
import { Link } from 'react-router-dom';
import CerrarSesion from './../../../components/perfil/CerrarSesion/CerrarSesion';
import EliminarCuenta from './../../../components/perfil/EliminarCuenta/EliminarCuenta';
import { Cascada, Bloque, motion, alToque } from './../../../components/ultil/Motion/Motion';
import { API_URL } from '../../../config';

const PerfilPage = (props) => {

  const [openEperson,setOpenEperson] = useState(false);
  const { token, planInfo, handleUpdateToken } = useAuthContext();
  const [switchForm,setSwitchForm] = useState(0)

  const handleOpenEperson = ()=>{
    setOpenEperson(true)
  }

  const handleCloseEperson = ()=>{
    setOpenEperson(false)
  }

  const changeSwitch = (numb)=>{
    setSwitchForm(numb);
    handleOpenEperson();
  }

  //Informacion
  const [person,setPerson] = useState();
  const [imgProfile,setImgProfile] = useState(null);
  const getInfo = ()=>{
    axios.get(`${API_URL}profile/data/personal`,
      {
        headers: {"Authorization" : `Bearer ${token}`} 
      }
    )
    .then((resp)=>{
      const planInfoT=  JSON.parse(window.localStorage.getItem('inf'));
      console.log(resp.data.data);
      const resultTmp = resp.data.data;
      setPerson({
        name:resultTmp.name,
        lastname:resultTmp.lastname,
        gender:resultTmp.gender,
        registeDate:resultTmp.registeDate,
        /* planInfoT.log es lo que la persona escribio para entrar, y ahora
           puede ser su celular. Mostrarlo aca pondria un numero en el campo
           Correo, como si ese fuera su correo. Se muestra solo cuando lo es. */
        email: (planInfoT.log || '').includes('@') ? planInfoT.log : '',
        image:resultTmp.image
      })
      setImgProfile(planInfoT.profile.image);

      planInfoT.profile.image = resultTmp.image;
      handleUpdateToken(token,planInfoT);

    }).catch((error)=>{
      console.log('get info ==>',error)
    })
  }

  // Delivery Point
  const [delivery,setDelivery] = useState();
  const getDelivery = () =>{
    axios.get(`${API_URL}profile/data/delivery`,
      {
        headers: {"Authorization" : `Bearer ${token}`} 
      }
    )
    .then((resp)=>{
      setDelivery(resp.data.data);
      
    }).catch((error)=>{
      console.log(error)
    })
  }

  // Privacidad
  const [privacity,setPrivacity] = useState();
  const getPrivacity = () =>{
    axios.get(`${API_URL}profile/data/privacy`,
      {
        headers: {"Authorization" : `Bearer ${token}`} 
      }
    )
    .then((resp)=>{
      setPrivacity(resp.data.data)
    }).catch((error)=>{
      console.log(error)
    })
  }


  useEffect(()=>{
    getInfo();
    getDelivery();
    getPrivacity();
  },[])

  const nombre = [person?.name, person?.lastname].filter(Boolean).join(' ');
  const contacto = person?.email || privacity?.phoneNumber || '';
  /* "51936364953" es ilegible de un vistazo: se muestra como lo marca el
     cliente en su telefono. */
  const celular = (v) => {
    const d = String(v || '').replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('51')) return `+51 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
    if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return v || '';
  };

  const fecha = (v) => {
    const m = moment(v, ['YYYY-MM-DD', moment.ISO_8601], true);
    return m.isValid() ? m.format('D [de] MMMM YYYY') : null;
  };

  /* Una fila de dato: etiqueta arriba, valor abajo. Mientras no llega el dato
     se muestra su esqueleto, no un guion: un guion se lee como "vacio". */
  const Dato = ({ etiqueta, valor, cargando }) => (
    <div className="afDato">
      <span className="afDato__et">{etiqueta}</span>
      {cargando
        ? <Skeleton variant="text" width={120} />
        : <b className="afDato__v">{valor || '—'}</b>}
    </div>
  );

  return (
    <LayoutDasboard claseStyle={false}>
      <Cascada className="afPanel afPanel--cuenta">

        <Bloque><h1 className="afPanel__titular">Mi cuenta</h1></Bloque>

        {/* Quien eres, en grande: foto, nombre y con que entras. Debajo, las
            tres cosas que se vienen a hacer aqui. */}
        <Bloque>
          <div className="afCard afYo">
            <span className="afYo__cielo" aria-hidden="true" />

            <button type="button" className="afYo__foto" onClick={() => changeSwitch(3)}
              aria-label="Cambiar mi foto">
              {imgProfile
                ? <img src={`/assets/img/avatars/avatar_${imgProfile}.jpg`} alt="" />
                : <span className="afYo__inicial">{(person?.name || '?').charAt(0).toUpperCase()}</span>}
              <span className="afYo__lapiz" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
                     strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/></svg>
              </span>
            </button>

            {person
              ? <p className="afYo__nombre">{nombre || 'Tu cuenta'}</p>
              : <Skeleton variant="text" width={200} height={34} sx={{ mx: 'auto' }} />}

            <p className="afYo__sub">
              {contacto ? celular(contacto) : 'Sin correo registrado'}
              {fecha(person?.registeDate) && <> · cliente desde el {fecha(person.registeDate)}</>}
            </p>

            {/* Las etiquetas de la cuenta, como las de las referencias: dicen
                de un vistazo que trae su plan. */}
            <div className="afYo__chips">
              {planInfo?.plan?.planName && <span className="afChip afChip--mint">{planInfo.plan.planName}</span>}
              {privacity?.documentNumber && <span className="afChip">DNI {privacity.documentNumber}</span>}
              {delivery?.address && <span className="afChip">{String(delivery.address).split(',')[0]}</span>}
            </div>

            <div className="afYo__acciones">
              {[
                { t: 'Editar datos', i: 'lapiz', f: () => changeSwitch(0) },
                { t: 'Direcciones', i: 'pin', a: '/ubicaciones' },
                { t: 'Contraseña', i: 'llave', f: () => changeSwitch(2) },
              ].map((x) => {
                const contenido = (
                  <>
                    <span className="afAccion__ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                           strokeLinecap="round" strokeLinejoin="round">
                        {x.i === 'lapiz' && <><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/></>}
                        {x.i === 'pin' && <><path d="M12 21.2s6.4-6.2 6.4-11a6.4 6.4 0 1 0-12.8 0c0 4.8 6.4 11 6.4 11Z"/><circle cx="12" cy="10" r="2.4"/></>}
                        {x.i === 'llave' && <><circle cx="8.5" cy="12" r="3.5"/><path d="M12 12h9M18 12v3M15.5 12v2.2"/></>}
                      </svg>
                    </span>
                    <span>{x.t}</span>
                  </>
                );
                return x.a
                  ? <Link className="afAccion" to={x.a} key={x.t}>{contenido}</Link>
                  : <motion.button type="button" className="afAccion" key={x.t} onClick={x.f} {...alToque}>{contenido}</motion.button>;
              })}
            </div>
          </div>
        </Bloque>

        <Bloque>
          <div className="afCuenta__rejilla">

            <div className="afCard">
              <div className="afCard__head">
                <span className="afCard__title">Tus datos</span>
                <button type="button" className="afMenu__mini" onClick={() => changeSwitch(0)}>Editar</button>
              </div>
              <Dato etiqueta="Nombre" valor={nombre} cargando={!person} />
              <Dato etiqueta="Documento" valor={privacity?.documentNumber} cargando={!privacity} />
              <Dato etiqueta="Celular" valor={celular(privacity?.phoneNumber)} cargando={!privacity} />
              <Dato etiqueta="Correo" valor={person?.email} cargando={!person} />
              <Dato etiqueta="Nacimiento" valor={fecha(privacity?.bornDate)} cargando={!privacity} />
            </div>

            <div className="afCard">
              <div className="afCard__head">
                <span className="afCard__title">Dónde te entregamos</span>
                <Link className="afMenu__mini" to="/ubicaciones">Cambiar</Link>
              </div>
              {delivery
                ? <>
                    <Dato etiqueta="Dirección" valor={delivery.address} />
                    <Dato etiqueta="Referencia" valor={delivery.description} />
                  </>
                : <Dato etiqueta="Dirección" valor="" cargando />}
              <p className="afMenu__nota afMenu__nota--suelta">
                Puedes tener varias direcciones y elegir una distinta para cada día.
              </p>
            </div>

            <div className="afCard">
              <div className="afCard__head">
                <span className="afCard__title">Tu contraseña</span>
                <button type="button" className="afMenu__mini" onClick={() => changeSwitch(2)}>Cambiar</button>
              </div>
              <p className="afMenu__nota afMenu__nota--suelta">
                Se guarda cifrada: nadie puede verla, ni nosotros. Si la olvidaste,
                cámbiala aquí o pide un código al entrar.
              </p>
            </div>

            <div className="afCard">
              <div className="afCard__head">
                <span className="afCard__title">Lo que comes</span>
                <button type="button" className="afMenu__mini" onClick={() => changeSwitch(1)}>Editar</button>
              </div>
              <p className="afMenu__nota afMenu__nota--suelta">
                Tus alergias y preferencias llegan a la cocina con cada pedido.
              </p>
            </div>

          </div>
        </Bloque>

        {/* En el telefono esta es la unica puerta a estas pantallas: la barra
            de abajo solo lleva cuatro secciones. */}
        <Bloque>
          <div className="afCard afCuenta__mas">
            <div className="afCard__head"><span className="afCard__title">Más opciones</span></div>
            <nav className="afMasOpciones">
              <Link to="/mi-plan">Mi plan<span>&rsaquo;</span></Link>
              <Link to="/facturacion">Mis pagos<span>&rsaquo;</span></Link>
              <Link to="/beneficios">Allpa+ · Tus beneficios<span>&rsaquo;</span></Link>
              <Link to="/salud-y-bienestar">Salud y bienestar<span>&rsaquo;</span></Link>
              <Link to="/preguntas-frecuentes">Preguntas frecuentes<span>&rsaquo;</span></Link>
            </nav>
          </div>
        </Bloque>

        <Bloque><CerrarSesion /></Bloque>
        <Bloque><EliminarCuenta /></Bloque>

      </Cascada>

      <Modal
        open={openEperson}
        onClose={handleCloseEperson}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="profEditCont">
          <div className="inlineFlex profEditClose" onClick={handleCloseEperson}>
            <CloseIcon/>
          </div>
          {switchForm === 0 ?
            <ProfileChangePerson iconImg={icoInfoPersonal} data={person} closeModal={handleCloseEperson} updatePerson={getInfo}/>
          : switchForm === 1 ?
            <ProfileChangePrivacity iconImg={icoPrivacidad} data={privacity} updatePrivacity={getPrivacity} closeModal={handleCloseEperson} />
          : switchForm === 2 ?
            <ProfileChangePassword iconImg={icoPrivacidad}  closeModal={handleCloseEperson}/>
          :
            <ProfileEditAvatar iconImg={icoPrivacidad} data={person} closeModal={handleCloseEperson} updatePerson={getInfo} />
          }
          
        </div>
      </Modal>
        
    </LayoutDasboard>
  )
};

export default PerfilPage;
