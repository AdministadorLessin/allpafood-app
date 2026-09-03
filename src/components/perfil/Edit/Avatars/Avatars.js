import React,{useState} from "react";
import './Avatars.scss';

import CloseIcon from '@mui/icons-material/Close';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import  axios from 'axios';
import { useAuthContext } from './../../../../context/authContext';

const ProfileEditAvatar = ({closeModal,data,updatePerson}) => {

  const [activeAvatar,setActiveAvatar] = useState(0);
  const [loadingForm,setLoadingForm] = useState(false);
  const { token, handleUpdateToken } = useAuthContext();



  const updateAvatar = ()=>{
    setLoadingForm(true);
    axios.put('http://localhost:8443/api-af/v1/profile/data/personal',
        {
            name: data.name,
            lastname: data.lastname,
            gender: data.gender,
            registerDate: data.registeDate ? data.registeDate : '2025-04-04',
            image: activeAvatar
        },
        {
            headers: {"Authorization" : `Bearer ${token}`} 
        }
        ).then((resp)=>{
          closeModal();
          updatePerson();
          setLoadingForm(false);
        }).catch((errr)=>{
            setLoadingForm(false);
        })
  }

  const sendAvatar = () =>{
    updateAvatar();
  }

  const changeAvatar = (item) =>{
    setActiveAvatar(item)
  }

  return (
    <div className="profileEdithAvatar">
        <h3>Seleccione su avatar</h3>
        <ul className={'peaList'}>
          {[...Array(24)].map((item,index)=>{
            return (
              <li onClick={()=>changeAvatar(index)} className={activeAvatar === index ? 'active' : ''}>
                <figure>
                  <img src={'../assets/img/avatars/avatar_'+index+'.jpg'} alt="" />
                </figure>
              </li>
            )
          })}
        </ul>
        <div className="peaBtnBox">
          <div className="btnPrimary" onClick={sendAvatar}>
            <SaveOutlinedIcon /> Guardar
          </div>
          <div onClick={closeModal} className="btnPrimary">
            <CloseIcon /> Cancelar
          </div>
        </div>
    </div>
  )
};

export default ProfileEditAvatar;
