import React from "react";
import './MenuDayValid.scss';
import Moment from 'react-moment';

const MenuDayValid = ({data,editMenu}) => {


    let activeTmp = false;
    if(data.breakfast){
        activeTmp = true;
    }
    if(data.lunch){
        activeTmp = true;
    }
    if(data.dinner){
        activeTmp = true;
    }

    const getDayTmp = (date) =>{
        var days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
        var d = new Date(date);
        var dayName = days[d.getDay()];
        return dayName;
    }


    return (
        <div 
            className={activeTmp === false ? 'dpmRoItem dpmRoItemError' :'dpmRoItem'}
        >
            <div className="dpmRoDate">
                <p><Moment format="DD">{data.scheduleDate}</Moment></p>
                <small>{getDayTmp(data.scheduleDate)}</small>
                <div className="corner">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0H13V13C13 13 11.7197 6.71969 9 4C6.28031 1.28031 0 0 0 0Z" fill="#c5ffde"/>
                    </svg>
                </div>
            </div>
            <div className="dpmRoDetails">
                <ul>
                    {false &&
                    <li>
                        <small>Desayuno:</small>
                        
                        <p>{data.breakfast  ? data.breakfast.menu.name : '---'}</p>
                        
                    </li>
                    }
                    <li>
                        <small>Almuerzo:</small>
                        <p>{data.lunch ? data.lunch.menu.name : '---'}</p>
                    </li>
                    <li>
                        <small>Cena:</small>
                        <p>{data.dinner ? data.dinner.menu.name : '---'}</p>
                    </li>
                </ul>
                <div className="aditionals">
                    <p>Bebida: <strong>{data.dinner ? data.dinner.menu.name : '---'}</strong></p>
                    <p>Snack: <strong>Manzana verde</strong></p>
                </div>
            </div>

        </div>
    )
};

export default MenuDayValid;
