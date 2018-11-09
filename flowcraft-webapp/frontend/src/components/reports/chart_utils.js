/*
Classes and general utilities for charts
 */

import React from "react";

import Typography from "@material-ui/core/Typography";
import SnackbarContent from "@material-ui/core/SnackbarContent"
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";

import indigo from "@material-ui/core/colors/indigo";

export class Chart {

    /**
     *
     * @param chartOptions
     */
    constructor (opts) {

        this.title = opts.title;
        this.axisLabels = opts.axisLabels;
        this.series = opts.series;

        this.layout = {
            chart: {
                zoomType: "x"
            },
            boost: {
                // enabled: true,
                // seriesThreshold: 1,
                // useGPUTranslations: true
            },
            title: {
                text: this.title,
                style: {
                    fontWeight: "bold"
                }
            },
            plotOptions: {
                // series: {
                //     animation: false
                // }
            },
            legend: {
                enabled: false
            },
            xAxis: {
                title: {
                    text: this.axisLabels.x,
                    margin: 30,
                    style: {
                        fontSize: 20,
                        fontWeight: "bold",
                    }
                }
            },
            yAxis: {
                title: {
                    text: this.axisLabels.y,
                    margin: 30,
                    style: {
                        fontSize: 20,
                        fontWeight: "bold",
                    }
                }
            },
            series: this.series,
            credits: {
                enabled: false,
            },
            tooltip: {},
            pane: {}
        };
    }
    extend(key, obj) {
        Object.assign(this.layout[key], obj)
    }
}


export class PreviewSnack extends React.Component{

    render(){

        const style = {
            container: {
                marginTop: "20px",
                display: "flex",
                flexGrow: "1",
                float: "right"
            },
            text: {
                lineHeight: "33px",
                color: "#fff",
            },
        };

        const action = (
            <Button onClick={this.props.actionClick} color={"secondary"} size={"small"}>
                {this.props.actionMessage}
            </Button>
        );

        return(
            <div style={style.container}>
                <SnackbarContent
                    message={this.props.message}
                    action={action}/>
            </div>
        )
    }
}


/**
 * Function to generate random colors and return an hex code per color.
 */
const getRandomColor = () => {
  const authorizedLetters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += authorizedLetters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Function to generate an array of colors in hex code for a given number of
 * entries
 *
 * @param {Number} counter - A number for the lenght of the array of colors to
 * return
 * @returns {Array}
 * @constructor
 */
export const GenerateColors = (counter) => {

    let colorArray = [];

    while (colorArray.length < counter) {
        // generates hex code randomly
        const color = getRandomColor();
        // pushes the color to the colorArray if it is not there yet
        !colorArray.includes(color) && colorArray.push(color);
    }

    return colorArray;

};
