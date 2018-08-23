import React from "react";

import Select from 'react-select';

import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Slide from '@material-ui/core/Slide';
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

import {Chart} from "./reports/chart_utils";
import {sortNumber} from "./reports/utils";

import {
    updateLabels,
    highLightScatter,
    highlightHist,
    getContig} from "./reports/sample_specific_utils";

import {LoadingComponent} from "./ReportsBase";

const ReactHighcharts = require("react-highcharts");
const HighchartsHistogram = require("highcharts/modules/histogram-bellcurve");

HighchartsHistogram(ReactHighcharts.Highcharts);


function Transition(props) {
  return <Slide direction="up" {...props} />;
}

export class SampleDialog extends React.Component{

    state = {
        open: false
    };

    handleClickOpen = () => {
        this.setState({open: true})
    };

    handleClose = () => {
        this.setState({open: false})
    };

    render(){

        const style = {
            reportContainer: {
                marginTop: "70px",
                padding: "20px"
            }
        };

        return(
            <div>
                <Button onClick={this.handleClickOpen}>OI!?</Button>
                <Dialog fullScreen
                        onClose={this.handleClose}
                        open={this.state.open}
                        TransitionComponent={Transition}>
                    <AppBar>
                        <Toolbar>
                            <IconButton color="inherit" onClick={this.handleClose} aria-label="Close">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="title" color="inherit">
                                Sample specific report for {this.props.sample}
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <div style={style.reportContainer}>
                        <SampleSpecificReport charts={this.props.charts}
                                              sample={this.props.sample}
                                              reportData={this.props.reportData}/>
                    </div>
                </Dialog>
            </div>
        )
    }
}


class SampleSpecificReport extends React.Component{

    shouldComponentUpdate(nextProps, nextState){
        return this.props.reportData !== nextProps.reportData;
    }

    render(){

        console.log(this.props)

        return(
            <div>
                {
                    this.props.charts.includes("size_dist") &&
                    <ContigSizeDistribution sample={this.props.sample}
                                            reportData={this.props.reportData}/>
                }
                {
                    this.props.charts.includes("genomeSliding") &&
                    <SyncCharts sample={this.props.sample}
                                reportData={this.props.reportData}/>
                }
            </div>
        )
    }
}


class ContigSizeDistribution extends React.Component{

    getChartData = (reportData, sample) => {

        const plotData = [];

        for (const el of reportData){

            if ( ((el || {}).reportJson || {}).plotData ){

                for (const plot of el.reportJson.plotData){

                    if (plot.sample !== sample){
                        continue
                    }

                    if (plot.data.hasOwnProperty("size_dist")){
                        plotData.push({
                            process: el.processName,
                            series: [{
                                name: "Data",
                                type: "scatter",
                                data: plot.data["size_dist"].sort(sortNumber),
                                id: "d",
                                color: "black",
                                marker: {
                                    radius: 3
                                },
                                events: {
                                    mouseOver() {updateLabels(this, "bold", 1);},
                                    mouseOut() {updateLabels(this, "normal", 1);},
                                }
                            }, {
                                name: "Histogram",
                                type: "histogram",
                                xAxis: 1,
                                yAxis: 1,
                                baseSeries: "d",
                                zIndex: -1,
                                color: "grey",
                                events: {
                                    mouseOver() {updateLabels(this, "bold", 0)},
                                    mouseOut() {updateLabels(this, "normal", 0);},
                                },
                            }]
                        })
                    }
                }
            }
        }

        return plotData;
    };

    render(){

        const plotData = this.getChartData(this.props.reportData, this.props.sample);

        let config = new Chart({
            title: "",
            axisLabels: {x: "Contig", y: "Size"},
            series: plotData[0].series
        });

        config.layout.xAxis = [{
            title: {text: "Contig"}
        }, {
            title: {text: "Frequency"},
            opposite: true
        }];
        config.layout.yAxis = [{
            title: {text: "Contig size"}
        }, {
            title: {text: "Frequency"},
            opposite: true
        }];

        return(
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Contig size distribution</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div style={{"height": "400px", "width":"100%"}}>
                        <ReactHighcharts config={config.layout} ref={"ssSizeDist"}></ReactHighcharts>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}


class SyncCharts extends React.Component{

    constructor(props){
        super(props);

        const {processes, data} = this.getSlidingCovData(props.reportData, props.sample);

        this.state = {
            processes: processes,
            selectedProcess: processes[0],
            plotData: data
        }
    }

    handleProcessChange = (value) => {
        if (value){
            this.setState({
                selectedProcess: value.value
            })
        }
    };

    getSlidingCovData = (reportData, sample) => {

        let data = new Map();
        let processes = [];

        let gcData;
        let covData;
        let xLabels;
        let xBars;
        let window;

        for (const el of reportData){

            if ( ((el || {}).reportJson || {}).plotData ){

                for (const plot of el.reportJson.plotData){

                    if (plot.sample !== sample){
                        continue
                    }

                    if (plot.data.hasOwnProperty("genomeSliding")){
                        gcData = plot.data.genomeSliding.gcData;
                        covData = plot.data.genomeSliding.covData;
                        xLabels = plot.data.genomeSliding.gcData.map((v, i) => {
                            return i * plot.data.genomeSliding.window
                        });
                        xBars = Array.from(plot.data.genomeSliding.xbars, v => v[1]);
                        window = plot.data.genomeSliding.window;

                        data.set(el.processName, {
                            gcData,
                            covData,
                            xLabels,
                            xBars,
                            window
                        });
                        processes.push(el.processName)
                    }
                }
            }
        }

        return {
            data,
            processes
        }
    };

    _syncExtremes = (e) => {

        if (!e.animation){
            e.animation = false;
        }

        let chartObj;

        if (e.trigger !== "_syncExtremes"){

            for (const chart of Object.keys(this.refs)){
                chartObj = this.refs[chart].getChart()
                chartObj.xAxis[0].setExtremes(e.min, e.max, undefined, e.animation, {trigger: "_syncExtremes"})
            }
        }
    };

    _syncCrosshair = (e) => {

        let point,
            event,
            chartObj;

            for (const chart of Object.keys(this.refs)){
                chartObj = this.refs[chart].getChart();

                event = chartObj.pointer.normalize(e);

                point = chartObj.series[0].searchPoint(event, true);

                if (point){
                    point.highlight(e);
                }
            }
    };

    getChartLayout = (seriesData, xLabels, xBars, window) => {

        console.log(xBars)

        let contigPlotLines = [];
        for (const c of xBars){
            contigPlotLines.push({
                value: c / window,
                width: .15,
                color: "grey",
            })
        }
        console.log(contigPlotLines)

        let config = new Chart({
            title: null,
            axisLabels: {x: null, y: null},
            series: [{
                data: seriesData,
                type: "line"
            }]
        });

        config.extend("chart", {
            marginTop: 40,
            spacingBottom: 10,
            zoomType: "x",
            panning: true,
            panKey: "ctrl",
            height: 300,
        });
        config.extend("legend", {
            enabled: false
        });
        config.extend("xAxis", {
            categories: xLabels,
            crosshair: {
                width: 10
            },
            tickInterval: 100,
            min: 0,
            max: xLabels.length,
            plotLines: contigPlotLines,
            events: {
                setExtremes: this._syncExtremes
            },
        });
        config.extend("credits", {
            enabled: false
        });
        config.extend("tooltip", {
            positioner() {
                return {
                    x: 40,
                    y: -10
                }
            },
            borderWidth: 0,
            backgroundColor: "none",
            pointFormatter(){
                return "<span>Position:<b> " + this.x * window + " </b>(Contig:<b> " + getContig(this.x * window, xBars) + ")</b></span><br>" +
                    "<span>Value: </span><b>" + this.y + "</b></span>"
            },
            headerFormat: "",
            shadow: false,
            style: {
                fontSize: "12px"
            },
            valueDecimals: 2
        });

        return config

    };

    componentDidMount(){
        this.chartContainer.addEventListener("mousemove", this._syncCrosshair)

        ReactHighcharts.Highcharts.Point.prototype.highlight = function (event) {
            this.onMouseOver(); // Show the hover marker
            this.series.chart.tooltip.refresh(this); // Show the tooltip
            this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
        }
    }

    render(){

        const currentPlotData = this.state.plotData.get(this.state.selectedProcess);

        console.log(currentPlotData)

        const gcConfig = this.getChartLayout(currentPlotData.gcData, currentPlotData.xLabels, currentPlotData.xBars, currentPlotData.window);
        const covConfig = this.getChartLayout(currentPlotData.covData, currentPlotData.xLabels, currentPlotData.xBars, currentPlotData.window);

        return(
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Genome sliding window</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div style={{flexGrow: 1}}>
                        {
                            this.state.processes.length > 1 &&
                            <ProcessMenu
                                selectedProcess={this.state.selectedProcess}
                                handleProcessChange={this.handleProcessChange}
                                processes={this.state.processes}/>
                        }
                        <div ref={elem => this.chartContainer = elem} style={{"width":"100%"}}>
                            <ReactHighcharts config={gcConfig.layout} ref={"slidindGc"}></ReactHighcharts>
                            <ReactHighcharts config={covConfig.layout} ref={"slidingCov"}></ReactHighcharts>
                        </div>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}

class ProcessMenu extends React.Component{

    render(){

        const style = {
            container: {
                maxWidth: "300px",
                marginBottom: "15px"
            },
            dropdownValue: {
                lineHeight: "33px",
                fontWeight: "bold"
            }
        };

        const options = this.props.processes.map((v) => {
            return {value: v, label: <Typography style={style.dropdownValue}>{v}</Typography>}
        });

        return(
            <div style={style.container}>
                <Typography>Select process: </Typography>
                <Select value={this.props.selectedProcess}
                        onChange={this.props.handleProcessChange}
                        options={options}/>
            </div>
        )
    }

}