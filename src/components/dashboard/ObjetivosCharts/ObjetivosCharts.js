import React,{useState,useEffect} from "react";
import './ObjetivosCharts.scss';

import icoProte from '../../../assets/img/ico_prote.png';
import icoCarbo from '../../../assets/img/ico_carbo.png';
import icoGrasas from '../../../assets/img/ico_grasas.png';

import icoCalorias from '../../../assets/img/ico_cal.png';

// Charts
import Chart from "react-apexcharts";

const ObjetivosCharts = ({data,objetive}) => {

  const [radialBarOptions,setRadialBarOptions] = useState({
    series: [0],
    options: {
      chart: {
        height: 250,
        type: 'radialBar',
        colors: '#000000',
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '69%',
          },
          dataLabels: {
            name: {
                fontSize: '0px',
            },
            value: {
                fontSize: '0px',
            },
            dataLabels: {
                show: false,
            }
          }
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
            type: 'vertical',
            stops: [1, 100],
            colorStops: [
                [
                    {
                        offset: 0,
                        color: "#F6D962",
                        opacity: 1
                    },
                    {
                        offset: 100,
                        color: "#F0B547",
                        opacity: 1
                    }
                ]
            ]
        }
      },
      stroke: {
          lineCap: 'round',
          
      }, 
      labels: ['Cricket'],
    },
  })

  const [totalMetrics,setTotalMetrics] = useState({
    bmr:0,
    macros:{
      fat:0,
      carbs:0,
      protein:0
    }
  });
  const [partMetrics,setPartMetrics] = useState(false);

  useEffect(()=>{
    if(objetive){
      setTotalMetrics(objetive);
    }
    setPartMetrics(data);
    const radialUpdatePercent =((data.calorias/totalMetrics.bmr)*100).toFixed(2);
    
    setRadialBarOptions({...radialBarOptions,series:[radialUpdatePercent]});
    
  },[data,objetive])

  return (
    <div className="inlineFlex objChartsBox">
        <div className="ocbRadialBox">
          <Chart options={radialBarOptions.options} series={radialBarOptions.series} type="radialBar"  height={300} className={'chartRadialBar'} />
          <div className="ocbRadialDet">
            <img src={icoCalorias} alt="" />
            <div className="txt">
              <small>Calorías</small>
              <p><strong>{partMetrics && partMetrics.calorias.toFixed(1)}</strong>/{totalMetrics && totalMetrics.bmr.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="inlineFlex objLinearList">
          <div className="objLinearItem">
              <div className="icon">
                <img src={icoProte} />
              </div>
              <div className="lineBox">
                <div className="txt"><span>Proteínas</span> <span><strong>{partMetrics && partMetrics.proteinas}/{totalMetrics && totalMetrics.macros.protein}</strong></span></div>
                <div className="line">
                  <span style={{width: '' + partMetrics && totalMetrics && ((partMetrics.proteinas/totalMetrics.macros.protein)*100).toFixed(2)+'%'}}></span>
                </div>
              </div>
          </div>
          <div className="objLinearItem objLinearItem2">
              <div className="icon">
                <img src={icoCarbo} />
              </div>
              <div className="lineBox">
                <div className="txt"><span>Carbo.</span> <span><strong>{partMetrics && partMetrics.carbo}/{totalMetrics && totalMetrics.macros.carbs}</strong></span></div>
                <div className="line">
                  <span style={{width: '' + partMetrics && totalMetrics && ((partMetrics.carbo/totalMetrics.macros.carbs)*100).toFixed(2)+'%'}}></span>
                </div>
              </div>
          </div>
          <div className="objLinearItem objLinearItem3">
              <div className="icon">
                <img src={icoGrasas} />
              </div>
              <div className="lineBox">
                <div className="txt"><span>Grasas</span> <span><strong>{partMetrics && partMetrics.grasas}/{totalMetrics && totalMetrics.macros.fat}</strong></span></div>
                <div className="line">
                  <span style={{width: '' + partMetrics && totalMetrics && ((partMetrics.grasas/totalMetrics.macros.fat)*100).toFixed(2)+'%'}}></span>
                </div>
              </div>
          </div>
        </div>
    </div>
  )
};

export default ObjetivosCharts;
