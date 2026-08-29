import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

import './CarruselNoticias.scss';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

// import required modules
import { Pagination } from 'swiper/modules';

import newsImageDash from '../../../assets/img/home_news.png';

const CarruselNoticias = (props) => {
  return (
    <Swiper
        pagination={{
            dynamicBullets: true,
        }}
        modules={[Pagination]}
        className="homeDashNotSwiper"
    >
        <SwiperSlide>
            <a href={'#'} className="hncItem">
                <img src={newsImageDash} alt="" />
                <div className="hncTitle">
                    <h4>¿Cuánto ejercicio debo hacer?</h4>
                </div>
            </a>
        </SwiperSlide>
        <SwiperSlide>
            <a href={'#'} className="hncItem">
                <img src={newsImageDash} alt="" />
                <div className="hncTitle">
                    <h4>¿Cuánto ejercicio debo hacer?</h4>
                </div>
            </a>
        </SwiperSlide>
        <SwiperSlide>
            <a href={'#'} className="hncItem">
                <img src={newsImageDash} alt="" />
                <div className="hncTitle">
                    <h4>¿Cuánto ejercicio debo hacer?</h4>
                </div>
            </a>
        </SwiperSlide>
    </Swiper>
  )
};

export default CarruselNoticias;
