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

  const { token, handleUpdateToken } = useAuthContext();

  const getFacturas = () =>{
    const rowsTmp = [];
    axios.get('https://api.allpafood.com/dev/api-af/v1/invoice/list',{
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
      setRows(rowsTmp);
    }).catch((error)=>{
      console.log(error);
    })
  }

  const [plan,setPlan] = useState();
  const [helloCard,setHelloCard] = useState();

  const getPlan = ()=>{
      axios.get('https://api.allpafood.com/dev/api-af/v1/dashboard/plan',{
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
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
            title={'Detalle'}
          />

        </div>
      </Modal>
    </LayoutDasboard>
  )
};

export default FacturacionPage;
