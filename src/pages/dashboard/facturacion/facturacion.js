import React, {useState,useEffect} from "react";
import './facturacion.scss';

import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Grid';

import icoMenu from '../../../assets/img/ico_factrura.svg';
import icoEntrega from '../../../assets/img/ico_entrega.svg';

import perfilMarcador from '../../../assets/img/perfil_marcador.png';

// @ts-ignore
import { DataGrid } from '@mui/x-data-grid';
import BtnEditar from './../../../components/ultil/BtnEditar/BtnEditar';

import {useAuthContext} from '../../../context/authContext';
import axios from 'axios';
import HelloPaper from './../../../components/dashboard/HelloPaper/HelloPapper';
import PlanUser from './../../../components/dashboard/PlanUser/PlanUser';
import TitleCard from './../../../components/ultil/TitleCard/TitleCard';

import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { API_URL } from '../../../config';

const paginationModel = { page: 0, pageSize: 5 };

const FacturacionPage = (props) => {

  const columns = [
    { field: 'id', headerName: 'ID', flex: 1 },
    { field: 'estado', headerName: 'Estado de factura', flex: 1 },
    { field: 'fecha', headerName: 'Fecha', flex: 1 },
    {field: 'total',headerName: 'Total',type: 'number',flex: 1},
    {
      field: 'detalle',
      headerName: 'Acción',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <button
          className="btnPrimary"
          onClick={() => {
            handleOpen(params.row)
          }}
        >
          Ver detalle
        </button>
      ),
    }
  ];
  const [rows,setRows] = useState([]);
  // Las facturas tal cual llegan: la tabla solo muestra cuatro campos, pero el
  // comprobante necesita el detalle por lineas, el metodo de pago y la
  // referencia del cobro.
  const [facturas,setFacturas] = useState([]);
  const [factura,setFactura] = useState(null);

  const { token, handleUpdateToken } = useAuthContext();

  const getFacturas = () =>{
    const rowsTmp = [];
    axios.get(`${API_URL}invoice/list`,{
      headers: {"Authorization" : `Bearer ${token}`} 
    }).then((resp)=>{
      if(resp.data.data && resp.data.data.length){
        resp.data.data.map((item)=>{
          rowsTmp.push({
            id:item.id,
            estado:item.status,
            fecha:item.emissionDate,
            total:'S/.'+item.totalPrice
          })
        })
      }
      setFacturas(resp.data.data || []);
      setRows(rowsTmp);
    }).catch((error)=>{
      console.log(error);
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

  return (
    <LayoutDasboard claseStyle={false}>
      <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={7} >
            <HelloPaper data={helloCard} />
          </Grid>
          <Grid item xs={12} sm={12} md={5} >
            <PlanUser data={plan} />
          </Grid>
          <Grid item xs={12} sm={12} md={12} >
              <CardPaper 
                  data={
                      {
                          titulo:'Facturas:',
                          ico:icoMenu,
                          className:false
                      }
                  } 
              >
                <div className="facturasTable">
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[5, 10]}
                    //checkboxSelection
                    sx={{ border: 0 }}
                  />
                </div>
              </CardPaper>
          </Grid>
          {false &&
            <Grid item xs={12} sm={12} md={5}>
                <CardPaper 
                    data={
                        {
                            titulo:'Facturación:',
                            ico:icoEntrega,
                            className:false
                        }
                    } 
                >
                <BtnEditar />
                <div className="displayFlex perfilBox perfilBox2">
                    <figure>
                    <img src={perfilMarcador} alt="Avatar 1" title="Avatar 1" />
                    </figure>
                    <div className="txt">
                    <div className="perfilLblField">
                        <small>Direccion:</small>
                        <p>Av. Arequipa 1150</p>
                    </div>
                    <div className="perfilLblField">
                        <small>Lugar:</small>
                        <p>Oficina - Departamento 105</p>
                    </div>
                    </div>
                </div>
                </CardPaper>
            </Grid>
          }
      </Grid>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="inlineFlex factModal">
          <TitleCard
            icon={<FormatListBulletedIcon />}
            title={'Comprobante'}
          />

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
