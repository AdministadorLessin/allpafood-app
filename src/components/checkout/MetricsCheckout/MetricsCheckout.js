import React from "react"

import Chart from "react-apexcharts"

const MetricsCheckout = (props) => {


    const [state, setState] = React.useState({
          
        series: [76, 67, 61, 90],
        options: {
          chart: {
            height: 390,
            type: 'radialBar',
          },
          plotOptions: {
            radialBar: {
              offsetY: 0,
              startAngle: 0,
              endAngle: 270,
              hollow: {
                margin: 5,
                size: '30%',
                background: 'transparent',
                image: undefined,
              },
              dataLabels: {
                name: {
                  show: false,
                },
                value: {
                  show: false,
                }
              },
              barLabels: {
                enabled: true,
                useSeriesColors: true,
                offsetX: -8,
                fontSize: '16px',
                formatter: function(seriesName, opts) {
                  return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex]
                },
              },
            }
          },
          colors: ['#ff6723', '#85d62f', '#ff822d', '#ffdea7'],
          labels: ['🔥 Calorias', '🥬 Proteinas', '🍠 Carbohidratos', '🥓 Grasas'],
          responsive: [{
            breakpoint: 480,
            options: {
              legend: {
                  show: false
              }
            }
          }]
        },
      
      
    });

    return (
        <div>
        <Chart options={state.options} series={state.series} type="radialBar" height={390} />
        </div>
    )
};

export default MetricsCheckout;
