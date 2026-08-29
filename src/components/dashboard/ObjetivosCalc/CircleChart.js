import React, {useState,useEffect} from "react"

// Charts
import Chart from "react-apexcharts";

const CircleChart = ({data}) => {
    const [chart1, setChart1] = useState({
        series: [data.percent],
        options: {

            chart: {
                height: 100,
                type: 'radialBar'
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        size: data.border,
                    },
                    dataLabels: {
                        show: false
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
                                color: data.colors[0],
                                opacity: 1
                            },
                            {
                                offset: 100,
                                color: data.colors[1],
                                opacity: 1
                            }
                        ]
                    ]
                }
            },
            stroke: {
                lineCap: 'round',
            
            },
            label: {
                formatter: function(value) {
                   return '';    
             }
            }
        },
    });

    useEffect(()=>{
        setChart1({
            ...chart1,
            series:[data.percent],
            options:{
                ...chart1.options,
                plotOptions: {
                    ...chart1.options.plotOptions,
                    radialBar:{
                        ...chart1.options.plotOptions.radialBar,
                        hollow:{
                            size:data.border
                        }
                    }
                },
            }
        })
    },[data])

    return (
        <Chart options={chart1.options} series={[data.percent]} type="radialBar" height={data.height} />
    )
};

export default CircleChart;
