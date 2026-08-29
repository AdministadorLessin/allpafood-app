import React from "react"
import icoEditar from '../../../assets/img/ico_editar.png';

const BtnEditar = (props) => {
  return (
    <a href="#" className="btnEditar">
        Editar
        <img src={icoEditar} alt="Editar" title="Editar" />
    </a>
  )
};

export default BtnEditar;
