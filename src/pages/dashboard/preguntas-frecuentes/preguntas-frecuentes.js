import React,{useState,useEffect} from "react";
import './preguntas-frecuentes.scss'

import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

import icoPreguntasFrecuentes from '../../../assets/img/ico_preguntas_frecuentes.svg';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Skeleton from '@mui/material/Skeleton';

import axios from 'axios';
import BlockAnimate from './../../../components/ultil/BlockAnimate/BlockAnimate';

const PreguntasFrecuentesPage = (props) => {

    const [faqList,setFapList] = useState();

    const getFaq = () =>{
        axios.get('https://admin-landing.allpafood.com/wp-json/wp/v2/preguntas-frecuentes')
            .then((resp)=>{
                setFapList(resp.data);
                console.log(resp.data);
            }).catch((error)=>{
                console.log(error)
            })
    }

    useEffect(()=>{
        getFaq();
    },[])

    return (
        <LayoutDasboard claseStyle={false}>
            <CardPaper
                data={
                    {
                        titulo:'Preguntas frecuentes :',
                        ico:icoPreguntasFrecuentes,
                        className:false
                    }
                }
            >
                <BlockAnimate
                    claseStyle={'inlineBlock'}
                    stateParam={faqList}
                    unicId={'preguntasFrecuentesas6d54asd654asd546'}
                >
                {faqList && faqList.length > 0 ?
                    <div className="preFreBox">
                        {faqList.map((item,index)=>{
                            if(index===0){
                                return (
                                    <Accordion  defaultExpanded >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id="panel1-header"
                                        >
                                            <Typography component="span">{item.title.rendered}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <div dangerouslySetInnerHTML={{__html: item.content.rendered}}></div>
                                        </AccordionDetails>
                                    </Accordion>
                                )
                            }else{
                                return (
                                    <Accordion>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"
                                            id="panel1-header"
                                        >
                                            <Typography component="span">{item.title.rendered}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <div dangerouslySetInnerHTML={{__html: item.content.rendered}}></div>
                                        </AccordionDetails>
                                    </Accordion>
                                )
                            }


                        })}

                    </div>
                :
                    <div className="preFreBox">
                        <Accordion defaultExpanded >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                            >
                                <Typography component="span" sx={{ width:'100%' }}><Skeleton variant="text" sx={{ fontSize: '2rem',width:'100%' }} /></Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                            >
                                <Typography component="span" sx={{ width:'100%' }}><Skeleton variant="text" sx={{ fontSize: '2rem',width:'100%' }} /></Typography>
                            </AccordionSummary>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                            >
                                <Typography component="span" sx={{ width:'100%' }}><Skeleton variant="text" sx={{ fontSize: '2rem',width:'100%' }} /></Typography>
                            </AccordionSummary>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                            >
                                <Typography component="span" sx={{ width:'100%' }}><Skeleton variant="text" sx={{ fontSize: '2rem' }} /></Typography>
                            </AccordionSummary>
                        </Accordion>
                    </div>
                }
                </BlockAnimate>
            </CardPaper>
        </LayoutDasboard>
    )
};

export default PreguntasFrecuentesPage;
