import React,{useEffect,useState} from "react";
import moment from 'moment';
import './MenuDay.scss';

import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined';
import EditIcon from '@mui/icons-material/Edit';

import Moment from 'react-moment';

import Modal from '@mui/material/Modal';

import TitleCard from "components/ultil/TitleCard/TitleCard";
import SaveIcon from '@mui/icons-material/Save';
import ReplyIcon from '@mui/icons-material/Reply';
import MenuDayEdith from './MenuDayEdith';
import Skeleton from '@mui/material/Skeleton';

import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import AddIcon from '@mui/icons-material/Add';
import RoomIcon from '@mui/icons-material/Room';

import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';

import axios from 'axios';
import { useAuthContext } from "context/authContext";
import ProgramMenuMap from "../ProgramMenu/ubicacion/ubicacion";

const MenuDay = ({data,reproOrder,getMenus}) => {

    const { token, setLoadResp } = useAuthContext();

    const todayDate = new Date();

    let resultEquals = false;
    let resultMayor = false;

    if(moment(data.date).format('dddd') === moment(todayDate).format('dddd')){
        resultEquals = true
    }

    if(moment(data.date).format('d') > moment(todayDate).format('d')){
        resultMayor = true
    }

    const getDayTmp = (date) =>{
        var days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
        var d = new Date(date);
        var dayName = days[d.getDay()];
        return dayName;
    }

    const [openMenuEdit, setOpenMenuEdit] = useState(false);
    const [dataTmp,setDataTmp] = useState();
    const handleModalEditOpen = (data) => {
        setOpenMenuEdit(true);
        if (data?.items?.length) {

            let tmp = {
                scheduleDate: '',
                menusId: []
            };

            data.items.forEach((item) => {

                tmp.scheduleDate = data?.date;

                if(item.type === 'lunch'){
                    tmp.lunch = item;
                }

                if(item.type === 'drinks'){
                    tmp.drinks = item;
                }

                if(item.type === 'dinner'){
                    tmp.dinner = item;
                }

                if(item.type === 'breakfast'){
                    tmp.breakfast = item;
                }

                if(item.type === 'starter'){
                    tmp.starter = item;
                }

                if(item.type === 'Snacks'){
                    tmp.Snacks = item;
                }

            });

            setDataTmp(tmp);
        }
    };

    const handleModalEditClose = () => setOpenMenuEdit(false);


    // Ubicaciones
    const [pointList,setPointList] = useState();
    const [loadPl,setLoadPl] = useState(false);
    const [pointSelect,setPointSelect] = useState({
        id:null,
        data:null
    });

    const getDirections = () => {
        setLoadPl(true)
        axios.get('http://localhost:8443/api-af/v1/delivery/find/points',{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{

            setPointList(resp.data.data);

            if(resp.data?.data){
                resp.data.data.map((item,index)=>{
                    if(item.id === data.deliveryPointId){
                        setPointSelect({
                            id: index,
                            data: item
                        })
                    }
                })
            }

            setTimeout(() => {
                setLoadPl(false)    
            }, 1500);
        }).catch((error)=>{
        })
    }

    const [openResumenMap, setOpenResumenMap] = useState(false);
    const handleResumenMapOpen = () => setOpenResumenMap(true);
    const handleResumenMapClose = () => setOpenResumenMap(false);


    const updateUbi = (item,index) =>{
        setPointSelect({
            id:index,
            data:item
        })
    }

    const removeUbi = (item) =>{
        axios.delete('http://localhost:8443/api-af/v1/delivery/delete/point?deliveryPointId='+item.id,{
            headers: {"Authorization" : `Bearer ${token}`} 
        }).then((resp)=>{

            getDirections()
        }).catch((error)=>{
            console.log(error)
        })
    }

    const [newMenu, setNewMenu] = useState([]);

    const updateOrderDay = () => {
        // 1. Creamos la base del objeto que vamos a enviar
        const requestBody = {
            orderId: data.id,
            menuTypeIds: newMenu,
        };

        // 2. Agregamos condicionalmente el deliveryPointId si existe
        if (pointSelect && pointSelect.data) {
            requestBody.deliveryPointId = pointSelect.data.id;
        }

        // 4. Usamos la variable local para el log y para Axios (¡aquí ya tiene los datos reales!)
        //console.log('updateOrderDay ===>', requestBody);
        setLoadResp(true);

        axios.put(
            'http://localhost:8443/api-af/v1/order/scheduled',
            requestBody, // <-- Enviamos la variable local fresca
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        )
        .then((resp) => {
            handleModalEditClose();
            handleResumenMapClose();
            getMenus();
            setLoadResp(false);
            /*
            setPointSelect({
                id:null,
                data:null
            });
            */
        })
        .catch((error) => {
            console.log('maldito puerco', error);
            setLoadResp(false);
        });
    };

    useEffect(()=>{

        // activar cuando mande datos la api
        
        //setPointSelect({
        //    id:data.deliveryPoint.id,
        //    data:data.deliveryPoint
        //});

        getDirections();
    },[]);

    return (
        <div 
            className={resultEquals ? 'dmwItem dmwItemActive': resultMayor ? 'dmwItem':'dmwItem dmwItemDisabled'} 
        >
            <div className="dmwDate">
                <p><Moment format="D">{data.date}</Moment></p>
                <small>{getDayTmp(data.date)}</small>

                <div className="corner">
                    {resultEquals ?
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0H13V13C13 13 11.7197 6.71969 9 4C6.28031 1.28031 0 0 0 0Z" fill="#7affd3"/>
                        </svg>
                    : resultMayor ? 
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0H13V13C13 13 11.7197 6.71969 9 4C6.28031 1.28031 0 0 0 0Z" fill="#CDF6FF"/>
                        </svg>
                    :
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0H13V13C13 13 11.7197 6.71969 9 4C6.28031 1.28031 0 0 0 0Z" fill="#ededed"/>
                        </svg>
                    }
                </div>
                {resultMayor &&
                    <button 
                        onClick={()=>{reproOrder(data.id)}}
                    >
                        <ChangeCircleOutlinedIcon/>
                        Cambiar
                    </button>
                }
            </div>
            
            <div className="dmwDetails">
                {resultMayor &&
                    <div 
                        className="dmwBtnEditar"
                        onClick={()=>handleModalEditOpen(data)}
                    >
                        <EditIcon />
                    </div>
                }
                <ul>
                    {data.items.map((subItem)=>{

                        if(subItem.type==='lunch'){
                            return (
                                <li>
                                    <small>{'Almuerzo'}</small>
                                    <p>{subItem.menu.name}</p>
                                </li>
                            )
                        }else if(subItem.type==='dinner'){
                            return (
                                <li>
                                    <small>{'Cena'}</small>
                                    <p>{subItem.menu.name}</p>
                                </li>
                            )
                        }

                    })}
                </ul>
                <div className="aditionals">
                    {data.items.map((subItem)=>{
                        if(subItem.type==='drinks'){
                            return (
                                <p>Bebida: <strong>{subItem.menu.name}</strong></p>
                            )
                        }else if(subItem.type==='snack'){
                            return (
                                <p>Snack: <strong>{subItem.menu.name}</strong></p>
                            )
                        }

                    })}
                </div>
            </div>

            <Modal
                open={openMenuEdit}
                onClose={handleModalEditClose}
            >
                <div className="dpmResumenOrder">
                    <TitleCard
                        title={
                            <span>Editar orden: {getDayTmp(data.date)} <Moment format="D">{data.date}</Moment></span> 
                        }
                        icon={<EditIcon />}
                    />

                    <MenuDayEdith data={dataTmp ? dataTmp:null} setNewMenu={setNewMenu} />

                        <br />
                    <div className="inlineFlex dpmRoDelivery">

                        <div className="inlineFlex dpmrdTitle">
                            <h4>
                                <DeliveryDiningIcon /> Delivery
                            </h4>  
                            <div onClick={handleResumenMapOpen} className="dpmRoDeliveryBtn">
                                Agregar <AddIcon />
                            </div>
                        </div>

                        {!loadPl && pointList && pointList.length > 0 ?
                            <div className="ubiPageMapListBox">
                                {pointList.length > 0 && pointList.map((item,index)=>{
                                    
                                return (
                                    <div 
                                        className={pointSelect.id === index ? 'dpmRoDeliveryItem dpmRoDeliveryItemAct':'dpmRoDeliveryItem'}
                                    >
                                    <div className="icon">
                                        <RoomIcon />
                                    </div>
                                    <div className="txt">
                                        <h3>{item.description}</h3>
                                        <p>{item.address}</p>
                                    </div>
                                    { pointSelect.id !== index &&
                                        <div className="actions inlineFlex">
                                            <div onClick={()=>updateUbi(item,index)} className="check">
                                                <CheckIcon />
                                            </div>
                                            <div onClick={()=>removeUbi(item)} className="remove">
                                                <DeleteIcon />
                                            </div>
                                        </div>
                                    }
                                    </div>
                                )
                                })}
                                
                            </div>
                        :
                            <div className="ubiPageMapListBox">
                                {pointList && pointList.length > 0 && pointList.map((item)=>(
                                    <Skeleton variant="rounded" width={'100%'} sx={{mb:1,borderRadius:4}} height={60} />
                                ))}
                            </div>
                        }
                    </div>
                    
                    <div className="inlineFlex dpmResumenBtnBox">
                        <button 
                            className={true ? 'btnPrimary' : 'btnPrimary btnDisabled'}
                            onClick={()=>updateOrderDay()}
                        >
                            <SaveIcon />Guardar orden
                        </button>
                        <button className={'btnPrimary'} onClick={()=>handleModalEditClose()}>
                            <ReplyIcon /> Volver
                        </button>
                    </div>
                </div>
            </Modal>
            
            <Modal
                open={openResumenMap}
                onClose={handleResumenMapClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <div className="inlineBlock dpmResumenMapCont">
                    <ProgramMenuMap setPointList={setPointList} updateUbi={updateUbi} handleResumenMapClose={handleResumenMapClose} />
                </div>
            </Modal>
        </div>
    )
};

export default MenuDay;
