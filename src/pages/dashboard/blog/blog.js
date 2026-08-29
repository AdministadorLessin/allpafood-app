import React,{useState,useEffect} from "react";
import axios from 'axios';

import './blog.scss';
import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

import icoMenu from '../../../assets/img/ico_factrura.svg';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import CardNoticia from './../../../components/blog/CardNoticia/CardNoticia';
import CardNoticiaLoad from './../../../components/blog/CardNoticiaLoad/CardNoticiaLoad';
import BlockAnimate from './../../../components/ultil/BlockAnimate/BlockAnimate';
import BlogNotResult from './../../../components/blog/BlogNotResult/BlogNotResult';

import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Backdrop from '@mui/material/Backdrop';
import BlogDetalle from './../../../components/blog/Detalle/Detalle';

const BlogPage = (props) => {

    const [noticiasList,setNoticiasList]  = useState();
    const [arrayFiltered,setArrayFiltered] = useState();
    const [arrayFiltered2,setArrayFiltered2] = useState();

    const getNoticias = ()=>{
        axios.get('https://admin-landing.allpafood.com/wp-json/wp/v2/posts')
            .then((resp)=>{
                setNoticiasList(resp.data)
                setArrayFiltered(resp.data)
                setArrayFiltered2(resp.data)
            }).catch((err)=>{
                console.log('erro',err)
            })
    }

    const pageCategories = 'https://admin-landing.allpafood.com/wp-json/wp/v2/categories';
    const [catList,setCatList] = useState();
    
    const getCategories = () =>{ 
        axios.get(pageCategories)
        
        .then((resp)=>{
            setCatList(resp.data)
        }).catch((error)=>{
            console.log(error)
        })
    }

    const filteredBooks = (t,list)=> list.filter(
        ({  title }) =>
          title.rendered.toLowerCase().includes(t.toLowerCase())
    );

    const [searchField,setSearchField] = useState();
    const changeField = (e)=>{
    
        const listTmp = filteredBooks(e.target.value,arrayFiltered2);
        const newList = []
        listTmp.map((item)=>{
            return newList.push(item)
        });
        
        setArrayFiltered(newList);
        setSearchField(e.target.value)
        
    }

    const [showNot,setShowNot] = useState(false);
    const applyFilter = (filter) => {
        setShowNot(true)
        const result = []
        for (const blog of noticiasList){
            for (const category of blog.categories){
                if(parseInt(category)  === parseInt(filter)){
                    result.push(blog);
                    break;
                }
            }
        }
        if(result.length){
            setArrayFiltered(result);
        }else{
            setArrayFiltered(0);
        }
        
    };

    // Modal
    const [openDetalle, setOpenDetalle] = useState(false);
    const [detalleItem,setDetalleItem] = useState();
    const handleOpenDetalle = (item) => {
        setOpenDetalle(true)
        setDetalleItem(item)
    };
    const handleCloseDetalle = () => {
        
        setOpenDetalle(false)
    };

    useEffect(()=>{
        getNoticias();
        getCategories();
    },[]);

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
                <div className="inlineFlex blogPageFiltros">
                    {catList &&
                        <div className="blogPageCat">
                            <h4>Filtrar por:</h4>
                            
                            <ul>
                                {catList.map((item)=>{
                                    return (
                                    <li><div className={'linkCat'} onClick={()=>applyFilter(item.id)} >{item.name}</div></li>
                                    )
                                })}
                            </ul>
                            
                        </div>
                    }
                    <div className="blogPageSearch">
                        <TextField
                            slotProps={{
                                input: {
                                    startAdornment:
                                    <InputAdornment position="start">
                                        <IconButton
                                        aria-label="description for action"
                                        >
                                        <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                },
                            }}
                            value={searchField}
                            onChange={changeField}
                            
                        />
                    </div>
                </div>

                <BlockAnimate
                    claseStyle={'inlineBlock'}
                    stateParam={arrayFiltered}
                    unicId={'blogLists1a6s5d56ad4s'}
                >
                { arrayFiltered && arrayFiltered.length ?
                    <div className="inlineFlex blogPageList">
                        {arrayFiltered.map((item)=>{
                            return (
                                <div className="blogPageItem">
                                    <CardNoticia data={item} catList={catList} modalOpen={handleOpenDetalle} />
                                </div>
                            )
                        })}
                    </div>
                :arrayFiltered === 0 ?
                    <BlogNotResult />
                :
                    <div className="inlineFlex blogPageList">
                        <div className="blogPageItem">
                            <CardNoticiaLoad />
                        </div>
                        <div className="blogPageItem">
                            <CardNoticiaLoad />
                        </div>
                        <div className="blogPageItem">
                            <CardNoticiaLoad />
                        </div>
                    </div>
                }
                </BlockAnimate>

                <Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    open={openDetalle}
                    onClose={handleCloseDetalle}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                    }}
                >
                    <Fade in={openDetalle} enter={'easing'}>
                        <div>
                            <BlogDetalle data={detalleItem} catList={catList}  closeModal={handleCloseDetalle} />
                        </div>
                    </Fade>
                </Modal>
            </CardPaper>
        </LayoutDasboard>
    )
};

export default BlogPage;
