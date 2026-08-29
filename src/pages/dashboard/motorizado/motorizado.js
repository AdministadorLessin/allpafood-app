import React from "react"
import LayoutDasboard from '../../../components/LayoutDashborad/LayoutDashboard';
import './motorizado.scss';

import {APIProvider, Map} from '@vis.gl/react-google-maps';
import CardPaper from './../../../components/ultil/CardPaper/CardPaper';

// Iconos
import icoMenu from '../../../assets/img/ico_marker.svg';
import LayoutTransition from './../../../components/LayoutTransition/LayoutTransition';

const DashboardMotorizado = (props) => {
  return (
    
    <LayoutTransition keytst={'asdasddasdas'}>
      <LayoutDasboard claseStyle={'mainLayoutBoxMotorizado'}>
        <div className="inlineFlex motorizadoMapBox">
          <div className="motorizadoMap">
            <APIProvider apiKey={'AIzaSyAAx9xj-TsHleju-u37DgxHohxXJv4d-uo'}>
              <Map
                style={{width: '100vw', height: '100vh'}}
                defaultCenter={{lat: -12.120440, lng: -77.029610}}
                defaultZoom={12}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
              />
            </APIProvider>
          </div>
          <div className="motorizadoList">
            <CardPaper
              data={
                {
                  titulo:'Envíos:',
                  ico:icoMenu,
                  className:false
                }
              } 
            >
              <div className="motDeliveryList">
                <div className="motDeliveryItem">
                  <figure>
                    <img src={'assets/img/avatars/avatar_19.jpg'} alt="" />
                  </figure>
                  <div className="txt">
                    <h4>Irvin Vivanco</h4>
                    <p>Av. 28 de julio 156 - Miraflores</p>
                  </div>
                  <div className="checkBox">
                    <div className="circl"></div>
                  </div>
                </div>
                <div className="motDeliveryItem">
                  <figure>
                    <img src={'assets/img/avatars/avatar_19.jpg'} alt="" />
                  </figure>
                  <div className="txt">
                    <h4>Irvin Vivanco</h4>
                    <p>Av. 28 de julio 156 - Miraflores</p>
                  </div>
                  <div className="checkBox">
                    <div className="circl"></div>
                  </div>
                </div>
                <div className="motDeliveryItem">
                  <figure>
                    <img src={'assets/img/avatars/avatar_19.jpg'} alt="" />
                  </figure>
                  <div className="txt">
                    <h4>Irvin Vivanco</h4>
                    <p>Av. 28 de julio 156 - Miraflores</p>
                  </div>
                  <div className="checkBox">
                    <div className="circl"></div>
                  </div>
                </div>
                <div className="motDeliveryItem">
                  <figure>
                    <img src={'assets/img/avatars/avatar_19.jpg'} alt="" />
                  </figure>
                  <div className="txt">
                    <h4>Irvin Vivanco</h4>
                    <p>Av. 28 de julio 156 - Miraflores</p>
                  </div>
                  <div className="checkBox">
                    <div className="circl"></div>
                  </div>
                </div>
              </div>
            </CardPaper>
          </div>
        </div>
      </LayoutDasboard>
    </LayoutTransition>
  )
};

export default DashboardMotorizado;
