import React,{useState,useEffect} from "react";
import './Detalle.scss'
import BlockAnimate from './../../ultil/BlockAnimate/BlockAnimate';
import Skeleton from '@mui/material/Skeleton';

import blogImg1 from '../../../assets/img/blog_img1.png';

import EastIcon from '@mui/icons-material/East';

import axios from 'axios';

const BlogDetalle = ({data,closeModal,catList}) => {

    const [detalle,setDetalle] = useState();
    const getDetalle = ()=>{
        axios.get('https://admin-landing.allpafood.com/wp-json/wp/v2/posts?slug='+data.slug+'&acf_format=standard')
        .then((resp)=>{
            setDetalle(resp.data[0])
            console.log(resp.data[0])
        }).catch((err)=>{
            console.log(err)
        })
    }

    const [catVer,setCatVer] = useState();

    useEffect(()=>{

        if(data){
            getDetalle();
        }
        if(catList){
            setCatVer(catList);
        }
    },[])

    
    const formatDate = (date ) => {
        date = String(date).split(' ');
        var days = String(date[0]).split('-');
        return parseInt(days[0])+'/'+ (parseInt(days[1]))+'/'+ parseInt(days[2]);
    }


    return (
        <div className="blogDetalleCont">
            <div className={'blogDetalleClose'} onClick={closeModal}>
                Volver <EastIcon />
            </div>
            <BlockAnimate
                claseStyle={'inlineBlock blogDetalleBox'}
                stateParam={detalle}
                unicId={'blogDetalleASDSAd11232'}
            >
                {detalle ?
                    <div className="inlineBlock blogDetalleBox">
                        
                        <h2>{detalle.title.rendered}</h2>
                        {catVer && catVer.length > 0 &&
                            <div className="cat">
                            {catVer.map((catItem)=>{
                                return (
                                    <div>
                                        {data.categories && data.categories.length > 0 &&
                                            data.categories.map((blogCat)=>{
                                                if(parseInt(blogCat)  === parseInt(catItem.id)){
                                                    return ( <span> {catItem.name}</span>)
                                                }
                                            })  
                                        }
                                    </div>
                                )
                            })}
                            </div>
                        }
                        <div className="date">
                            {formatDate(data.date)}
                        </div>
                        <figure>
                            {detalle.fimg_url ?
                                <img src={detalle.fimg_url} alt="" />
                            :
                                <img src={blogImg1} alt="" />
                            }
                            
                        </figure>
                        {detalle.content && detalle.content.rendered &&
                            <div className="blogDetallesCampTxt" dangerouslySetInnerHTML={{__html:detalle.content.rendered}}>
                            </div>
                        }
                    </div>
                :
                    <div className="inlineBlock blogDetalleLoad">
                        <div onClick={()=>closeModal()}>cerrar</div>
                        <h2><Skeleton variant="text" sx={{ fontSize: '3rem' }} /></h2>
                        <h3><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></h3>
                        <h4><Skeleton variant="text" sx={{ fontSize: '1rem' }} /></h4>
                        <figure>
                            
                        </figure>
                        <div className="txt">
                            
                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            
                        </div>
                    </div>
                }
            </BlockAnimate>
        </div>
    )
};

export default BlogDetalle;
