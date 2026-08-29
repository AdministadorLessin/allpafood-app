import React, {useState} from 'react';
import './CardInfoCalorias.scss';
import CardPaper from './../../ultil/CardPaper/CardPaper';

import icoObjetivo from '../../../assets/img/ico_calorias_agua.svg';
import FpMacros from './../../auth/FormPerfil/Macros/marcros';



const CardInfoCalorias = ({data}) => {

  const [dataNeedDay,setDataNeedDay] = useState(JSON.parse(window.localStorage.getItem('needBrm')));
  const [macrosLoad,setMacrosLoad] = useState({
    kcal:true,
    protein:true,
    carbs:true,
    grasas:true
  });

  return (
    <CardPaper
      data={
        {
          titulo:'Lo que necesitas por día:',
          ico:icoObjetivo,
          className:'CicBox'
        }
      }
    >
      {data &&
        <FpMacros macrosLoad={macrosLoad} dataNeedDay={dataNeedDay} />
      }
    </CardPaper>
  )
};

export default CardInfoCalorias;
