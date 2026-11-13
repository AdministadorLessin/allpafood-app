import React, {useState,useEffect} from "react";
import './facturacion.scss';

import Pantalla, { Tramo } from '../../../components/perfil/Pantalla/Pantalla';
import Hoja from '../../../components/perfil/Hoja/Hoja';
import Skeleton from '@mui/material/Skeleton';
import moment from 'moment';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';
import { API_URL } from '../../../config';

const FacturacionPage = (props) => {

  const [cargado,setCargado] = useState(false);
  // Las facturas tal cual llegan: la tabla solo muestra cuatro campos, pero el
  // comprobante necesita el detalle por lineas, el metodo de pago y la
  // referencia del cobro.
  const [facturas,setFacturas] = useState([]);
  const [factura,setFactura] = useState(null);

  const { token, handleUpdateToken } = useAuthContext();

  const getFacturas = () =>{
    axios.get(`${API_URL}invoice/list`,{
      headers: {"Authorization" : `Bearer ${token}`} 
    }).then((resp)=>{
      setFacturas(resp.data.data || []);
      setCargado(true);
    }).catch((error)=>{
      console.log(error);
      setCargado(true);
    })
  }

  const [plan,setPlan] = useState();
  const [helloCard,setHelloCard] = useState();

  const getPlan = ()=>{
      axios.get(`${API_URL}dashboard/plan`,{
          headers: {"Authorization" : `Bearer ${token}`} 
      })
      .then((resp)=>{
          const reultTmp = resp.data.data;
          const infTmp = JSON.parse(window.localStorage.getItem('inf'));
          infTmp.plan = reultTmp;
          handleUpdateToken(token,infTmp);
          setHelloCard(infTmp);
          setPlan(resp.data.data);
      }).catch((error)=>{
          console.log(error);
      })
  }

  const [open, setOpen] = useState(false);
  const handleOpen = (row) => {
    // handleOpen recibia la fila y la ignoraba, asi que el modal se abria
    // vacio: solo un titulo que decia "Detalle" y nada debajo.
    setFactura(facturas.find((f) => String(f.id) === String(row?.id)) || null);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const nombreCliente = (() => {
    try {
      const inf = JSON.parse(window.localStorage.getItem('inf'));
      const p = inf?.profile;
      return [p?.name, p?.lastname].filter(Boolean).join(' ') || '';
    } catch { return ''; }
  })();

  /* El API devuelve la descripcion del enum, no la letra: COMPLETED, no "C".
     Se contemplan las dos por si algun endpoint viejo manda la letra. */
  const ESTADOS = {
    C: 'Pagado', COMPLETED: 'Pagado',
    P: 'Pendiente', PENDING: 'Pendiente',
    X: 'Anulado', CANCELLED: 'Anulado',
    I: 'En proceso', 'IN PROGRESS': 'En proceso',
  };
  const soles = (n) => 'S/ ' + Number(n || 0).toFixed(2);

  useEffect(()=>{
      getFacturas();
      getPlan();
  },[])

  /* Lo gastado y lo pagado, que es lo que se viene a ver aqui. */
  const totalPagado = facturas
    .filter((f) => ['C','COMPLETED'].includes(f.status))
    .reduce((s2, f) => s2 + Number(f.totalPrice || 0), 0);
  const ahorro = facturas.reduce((s2, f) => s2 + (f.details || [])
    .filter((d) => Number(d.value) < 0)
    .reduce((s3, d) => s3 + Math.abs(Number(d.value)), 0), 0);

  const fechaLarga = (v) => {
    const m = moment(v, ['YYYY-MM-DD', moment.ISO_8601], true);
    return m.isValid() ? m.format('D [de] MMMM YYYY') : (v || '—');
  };

  const TONO_ESTADO = {
    C: 'ok', COMPLETED: 'ok',
    P: 'espera', PENDING: 'espera',
    I: 'espera', 'IN PROGRESS': 'espera',
    X: 'nulo', CANCELLED: 'nulo',
  };

  /* Como se llama la compra: la linea del plan en el comprobante. Si no la
     trae, su numero. */
  const nombreDe = (f) => {
    const linea = (f.details || []).find((d) => /^Plan/i.test(d.name || ''));
    return linea ? String(linea.name).replace(/^Plan\s+/i, '') : `Comprobante N° ${f.id}`;
  };
  const fechaFila = (v) => {
    const m = moment(v, ['YYYY-MM-DD', moment.ISO_8601], true);
    return m.isValid() ? m.format('D [de] MMMM') + (m.year() !== moment().year() ? ` de ${m.year()}` : '') : (v || '');
  };
  const pagado = (f) => ['C', 'COMPLETED'].includes(f.status);

  return (
    <Pantalla etiqueta="Mis pagos" titulo="Tus comprobantes"
      bajada="Toca uno para verlo completo o guardarlo." clase="pag">

      {/* Lo que pago y lo que se ahorro: las cifras que el cliente busca
          antes de revisar comprobante por comprobante. */}
      {cargado && facturas.length > 0 &&
        <Tramo className="pag__cifras">
          <div><b>{soles(totalPagado)}</b><small>pagado hasta hoy</small></div>
          {ahorro > 0 && <div><b>{soles(ahorro)}</b><small>en descuentos</small></div>}
          {plan?.planName &&
            <div><b className="pag__txt">{plan.planName}</b>
              <small>{plan.expirationDate ? `vence el ${moment(plan.expirationDate).format('D [de] MMM').replace('.', '')}` : 'tu plan'}</small></div>}
        </Tramo>}

      <Tramo>
        {!cargado &&
          <>
            <Skeleton variant="rounded" height={58} sx={{ borderRadius: '16px', mt: '22px' }} />
            <Skeleton variant="rounded" height={58} sx={{ borderRadius: '16px', mt: '10px' }} />
          </>
        }

        {cargado && facturas.length === 0 &&
          <p className="cuP__vacio">
            Todavía no tienes pagos registrados. Cuando compres un plan, tu
            comprobante aparece aquí.
          </p>
        }

        {facturas.length > 0 &&
          <div className="cuP__lista pag__lista">
            {facturas.map((f) => (
              <button type="button" className="cuP__fila" key={f.id} onClick={() => handleOpen(f)}>
                <span className="cuP__filaTxt">
                  <b>{nombreDe(f)}</b>
                  <small>
                    {[fechaFila(f.emissionDate), f.paymentMethod].filter(Boolean).join(' · ')}
                    {!pagado(f) &&
                      <> <span className={`cuP__chip cuP__chip--${TONO_ESTADO[f.status] === 'nulo' ? 'gris' : 'coral'}`}>{ESTADOS[f.status] || f.status}</span></>}
                  </small>
                </span>
                <span className="cuP__filaValor">{soles(f.totalPrice)}</span>
                <span className="cuP__filaIr" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </button>
            ))}
          </div>}
      </Tramo>

      <Tramo>
        <p className="cuP__nota">
          Son comprobantes internos de Allpa Food. Si necesitas una boleta o
          factura electrónica, escríbenos y te la enviamos.
        </p>
      </Tramo>

      {/* El comprobante completo, en una hoja. */}
      <Hoja abierta={open} alCerrar={handleClose}
        etiqueta={factura ? `Comprobante N° ${factura.id}` : 'Comprobante'}
        titulo={factura ? soles(factura.totalPrice) : 'No está disponible'}
        bajada={factura ? null : 'No pudimos cargar este comprobante.'}
        pie={factura
          ? <button type="button" className="hoja__btn afComp__btn" onClick={() => window.print()}>
              Imprimir o guardar en PDF
            </button>
          : null}>
        {factura &&
          <div className="afComp" id="afComprobante">
            <div className="afComp__cab">
              <div>
                <p className="afComp__marca">Allpa Food</p>
                <p className="afComp__sub">Comprobante interno de pago</p>
              </div>
              <div className="afComp__num">
                <span>N°</span>
                <b>{factura.id}</b>
              </div>
            </div>

            <div className="afComp__datos">
              {nombreCliente &&
                <p><span>Cliente</span><b>{nombreCliente}</b></p>}
              <p><span>Fecha</span><b>{fechaLarga(factura.emissionDate)}</b></p>
              <p><span>Estado</span><b>{ESTADOS[factura.status] || factura.status}</b></p>
              {factura.paymentMethod &&
                <p><span>Medio de pago</span><b>{factura.paymentMethod}</b></p>}
              {factura.paymentReference &&
                <p><span>Referencia</span><b>{factura.paymentReference}</b></p>}
            </div>

            <div className="afComp__lineas">
              {(factura.details || []).map((d, i) => (
                <p key={i} className={Number(d.value) < 0 ? 'afComp__linea afComp__linea--menos' : 'afComp__linea'}>
                  <span>{d.name}</span>
                  <b>{soles(d.value)}</b>
                </p>
              ))}
            </div>

            <p className="afComp__total">
              <span>Total</span>
              <b>{soles(factura.totalPrice)}</b>
            </p>

            <p className="afComp__pie">
              Documento interno de Allpa Food. No constituye comprobante
              electrónico ante SUNAT.
            </p>
          </div>
        }
      </Hoja>
    </Pantalla>
  )
};

export default FacturacionPage;
