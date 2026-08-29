import React,{useEffect, useState} from "react";
import './MenuDayEdith.scss';
import Modal from '@mui/material/Modal';

import Moment from 'react-moment';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EditIcon from '@mui/icons-material/Edit';
import { useAuthContext } from "context/authContext";

import axios from 'axios';
import TitleCard from './../../ultil/TitleCard/TitleCard';

const MenuDayEdith = ({data,setNewMenu}) => {

    const {token, baseUrl, setLoadResp} = useAuthContext();
    const [dataEdith,setDataEdith] = useState(data);

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

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [menuList,setMenuList] = useState([]);
    const [selectCat,setSelectCat] = useState();
    const dataTmp = data.scheduleDate;
    
    const getMenusDay = async () => {
        
        try {
            
            const { data } = await axios.get(
                `${baseUrl}menu/schedule?startDate=${dataTmp}&endDate=${dataTmp}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            handleOpen();

            const tmpData = data.data || [];
            //console.log(data.data[0])

            // categorías válidas
            const validCategories = [
                'breakfast',
                'lunch',
                'dinner',
                'drinks'
            ];

            // transformar data
            const eventsTmp = tmpData.flatMap(item =>
                item.menuTypeGroups.flatMap(group =>
                    group.menuTypes.map(menu => ({
                        id: menu.id,
                        name: menu.menu.name,
                        description:menu.menu.description,
                        imgUrl: menu.menu.imageUrl,
                        type: validCategories.includes(group.type)
                            ? group.type
                            : 'snacks'
                    }))
                )
            );

            // orden personalizado
            /*
            const order = [
                'breakfast',
                'lunch',
                'dinner',
                'drinks',
                'snacks'
            ];

            // categorías únicas ordenadas

            const catListTmp = order.filter(category =>
                eventsTmp.some(item => item.type === category)
            );
            */


            //console.log('eventsTmp',eventsTmp)
            setMenuList(eventsTmp);

        } catch (error) {
            console.log(error);
        }
    };

    const [ dataPlan, setDataPlan ] = useState();

    const changeCatList = (cat) =>{
        setSelectCat(cat);
    }

    const [menuSelect,setMenuSelect] = useState({
        lunch:null,
        dinner:null
    });
       
    const changeMenu = (item) => {

        const updateMenu = {
            ...menuSelect
        };

        if (item.type === 'lunch') {
            updateMenu.lunch = item.id;

            setDataEdith(prev => ({
                ...prev,
                lunch: {
                    id: item.id,
                    menu: item
                }
            }));
        }

        if (item.type === 'dinner') {
            updateMenu.dinner = item.id;

            setDataEdith(prev => ({
                ...prev,
                dinner: {
                    id: item.id,
                    menu: item
                }
            }));
        }

        setMenuSelect(updateMenu);

        setNewMenu(
            [updateMenu.lunch, updateMenu.dinner].filter(Boolean)
        );
    };

    useEffect(()=>{
        const planInfoTmp = JSON.parse(window.localStorage.getItem('inf'));


        if(planInfoTmp?.plan?.planName === 'Nutrivital Plus' || planInfoTmp?.plan?.planName === 'Nutrivital' ){
            setMenuSelect({
                lunch: data.lunch?.id ? data.lunch.id : 'null'
            });
        }else{
            setMenuSelect({
                lunch: data.lunch?.id ? data.lunch.id : 'null',
                dinner: data.dinner?.id ? data.dinner.id : 'null'
            });
        }

        setDataPlan(planInfoTmp);
        setSelectCat('lunch');
        
    },[])

    return (
        <div 
            className={activeTmp === false ? 'dpmEditItem dpmEditItemError' :'dpmEditItem'}
        >
            <div className="dpmEditDate">
                <p><Moment format="DD">{dataEdith.scheduleDate}</Moment></p>
                <small>{getDayTmp(dataEdith.scheduleDate)}</small>
                <div className="corner">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0H13V13C13 13 11.7197 6.71969 9 4C6.28031 1.28031 0 0 0 0Z" fill="#c5ffde"/>
                    </svg>
                </div>
                <button 
                    onClick={()=>getMenusDay()}
                >
                    <EditNoteIcon/><br />
                    Editar
                </button>
            </div>
            <div className="dpmEditDetails">
                <ul>
                    <li>
                        <small>Almuerzo:</small>
                        <p>{dataEdith.lunch ? dataEdith.lunch.menu.name : '---'}</p>
                    </li>
                    <li>
                        <small>Cena:</small>
                        <p>{dataEdith.dinner ? dataEdith.dinner.menu.name : '---'}</p>
                    </li>
                </ul>
                <div className="aditionals">
                    {dataEdith.drinks &&
                        <p>Bebida: <strong>{dataEdith.drinks ? dataEdith.drinks.menu.name : '---'}</strong></p>
                    }
                    {dataEdith.snack &&
                        <p>Bebida: <strong>{dataEdith.snack ? dataEdith.snack.menu.name : '---'}</strong></p>
                    }

                </div>
            </div>

            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <div 
                    className="inlineBlock dpmEditModal" 
                >
                    <TitleCard
                        title={'Editar Menú'}
                        icon={<EditIcon />}
                    />


                    {dataPlan && dataPlan.plan?.planName === 'Nutrivital' ?
                        <ul className="displayFlex dpmEditMenuCats">
                            <li 
                                className={selectCat === 'lunch' ? 'active' : ''} 
                                onClick={()=>changeCatList('lunch')}
                            >
                                Almuerzo
                            </li>
                        </ul>
                    :dataPlan && dataPlan.plan?.planName === 'Nutrivital Plus' ?
                        <ul className="displayFlex dpmEditMenuCats">
                            <li
                                className={selectCat === 'lunch' ? 'active' : ''}
                                onClick={()=>changeCatList('lunch')}
                            >
                                Almuerzo
                            </li>
                        </ul>
                    :
                        <ul className="displayFlex dpmEditMenuCats">
                            <li
                                className={selectCat === 'lunch' ? 'active' : ''}
                                onClick={()=>changeCatList('lunch')}
                            >
                                Almuerzo
                            </li>
                            <li
                                className={selectCat === 'dinner' ? 'active' : ''}
                                onClick={()=>changeCatList('dinner')}
                            >
                                Cena
                            </li>
                        </ul>
                    }

                    {menuList && menuList.length > 0 &&
                        <div className="inlineFlex dpmEditMenuList">
                            {menuList.map((item)=>{
                                if(item.type === selectCat){
                                    return (
                                        <div 
                                            className={ 
                                                item.type === 'lunch' && menuSelect.lunch === item.id ? 'inlineFlex dpmEditMenuItem dpmEditMenuItemAct' 
                                                : item.type === 'dinner' && menuSelect.dinner === item.id ? 'inlineFlex dpmEditMenuItem dpmEditMenuItemAct'
                                                :  'inlineFlex dpmEditMenuItem'
                                            }
                                            onClick={()=>changeMenu(item)}
                                        >
                                            <figure>
                                                {item.imgUrl &&
                                                    <img src={item.imgUrl} alt="" />
                                                }
                                            </figure>
                                            <div className="txt">
                                                <h4>{item.name}</h4>
                                                <p>{item.description}</p>
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    }
                    <div className="dpmEditBtnBox">
                        <button onClick={handleClose}>
                            Guardar
                        </button>
                        <button onClick={handleClose}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
};

export default MenuDayEdith;
