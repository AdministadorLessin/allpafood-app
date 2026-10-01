import React, {useState,useEffect} from "react";
import './facturacion.scss';

import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import Modal from '@mui/material/Modal';
import Skeleton from '@mui/material/Skeleton';
import moment from 'moment';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';
import { Cascada, Bloque, motion, alToque } from '../../../components/ultil/Motion/Motion';
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

  return (
    <LayoutDasboard claseStyle={false}>
      <Cascada className="afPanel">

        <Bloque><h1 className="afPanel__titular">Mis pagos</h1></Bloque>

        {/* Lo que pago y lo que se ahorro: las dos cifras que el cliente busca
            antes de revisar factura por factura. */}
        <Bloque>
          <div className="afPagos__cifras">
            <div className="afCard afPagos__cifra">
              <span className="afPagos__et">Pagado hasta hoy</span>
              <b className="afPagos__n">S/ {totalPagado.toFixed(2)}</b>
              <small>{facturas.length} {facturas.length === 1 ? 'comprobante' : 'comprobantes'}</small>
            </div>
            {ahorro > 0 &&
              <div className="afCard afPagos__cifra afPagos__cifra--ahorro">
                <span className="afPagos__et">Te ahorraste</span>
                <b className="afPagos__n">S/ {ahorro.toFixed(2)}</b>
                <small>en descuentos aplicados</small>
              </div>
            }
            {plan &&
              <div className="afCard afPagos__cifra">
                <span className="afPagos__et">Tu plan</span>
                <b className="afPagos__n afPagos__n--txt">{plan.planName}</b>
                <small>
                  {plan.expirationDate
                    ? `Vence el ${moment(plan.expirationDate).format('D [de] MMM')}`
                    : 'Sin fecha de vencimiento'}
                </small>
              </div>
            }
          </div>
        </Bloque>

        <Bloque>
          <div className="afCard">
            <div className="afCard__head">
              <span className="afCard__title">Tus comprobantes</span>
              {facturas.length > 0 &&
                <span className="afCard__label">{facturas.length}</span>}
            </div>

            {!cargado &&
              <>
                <Skeleton variant="rounded" height={58} sx={{ borderRadius: '14px', mb: 1 }} />
                <Skeleton variant="rounded" height={58} sx={{ borderRadius: '14px' }} />
              </>
            }

            {cargado && facturas.length === 0 &&
              <p className="afMenu__nota afMenu__nota--suelta">
                Todavía no tienes pagos registrados. Cuando compres un plan, tu
                comprobante aparece aquí.
              </p>
            }

            {facturas.map((f) => (
              <motion.button type="button" className="afRecibo" key={f.id}
                onClick={() => handleOpen(f)} {...alToque}>
                <span className="afRecibo__txt">
                  <b>{fechaLarga(f.emissionDate)}</b>
                  <small>Comprobante N° {f.id}</small>
                </span>
                <span className={`afRecibo__estado afRecibo__estado--${TONO_ESTADO[f.status] || 'espera'}`}>
                  {ESTADOS[f.status] || f.status}
                </span>
                <span className="afRecibo__monto">{soles(f.totalPrice)}</span>
                <span className="afRecibo__ir">›</span>
              </motion.button>
            ))}
          </div>
        </Bloque>

        <Bloque>
          <p className="afMenu__nota afMenu__nota--suelta">
            Son comprobantes internos de Allpa Food. Si necesitas una boleta o
            factura electrónica, escríbenos y te la enviamos.
          </p>
        </Bloque>

      </Cascada>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="inlineFlex factModal">
          <p className="afComp__titulo">Comprobante</p>

          {!factura && <p className="afComp__vacio">No pudimos cargar esta factura.</p>}

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
                <p><span>Fecha</span><b>{factura.emissionDate}</b></p>
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

          {factura &&
            <button type="button" className="afComp__btn" onClick={() => window.print()}>
              Imprimir o guardar en PDF
            </button>
          }
        </div>
      </Modal>
    </LayoutDasboard>
  )
};

export default FacturacionPage;
