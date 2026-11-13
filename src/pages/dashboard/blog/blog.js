import React,{useState,useEffect} from "react";
import axios from 'axios';

import './blog.scss';
import Pantalla, { Tramo } from './../../../components/perfil/Pantalla/Pantalla';
import HojaNutricion from './../../../components/perfil/HojaNutricion/HojaNutricion';
import Skeleton from '@mui/material/Skeleton';
import { motion } from 'motion/react';
import { resorte } from '../../../movimiento';

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
    
        const listTmp = filteredBooks(e.target.value,arrayFiltered2 || []);
        const newList = []
        listTmp.map((item)=>{
            return newList.push(item)
        });
        
        setArrayFiltered(newList);
        setSearchField(e.target.value)
        
    }

    const [verNutricion,setVerNutricion] = useState(false);
    const [showNot,setShowNot] = useState(false);
    const [catActiva,setCatActiva] = useState(null);
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

    /* El texto de WordPress viene con etiquetas: se limpia para mostrar un
       resumen de dos lineas, no HTML a medio pintar. */
    const resumen = (html) => String(html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&hellip;/g, '…')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();

    const nombreCategoria = (item) => {
        if (!catList || !item?.categories?.length) return null;
        const c = catList.find((x) => item.categories.includes(x.id));
        return c ? c.name : null;
    };

    return (
        <Pantalla etiqueta="Bienestar" titulo="Salud y bienestar"
            bajada="Recetas, consejos y nutrición del equipo de Allpa Food."
            volver="/bienestar" clase="blg">

            <Tramo className="blg__barra">
                <div className="blg__buscar">
                    <span className="blg__lupa" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
                    </span>
                    <input
                        type="search"
                        placeholder="Buscar un artículo"
                        value={searchField || ''}
                        onChange={changeField}
                        aria-label="Buscar un artículo"
                    />
                </div>

                {catList && catList.length > 0 &&
                    <div className="blg__cats" role="group" aria-label="Categorías">
                        <button type="button" aria-pressed={catActiva === null}
                            className={`blg__cat${catActiva === null ? ' is-on' : ''}`}
                            onClick={() => { setCatActiva(null); setArrayFiltered(arrayFiltered2); }}>
                            Todo
                        </button>
                        {catList.map((item) => (
                            <button type="button" key={item.id} aria-pressed={catActiva === item.id}
                                className={`blg__cat${catActiva === item.id ? ' is-on' : ''}`}
                                onClick={() => { setCatActiva(item.id); applyFilter(item.id); }}>
                                {item.name}
                            </button>
                        ))}
                    </div>
                }
            </Tramo>

            <Tramo>
                {!arrayFiltered && arrayFiltered !== 0 &&
                    <div className="blg__lista">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} variant="rounded" height={i === 0 ? 300 : 220}
                                sx={{ borderRadius: '26px' }} />
                        ))}
                    </div>
                }

                {(arrayFiltered === 0 || (arrayFiltered && arrayFiltered.length === 0)) &&
                    <p className="cuP__vacio">
                        No encontramos artículos con ese filtro. Prueba con otra categoría u otra palabra.
                    </p>
                }

                {arrayFiltered && arrayFiltered.length > 0 &&
                    <div className="blg__lista">
                        {arrayFiltered.map((item, i) => (
                            /* Foto a sangre con la tipografia encima: el plato vende, no
                               el marco. La primera va mas alta: da un punto de entrada. */
                            <motion.button type="button"
                                className={`blg__nota${i === 0 ? ' blg__nota--destacada' : ''}`}
                                key={item.id}
                                style={item.fimg_url ? { backgroundImage: `url(${item.fimg_url})` } : undefined}
                                onClick={() => handleOpenDetalle(item)}
                                whileTap={{ scale: 0.98 }} transition={resorte.toque}>
                                <span className="blg__velo" />
                                {nombreCategoria(item) &&
                                    <span className="blg__notaCat">{nombreCategoria(item)}</span>}
                                <span className="blg__notaTxt">
                                    <b>{resumen(item?.title?.rendered)}</b>
                                    <small>{resumen(item?.excerpt?.rendered).slice(0, 110)}…</small>
                                </span>
                            </motion.button>
                        ))}
                    </div>
                }
            </Tramo>

            {/* Quien llega hasta aqui con una duda propia: una persona. */}
            <Tramo className="cuP__tinta blg__nutri">
                <b>¿Tienes una duda sobre tu alimentación?</b>
                <p>Orientación sin costo, por WhatsApp.</p>
                <motion.button type="button" className="cuP__btn cuP__btn--menta"
                    onClick={() => setVerNutricion(true)} whileTap={{ scale: 0.97 }} transition={resorte.toque}>
                    Habla con nutrición
                </motion.button>
            </Tramo>

            <HojaNutricion abierta={verNutricion} alCerrar={() => setVerNutricion(false)} />

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
        </Pantalla>
    )
};

export default BlogPage;
