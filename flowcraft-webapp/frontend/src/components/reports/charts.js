import React from "react";

import Select from "react-select/";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import Button from "@material-ui/core/Button";

import MagnifyIcon from "mdi-react/MagnifyIcon";
import CloseIcon from "mdi-react/CloseIcon";

import classNames from "classnames";
import Boost from 'highcharts/modules/boost';
import {Chart, PreviewSnack} from "./chart_utils";
import {LoadingComponent} from "../ReportsBase";
import {getHighlight} from "./utils";

import {ReportAppConsumer} from "./contexts";
import {highlightChartSample} from "./filters_highlights";

import styles from "../../styles/charts.css"
// Theme imports
import {themes} from "./themes";
import {theme} from "../../../config.json";

import SortAlphabeticalIcon from "mdi-react/SortAlphabeticalIcon";

const ReactHighcharts = require("react-highcharts");
Boost(ReactHighcharts.Highcharts);

export class FastQcCharts extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            chartData: props.rawReports,
            tabValue: 0,
            limit: 200
        };

        this.updateChartLimit = this.updateChartLimit.bind(this);
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

                            // Check if sample or project is in highlights
                            const highlight = getHighlight(this.props.highlights, el.sample, r.projectid);
                            // let highlight;
                            // if (this.props.highlights.samples.some((v) => {return v.label === el.sample})){
                            //     highlight = this.props.highlights.samples.filter((v) => {return v.label === el.sample})[0]
                            // } else {
                            //     highlight = this.props.highlights.projects.filter((v) => {return v.label === el.sample})[0]
                            // }

                            qcCharts[plot].push({
                                name: el.sample,
                                data: parsedData,
                                color: highlight ? highlight.color : "#626262",
                                zIndex: highlight ? 10 + highlight.idx : 1
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

    componentDidUpdate(prevProps, prevState){
        if (prevProps.rawReports !== this.props.rawReports){
            this.setState({chartData: this.props.rawReports})
        }
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

    selectSample = (sample) => {
        highlightChartSample(sample.label, this.refs.chart)
    };

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }
    render (){

       const samples = this.props.plotData.map((v) => {return v.name});

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

        return (
            <LoadingComponent>
                <ChartToolbar samples={samples} selectSample={this.selectSample} />
                <ReactHighcharts config={config.layout} ref="chart" ></ReactHighcharts>
            </LoadingComponent>
        )
    }
 }


class FastqcSequenceQuality extends React.Component {

    selectSample = (sample) => {
        highlightChartSample(sample.label, this.refs.chart)
    };

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }

    render (){

        const samples = this.props.plotData.map((v) => {return v.name});

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

        return (
            <LoadingComponent>
                <ChartToolbar samples={samples} selectSample={this.selectSample} />
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </LoadingComponent>
        )
    }
}


class FastqcGcContent extends React.Component {

    selectSample = (sample) => {
        highlightChartSample(sample.label, this.refs.chart)
    };

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

        const samples = this.props.plotData.map((v) => {return v.name});

        let config = new Chart({
            title: "GC percentage",
            axisLabels: {x: "GC percentage", y: "Normalized read count (%)"},
            series: this.normalizeCounts(this.props.plotData)
        });

        config.extend("chart", {height: "550px"});

        console.log("render gc perc")

        return (
            <LoadingComponent>
                <ChartToolbar samples={samples} selectSample={this.selectSample} />
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </LoadingComponent>
        )
    }
}


class FastqcSequenceLength extends React.Component {

    selectSample = (sample) => {
        highlightChartSample(sample.label, this.refs.chart)
    };

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }

    render (){

        const samples = this.props.plotData.map((v) => {return v.name});

        let config = new Chart({
            title: "Distribution of sequence length",
            axisLabels: {x: "Base pair", y: "Count"},
            series: this.props.plotData
        });

        config.extend("chart", {height: "550px"});

        console.log("render fastqc len")

        return (
            <LoadingComponent>
                <ChartToolbar samples={samples} selectSample={this.selectSample} />
                <ReactHighcharts config={config.layout} ref="chart"></ReactHighcharts>
            </LoadingComponent>
        )
    }
}


class FastqcNContent extends React.Component {

    selectSample = (sample) => {
        highlightChartSample(sample.label, this.refs.chart)
    };

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData === this.props.plotData){
            return false
        } else {
            return true
        }
    }

    render (){

        const samples = this.props.plotData.map((v) => {return v.name});

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
                <ChartToolbar samples={samples} selectSample={this.selectSample} />
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

        let highlightsExist = (this.props.highlights.samples.length > 0 || this.props.highlights.projects.length > 0);

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
                                project: r.projectid

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

                const highlight = getHighlight(this.props.highlights, point.name, point.project);

                chartData.push({
                    linkedTo: point.linkedTo,
                    id: point.id,
                    name: point.name,
                    index: sampleCounter,
                    colorIndex: !highlightsExist ? colorIndexMap.get(point.id).colorIndex : null,
                    color: highlight ? highlight.color : highlightsExist ? "gray" : null,
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

    state = {
        alphaSort: false
    };

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

    selectSample = (sample) => {
        highlightChartSample(sample.label, this.refs.assemblySizeDist)
    };

    sortDataAlphabetically = (chartData) => {

        let sampleCounter = 0;
        let newArray = JSON.parse(JSON.stringify(chartData))

        const sortedData = newArray.sort((a, b) => {
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();

            return (a < b) ? -1 : (a > b) ? 1 : 0;
        }).map((v) => {
            v.data = this.spreadData(v.data.map((el) => el[1]), sampleCounter);
            sampleCounter += 1;
            return v
        });

        return sortedData

    };

    shouldComponentUpdate(nextProps, nextState){

        if (nextProps.plotData !== this.props.plotData){
            return true
        } else if (nextState.alphaSort !== this.state.alphaSort){
            return true
        } else {
            return false
        }
    }

    render(){

        console.log("render pilon chart")

        let config = new Chart({
            title: "Contig size distribution",
            axisLabels: {x: "Sample", y: "Contig size"},
            series: this.state.alphaSort ?
                this.sortDataAlphabetically(this.props.plotData.chartData) :
                this.props.plotData.chartData
        });

        const samples = this.props.plotData.chartData.map((v) => {return v.name});

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
            categories: this.state.alphaSort ?
                this.props.plotData.categories.concat().sort() :
                this.props.plotData.categories,
            labels: {rotation: -45}
        });
        config.extend("legend", {
            enabled: true,
            labelFormatter() {
                return this.userOptions.id
            }
        });

        const style = {
            button: {
                padding: 0,
                minWidth: "35px",
                height: "35px",
                marginLeft: "5px",
                backgroundColor: this.state.alphaSort ? themes[theme].palette.primary.main : "#fff",
            }
        };

        const sortButton = (
            <Tooltip placement={"top"} title={`Toggle alphabetical sort ${this.state.alphaSort ? "OFF" : "ON"}`}>
                <Button color={"primary"} variant={"outlined"} style={style.button} onClick={() => {this.setState({alphaSort: !this.state.alphaSort})}} >
                    <SortAlphabeticalIcon color={!this.state.alphaSort ? themes[theme].palette.primary.main : "#fff"}/>
                </Button>
            </Tooltip>
        );

        return(
            <LoadingComponent>
                <ChartToolbar samples={samples} selectSample={this.selectSample}>
                    {sortButton}
                </ChartToolbar>
                <ReactHighcharts config={config.layout} ref="assemblySizeDist"></ReactHighcharts>
            </LoadingComponent>
        )

    }

}


export class FindDistributionChart extends React.Component{

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.plotData !== this.props.plotData;
    }

    render(){

        const config = new Chart({
            title: null,
            axisLabels: {x: "Sample", y: "Value"},
            series: this.props.data
        });

        config.extend("chart", {
            type: "scatter",
            zoomType: "xy"
        });
        config.extend("legend", {
            enabled: false
        });
        config.extend("xAxis", {
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
            categories: this.props.data.map((v) => {return v.name}),
            labels: {
                rotation: -45
            }
        });

        return(
            <div>
                <ReactHighcharts config={config.layout} ref="findDistribution"></ReactHighcharts>
            </div>
        )
    }
}


class ChartToolbar extends React.Component{

    state = {
        selection: null,
    };

    handleSelection = (e) => {
        this.setState({selection: e})
    };

    render(){

        const style = {
            root: {
                display: "flex",
                paddingLeft: "60px",
                paddingRight: "10px"
            },
            toolbar: {
                flexGrow: "1",
            },
            searchContainer: {
                display: "flex",
                float: "right",
                flexWrap: "wrap",
            },
            select: {
                width: "300px",
                flexGrow: 1,
            },
            button: {
                padding: 0,
                minWidth: "35px",
                height: "35px",
                marginLeft: "5px",
            }
        };

        const options = this.props.samples.map((v) => {return {
            label: v,
            value: v
        }});

        return(
            <div style={style.root}>
                <div style={style.toolbar}>
                    {this.props.children}
                </div>
                <div style={style.searchContainer}>
                    <div style={style.select}>
                         <Select
                             value={this.state.selection ? this.state.selection : 0}
                             onChange={this.handleSelection}
                             placeholder={"Search samples"}
                             options={options}/>
                    </div>
                    <Button color={"primary"} variant={"outlined"} style={style.button} onClick={() => {this.props.selectSample(this.state.selection)}}>
                        <MagnifyIcon color={themes[theme].palette.primary.main}/>
                    </Button>
                    <Button color={"primary"} variant={"outlined"} style={style.button} onClick={() => {this.props.selectSample(""); this.handleSelection(null)}}>
                        <CloseIcon color={themes[theme].palette.error.main}/>
                    </Button>
                </div>

            </div>
            // <div style={style.root}>
            //     <div style={{float: "left"}}>
            //         {this.props.children}
            //     </div>
            //     <div style={{flexGrow: "1"}}>
            //         <div style={style.selectContainer}>
            //             <Select
            //                 value={this.state.selection ? this.state.selection : 0}
            //                 onChange={this.handleSelection}
            //                 placeholder={"Search samples"}
            //                 options={options}/>
            //         </div>
            //         <Button color={"primary"} variant={"outlined"} style={style.button} onClick={() => {this.props.selectSample(this.state.selection)}}>
            //             <MagnifyIcon color={themes[theme].palette.primary.main}/>
            //         </Button>
            //         <Button color={"primary"} variant={"outlined"} style={style.button} onClick={() => {this.props.selectSample(""); this.handleSelection(null)}}>
            //             <CloseIcon color={themes[theme].palette.error.main}/>
            //         </Button>
            //     </div>
            // </div>
        )
    }
}


export class ResourcesPieChart extends React.Component{

    render(){

        const config = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: "pie",
                height: "170px"
            },
            tooltip: {
                pointFormat: "<b>{point.name}</b>: {point.percentage:.1f} % ({point.y}))"
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: "pointer",
                    dataLabels: {
                        enabled: false,
                    }
                }
            },
            title: {
                text: null
            },
            credits: {
                enabled: false
            },
            series: [{
                name: "Processes",
                colorByPoint: true,
                data: this.props.data.sort((a, b) => {return a.y - b.y})
            }]
        };

        return(
            <div>
                <ReactHighcharts config={config} ref="resourcesChart"></ReactHighcharts>
            </div>
        )
    }
}