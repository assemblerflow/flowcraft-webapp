import React from "react";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import CircularProgress from "@material-ui/core/CircularProgress";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import classNames from "classnames";

const ReactHighcharts = require("react-highcharts");
import Highcharts from "highcharts";
import Boost  from 'highcharts/modules/boost';
Boost(ReactHighcharts.Highcharts);

import {Chart, PreviewSnack} from "./chart_utils";
import {LoadingComponent} from "../ReportsBase";

import {ReportAppConsumer} from "./contexts";

import styles from "../../styles/charts.css"

export class FastQcCharts extends React.Component {

    constructor(props) {
        super(props);

        const limit = 200;

        this.state = {
            chartData: props.rawReports,
            tabValue: 0,
            limit: 200
        };

        this.updateChartLimit = this.updateChartLimit.bind(this);
    }

    static getDerivedStateFromProps(props, state){

        if (props.rawReports === state.chartData ){
            return null
        } else {
            return {chartData: props.rawReports}
        }
    }

    updateChartLimit = (newLimit) => {
        this.setState({limit: newLimit})
    };

    parsePlotData = (reportData, limit) => {
        // The limit parameter sets a maximum to the final chartData object
        // If set to null, there will be no limit

        // This variable is set to true when the report data has been limited
        let preview = false;

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
            if(r.hasOwnProperty("reportJson")){
                if (!r.reportJson.hasOwnProperty("plotData")){
                    continue
                }

                for (const el of r.reportJson.plotData){
                    if (!el.hasOwnProperty("data")){
                        continue
                    }

                    for (const [plot, data] of Object.entries(el.data)){
                        if (chartSignatures.includes(plot)){

                            if (limit && limit !== 0 && qcCharts[plot].length > (limit - 1)){
                                if (!preview){
                                    preview = true
                                }
                                continue
                            }

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
        }

        return {
            qcCharts,
            preview
        }

    };

    handleChange = (value) => {
        this.setState({tabValue: value})
    };

    render () {

        const style = {
            buttonBar: {
                "overflowX": "auto",
                "display": "flex",
                "justifyContent": "center",
                "marginBottom": "20px"
            },
            button: {
                minWidth: "150px",
            }
        };

        console.log("render fastqc tabs")

        // Sets the number of samples in the chart above which the chart preview
        // toggle system is introduced.
        const previewThreshold = 200;

        const chartData = this.parsePlotData(this.state.chartData, 200);

        return (
            <div>
                <ExpansionPanel defaultExpanded >
                    <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant={"headline"}>FastQC charts</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <div style={{"width": "100%", "height": "100%"}}>
                            <ReportAppConsumer>
                                {({highlights}) => (
                                    <div className={styles.mainPaper} style={{"height": "100%", "width": "100%"}}>
                                        <div style={style.buttonBar}>
                                            <Button style={style.button} className={classNames(this.state.tabValue === 0 && styles.tabButton)}  onClick={() => {this.handleChange(0)}}>Base sequence quality</Button>
                                            <Button style={style.button} className={classNames(this.state.tabValue === 1 && styles.tabButton)} onClick={() => {this.handleChange(1)}}>Sequence quality</Button>
                                            <Button style={style.button} className={classNames(this.state.tabValue === 2 && styles.tabButton)} onClick={() => {this.handleChange(2)}}>Base GC content</Button>
                                            <Button style={style.button} className={classNames(this.state.tabValue === 3 && styles.tabButton)} onClick={() => {this.handleChange(3)}}>Sequence length</Button>
                                            <Button style={style.button} className={classNames(this.state.tabValue === 4 && styles.tabButton)} onClick={() => {this.handleChange(4)}}>Missing data</Button>
                                        </div>
                                        {this.state.tabValue === 0  && <FastqcBaseSequenceQuality highlights={highlights} plotData={chartData.qcCharts["base_sequence_quality"]}/>}
                                        {this.state.tabValue === 1  && <FastqcSequenceQuality plotData={chartData.qcCharts["sequence_quality"]}/>}
                                        {this.state.tabValue === 2  && <FastqcGcContent plotData={chartData.qcCharts["base_gc_content"]}/>}
                                        {this.state.tabValue === 3  && <FastqcSequenceLength plotData={chartData.qcCharts["sequence_length_dist"]}/>}
                                        {this.state.tabValue === 4  && <FastqcNContent plotData={chartData.qcCharts["base_n_content"]}/>}
                                    </div>
                                )}
                            </ReportAppConsumer>
                            {
                                chartData.preview &&
                                <PreviewSnack
                                    actionClick={() => {
                                        this.updateChartLimit(0)
                                    }}
                                    actionMessage={"Show full Chart"}
                                    message={`This chart is a preview of the first ${this.state.limit} samples`}/>
                            }
                            {
                                chartData.qcCharts["base_sequence_quality"].length > previewThreshold &&
                                <PreviewSnack
                                    actionClick={() => {this.updateChartLimit(previewThreshold)}}
                                    actionMessage={"Show preview Chart"}
                                    message={`Chart displaying a large number of samples (${data.categories.length})`}/>
                            }
                        </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            </div>
        )
    }
}


class FastqcBaseSequenceQuality extends React.Component {

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }

    render (){
        console.log("render base qual")

        let config = new Chart({
            title: "Per base sequence quality scores",
            axisLabels: {x: "Position in read (bp)", y: "Quality score"},
            series: this.props.plotData
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
        config.extend("plotOptions", {
            "series": {
                boostThreshold: 1
            }
        });

        return (
            <LoadingComponent>
                {
                    <ReactHighcharts config={config.layout} ref="chart" ></ReactHighcharts>
                }
            </LoadingComponent>
        )
    }
 }


class FastqcSequenceQuality extends React.Component {

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }

    render (){

        let config = new Chart({
            title: "Per sequence quality scores",
            axisLabels: {x: "Quality score", y: "Position in read (bp)"},
            series: this.props.plotData
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

        console.log("render seq qual")
        return (
            <LoadingComponent>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </LoadingComponent>
        )
    }
}


class FastqcGcContent extends React.Component {

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
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
            series: this.normalizeCounts(this.props.plotData)
        });

        config.extend("chart", {height: "550px"});

        console.log("render gc perc")

        return (
            <LoadingComponent>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </LoadingComponent>
        )
    }
}


class FastqcSequenceLength extends React.Component {

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }

    render (){

        let config = new Chart({
            title: "Distribution of sequence length",
            axisLabels: {x: "Base pair", y: "Count"},
            series: this.props.plotData
        });

        config.extend("chart", {height: "550px"});

        console.log("render fastqc len")

        return (
            <LoadingComponent>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </LoadingComponent>
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
            series: this.props.plotData
        });

        config.extend("yAxis", {min: 0});
        config.extend("chart", {height: "550px"});

        console.log("render n content")

        return (
            <LoadingComponent>
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </LoadingComponent>
        )
    }
}


export class AssemblySizeDistChart extends React.Component {

    constructor(props){
        super(props);

        const limit = 200;

        this.updateChartLimit = this.updateChartLimit.bind(this);

        this.state = {
            limit,
        };
    }

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

    parsePlotData = (reportData, limit) => {

        // The limit parameter sets a maximum to the final chartData object
        // If set to null, there will be no limit

        // This variable is set to true when the report data has been limited
        let preview = false;

        const chartSignature = "size_dist";
        let chartDataByProcess = new Map();
        let chartData = [];
        let categories = [];
        let sampleCounter = 0;

        let colorIndexMap = new Map();
        let colorIndex = 0;

        for (const r of reportData){
            if(r.hasOwnProperty("reportJson")) {
                if (!r.reportJson.hasOwnProperty("plotData")) {
                    continue
                }

                for (const el of r.reportJson.plotData) {
                    if (!el.hasOwnProperty("data")) {
                        continue
                    }

                    for (const [plot, data] of Object.entries(el.data)) {
                        if (plot === chartSignature) {

                            let linkedTo = null;

                            // Determine the color index based on the process name
                            // Different process names should get different colors
                            if (!colorIndexMap.has(r.processName)) {
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
                            if (!chartDataByProcess.has(r.processName)) {
                                chartDataByProcess.set(r.processName, [])
                            }

                            chartDataByProcess.get(r.processName).push({
                                linkedTo: linkedTo,
                                id: r.processName,
                                name: el.sample,
                                data,

                            });
                        }
                    }
                }
            }
        }

        for (const data of chartDataByProcess.values()){

            for (const point of data){

                if (limit && limit !== 0 && chartData.length > (limit - 1)){
                    preview = true;
                    return {
                        chartData,
                        categories,
                        preview
                    }
                }

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
            categories,
            preview,
        }
    };

    updateChartLimit = (newLimit) => {
        this.setState({limit: newLimit});
    };

    render () {

        // Sets the number of samples in the chart above which the chart preview
        // toggle system is introduced.
        const previewThreshold = 200;

        const data = this.parsePlotData(this.props.rawReports, this.state.limit);

        return (
            <div>
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Assembled contig size distribution</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div style={{"width": "100%"}}>
                        <div className={styles.mainPaper} style={{"height": "600px", "width":"100%"}}>
                            <PilonSizeDistChart plotData={data}/>
                        </div>
                        {
                            data.preview &&
                            <PreviewSnack
                                actionClick={() => {
                                    this.updateChartLimit(0)
                                }}
                                actionMessage={"Show full Chart"}
                                message={`This chart is a preview of the first ${this.state.limit} samples`}/>
                        }
                        {
                            data.categories.length > previewThreshold &&
                                <PreviewSnack
                                    actionClick={() => {this.updateChartLimit(previewThreshold)}}
                                    actionMessage={"Show preview Chart"}
                                    message={`Chart displaying a large number of samples (${data.categories.length})`}/>
                        }
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            </div>
        )
    }
}


class PilonSizeDistChart extends React.Component{

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }

    render(){

        console.log("render pilon chart")

        let config = new Chart({
            title: "Contig size distribution",
            axisLabels: {x: "Sample", y: "Contig size"},
            series: this.props.plotData.chartData
        });

        config.extend("plotOptions", {
            "scatter": {
                boostThreshold: 1,
                events: {
                    legendItemClick() {
                        // Get the process name
                        const seriesId = this.userOptions.id;
                        // Get series
                        const series = this.chart.series;
                        const vis = !this.visible;

                        // Do nothing is toggling the last visible series
                        let visible = [];
                        for (const el of series) {
                            if (!visible.includes(el.userOptions.id) && el.visible) {
                                visible.push(el.userOptions.id)
                            }
                        }
                        if (visible.length === 1 && this.userOptions.id === visible[0]) {
                            return false
                        }

                        // Overrides the redraw function to disable time consuming
                        // redrawing each time a point is hidden.
                        const _redraw = this.chart.redraw;
                        this.chart.redraw = function () {
                        };

                        for (const el of series.reverse()) {
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
            categories: this.props.plotData.categories,
            labels: {rotation: -45}
        });
        config.extend("legend", {
            enabled: true,
            labelFormatter() {
                return this.userOptions.id
            }
        });

        return(
            <LoadingComponent>
                <ReactHighcharts config={config.layout} ref="assemblySizeDist"></ReactHighcharts>
            </LoadingComponent>
        )

    }

}