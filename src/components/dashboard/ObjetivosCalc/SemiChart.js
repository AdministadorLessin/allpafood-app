import React,{useState,useEffect} from "react";

import Chart from "react-apexcharts";

const SemiChart = ({percent,heightChart}) => {
    const [radialBarOptions, setRadialBarOptions] = useState({
        series: [0],
        options: {
            chart: {
                type: 'radialBar',
                offsetY: -20,
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                radialBar: {
                    startAngle: -90,
                    endAngle: 90,
                    track: {
                        background: "#e7e7e7",
                        strokeWidth: '97%',
                        margin: 5,
                    },
                    hollow: {
                        size: '70%',
                    },
                    dataLabels: {
                        show: false
                    }
                }
            },
            grid: {
                padding: {
                    top: -10
                }
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
            labels: ['Average Results'],
        },
    });

    useEffect(()=>{
        if(percent){
            setRadialBarOptions({
                ...radialBarOptions,
                series:[percent]
            })
        }
    },[percent])

    return (
        <Chart options={radialBarOptions.options} series={radialBarOptions.series} type="radialBar"  height={heightChart} className={'chartRadialBar'} />
    )
};

export default SemiChart;
