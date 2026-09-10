import React, { useEffect, useState } from 'react';
import './beneficios.scss';
import axios from 'axios';
import LayoutDashboard from '../../../components/LayoutDashborad/LayoutDashboard';
import { useAuthContext } from '../../../context/authContext';
import { Cascada, Bloque } from '../../../components/ultil/Motion/Motion';

/**
 * Allpa+, los convenios que vienen con el plan.
 *
 * Existian solo en la web publica, asi que quien ya habia pagado —el unico
 * que puede usarlos— no los veia por ningun lado. Estaba pagando por algo
 * que no sabia que tenia, y eso es justo lo que sostiene una renovacion.
 *
 * Los convenios no van escritos aqui: se leen de settings/allpa_plus, que es
 * una fila de la base. Sumar una marca es editar esa fila, sin volver a
 * compilar ni desplegar la app.
 */

/* Un icono por categoria. Si manana aparece una categoria nueva, cae en el
   generico en vez de romper la pantalla. */
const ICONOS = {
  'Salud & Bienestar': 'M12 21s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 12c0 4.6-7 9-7 9z',
  'Educación': 'M3 8l9-4 9 4-9 4-9-4zM7 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4',
  'Hogar & Lifestyle': 'M4 11l8-6 8 6M6 10v9h12v-9',
  'Fitness': 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12',
  'Alimentación Saludable': 'M12 8c-3.5-3-8 .5-6.5 5.5C6.7 18 10 21 12 21s5.3-3 6.5-7.5C20 8.5 15.5 5 12 8zM12 8c0-2 1-3.5 3-4.5',
  _: 'M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z',
};

const WHATSAPP = '51999999999';

const Beneficios = () => {
  const { baseUrl, token } = useAuthContext();
  const [convenios, setConvenios] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`${baseUrl}settings/allpa_plus`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setConvenios(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .catch(() => {
        setConvenios([]);
        setError('No pudimos cargar tus beneficios. Vuelve a intentarlo.');
      });
  }, [baseUrl, token]);

  /* Se agrupa en el orden en que llegan, no alfabetico: asi el orden de los
     convenios lo decide quien edita la fila, sin tocar codigo. */
  const porCategoria = (convenios ?? []).reduce((acc, c) => {
    const k = c.categoria || 'Otros';
    (acc[k] = acc[k] || []).push(c);
    return acc;
  }, {});

  const pedir = (c) => {
    const texto = `Hola, quiero usar mi beneficio Allpa+ de ${c.marca}.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <LayoutDashboard>
      <Cascada className="afPlus">
        <Bloque>
          <h1 className="afPlus__titular">
            <span className="t1">Tu plan</span>
            también rinde afuera
          </h1>
        </Bloque>

        <Bloque>
          <p className="afPlus__bajada">
            Descuentos y acompañamiento en salud, fitness, hogar y formación,
            solo por ser cliente.
          </p>
        </Bloque>

        {error && <Bloque><p className="afPlus__error">{error}</p></Bloque>}

        {convenios === null && (
          <Bloque><p className="afPlus__cargando">Cargando tus beneficios…</p></Bloque>
        )}

        {convenios !== null && convenios.length === 0 && !error && (
          <Bloque>
            <p className="afPlus__cargando">
              Todavía no hay convenios publicados. Vuelve pronto.
            </p>
          </Bloque>
        )}

        {Object.entries(porCategoria).map(([categoria, items]) => (
          <React.Fragment key={categoria}>
            <Bloque>
              <p className="afPlus__cat">
                <span className="afPlus__catIco">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICONOS[categoria] || ICONOS._} />
                  </svg>
                </span>
                {categoria}
                <b>{items.length}</b>
              </p>
            </Bloque>

            {items.map((c) => (
              <Bloque key={categoria + c.marca}>
                <div className="afConvenio">
                  <div className="afConvenio__top">
                    <span className="afConvenio__marca">{c.marca}</span>
                    <span className="afConvenio__valor">{c.beneficio}</span>
                  </div>
                  <p className="afConvenio__que">{c.que}</p>
                  <p className="afConvenio__detalle">{c.detalle}</p>
                  {c.nota && <span className="afConvenio__nota">{c.nota}</span>}
                  <button type="button" className="afConvenio__btn" onClick={() => pedir(c)}>
                    Pedir este beneficio
                  </button>
                </div>
              </Bloque>
            ))}
          </React.Fragment>
        ))}

        {convenios !== null && convenios.length > 0 && (
          <Bloque>
            <div className="afPlus__como">
              <p className="afPlus__comoTit">Cómo se usa</p>
              <ol className="afPlus__pasos">
                <li>Tocas <b>Pedir este beneficio</b> y nos escribes por WhatsApp.</li>
                <li>Verificamos que tu plan esté vigente.</li>
                <li>Te enviamos el código o las instrucciones de esa marca.</li>
              </ol>
              <p className="afPlus__letraChica">
                Los descuentos aplican a los productos que elige cada marca y
                están sujetos a sus condiciones. Algunos son solo para Lima
                Metropolitana.
              </p>
            </div>
          </Bloque>
        )}
      </Cascada>
    </LayoutDashboard>
  );
};

export default Beneficios;
