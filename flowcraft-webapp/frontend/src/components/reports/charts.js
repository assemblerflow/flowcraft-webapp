import React from "react";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import CircularProgress from "@material-ui/core/CircularProgress";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import SwipeableViews from "react-swipeable-views";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

const ReactHighcharts = require("react-highcharts");
import Boost  from 'highcharts/modules/boost';
Boost(ReactHighcharts.Highcharts);

import {Chart} from "./chart_utils";

import styles from "../../styles/charts.css"

export class FastQcCharts extends React.Component {

    constructor(props) {
        super(props);

        const chartData = this.parsePlotData(props.rawReports);

        this.state = {
            chartData,
            tabValue: 0
        }
    }

    parsePlotData = (reportData) => {

        let qcCharts = {
            "base_n_content": [],
            "base_gc_content": [],
            "sequence_quality": [],
            "per_base_sequence_content": [],
            "sequence_length_dist": [],
            "base_sequence_quality": []
        };

        const chartSignatures = [...Object.keys(qcCharts)];

        for (const r of reportData){
            if (!r.reportJson.hasOwnProperty("plotData")){
                continue
            }

            for (const el of r.reportJson.plotData){
                if (!el.hasOwnProperty("data")){
                    continue
                }

                for (const [plot, data] of Object.entries(el.data)){
                    if (chartSignatures.includes(plot)){

                        const parsedData = data.data[0].map((v) => {
                            return parseFloat(v)
                        });

                        qcCharts[plot].push({
                            name: el.sample,
                            data: parsedData,
                            color: "#626262"
                        })
                    }
                }
            }
        }

        return qcCharts

    };

    handleChange = (event, value) => {
        this.setState({tabValue: value})
    };

    render () {

        const chartData = this.parsePlotData(this.props.rawReports);

        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>FastQC charts</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper} style={{"height": "600px"}}>
                        <Tabs value={this.state.tabValue}
                              onChange={this.handleChange}
                              indicatorColor={"primary"}
                              textColor={"primary"}
                              scrollable
                              scrollButtons={"auto"}>
                            <Tab label={"Base sequence quality"}/>
                            <Tab label={"Sequence quality"}/>
                            <Tab label={"Base GC content"}/>
                            <Tab label={"Sequence length"}/>
                            <Tab label={"Missing data"}/>
                        </Tabs>
                            {this.state.tabValue === 0  && <FastqcBaseSequenceQuality plotData={chartData["base_sequence_quality"]}/>}
                            {this.state.tabValue === 1  && <FastqcSequenceQuality plotData={chartData["sequence_quality"]}/>}
                            {this.state.tabValue === 2  && <FastqcGcContent plotData={chartData["base_gc_content"]}/>}
                            {this.state.tabValue === 3  && <FastqcSequenceLength plotData={chartData["sequence_length_dist"]}/>}
                            {this.state.tabValue === 4  && <FastqcNContent plotData={chartData["base_n_content"]}/>}
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}


class FastqcBaseSequenceQuality extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            plotData: props.plotData
        }
    }

    render (){

        let config = new Chart({
            title: "Per base sequence quality scores",
            axisLabels: {x: "Position in read (bp)", y: "Quality score"},
            series: this.state.plotData
        });

        config.extend("yAxis", {
            min: 0,
            max: 45,
            plotBands: [{
                color: "rgba(170,255,170,.3)",
                from: 28,
                to: 45,
            }, {
                color: "rgba(255,255,170,.3)",
                from: 20,
                to: 28
            }, {
                color: "rgba(255,170,170,.3)",
                from: 0,
                to: 20
            }]
        });
        config.extend("chart", {height: "550px"});

        return (
            <div>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </div>
        )
    }
 }


class FastqcSequenceQuality extends React.Component {

   constructor(props){
       super(props);

       this.state = {
           plotData: props.plotData
       }
   }

    render (){

        let config = new Chart({
            title: "Per sequence quality scores",
            axisLabels: {x: "Quality score", y: "Position in read (bp)"},
            series: this.state.plotData
        });

        config.extend("xAxis", {
            min: 0,
            max: 45,
            plotBands: [{
                color: "rgba(170,255,170,.3)",
                from: 28,
                to: 45,
            }, {
                color: "rgba(255,255,170,.3)",
                from: 20,
                to: 28
            }, {
                color: "rgba(255,170,170,.3)",
                from: 0,
                to: 20
            }]
        });
        config.extend("chart", {height: "550px"});

        return (
            <div>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </div>
        )
    }
}


class FastqcGcContent extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            plotData: this.normalizeCounts(props.plotData)
        }
    }

    normalizeCounts(dataArray){

        for (const sample of dataArray){
            const totalBp = sample.data.reduce((a, b) => a + b, 0);
            sample.data = sample.data.map((v) => {return (v / totalBp) * 100});
        }

        return dataArray

    }

    render (){

        let config = new Chart({
            title: "GC percentage",
            axisLabels: {x: "GC percentage", y: "Normalized read count (%)"},
            series: this.state.plotData
        });

        config.extend("chart", {height: "550px"});

        return (
            <div>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </div>
        )
    }
}


class FastqcSequenceLength extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            plotData: props.plotData
        }
    }

    render (){

        let config = new Chart({
            title: "Distribution of sequence length",
            axisLabels: {x: "Base pair", y: "Count"},
            series: this.state.plotData
        });

        config.extend("chart", {height: "550px"});

        return (
            <div>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </div>
        )
    }
}


class FastqcNContent extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            plotData: props.plotData
        }
    }

    render (){

        let config = new Chart({
            title: "Missing data content",
            axisLabels: {x: "Base pair", y: "Count"},
            series: this.state.plotData
        });

        config.extend("yAxis", {min: 0});
        config.extend("chart", {height: "550px"});

        return (
            <div>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </div>
        )
    }
}


export class AssemblySizeDistChart extends React.Component {

    spreadData = (dataArray, index) => {

        let offset = index - 0.25;
        const step = 0.5 / dataArray.length;
        let data = [];

        for (const point of dataArray){
            data.push([offset + step, point]);
            offset += step
        }

        return data;

    };

    parsePlotData = (reportData) => {

        const chartSignature = "size_dist";
        let chartDataByProcess = new Map();
        let chartData = [];
        let categories = [];
        let sampleCounter = 0;

        let colorIndexMap = new Map();
        let colorIndex = 0;

        for (const r of reportData){
            if (!r.reportJson.hasOwnProperty("plotData")){
                continue
            }

            for (const el of r.reportJson.plotData){
                if (!el.hasOwnProperty("data")){
                    continue
                }

                for (const [plot, data] of Object.entries(el.data)){
                    if (plot === chartSignature){

                        let linkedTo = null;

                        // Determine the color index based on the process name
                        // Different process names should get different colors
                        if (!colorIndexMap.has(r.processName)){
                            colorIndexMap.set(r.processName, {
                                colorIndex,
                                sample: el.sample
                            });
                            colorIndex += 1;
                        } else {
                            linkedTo = colorIndexMap.get(r.processName).sample
                            linkedTo = r.processName
                        }
                        //
                        // Create new array associated with a new process name
                        if (!chartDataByProcess.has(r.processName)){
                            chartDataByProcess.set(r.processName, [])
                        }

                        chartDataByProcess.get(r.processName).push({
                            linkedTo: linkedTo,
                            id: r.processName,
                            name: el.sample,
                            data,

                        });
                        // categories.push(el.sample);
                        // sampleCounter += 1
                    }
                }
            }
        }

        for (const data of chartDataByProcess.values()){


            for (const point of data){

                chartData.push({
                    linkedTo: point.linkedTo,
                    id: point.id,
                    name: point.name,
                    index: sampleCounter,
                    colorIndex: colorIndexMap.get(point.id).colorIndex,
                    data: this.spreadData(point.data, sampleCounter),
                    marker: {
                        symbol: "circle",
                    }
                });

                sampleCounter += 1;
                categories.push(point.name);
            }
        }

        return {
            chartData,
            categories
        }
    };

    render () {

        const data = this.parsePlotData(this.props.rawReports);

        let config = new Chart({
            title: "Contig size distribution",
            axisLabels: {x: "Sample", y: "Contig size"},
            series: data.chartData
        });

        config.extend("plotOptions", {
            "scatter": {
                boostThreshold: 1,
                events: {
                    legendItemClick () {
                        // Get the process name
                        const seriesId = this.userOptions.id;
                        // Get series
                        const series = this.chart.series;
                        const vis = !this.visible;

                        // Do nothing is toggling the last visible series
                        let visible = [];
                        for (const el of series){
                            if (!visible.includes(el.userOptions.id) && el.visible){
                                visible.push(el.userOptions.id)
                            }
                        }
                        if (visible.length === 1 && this.userOptions.id === visible[0]){
                            return false
                        }

                        // Overrides the redraw function to disable time consuming
                        // redrawing each time a point is hidden.
                        const _redraw = this.chart.redraw;
                        this.chart.redraw = function(){};

                        for (const el of series.reverse()){
                            // console.log(el.userOptions.id)
                            if (el.userOptions.id === seriesId) {
                                el.setVisible(vis, false)
                            }
                        }

                        // Restore the redraw function and redraw
                        this.chart.redraw = _redraw;
                        this.chart.redraw();
                        return false;
                    }
                }
            },
        });
        config.extend("chart", {type: "scatter"});
        config.extend("chart", {height: "600px"});
        config.extend("xAxis", {
            categories: data.categories,
            labels: {rotation: -45}
        });
        config.extend("legend", {
            enabled: true,
            labelFormatter () {
                return this.userOptions.id
            }
        });

        return (
            <div>
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Assembled contig size distribution</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper} style={{"height": "600px"}}>
                        <ReactHighcharts config={config.layout} ref="assemblySizeDist"></ReactHighcharts>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            </div>
        )
    }
}