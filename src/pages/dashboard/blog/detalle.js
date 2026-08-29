import React from "react";

import './detalle.scss';

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

import icoMenu from '../../../assets/img/ico_factrura.svg';

import blogImg1 from '../../../assets/img/blog_img2.png';

const DetallePage = (props) => {
  return (
    <LayoutDasboard claseStyle={false}>
        <CardPaper
            data={
                {
                    titulo:'Salud y bienestar:',
                    ico:icoMenu,
                    className:false
                }
            } 
        >
            <div className="inlineFlex bpBackContent">
                <a href="#" className="btnBack">
                    <span>
                        Volver
                    </span>
                </a>
            </div>
            <div className="inlineBlock bpDetBox">
                <div className="bpDetTitle">
                    <div className="date">
                        11/11/2024
                    </div>
                    <h1>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</h1>
                </div>
                <div className="bpDetCont">
                    <figure>
                        <img src={blogImg1} alt="" />
                    </figure>
                    <div className="txt">
                        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                        <ul>
                            <li>Lorem Ipsum has been the industry's</li>
                            <li>It has survived not only five centuries</li>
                            <li>It was popularised in the 1960s with the release of Letraset</li>
                            <li>Lorem Ipsum has been the industry's</li>
                            <li>It has survived not only five centuries</li>
                            <li>It was popularised in the 1960s with the release of Letraset</li>
                        </ul>
                        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </div>
                </div>
            </div>
        </CardPaper>
    </LayoutDasboard>
  )
};

export default DetallePage;
