import React from "react";

import Select from 'react-select';

import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import Toolbar from "@material-ui/core/Toolbar";
import Divider from "@material-ui/core/Divider";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Badge from "@material-ui/core/Badge";
import Slide from '@material-ui/core/Slide';
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Popover from "@material-ui/core/Popover";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

import Crosshairs from "mdi-react/CrosshairsIcon"
import {MuiThemeProvider} from "@material-ui/core/styles";

import {themes} from "./reports/themes";
import {theme} from "../../config.json";

import red from "@material-ui/core/colors/red";
import indigo from "@material-ui/core/colors/indigo";

import {Chart} from "./reports/chart_utils";
import {sortNumber} from "./reports/utils";

import {
    updateLabels,
    highLightScatter,
    highlightHist,
    getContig} from "./reports/sample_specific_utils";

import {ReportAppConsumer} from "./reports/contexts";

import {LoadingComponent} from "./ReportsBase";
import {Header} from "./Header";

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
                <ReportAppConsumer>
                    {
                        ({tableData, qcInfo}) => (
                            <Overview tableData={tableData}
                                      qcInfo={qcInfo}
                                      sample={this.props.sample}/>
                        )
                    }
                </ReportAppConsumer>
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


class Overview extends React.Component{

    getOverviewData = (tableData, sample) => {

        let data = new Map;
        let dataExtremes = new Map;
        let tempData;

        for (const [table, vals] of tableData.entries()){
            for (const el of vals){

                if (!isNaN(el.value)){
                    if (!dataExtremes.has(el.header)){
                        dataExtremes.set(el.header, {min: el.value, max: el.value})
                    } else if (parseFloat(el.value) > dataExtremes.get(el.header).max ){
                        dataExtremes.get(el.header).max = el.value
                    } else if (parseFloat(el.value) < dataExtremes.get(el.header).min){
                        dataExtremes.get(el.header).min = el.value
                    }
                }

                if (el.rowId === sample){

                    tempData = {
                        header: el.header,
                        value: el.value,
                        process: el.processName
                    };

                    if (!data.has(table)){
                        data.set(table, [tempData])
                    } else {
                        data.get(table).push(tempData)
                    }
                }
            }
        }

        return {
            data,
            dataExtremes
        };
    };

    render(){

        const style = {
            header: {
                fontSize: "20px",
                fontWeight: "bold"
            },
            headerContainer: {
                marginBottom: "20px"
            },
        };

        const headerMap = {
            "qc": "Quality Control",
            "assembly": "Assembly",
            "abricate": "AMR"
        };

        const {data, dataExtremes} = this.getOverviewData(this.props.tableData, this.props.sample);

        return(
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Overview</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <MuiThemeProvider theme={themes[theme]}>
                        <div>
                            <Grid container spacing={24}>
                                <Grid item xs={4}>
                                    <Typography>Sample: {this.props.sample}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography>as</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <QualityCard qcInfo={this.props.qcInfo} sample={this.props.sample} />
                                </Grid>
                            </Grid>
                            <Grid container spacing={24}>
                                {
                                    Array.from(data, ([key, val]) => {
                                        return (
                                            <Grid item xs={12} key={key}>
                                                <div style={style.headerContainer}>
                                                    <Typography style={style.header}>{headerMap.hasOwnProperty(key) ? headerMap[key] : key}</Typography>
                                                    <Divider/>
                                                </div>
                                                <Grid container spacing={24}>
                                                {
                                                    val.map((el) => {
                                                        return(
                                                            <Grid style={{minWidth: "220px"}} xs={2} item key={`${el.header}${el.process}`}>
                                                                <HeaderCard values={el}
                                                                            dataExtremes={dataExtremes}/>
                                                            </Grid>
                                                        )
                                                    })
                                                }
                                                </Grid>
                                            </Grid>
                                        )
                                    })
                                }
                            </Grid>
                        </div>
                    </MuiThemeProvider>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}


class QualityCard extends React.Component{

    /*
    Retrieves an object with two key:value pairs with the warnings and fails for
    a given sample.
     */
    _getSampleQcInfo = (sample, qcInfo) => {

        let sampleQcInfo = {
            "warnings": [],
            "fail": []
        };

        for (const [pname, samples] of qcInfo.entries()) {
            for (const [smpl, vals] of samples.entries()) {
                if (sample === smpl) {

                    if (vals.hasOwnProperty("warnings")) {
                        sampleQcInfo.warnings = sampleQcInfo.warnings.concat(vals.warnings)
                    }
                    if (vals.hasOwnProperty("fail")) {
                        sampleQcInfo.fail = sampleQcInfo.fail.concat(vals.fail)
                    }

                }
            }
        }

        return sampleQcInfo
    };

    render(){

        console.log(themes[theme])

        const sampleQcInfo = this._getSampleQcInfo(this.props.sample, this.props.qcInfo);
        const status = (sampleQcInfo.warnings.length === 0 && sampleQcInfo.fail.length === 0) ?
            "pass" :
            sampleQcInfo.fail.length > 0 ?
                "fail" :
                "warning";

        const style = {
            root: {
                padding: "15px",
                backgroundColor: status === "pass" ? themes[theme].palette.success.main : status === "warning" ? themes[theme].palette.warning.main : themes[theme].palette.error.main
            }
        };

        return(
            <Paper style={style.root}>
                OMAGODE
            </Paper>
        )
    }
}

class HeaderCard extends React.Component{

    shouldComponentUpdate = (nextProps) => {
        return nextProps.values !== this.props.values
    };

    render(){

        let proportion;
        let ranges;
        if (this.props.dataExtremes.has(this.props.values.header)){
            ranges = this.props.dataExtremes.get(this.props.values.header);
            if (this.props.values.value === ranges.min){
                proportion = 100;
            } else {
                proportion = parseInt(((this.props.values.value - ranges.min) / (ranges.max - ranges.min)) * 100)
            }
        }

        const style = {
            root: {
                display: "flex"
            },
            header: {
                fontSize: "15px",
                fontWeight: "bold",
                color: "#8e8e8e"
            },
            value: {
                fontSize: "24px",
                fontWeight: "bold",
            },
            process: {
                fontSize: "13px",
                fontWeight: "bold",
                color: "#8e8e8e"
            },
            textContainer: {
                margin: "auto",
                marginLeft: "0",
                paddingLeft: "5px",
                paddingRight: "10px",
                borderLeft: proportion ? "1px solid grey" : "0px"
            }
        };

        return(
            <div>
                <div style={style.root}>
                    {
                        proportion &&
                            <GaugeChart value={proportion}/>
                    }
                    <div style={style.textContainer}>
                        <Typography style={style.header}>{this.props.values.header}</Typography>
                        <Typography style={style.value}>{this.props.values.value}</Typography>
                        <Typography style={style.process}>{this.props.values.process}</Typography>
                    </div>
                </div>
            </div>
        )
    }
}


class GaugeChart extends React.Component{
    render(){

        const config = {
            chart: {
                type: "solidgauge",
                height: "80",
                width: "80",
                marginRight: "-25",
                marginLeft: "-15"
            },
            title: {
                text: "",
                margin: 0
            },
            pane: {
                startAngle: 0,
                endAngle: 360,
                background: [{
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                }, {
                    backgroundColor: "#bababa",
                    borderColor: "transparent",
                    innerRadius: "75%",
                    outerRadius: "100%"
                }],
                shape: "arc"
            },
            yAxis: {
                min: 0,
                max: 100,
                minorTickInterval: null,
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
            },
            tooltip: {
                enabled: false
            },
            plotOptions: {
                solidgauge: {
                    innerRadius: "75%",
                    animation: false
                }

            },
            credits: {
                enabled: false
            },
            series: [{
                data: [{
                    y: this.props.value,
                    color:  "#5c6bc0",
                }],
                dataLabels: {
                    format: "<Typography style='text-align:center;font-size:14px'>{y}%</Typography>",
                    y: 15,
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    color: "#5c6bc0"
                }
            }]
        };

        return(
            <div>
                <ReactHighcharts config={config} ref={"gaugeChart"}></ReactHighcharts>
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
                                    contig: v.contig,
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

    getChartLayout = (seriesData, title, xLabels, plotLines, xBars, window) => {

        let config = new Chart({
            title: title,
            axisLabels: {x: null, y: null},
            series: [{
                data: seriesData,
                type: "line",
                lineWidth: 0.8
            }]
        });

        config.extend("chart", {
            marginLeft: 80,
            spacingTop: 30,
            spacingBottom: 10,
            zoomType: "x",
            panning: true,
            panKey: "ctrl",
            height: 270,
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
                    x: 70,
                    y: 20
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
        const chartHeight = 90 + (seriesHeight * categories.length);

        let config = new Chart({
            title: null,
            axisLabels: {x: null, y: null},
            series: data
        });

        config.extend("chart", {
            marginLeft: 80,
            spacingTop: 30,
            spacingBottom: 10,
            zoomType: "x",
            panning: true,
            panKey: "ctrl",
            height: chartHeight,
            type: "xrange",
        });
        config.extend("title", {
            text: "Antimicrobial resistance and virulence annotation",
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
                    x: 70,
                    y: 35
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
            categories: xLabels,
            min: 0,
            tickInterval: 100,
            max: xLabels.length,
            plotLines: plotLines,
            crosshair: {
                width: 10
            },
            events: {
                setExtremes: this._syncExtremes
            },
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

    highlightAbrSelection = (value) => {

        if (!this.refs.hasOwnProperty("slidingAbr")){
            return
        }
        let chartObj = this.refs.slidingAbr.getChart();

        const highlightRange = [
            value.pos - chartObj.xAxis[0].max * 0.003,
            value.pos + chartObj.xAxis[0].max * 0.003,
        ];

        chartObj.xAxis[0].removePlotBand("geneHighlight");

        chartObj.xAxis[0].addPlotBand({
            id: "geneHighlight",
            color: "rgba(169, 255, 176, 0.5)",
            from: highlightRange[0],
            to: highlightRange[1]
        });

    };

    zoomAbrSelection = (value) => {

        if (!this.refs.hasOwnProperty("slidingAbr")){
            return
        }
        let chartObj = this.refs.slidingAbr.getChart();

        const zoomRange = [
            value.pos - chartObj.xAxis[0].max * 0.001,
            value.pos + chartObj.xAxis[0].max * 0.001,
        ];

        this._syncExtremes({
            min: zoomRange[0],
            max: zoomRange[1],
            animation: true
        });

        // Get index of series for the database
        const seriesIdx = chartObj.series.findIndex(
            (x) => x.name === value.database
        );
        const pointIdx = chartObj.series[seriesIdx].data.findIndex(
            (x) => x.x === value.pos
        );

        const point = chartObj.series[seriesIdx].data[pointIdx]
        console.log(chartObj.series[seriesIdx])

        setTimeout(() => {point.firePointEvent("click");}, 500);

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

        console.log(this.props)

        const gcConfig = this.getChartLayout(this.props.plotData.gcData, "GC% content", this.props.plotData.xLabels, this.props.plotData.plotLines, this.props.plotData.xBars, this.props.plotData.window);
        const covConfig = this.getChartLayout(this.props.plotData.covData, "Coverage depth", this.props.plotData.xLabels, this.props.plotData.plotLines, this.props.plotData.xBars, this.props.plotData.window);

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
                            <AbricateSelect
                                highlightAbrSelection={this.highlightAbrSelection}
                                zoomAbrSelection={this.zoomAbrSelection}
                                data={this.props.plotData.xrangeData}/>
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
            root: {
                overflow: "hidden",
                padding: "10px"
            },
            grid: {
                padding: "10px",
                minWidth: "400px"
            },
            button: {
                padding: 0,
                width: "40px",
                height: "40px",
                color: red[400],
            },
            header: {
                display: "flex"
            },
            headerTitle: {
                flexGrow: "1",
                margin: "auto"
            },
            textItems: {
                fontSize: "15px",
                marginBottom: "7px"
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
                <div style={style.root}>
                    <div style={style.header}>
                        <Typography variant={"subheading"} style={style.headerTitle}>AMR gene details</Typography>
                        <IconButton style={style.button} size={"small"}>
                            <CloseIcon onClick={this.handleClose}/>
                        </IconButton>
                    </div>
                    <Divider/>
                    <Grid style={style.grid} container spacing={16}>
                        <Grid item xs={9} style={{margin: "auto"}}>
                            {
                                Object.keys(infoObject).map((key) => {
                                    return(
                                        <Typography style={style.textItems} key={key}>
                                            <b>{infoObject[key]}</b>: {data[key]}
                                        </Typography>
                                    )
                                })
                            }
                        </Grid>
                        <Grid item xs={3}>
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

class AbricateSelect extends React.Component{

    state = {
        selected: null,
    };

    prepareOptions = (data) => {

        let options = [];
        let currentOpts;

        for (const el of data) {
            currentOpts = {
                label: el.name,
                options: []
            };
            for (const d of el.data) {
                currentOpts.options.push({
                    value: `${d.gene}_${d.x}`,
                    label: d.gene,
                    pos: d.x,
                    database: el.name
                });
            }
            options.push(currentOpts);
        }

        return options;
    };



    render(){

        const groupedOpts = this.prepareOptions(this.props.data);

        const style = {
            root: {
                maxWidth: "400px",
                margin: "auto",
                marginTop: "10px"
            },
            container: {
                display: "flex"
            },
            text: {
                fontSize: "16px",
                margin: "auto",
                marginRight: "10px"
            },
            button: {
                padding: 0,
                width: "40px",
                height: "40px",
                marginLeft: "10px"
            },
            badge: {
                width: "10px",
                height: "10px",
                marginLeft: "50px"
            },
            groupName: {
                flexGrow: "1",
                color: indigo[400],
                fontWeight: "bold",
            },
            groupCount: {

            }
        };

        const formatGroupLabel = data => (
            <div>
                <div style={{display: "flex"}}>
                    <Typography style={style.groupName}>{data.label}</Typography>
                    <Typography style={style.groupCount}>{data.options.length}</Typography>
                </div>
                <Divider/>
            </div>
        );

        return(
            <div style={style.root}>
                <div style={style.container}>
                    <Typography style={style.text}>Search genes: </Typography>
                    <div style={{flexGrow: "1"}}>
                        <Select options={groupedOpts}
                                menuPlacement={"top"}
                                onChange={(value) => {this.props.highlightAbrSelection(value); this.setState({selected: value})}}
                                formatGroupLabel={formatGroupLabel}/>
                    </div>
                    <IconButton onClick={() => {this.props.zoomAbrSelection(this.state.selected)}} variant={"container"} style={style.button} >
                        <Crosshairs color={indigo[300]}/>
                    </IconButton>
                </div>
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