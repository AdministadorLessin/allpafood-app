import React, { useState, useEffect } from "react";
import './Detalle.scss';
import Skeleton from '@mui/material/Skeleton';
import axios from 'axios';

/**
 * Un articulo de Salud y bienestar, abierto.
 *
 * Sigue la misma linea que la lista: la foto manda, el titulo va encima de
 * ella y el texto abajo en una columna comoda de leer. Antes el titulo iba
 * arriba en negro, la foto despues y el contenido con los estilos crudos de
 * WordPress; parecia otra pagina, no parte de la app.
 *
 * Esto es un beneficio del plan, asi que tiene que sentirse cuidado.
 */
const BlogDetalle = ({ data, closeModal, catList }) => {

    const [detalle, setDetalle] = useState(null);

    useEffect(() => {
        if (!data?.slug) return;
        axios.get('https://admin-landing.allpafood.com/wp-json/wp/v2/posts?slug=' + data.slug + '&acf_format=standard')
            .then((resp) => setDetalle(resp.data?.[0] || null))
            .catch(() => setDetalle(null));
    }, [data]);

    const categoria = (() => {
        if (!catList || !data?.categories?.length) return null;
        const c = catList.find((x) => data.categories.includes(x.id));
        return c ? c.name : null;
    })();

    const fecha = (() => {
        const d = new Date(data?.date);
        return Number.isNaN(d.valueOf())
            ? null
            : d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    })();

    const titulo = String(detalle?.title?.rendered || data?.title?.rendered || '')
        .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
    const foto = detalle?.fimg_url || data?.fimg_url;

    return (
        <div className="afArt">
            <button type="button" className="afArt__volver" onClick={closeModal}>
                ← Volver
            </button>

            <article className="afArt__hoja">
                {/* Portada: la misma tarjeta de la lista, ahora a lo ancho. */}
                <header className="afArt__portada"
                    style={foto ? { backgroundImage: `url(${foto})` } : undefined}>
                    <span className="afArt__velo" />
                    {categoria && <span className="afArt__cat">{categoria}</span>}
                    <h1 className="afArt__titulo">{titulo || <Skeleton variant="text" width={280} />}</h1>
                    {fecha && <p className="afArt__fecha">{fecha}</p>}
                </header>

                <div className="afArt__cuerpo">
                    {!detalle &&
                        <>
                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            <Skeleton variant="text" width="75%" sx={{ fontSize: '1rem' }} />
                            <Skeleton variant="rounded" height={180} sx={{ borderRadius: '18px', mt: 2 }} />
                        </>
                    }

                    {detalle?.content?.rendered &&
                        <div className="afArt__txt"
                            dangerouslySetInnerHTML={{ __html: detalle.content.rendered }} />
                    }
                </div>

                <footer className="afArt__pie">
                    <p>Contenido del equipo de Allpa Food, incluido en tu plan.</p>
                    <button type="button" className="afBtn afBtn--fantasma" onClick={closeModal}>
                        Volver a los artículos
                    </button>
                </footer>
            </article>
        </div>
    );
};

export default BlogDetalle;
