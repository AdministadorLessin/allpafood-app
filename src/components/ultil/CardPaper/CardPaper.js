import React from "react"
import './CardPaper.scss'

const CardPaper = ({data,children}) => {
  return (
    <div className={ data.className ? 'paperItem '+ data.className: 'paperItem' } >
      {data && data.titulo &&
        <div className="title">
          <div className="ico">
            {/* El icono podia ser solo la ruta de una imagen. Aceptar tambien
                un nodo permite usar los SVG del sistema nuevo sin tener que
                exportar un PNG por cada cabecera. */}
            {typeof data.ico === 'string'
              ? <img src={data.ico} alt="" />
              : data.ico}
          </div>
          <h3>{data.titulo }</h3>
        </div>
      }
      {children ? children : 'loading' }
    </div>
  )
};

export default CardPaper;
