import React from "react"
import './CardNoticias.scss';
import newsImageDash from '../../../assets/img/home_news.png';


const CardNoticias = (props) => {
  return (
        <a href={'#'} className="hnNotItem">
            <div className="category">
                Categoria
            </div>
            <img src={newsImageDash} alt="" />
            <div className="hncTitle">
                <h4>¿Cuánto ejercicio debo hacer?</h4>
            </div>
        </a>
  )
};

export default CardNoticias;
