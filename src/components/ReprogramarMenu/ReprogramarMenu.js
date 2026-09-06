import React,{useState,useEffect,useRef} from "react";
import './ReprogramarMenu.scss';
import CheckIcon from '@mui/icons-material/Check';

import Modal from '@mui/material/Modal';

import icoNotificacion from '../../assets/img/icon_notify.svg';
import icoExpiracion from '../../assets/img/ico_expiracion.png';
import icoDisponible from '../../assets/img/ico_disponible.png';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

import Badge from '@mui/material/Badge';

import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';

import dayjs from 'dayjs';
import Moment from 'react-moment';
import moment from 'moment';

import axios from 'axios';

import {useAuthContext} from '../../context/authContext';
import "dayjs/locale/es";
import { API_URL } from '../../config';


function getRandomNumber(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }
  

  function fakeFetch(date, { signal }) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const daysInMonth = date.daysInMonth();
        const daysToHighlight = [1, 2, 3].map(() => getRandomNumber(1, daysInMonth));
  
        resolve({ daysToHighlight });
      }, 500);
  
      signal.onabort = () => {
        clearTimeout(timeout);
        reject(new DOMException('aborted', 'AbortError'));
      };
    });
  }
  
  const initialValue = dayjs('2022-04-17');
  function ServerDay(props) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  
    //const isSelected =
    //!props.outsideCurrentMonth && highlightedDays.indexOf(props.day.date()) >= 0;
    
    const isSelected =
      !props.outsideCurrentMonth && highlightedDays.find(item => item === moment(props.day.$d).format('DD/MM/YYYY'));
  
    const toDateTmp = ()=>{
      console.log('==>',highlightedDays)
      console.log('--->',moment(props.day.$d).format('DD/MM/YYYY'))
      return moment(props.day.$d).format('DD-MM-YYYY');
    }

    return (
      <Badge
        key={props.day.toString()}
        overlap="circular"

        dayxD={toDateTmp()}
        montXD={isSelected}

        badgeContent={isSelected ? <CheckIcon /> : undefined}
      >
        <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
      </Badge>
    );
  }

const ReprogramarMenu = ({openReprogramar, setOpenReprogramar,data}) => {
    
    const { token, planInfo } = useAuthContext();
    const [open, setOpen] = useState(openReprogramar);
    const handleClose = () => {
        setOpenReprogramar(false);
        setOpen(false)
    };


    const [value, setValue] = useState(dayjs(new Date()));

    const [datePlan,setDatePlan] = useState();
    const [highlightedDays, setHighlightedDays] = useState([]);

    const getAllprogam = () =>{
        axios.get(`${API_URL}order/plan`,
            {
              headers: {"Authorization" : `Bearer ${token}`} 
            }
        ).then((resp)=>{
            const daysTemp = [];
            resp.data.data.map((item)=>{
              //console.log('-->Zzzzz',moment(item.date).format('DD/MM/YYYY'))
              daysTemp.push(moment(item.date).format('DD/MM/YYYY'))
            })
            //console.log('00',daysTemp)
            setHighlightedDays(daysTemp)

        })
        .catch((error)=>{
            console.log(error);
        })
    }

    const requestAbortController = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
  
    const fetchHighlightedDays = (date) => {
      const controller = new AbortController();
        fakeFetch(date, {
          signal: controller.signal,
        })
        .then(({ daysToHighlight }) => {
          //console.log(daysToHighlight)
          //setHighlightedDays(daysToHighlight);
          setIsLoading(false);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            throw error;
          }
        });
  
      requestAbortController.current = controller;
    };
  
    useEffect(() => {
      fetchHighlightedDays(initialValue);
      return () => requestAbortController.current?.abort();
    }, []);
  
    const handleMonthChange = (date) => {
      if (requestAbortController.current) {
        // make sure that you are aborting useless requests
        // because it is possible to switch between months pretty quickly
        requestAbortController.current.abort();
      }
  
      setIsLoading(true);
      //setHighlightedDays([]);
      fetchHighlightedDays(date);

      fetchHighlightedDays(initialValue);
      return () => requestAbortController.current?.abort();
    };

    useEffect(()=>{
        setOpen(openReprogramar);
        setDatePlan(planInfo);
        getAllprogam();
    },[openReprogramar]);



    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <div className="rMenuCont">
                <div className="title">
                    <div className="ico">
                        <img src={icoNotificacion} alt="" />
                    </div>
                    <h3>Tu calendario de entregas</h3>
                </div>
                {datePlan && datePlan.plan &&
                    <div className="displayFlex rMenuExpiracion">
                        <div className="rMenuExpiracionItem">
                            <figure>
                                <img src={icoDisponible} alt="" />
                            </figure>
                            <div className="txt">
                                <small>Envíos:</small>
                                <h5>{datePlan.plan.consumption.orders.consumed} de {datePlan.plan.consumption.orders.total}</h5>
                            </div>
                        </div>
                        <div className="rMenuExpiracionItem">
                            <figure>
                                <img src={icoExpiracion} alt="" />
                            </figure>
                            <div className="txt">
                                <small>Expira el</small>
                                <h5>
                                    <Moment format="D MMM">
                                        {datePlan.plan.expirationDate}
                                    </Moment>
                                </h5>
                            </div>
                        </div>
                    </div>
                }
                {datePlan && datePlan.plan &&
                <div className="rMenuCalendar">
                    <LocalizationProvider 
                        dateAdapter={AdapterDayjs}
                        adapterLocale="es"
                    >
                        <DateCalendar
                            minDate={dayjs(datePlan.plan.initDate)}
                            maxDate={dayjs(datePlan.plan.expirationDate)}
                            value={value} 
                            onChange={(newValue) => {
                              console.log(value)
                              setValue(newValue)
                            }}
                            defaultValue={value}
                            loading={isLoading}
                            onMonthChange={handleMonthChange}
                            renderLoading={() => <DayCalendarSkeleton className='asdapodaisdASDADADSAS' />}
                            slots={{
                              day: ServerDay,
                            }}
                            slotProps={{
                              day: {
                                highlightedDays,
                              },
                            }}
                        />
                    </LocalizationProvider>
                </div>
                }
            </div>
        </Modal>
    )
};

export default ReprogramarMenu;
