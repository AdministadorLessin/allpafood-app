import React from "react"
import './CardPaper.scss'

const CardPaper = ({data,children}) => {
  return (
    <div className={ data.className ? 'paperItem '+ data.className: 'paperItem' } >
      {data && data.titulo &&
        <div className="title">
          <div className="ico">
            {data.ico && 
              <img src={data.ico} alt="" />
            }
          </div>
          <h3>{data.titulo }</h3>
        </div>
      }
      {children ? children : 'loading' }
    </div>
  )
};

export default CardPaper;
