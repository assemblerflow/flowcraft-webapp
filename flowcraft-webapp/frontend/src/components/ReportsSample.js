import React from "react";

import Select from 'react-select';

import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import ListItem from "@material-ui/core/ListItem";
import CloseIcon from "@material-ui/icons/Close";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Slide from '@material-ui/core/Slide';
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List"
import Popover from "@material-ui/core/Popover";
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

import {ReportAppConsumer} from "./reports/contexts";

import {LoadingComponent, LoadingScreen} from "./ReportsBase";

const ReactHighcharts = require("react-highcharts");
const HighchartsMore = require("highcharts/highcharts-more");
const HighchartsHistogram = require("highcharts/modules/histogram-bellcurve");
const HighchartsxRange = require("highcharts/modules/xrange");
const HighchartsGauge = require("highcharts/modules/solid-gauge");

HighchartsMore(ReactHighcharts.Highcharts);
HighchartsGauge(ReactHighcharts.Highcharts);
HighchartsHistogram(ReactHighcharts.Highcharts);
HighchartsxRange(ReactHighcharts.Highcharts);


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

        return(
            <div>
                {
                    this.props.charts.includes("size_dist") &&
                    <ContigSizeDistribution sample={this.props.sample}
                                            reportData={this.props.reportData}/>
                }
                {
                    this.props.charts.includes("genomeSliding") &&
                    <ReportAppConsumer>
                        {
                            ({charts}) => (
                                <SyncChartsContainer sample={this.props.sample}
                                            charts={charts}
                                            reportData={this.props.reportData}/>
                            )
                        }
                    </ReportAppConsumer>}
            </div>
        )
    }
}


class ContigSizeDistribution extends React.Component{

    constructor(props){
        super(props);

        const {processes, data} = this.getChartData(props.reportData, props.sample);

        this.state = {
            processes: processes,
            selectedProcess: processes[0],
            plotData: data
        }
    };

    handleProcessChange = (value) => {
        if (value){
            this.setState({
                selectedProcess: value.value
            })
        }
    };

    getChartData = (reportData, sample) => {

        let data = new Map();
        let processes = [];
        let plotData = [];

        for (const el of reportData){

            if ( ((el || {}).reportJson || {}).plotData ){

                for (const plot of el.reportJson.plotData){

                    if (plot.sample !== sample){
                        continue
                    }

                    if (plot.data.hasOwnProperty("size_dist")){
                        plotData = [{
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
                        }];
                        data.set(el.processName, plotData);
                        processes.push(el.processName);
                    }
                }
            }
        }

        return {
            processes,
            data
        };
    };

    render(){

        const currentPlotData = this.state.plotData.get(this.state.selectedProcess);

        return(
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Contig size distribution</Typography>
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
                        <LoadingComponent>
                            <ContigSizeDistributionChart plotData={currentPlotData}/>
                        </LoadingComponent>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}

class ContigSizeDistributionChart extends React.Component{

    shouldComponentUpdate(nextProps, nextState){

        return nextProps.plotData !== this.props.plotData;
    }

    render(){

        let config = new Chart({
            title: "",
            axisLabels: {x: "Contig", y: "Size"},
            series: this.props.plotData
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
            <div style={{"height": "400px", "width":"100%"}}>
                <ReactHighcharts config={config.layout} ref={"ssSizeDist"}></ReactHighcharts>
            </div>
        )
    }
};


class SyncChartsContainer extends React.Component{

    constructor(props){
        super(props);

        const {processes, data} = this.getSlidingData(props.reportData, props.sample);

        this.state = {
            processes: processes,
            selectedProcess: processes[0],
            plotData: data
        };
    }

    handleProcessChange = (value) => {
        if (value){
            this.setState({
                selectedProcess: value.value
            })
        }
    };

    _convertContigPosition = (xrange, contig, xbars, window) => {

        let contigId;
        let prevRange = 0;

        for (const val of xbars){
            contigId = xbars.indexOf(val) + 1;

            if (contigId === contig){
                return [(xrange[0] + prevRange) / window, (xrange[1] + prevRange) / window]
            }

            prevRange = val;
        }

        return [0, 0]

    };

    complementAbricateData = (reportData, sample, assemblyFile, xBars, window) => {

        let xrangeData = [];
        let xrangeCategories = [];

        for (const el of reportData) {

            if (((el || {}).reportJson || {}).plotData) {

                for (const plot of el.reportJson.plotData) {

                    // Skip entries for different sample/ assembly file
                    if (plot.sample !== sample || plot.assemblyFile !== assemblyFile) {
                        continue
                    }

                    if (plot.data.hasOwnProperty("abricateXrange")) {
                        let counter = 0;
                        for (const [db, data] of Object.entries(plot.data.abricateXrange)){

                            const tempData = Array.from(data, (v) => {

                                const correctRange = this._convertContigPosition(v.seqRange, parseInt(v.contig), xBars, window);

                                return {
                                    x: correctRange[0],
                                    x2: correctRange[1],
                                    y: counter,
                                    gene: v.gene,
                                    accession: v.accession,
                                    coverage: v.coverage,
                                    identity: v.identity,
                                    window: window
                                }
                            });
                            xrangeCategories.push(db);
                            xrangeData.push({
                                name: db,
                                data: tempData,
                                pointWidth: 12,
                                pointRange: 0
                            });
                            counter += 1;
                        }
                    }
                }
            }
        }

        return {
            xrangeData,
            xrangeCategories
        }

    };

    getSlidingData = (reportData, sample) => {

        let data = new Map();
        let processes = [];

        let gcData;
        let covData;
        let xLabels;
        let xBars;
        let window;
        let plotLines;

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
                        plotLines = xBars.map((v) => {
                            return {
                                value: v / window,
                                width: 0.15,
                                color: "grey"
                            }
                        });

                        if (this.props.charts.includes("abricateXrange")){
                            const {xrangeData, xrangeCategories} = this.complementAbricateData(reportData, sample, plot.data.genomeSliding.assemblyFile, xBars, window);
                            data.set(el.processName, {
                                gcData,
                                covData,
                                xLabels,
                                plotLines,
                                xBars,
                                window,
                                xrangeData,
                                xrangeCategories
                            });
                        } else {
                            data.set(el.processName, {
                                gcData,
                                covData,
                                xLabels,
                                xBars,
                                plotLines,
                                window
                            });
                        }
                        processes.push(el.processName);
                    }
                }
            }
        }

        return {
            data,
            processes
        }
    };

    render(){

        const currentPlotData = this.state.plotData.get(this.state.selectedProcess);

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
                        <LoadingComponent>
                            <SyncCharts plotData={currentPlotData}/>
                        </LoadingComponent>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}


class SyncCharts extends React.Component{

    constructor(props){
        super(props);

        this._geneClick = this._geneClick.bind(this)
        this.prevPath = {};
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
            seriesName,
            chartObj;

        for (const chart of Object.keys(this.refs)){
            chartObj = this.refs[chart].getChart();

            event = chartObj.pointer.normalize(e);

            if (chartObj.userOptions.chart.type === "xrange"){

                for (const s of chartObj.series){

                    if (!s){
                        continue
                    }

                    seriesName = s.userOptions.name;
                    if (this.prevPath.hasOwnProperty(seriesName)){
                        this.prevPath[seriesName].element.remove();
                    }

                    point = s.searchPoint(event, true);
                    if (!point){
                        continue
                    }

                    // Get corrected coordinates for crosshairs
                    const crossX = point.plotX + chartObj.plotBox.x;
                    const crossY = point.plotY + chartObj.plotBox.y - 10;
                    const crossOffSet = point.plotY + chartObj.plotBox.y + 10;

                    this.prevPath[seriesName] = chartObj.renderer.path(["M", crossX, crossY, "V", crossOffSet])
                        .attr({"stroke-width": 5, stroke: point.color, id:s.userOptions.name, zIndex: -1, opacity: .7})
                        .add();
                }

            } else {
                point = chartObj.series[0].searchPoint(event, true);
                if (point){
                    point.highlight(e);
                }
            }
        }
    };

    getChartLayout = (seriesData, xLabels, plotLines, xBars, window) => {

        let config = new Chart({
            title: null,
            axisLabels: {x: null, y: null},
            series: [{
                data: seriesData,
                type: "line",
                lineWidth: 0.8
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
            plotLines: plotLines,
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

    _geneClick = (e) => {
        console.log(e)
        const data = {
            gene: e.point.gene,
            geneLength: parseInt((e.point.x2 - e.point.x) * 2000),
            genePosition: `${e.point.x * 2000} - ${e.point.x2 * 2000}`,
            database: e.point.yCategory,
            accession: e.point.accession,
            coverage: e.point.coverage,
            identity: e.point.identity
        };
        this.genePopover.handleClick(e.target, data)
    };

    getxRangeLayout = (data, categories, xLabels, plotLines) => {

        const seriesHeight = 20;
        const chartHeight = 60 + (seriesHeight * categories.length);

        let config = new Chart({
            title: null,
            axisLabels: {x: null, y: null},
            series: data
        });

        config.extend("chart", {
            marginLeft: 100,
            spacingTop: 10,
            spacingBottom: 10,
            zoomType: "x",
            panning: true,
            panKey: "ctrl",
            height: chartHeight,
            type: "xrange",
        });
        config.extend("title", {
            text: "Antimicrobial resistance and virulence annotation",
            margin: 5
        });
        config.extend("plotOptions", {
            series: {
                cursor: "pointer",
                borderColor: "#fff",
                point: {
                    events: {
                        click: (e) => {
                            this._geneClick(e)
                        }
                    }
                }
            },
        });
        config.extend("tooltip", {
            positioner() {
                return {
                    x: 30,
                    y: 0
                };
            },
            pointFormatter() {
                return `<span>Gene: <b>${this.gene}</b> (Click for details)</span>`;
            },
            borderWidth: 0,
            backgroundColor: "none",
            headerFormat: "",
            shadow: false
        });
        config.extend("xAxis", {
            min: 0,
            max: xLabels.length,
            plotLines: plotLines,
            events: {
                setExtremes: this._syncExtremes
            },
            labels: {
                enabled: false
            }
        });
        config.extend("yAxis", {
            categories: categories,
            title: {
                text: null
            },
        });
        config.extend("credits", {
            enabled: false
        });

        return config

    };

    componentDidMount(){
        this.chartContainer.addEventListener("mousemove", this._syncCrosshair)

        ReactHighcharts.Highcharts.Point.prototype.highlight = function (event) {
            this.onMouseOver(); // Show the hover marker
            this.series.chart.tooltip.refresh(this); // Show the tooltip
            this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
        };

        ReactHighcharts.Highcharts.Pointer.prototype.reset = function () {
            return undefined;
        };
    }

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.plotData !== this.props.plotData;
    }

    render(){

        const gcConfig = this.getChartLayout(this.props.plotData.gcData, this.props.plotData.xLabels, this.props.plotData.plotLines, this.props.plotData.xBars, this.props.plotData.window);
        const covConfig = this.getChartLayout(this.props.plotData.covData, this.props.plotData.xLabels, this.props.plotData.plotLines, this.props.plotData.xBars, this.props.plotData.window);

        let xRangeConfig;
        if (this.props.plotData.hasOwnProperty("xrangeData")){
            xRangeConfig = this.getxRangeLayout(this.props.plotData.xrangeData, this.props.plotData.xrangeCategories, this.props.plotData.xLabels, this.props.plotData.plotLines)
        }

        return(
            <div ref={elem => this.chartContainer = elem} style={{"width":"100%"}}>
                <ReactHighcharts config={gcConfig.layout} ref={"slidindGc"}></ReactHighcharts>
                <ReactHighcharts config={covConfig.layout} ref={"slidingCov"}></ReactHighcharts>
                {
                    xRangeConfig &&
                        <div>
                            <GenePopup onRef={ref => (this.genePopover = ref)}/>
                            <ReactHighcharts config={xRangeConfig.layout} ref={"slidingAbr"}></ReactHighcharts>
                        </div>
                }
            </div>
        )
    }
}

class GenePopup extends React.Component{

    state = {
        anchorEl: null,
        data: {},
        show: false
    };

    // Required to set reference on parent component to allow state change
    componentDidMount() {
        this.props.onRef(this);
    }

    componentWillUnmount() {
        this.props.onRef(undefined);
    }

    handleClick = (pos, data) => {
        this.setState({
            anchorEl: pos,
            data: data,
            show: true
        });
    };

    handleClose = () => {
        this.setState({
            show: false,
        });
    };

    render(){

        const style = {
            grid: {
                padding: "10px",
                minWidth: "400px"
            }
        };

        const { anchorEl, show, data } = this.state;

        const infoObject = {
            "gene": "Gene",
            "geneLength": "Gene length",
            "genePosition":"Gene position",
            "database": "Database",
            "accession": "Accession"
        };

        return(
            <Popover
                open={show}
                anchorEl={anchorEl}
                onClose={this.handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                >
                <div style={{overflow: "hidden"}}>
                    <Grid style={style.grid} container spacing={16}>
                        <Grid item xs={8}>
                            {
                                Object.keys(infoObject).map((key) => {
                                    return(
                                        <Typography key={key}>
                                            <b>{infoObject[key]}</b>: {data[key]}
                                        </Typography>
                                    )
                                })
                            }
                        </Grid>
                        <Grid item xs={4}>
                            <GeneGaugeChart title={"Coverage"} value={data.coverage}/>
                            <GeneGaugeChart title={"Identity"} value={data.identity}/>
                        </Grid>
                    </Grid>
                </div>
            </Popover>
        )
    }
}

class GeneGaugeChart extends React.Component{

    render(){

        console.log(this.props)

        let config = new Chart({
            title: this.props.title,
            axisLabels: {x: null, y: null},
            series: [{
                data: [this.props.value],
                dataLabels: {
                    format: "<p style='text-align:center;'>{y}%</p>",
                    y: 33
                }
            }]
        });
        config.extend("chart", {
            type: "solidgauge",
            backgroundColor: "transparent",
            height: 80,
        });
        config.extend("title", {
            margin: 2,
            style: {"fontSize": "11px", fontWeight: "bold"}
        });
        config.extend("pane", {
            center: ["50%", "70%"],
            size: "130%",
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: "#fff",
                innerRadius: "75%",
                outerRadius: "100%",
                shape: "arc",
                borderColor: "transparent"
            }
        });
        config.extend("tooltip", {
            enabled: false
        });
        config.extend("credits", {
            enabled: false
        });
        config.extend("yAxis", {
            min: 0,
            max: 100,
            stops: [
                [0.1, "#e74c3c"], // red
                [0.5, "#f1c40f"], // yellow
                [0.9, "#2ecc71"] // green
            ],
            minorTickInterval: null,
            tickPixelInterval: 400,
            tickWidth: 0,
            gridLineWidth: 0,
            gridLineColor: "transparent",
            padding: 0,
            labels: {
                enabled: false
            },
            title: {
                enabled: false
            }
        });
        config.extend("plotOptions", {
            solidgauge: {
                innerRadius: "75%",
                dataLabels: {
                    y: -45,
                    borderWidth: 0,
                    useHTML: true
                },
                animation: {
                    duration: 0
                }
            }
        });

        return(
            <div>
                <ReactHighcharts config={config.layout} ref={"slidingAbr"}></ReactHighcharts>
            </div>
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
                <Select defaultValue={this.props.selectedProcess}
                        value={this.props.selectedProcess}
                        clearable={false}
                        onChange={this.props.handleProcessChange}
                        options={options}/>
            </div>
        )
    }

}