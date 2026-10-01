import React,{useState,useEffect} from "react";
import axios from 'axios';

import './blog.scss';
import LayoutDasboard from './../../../components/LayoutDashborad/LayoutDashboard';
import Skeleton from '@mui/material/Skeleton';
import { Cascada, Bloque, motion, alToque } from './../../../components/ultil/Motion/Motion';

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
        <LayoutDasboard claseStyle={false}>
            <Cascada className="afPanel afPanel--blog">

                <Bloque><h1 className="afPanel__titular">Salud y bienestar</h1></Bloque>
                <Bloque>
                    <p className="afMenu__ayuda">
                        Recetas, consejos y nutrición del equipo de Allpa Food.
                    </p>
                </Bloque>

                <Bloque>
                    <div className="afBlog__barra">
                        <div className="afBlog__buscar">
                            <span className="afBlog__lupa" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
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
                            <div className="afBlog__cats">
                                <button type="button"
                                    className={`afBlog__cat${catActiva === null ? ' afBlog__cat--on' : ''}`}
                                    onClick={() => { setCatActiva(null); setArrayFiltered(arrayFiltered2); }}>
                                    Todo
                                </button>
                                {catList.map((item) => (
                                    <button type="button" key={item.id}
                                        className={`afBlog__cat${catActiva === item.id ? ' afBlog__cat--on' : ''}`}
                                        onClick={() => { setCatActiva(item.id); applyFilter(item.id); }}>
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        }
                    </div>
                </Bloque>

                <Bloque>
                    {!arrayFiltered && arrayFiltered !== 0 &&
                        <div className="afBlog__lista">
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} variant="rounded" height={300}
                                    sx={{ borderRadius: '26px', gridColumn: i === 0 ? 'span 2' : 'auto' }} />
                            ))}
                        </div>
                    }

                    {arrayFiltered === 0 &&
                        <div className="afCard">
                            <p className="afMenu__nota afMenu__nota--suelta">
                                No encontramos artículos con ese filtro. Prueba con otra categoría.
                            </p>
                        </div>
                    }

                    {arrayFiltered && arrayFiltered.length > 0 &&
                        <div className="afBlog__lista">
                            {arrayFiltered.map((item, i) => (
                                /* Foto a sangre con la tipografia encima, como las tarjetas de
                                   comida de la referencia: el plato vende, no el marco blanco.
                                   La primera ocupa el doble de ancho: da un punto de entrada
                                   en vez de una cuadricula pareja. */
                                <motion.button type="button"
                                    className={`afNota${i === 0 ? ' afNota--destacada' : ''}`}
                                    key={item.id}
                                    style={item.fimg_url ? { backgroundImage: `url(${item.fimg_url})` } : undefined}
                                    onClick={() => handleOpenDetalle(item)} {...alToque}>
                                    <span className="afNota__velo" />
                                    {nombreCategoria(item) &&
                                        <span className="afNota__cat">{nombreCategoria(item)}</span>}
                                    <span className="afNota__flecha" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                             strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
                                    </span>
                                    <span className="afNota__txt">
                                        <b>{resumen(item?.title?.rendered)}</b>
                                        <small>{resumen(item?.excerpt?.rendered).slice(0, 110)}…</small>
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    }
                </Bloque>

            </Cascada>

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
        </LayoutDasboard>
    )
};

export default BlogPage;
