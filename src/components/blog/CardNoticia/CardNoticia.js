import React,{useState,useEffect} from "react";
import './CardNoticia.scss';

import blogImg1 from '../../../assets/img/blog_img1.png';

const CardNoticia = ({data,catList,modalOpen}) => {

    const [info,setInfo] = useState();
    const [catVer,setCatVer] = useState();

    const formatDate = (date ) => {
        date = String(date).split(' ');
        var days = String(date[0]).split('-');
        return parseInt(days[0])+'/'+ (parseInt(days[1]))+'/'+ parseInt(days[2]);
    }

    useEffect(()=>{
        console.log(catList)
        if(data){
            setInfo(data);
        }
        if(catList){
            setCatVer(catList);
        }
    },[]);


    
    return (
        
        <div className="cardNotica">
            <figure>
                {data.fimg_url ?
                    <img src={data.fimg_url} />
                :
                    <img src={blogImg1} />
                }
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
            </figure>
            <h3>{data.title.rendered}</h3>
            <div className="txt">
                {data.excerpt && data.excerpt.rendered &&
                    <div dangerouslySetInnerHTML={{__html: data.excerpt.rendered}}></div>
                }
                {data.date &&
                <div className="date">
                    {formatDate(data.date)}
                </div>
                }
            </div>
            <div className="btnMore" onClick={()=>modalOpen(data)}>
                <span>Ver más</span>
            </div>
        </div>
    )
};

export default CardNoticia;
