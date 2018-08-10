/*
Classes and general utilities for charts
 */

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
            title: {
                text: this.title
            },
            plotOptions: {
                series: {
                    animation: false
                }
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
            series: this.series
        };
    }
    extend(key, obj) {
        Object.assign(this.layout[key], obj)
    }
}