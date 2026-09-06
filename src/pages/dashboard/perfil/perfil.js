import React,{useState,useEffect} from "react"

import Grid from '@mui/material/Grid';

import "./perfil.scss";
import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

// Iconos
import icoPrivacidad from '../../../assets/img/ico_datos_privacidad.svg';
import icoEditar from '../../../assets/img/ico_editar.png';
import icoInfoPersonal from '../../../assets/img/ico_informacion_personal.svg';
import icoEntrega from '../../../assets/img/ico_entrega.svg';

import Modal from '@mui/material/Modal';
import ProfileChangePassword from '../../../components/perfil/Edit/Password/Password';

import axios from 'axios';

import {useAuthContext} from '../../../context/authContext';
import CloseIcon from '@mui/icons-material/Close';
import CardProfileDelivery from './../../../components/perfil/Card/Delivery/Delivery';
import CardProfilePassword from './../../../components/perfil/Card/Pasword.js/Password';
import CardProfilePrivacidad from './../../../components/perfil/Card/Privacidad/Privacidad';
import CardProfilePersonal from './../../../components/perfil/Card/Personales/Personales';
import ProfileChangePerson from './../../../components/perfil/Edit/Personales/Personales';
import ProfileChangePrivacity from './../../../components/perfil/Edit/Privacidad/Privacidad';
import ProfileEditAvatar from './../../../components/perfil/Edit/Avatars/Avatars';
import { Link } from 'react-router-dom';
import CerrarSesion from './../../../components/perfil/CerrarSesion/CerrarSesion';
import { API_URL } from '../../../config';

const PerfilPage = (props) => {

  const [openEperson,setOpenEperson] = useState(false);
  const { token,  handleUpdateToken } = useAuthContext();
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
        email:planInfoT.log,
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

  return (
    <LayoutDasboard claseStyle={false}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={6}>
          <CardPaper
              data={
                {
                  titulo:'Datos personales:',
                  ico:icoInfoPersonal,
                  className:false
                }
              } 
          >
            <div onClick={()=>changeSwitch(0)} className="btnEditar">
              Editar
              <img src={icoEditar} alt="Editar" title="Editar" />
            </div>
            <CardProfilePersonal data={person} imgProfile={imgProfile} setSwitch={changeSwitch}  />
          </CardPaper>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <CardPaper
              data={
                {
                  titulo:'Datos de entrega:',
                  ico:icoEntrega,
                  className:false
                }
              } 
          >
            <Link to={'/ubicaciones'}  className="btnEditar">
              Editar
              <img src={icoEditar} alt="Editar" title="Editar" />
            </Link>

            <CardProfileDelivery data={delivery} />
          </CardPaper>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <CardPaper
              data={
                {
                  titulo:'Datos de privacidad:',
                  ico:icoPrivacidad,
                  className:false
                }
              } 
          >
            <div onClick={()=>changeSwitch(1)} className="btnEditar">
              Editar
              <img src={icoEditar} alt="Editar" title="Editar" />
            </div>
            
            <CardProfilePrivacidad data={privacity} />
          </CardPaper>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <CardPaper
              data={
                {
                  titulo:'Datos de autenticacion:',
                  ico:icoPrivacidad,
                  className:false
                }
              } 
          >
            <div onClick={()=>changeSwitch(2)} className="btnEditar">
              Editar
              <img src={icoEditar} alt="Editar" title="Editar" />
            </div>
            <CardProfilePassword />
          </CardPaper>

          {/* Estas cuatro paginas solo existian dentro del menu hamburguesa. Al
              pasar la navegacion a las pestanas quedaban sin puerta, asi que
              viven aqui, dentro de Cuenta. */}
          <CardPaper
              data={
                {
                  titulo:'Más opciones',
                  ico:icoPrivacidad,
                  className:false
                }
              }
          >
            <nav className="afMasOpciones">
              <Link to="/facturacion">Facturación<span>&rsaquo;</span></Link>
              <Link to="/ubicaciones">Datos de entrega<span>&rsaquo;</span></Link>
              <Link to="/salud-y-bienestar">Salud y bienestar<span>&rsaquo;</span></Link>
              <Link to="/preguntas-frecuentes">Soporte<span>&rsaquo;</span></Link>
            </nav>
          </CardPaper>

          {/* No existia forma de cerrar sesion en toda la app. */}
          <CerrarSesion />
        </Grid>
      </Grid>
        
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
