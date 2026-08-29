import React,{useState,useEffect} from "react";

import Skeleton from '@mui/material/Skeleton';
import BlockAnimate from './../../../ultil/BlockAnimate/BlockAnimate';

const CardProfilePassword = () => {

    const [data,setData] = useState();
    useEffect(()=>{
        setTimeout(() => {
            setData(true)
        }, 1000);
    },[])
    return (
        <div className="displayFlex perfilBox perfilBox3">
            <BlockAnimate
                claseStyle={'txt'}
                stateParam={data}
                unicId={'CardPasswordasd564ad56a4sd'}
            >
            
            {data ?

                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                        <small>Clave:</small>
                        <p>************</p>
                    </div>
                </div>

            :

                <div className="inlineBlock txtBox">
                    <div className="perfilLblField">
                    <small>Clave:</small>
                    <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                    </div>
                </div>

            }
            </BlockAnimate>
        </div>
    )
};

export default CardProfilePassword;
