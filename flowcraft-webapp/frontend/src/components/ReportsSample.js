import React from "react";
import ReactDOM from "react-dom";

import Select from 'react-select';

import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import Toolbar from "@material-ui/core/Toolbar";
import Divider from "@material-ui/core/Divider";
import Popover from "@material-ui/core/Popover";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Slide from '@material-ui/core/Slide';
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import CrosshairsGpsIcon from "mdi-react/CrosshairsGpsIcon"
import {MuiThemeProvider} from "@material-ui/core/styles";

import {themes} from "./reports/themes";
import {theme} from "../../config.json";

import red from "@material-ui/core/colors/red";
import indigo from "@material-ui/core/colors/indigo";

import {Chart} from "./reports/chart_utils";
import {OverviewQcPopover} from "./reports/overview";
import {sortNumber} from "./reports/utils";

import {
    getContig,
    highlightHist,
    highLightScatter,
    updateLabels
} from "./reports/sample_specific_utils";

import {ReportAppConsumer} from "./reports/contexts";
import {FindDistributionChart, ResourcesPieChart} from "./reports/charts";
import {getSamplePlot} from "./reports/parsers";

import {LoadingComponent} from "./ReportsBase";

const ReactHighcharts = require("react-highcharts");
const HighchartsMore = require("highcharts/highcharts-more");
const HighchartsHistogram = require("highcharts/modules/histogram-bellcurve");
const HighchartsxRange = require("highcharts/modules/xrange");
const HighchartsGauge = require("highcharts/modules/solid-gauge");
const HighchartsSankey = require("highcharts/modules/sankey");

HighchartsMore(ReactHighcharts.Highcharts);
HighchartsGauge(ReactHighcharts.Highcharts);
HighchartsHistogram(ReactHighcharts.Highcharts);
HighchartsxRange(ReactHighcharts.Highcharts);
HighchartsSankey(ReactHighcharts.Highcharts);


function Transition(props) {
  return <Slide direction="up" {...props} />;
}

/*
This is the main entry point component for showing the SampleSpecificReport
component. Using it requires only two props:
    - this.props.button: used to trigger the opening of the the modal
    - this.props.sample: used to fetch the sample specific data
 */
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
                padding: "20px"
            },
            buttonContainer: {
                display: "inline-block"
            }
        };

        return(
            <ReportAppConsumer>
                {
                    ({charts, reportData}) => (
                        <div style={style.buttonContainer}>
                            <div onClick={this.handleClickOpen}>
                                {this.props.button}
                            </div>
                            <Dialog fullScreen
                                    onClose={this.handleClose}
                                    open={this.state.open}
                                    TransitionComponent={Transition}>
                                <AppBar position={"sticky"}>
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
                                    <SampleSpecificReport charts={charts}
                                                          sample={this.props.sample}
                                                          zoomInitialGene={this.props.zoomInitialGene}
                                                          reportData={reportData}/>
                                </div>
                            </Dialog>
                        </div>
                    )
                }

            </ReportAppConsumer>
        )
    }
}

/*
Main component of the sample specific report.
 */
class SampleSpecificReport extends React.Component{

    shouldComponentUpdate(nextProps, nextState){
        return this.props.reportData !== nextProps.reportData;
    }

    render(){

        return(
            <div>
                <ReportAppConsumer>
                    {
                        ({tableData, qcInfo, nfMetadata}) => (
                            <Overview tableData={tableData}
                                      qcInfo={qcInfo}
                                      nfMetadata={nfMetadata}
                                      reportData={this.props.reportData}
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
                                <SyncChartsContainer
                                    sample={this.props.sample}
                                    charts={charts}
                                    zoomInitialGene={this.props.zoomInitialGene}
                                    reportData={this.props.reportData}/>
                            )
                        }
                    </ReportAppConsumer>}
            </div>
        )
    }
}

/*
The first component of the sample specific report. Specified the first panel
with an overview of sample information, data loss, quality control and several
metrics.
 */
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

                if (el.rowId === sample && !el.hideOverview){

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
            gridItems: {
                minWidth: "300px",
            }
        };

        const headerMap = {
            "qc": "Quality Control",
            "assembly": "Assembly",
            "abricate": "AMR",
            "plasmids": "Plasmids"
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
                            <Grid container spacing={40}>
                                <Grid style={style.gridItems} item xs={4}>
                                    <QualityCard qcInfo={this.props.qcInfo} sample={this.props.sample} />
                                </Grid>
                                <Grid style={style.gridItems} item xs={4}>
                                    <DataResources
                                        reportData={this.props.reportData}
                                        sample={this.props.sample}/>
                                </Grid>
                                <Grid style={style.gridItems} item xs={4}>
                                    <DataLossOverview sample={this.props.sample}
                                                      nfMetadata={this.props.nfMetadata}
                                                      reportData={this.props.reportData} />
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
                                                            <Grid style={{minWidth: "260px"}} xs={2} item key={`${el.header}${el.process}`}>
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


class DataResources extends React.Component{

    state = {
        resource: "time"
    };

    handleChange = (e) => {
        this.setState({resource: e.label})
    };

    getResourceData = (reportArray, sample) => {

        const resources = {
            time: [],
            memory: [],
            rchar: [],
            wchar: [],
        };

        for (const el of reportArray){
            if (!el.hasOwnProperty("sampleName")){
                continue
            }
            const resourceList = el.trace[1].split(" ");

            if (el.sampleName === sample){
                resources.time.push({
                    name: el.processName,
                    y: parseInt(el.trace[2].trim())
                });
                resources.memory.push({
                    name: el.processName,
                    y: parseInt(resourceList[5])
                });
                resources.rchar.push({
                    name: el.processName,
                    y: parseInt(resourceList[8])
                });
                resources.wchar.push({
                    name: el.processName,
                    y: parseInt(resourceList[9])
                });
            }
        }

        return resources
    };

    render(){

        const style = {
            header: {
                fontSize: "16px",
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: "10px",
                lineHeight: "35px"
            },
            headerContainer: {
                display: "flex",
                justifyContent: "center"
            },
            headerSelect: {
                flexBasis: 120,
                marginLeft: "10px"
            }
        };

        const resources = this.getResourceData(this.props.reportData, this.props.sample)
        const options = Object.keys(resources).map((v) => {return {
            value: v,
            label: v
        }});

        return(
            <div>
                <LoadingComponent>
                    <div style={style.headerContainer}>
                        <Typography style={style.header}>Resource usage</Typography>
                        <div style={style.headerSelect}>
                            <Select
                                value={{value: this.state.resource, label: this.state.resource}}
                                onChange={this.handleChange}
                                options={options}/>
                        </div>
                    </div>
                    <ResourcesPieChart name={this.state.resource} data={resources[this.state.resource]}/>
                </LoadingComponent>
            </div>
        )
    }
}

/*
Component that shows the quality control for the sample. If the QC status is
warning or fail, it also provides buttons to display the individual warnings and
fails
 */
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

        const sampleQcInfo = this._getSampleQcInfo(this.props.sample, this.props.qcInfo);
        const status = (sampleQcInfo.warnings.length === 0 && sampleQcInfo.fail.length === 0) ?
            "pass" :
            sampleQcInfo.fail.length > 0 ?
                "fail" :
                "warning";

        const style = {
            root: {
                height: "75%",
                padding: "15px",
                backgroundColor: status === "pass" ? themes[theme].palette.success.main : status === "warning" ? themes[theme].palette.warning.main : themes[theme].palette.error.main
            },
            statusLine: {
                display: "flex",
                marginBottom: "15px"
            },
            statusText: {
                flexGrow: "1",
                fontSize: "18px",
                fontWeight: "bold"
            },
            statusValue: {
                fontSize: "18px",
                fontWeight: "bold",
                textTransform: "capitalize"
            },
            text: {
                fontSize: "18px",
                textAlign: "left",
                width: "100%",
                lineHeight: "33px"
            }
        };

        const messages = {
            "pass": <Typography>Sample has successfully passed all quality control checks!</Typography>,
            "warning": (
                <div style={style.statusLine}>
                    <Typography style={style.text}>Warnings: </Typography>
                    <OverviewQcPopover buttonContained content={sampleQcInfo.warnings}/>
                </div>
            ),
            "fail": (
                <div>
                    <div style={style.statusLine}>
                        <Typography style={style.text}>Warnings: </Typography>
                        <OverviewQcPopover buttonContained content={sampleQcInfo.warnings}/>
                    </div>
                    <div style={style.statusLine}>
                        <Typography style={style.text}>Fail: </Typography>
                        <OverviewQcPopover buttonContained content={sampleQcInfo.fail}/>
                    </div>
                </div>)
        };

        return(
            <Paper style={style.root}>
                <div style={style.statusLine}>
                    <Typography style={style.statusText}>Quality control status:</Typography>
                    <Typography style={style.statusValue}>{status}</Typography>
                </div>
                {
                    messages[status]
                }
            </Paper>
        )
    }
}

/*
These is the individual component that shows the individual table values in
the overview component.
 */
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
                        proportion >= 0 &&
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
                    format: "<Typography style='text-align:center;font-size:12px'>{y}%</Typography>",
                    y: 12,
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


class DataLossOverview extends React.Component{

    _findForkParent = (pipelineId, lane) => {

        for (const nf of this.props.nfMetadata){
            if (nf.runName === pipelineId){
                const forkTree = nf.forks;

                for (const l of Object.keys(forkTree)){
                    if (forkTree[l].includes(parseInt(lane))){
                        return l
                    }
                }
            }
        }

    };

    getChartData = (reportData, sample) => {

        let tempData = [];
        let laneList = [];
        let maxBp = 0;

        for (const el of reportData){

            if ( ((el || {}).reportJson || {}).plotData ){
                for (const plot of el.reportJson.plotData){

                    if (plot.sample !== sample){
                        continue
                    }

                    if (plot.data.hasOwnProperty("sparkline")){

                        let process;
                        let tempLane;
                        let lane;

                        tempLane = el.processName.split("_");
                        if (!isNaN(tempLane[tempLane.length - 2])){
                            lane = tempLane[tempLane.length - 2];
                            process = tempLane.slice(0, tempLane.length - 2).join(" ")
                        } else {
                            lane = 1;
                            process = tempLane.slice(0, tempLane.length - 1).join(" ")
                        }

                        tempData.push({
                            value: plot.data.sparkline,
                            processId: tempLane[tempLane.length - 1],
                            process: process,
                            lane: lane,
                            pipelineId: el.pipelineId
                        });

                        if (!laneList.includes(lane)){
                            laneList.push(lane)
                        }

                        if (maxBp < plot.data.sparkline){
                            maxBp = plot.data.sparkline
                        }
                    }
                }
            }
        }

        // Get data, depending on the presence of forks
        if (laneList.length === 1){
            const rawData = Array.from(tempData.sort((a, b) => {return b.value - a.value}));
            const data = rawData.map((v) => {return parseFloat(v.value) / maxBp});
            const categories = rawData.map((v) => {return v.process});

            return {
                type: "sparkline",
                data,
                categories,
                sample
            }
        } else {

            let laneData = {};
            let tempKeys = [];
            let chartData = [];

            for (const d of tempData){

                if (Object.keys(laneData).length === 0){
                    laneData[d.lane] = [d];
                    continue
                }

                if (!laneData.hasOwnProperty(d.lane)){
                    const parentLane = this._findForkParent(d.pipelineId, d.lane);
                    laneData[d.lane] = JSON.parse(JSON.stringify(laneData[parentLane]));
                    laneData[d.lane].push(d);
                    !tempKeys.includes(parentLane) && tempKeys.push(parentLane);
                } else {
                    laneData[d.lane].push(d)
                }
            }

            for (const k of tempKeys){
                delete laneData[k];
            }

            for (const d of Object.keys(laneData)){
                const data = laneData[d].map((v) => {return parseFloat(v.value) / maxBp})
                const categories = laneData[d].map((v) => {return v.process});
                chartData.push({
                    lane: d,
                    data,
                    categories,
                    sample
                })
            }

            return {
                type: "multisparkline",
                chartData
            }
        }

    };

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.reportData !== this.props.reportData;
    }
    render(){

        const style = {
            header: {
                fontSize: "16px",
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: "10px"
            },
            chartContainer: {
                padding: "10px"
            }
        };

        const chartData = this.getChartData(this.props.reportData, this.props.sample);

        return(
            <LoadingComponent>
                <Typography style={style.header}>Data loss trend</Typography>
                <div style={style.chartContainer}>
                    {
                        chartData.type === "sparkline" &&
                        <SparkLine data={chartData.data}
                                   sample={chartData.sample}
                                   categories={chartData.categories}/>
                    }
                    {
                        (chartData.chartData !== undefined && chartData.chartData.length > 0) &&
                        <MultiSparkline chartData={chartData.chartData}/>
                    }
                </div>
            </LoadingComponent>
        )
    }
}


class MultiSparkline extends React.Component{

    constructor(props){
        super(props);

        this.state = {
            lane: 0
        }
    }

    handleSelectionChange = (value) => {
        this.setState({lane: value.value})
    };

    getAreaChart = (data, categories, sample) => {

        const config = {
            chart: {
                type: "area",
                height: "135px"
            },
            title: {
                text: null
            },
            xAxis: {
                categories: categories,
                tickLength: 0,
                min: 0.5,
                max: 2.5,
                labels: {
                    enabled: false
                },
                title: {
                    text: null
                }
            },
            yAxis: {
                max: 1,
                labels: {
                    enabled: true
                },
                title: {
                    text: null
                }
            },
            tooltip: {
                useHTML: true,
                valueDecimals: 2
            },
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                area: {
                    animation: false
                }
            },
            series: [{
                name: sample,
                data: data
            }]
        };

        return config
    };

    render(){

        const data = this.props.chartData[this.state.lane];
        const config = this.getAreaChart(data.data, data.categories, data.sample);
        const options = this.props.chartData.map((v, i) => {return {label: v.lane, value: i}});

        const style = {
            selectContainer: {
                display: "flex",
                marginBottom: "10px"
            },
            selectText: {
                width: "20%",
                minWidth: "150px",
                margin: "auto",
                fontSize: "16px",
                paddingLeft: "30px",
                marginBottom: "5px"
            },
            select: {
                flexGrow: "1",
            }
        };

        return(
            <div style={{"height": "180px", "width":"100%"}}>
                <div style={style.selectContainer}>
                    <Typography style={style.selectText}>Select lane:</Typography>
                    <div style={style.select}>
                        <Select
                            value={{value: data.lane, label: data.lane}}
                            options={options}
                            onChange={(value) => {
                                this.handleSelectionChange(value)
                            }}/>
                    </div>
                </div>
                <ReactHighcharts config={config} ref={"datalossMultiSparkline"}></ReactHighcharts>
            </div>
        )
    }
}


class SparkLine extends React.Component{

    getAreaChart = (data, categories, sample) => {

        const config = {
            chart: {
                type: "area",
                height: "167px"
            },
            title: {
                text: null
            },
            xAxis: {
                categories: categories,
                tickLength: 0,
                min: 0.5,
                max: 2.5,
                labels: {
                    enabled: false
                },
                title: {
                    text: null
                }
            },
            yAxis: {
                max: 1,
                labels: {
                    enabled: true
                },
                title: {
                    text: null
                }
            },
            tooltip: {
                useHTML: true,
                valueDecimals: 2
            },
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                area: {
                    animation: false
                }
            },
            series: [{
                name: sample,
                data: data
            }]
        };

        return config
    };

    render(){

        const config = this.getAreaChart(this.props.data, this.props.categories, this.props.sample);

        return(
            <div style={{"height": "180px", "width":"100%"}}>
                <ReactHighcharts config={config} ref={"datalossSparkline"}></ReactHighcharts>
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
            <div>
                {
                   currentPlotData !== undefined &&
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
                }
            </div>
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

        let contigId = 0;
        let prevRange = 0;

        for (const val of xbars){
            contigId += 1;

            if (contigId === contig){
                return [(xrange[0] + prevRange) / window, (xrange[1] + prevRange) / window]
            }

            prevRange = val[0];
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
                                    database: db,
                                    accession: v.accession,
                                    coverage: v.coverage,
                                    identity: v.identity,
                                    contig: v.contig,
                                    window
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

    _convertPlasmidPosition = (xBars, contig, window) => {

        let c = 0;
        for (const val of xBars){

            if (val[1] === contig){
                return [val[0] / window,  xBars[c + 1][0] / window]
            }
            c += 1
        }

        return [0, 0]
    };

    /**
     * Function that collects accessions and their respective id and
     * shared hashes
     * @param tableData : Object object that has the table for the selected
     * sample
     * @param listAccessions : Array an array os accession number hits for a
     * contig
     */
    _getPlasmidsResults = (tableData, listAccessions) => {

        let accessionsResults = {};

        // searches all accessions in table data to fetch the respective ids
        // and shared hashes
        for (const acc of listAccessions) {
            const id = tableData[0].patlas_mashdist[acc][0];
            const sharedHashes = tableData[0].patlas_mashdist[acc][1];
            accessionsResults[acc] = {
                id,
                sharedHashes
            }
        }

        return accessionsResults
    };

    complementPlasmidData = (reportData, sample, assemblyFile, xBars, window) => {

        let xrangeCategoriesPlasmids = [],
            xrangeDataPlasmids = [];

        for (const el of getSamplePlot(reportData, sample)) {

            for (const plot of el.reportJson.plotData){

                if (plot.data.hasOwnProperty("patlasMashDistXrange") &&
                    plot.assemblyFile === assemblyFile){

                    xrangeCategoriesPlasmids.push("plasmids");

                    const tempData = Object.keys(plot.data.patlasMashDistXrange).map((contig) => {

                        const correctRange = this._convertPlasmidPosition(
                            xBars, contig, window);

                        // get information from tableRow with the corresponding
                        // identity, shared sequences.
                        const accessionsResults = this._getPlasmidsResults(
                            el.reportJson.tableRow[0].data,
                            plot.data.patlasMashDistXrange[contig]
                        );

                        console.log(accessionsResults)

                        return {
                            x: correctRange[0],
                            x2: correctRange[1],
                            y: 0,
                            gene: contig,
                            accessionsResults
                        };
                    });

                    xrangeDataPlasmids.push({
                        name: "plasmids",
                        data: tempData,
                        pointWidth: 12,
                        pointRange: 0,
                    })
                }
            }
        }

        return {xrangeCategoriesPlasmids, xrangeDataPlasmids}

    };

    getSlidingData = (reportData, sample) => {

        let data = new Map();
        let processes = [];

        for (const el of getSamplePlot(reportData, sample)){

            for (const plot of el.reportJson.plotData){

                if (plot.data.hasOwnProperty("genomeSliding")){
                    let currentData = {
                        gcData: plot.data.genomeSliding.gcData,
                        covData: plot.data.genomeSliding.covData,
                        xLabels: plot.data.genomeSliding.gcData.map((v, i) => {
                            return i * plot.data.genomeSliding.window
                        }),
                        xBars: Array.from(plot.data.genomeSliding.xbars, v => [v[1], v[2]]),
                        window: plot.data.genomeSliding.window,
                    };

                    currentData.plotLines = currentData.xBars.map((v) => {
                        return {
                            value: v[0] / currentData.window,
                            width: 0.15,
                            color: "grey"
                        }
                    });

                    if (this.props.charts.includes("abricateXrange")){
                        const {xrangeData, xrangeCategories} = this.complementAbricateData(
                            reportData, sample,
                            plot.data.genomeSliding.assemblyFile,
                            currentData.xBars, currentData.window
                        );

                        currentData.xrangeData = xrangeData;
                        currentData.xrangeCategories = xrangeCategories;
                    }

                    if (this.props.charts.includes("patlasMashDistXrange")){
                        const {xrangeCategoriesPlasmids, xrangeDataPlasmids} = this.complementPlasmidData(
                            reportData, sample,
                            plot.data.genomeSliding.assemblyFile,
                            currentData.xBars,
                            currentData.window
                        );

                        currentData.xrangeDataPlasmids = xrangeDataPlasmids;
                        currentData.xrangeCategoriesPlasmids = xrangeCategoriesPlasmids;
                    }

                    processes.push(el.processName);
                    data.set(el.processName, currentData);
                }
            }

        }

        console.log(data)

        return {
            data,
            processes
        }
    };

    render(){

        const currentPlotData = this.state.plotData.get(this.state.selectedProcess);

        return(
            <div>
                {
                    currentPlotData !== undefined &&
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
                                        <SyncCharts
                                            zoomInitialGene={this.props.zoomInitialGene}
                                            plotData={currentPlotData}/>
                                    </LoadingComponent>
                                </div>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                }
            </div>
        )
    }
}


class SyncCharts extends React.Component{

    constructor(props){
        super(props);

        this._geneClick = this._geneClick.bind(this);
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
            marginLeft: 100,
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

    _plasmidClick = (e) => {
        console.log("click plasmids: ", e.point)
        const data = {
            gene: e.point.gene,
            geneLength: parseInt((e.point.x2 - e.point.x) * 2000),
            genePosition: `${e.point.x * 2000} - ${e.point.x2 * 2000}`,
            accessionsResults: e.point.accessionsResults
        }

        console.log(data)
        // this.plasmidPopover.handleClick(e.target, data)
    };

    getxRangeLayout = (data, categories, xLabels, plotLines, title,
                       clickFunction) => {

        const seriesHeight = 10;
        const chartHeight = 150 + (seriesHeight * categories.length);

        let config = new Chart({
            title: null,
            axisLabels: {x: null, y: null},
            series: data
        });

        config.extend("chart", {
            marginLeft: 100,
            spacingTop: 30,
            spacingBottom: 10,
            zoomType: "x",
            panning: true,
            panKey: "ctrl",
            height: chartHeight,
            type: "xrange",
        });
        config.extend("title", {
            text: title,
        });
        config.extend("plotOptions", {
            series: {
                cursor: "pointer",
                borderColor: "#fff",
                point: {
                    events: {
                        click: (e) => {
                            clickFunction(e)
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
                return `<span>Name: <b>${this.gene}</b> (Click for details)</span>`;
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
        chartObj.showResetZoom();

        // Get index of series for the database
        const seriesIdx = chartObj.series.findIndex(
            (x) => x.name === value.database
        );
        const pointIdx = chartObj.series[seriesIdx].data.findIndex(
            (x) => x.x === value.pos
        );

        const point = chartObj.series[seriesIdx].data[pointIdx];

        const pointData = {
            point: {
                gene: point.options.gene,
                x: point.options.x,
                x2: point.options.x2,
                yCategory: point.options.database,
                accession: point.options.accession,
                coverage: point.options.coverage,
                identity: point.options.identity,
            },
            target: point.graphicOriginal.element
        };

        setTimeout(() => {point.firePointEvent("click", pointData);}, 500);

    };

    componentDidMount(){
        this.chartContainer.addEventListener("mousemove", this._syncCrosshair);

        ReactHighcharts.Highcharts.Point.prototype.highlight = function (event) {
            this.onMouseOver(); // Show the hover marker
            this.series.chart.tooltip.refresh(this); // Show the tooltip
            this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
        };

        ReactHighcharts.Highcharts.Pointer.prototype.reset = function () {
            return undefined;
        };

        if (this.props.zoomInitialGene){
            const domNode = ReactDOM.findDOMNode(this.amrChart);
            domNode.scrollIntoView()
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.plotData !== this.props.plotData;
    }

    render(){

        const gcConfig = this.getChartLayout(this.props.plotData.gcData, "GC% content", this.props.plotData.xLabels, this.props.plotData.plotLines, this.props.plotData.xBars, this.props.plotData.window);
        const covConfig = this.getChartLayout(this.props.plotData.covData, "Coverage depth", this.props.plotData.xLabels, this.props.plotData.plotLines, this.props.plotData.xBars, this.props.plotData.window);

        let xRangeConfig;
        if (this.props.plotData.hasOwnProperty("xrangeData")){
            xRangeConfig = this.getxRangeLayout(
                this.props.plotData.xrangeData,
                this.props.plotData.xrangeCategories,
                this.props.plotData.xLabels,
                this.props.plotData.plotLines,
                "Antimicrobial resistance and virulence annotations",
                this._geneClick,
            )
        }

        let xRangeConfigPlasmids;
        if (this.props.plotData.hasOwnProperty("xrangeDataPlasmids")) {
            xRangeConfigPlasmids = this.getxRangeLayout(
                this.props.plotData.xrangeDataPlasmids,
                this.props.plotData.xrangeCategoriesPlasmids,
                this.props.plotData.xLabels,
                this.props.plotData.plotLines,
                "Plasmid hits",
                this._plasmidClick,
            );
        }

        return(
            <div ref={elem => this.chartContainer = elem} style={{"width":"100%"}}>
                <ReactHighcharts config={gcConfig.layout} ref={"slidindGc"}></ReactHighcharts>
                <ReactHighcharts config={covConfig.layout} ref={"slidingCov"}></ReactHighcharts>
                {
                    xRangeConfig &&
                        <div ref={ref => (this.amrChart = ref)}>
                            <GenePopup onRef={ref => (this.genePopover = ref)}/>
                            <ReactHighcharts config={xRangeConfig.layout} ref={"slidingAbr"}></ReactHighcharts>
                            <AbricateSelect
                                highlightAbrSelection={this.highlightAbrSelection}
                                zoomAbrSelection={this.zoomAbrSelection}
                                zoomInitialGene={this.props.zoomInitialGene}
                                data={this.props.plotData.xrangeData}/>
                        </div>
                }
                {
                    xRangeConfigPlasmids &&
                    <div>
                        {/*<GenePopup onRef={ref => (this.genePopover = ref)}/>*/}
                        <ReactHighcharts config={xRangeConfigPlasmids.layout} ref={"slidingPlasmids"}></ReactHighcharts>
                        {/*<AbricateSelect*/}
                            {/*highlightAbrSelection={this.highlightAbrSelection}*/}
                            {/*zoomAbrSelection={this.zoomAbrSelection}*/}
                            {/*zoomInitialGene={this.props.zoomInitialGene}*/}
                            {/*data={this.props.plotData.xrangeData}/>*/}
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

    constructor(props){
        super(props);

        this.state = {
            selected: null
        };

        this.initialGeneSelection = null;
    }

    prepareOptions = (data) => {

        let options = [];
        let currentOpts;

        for (const el of data) {
            currentOpts = {
                label: el.name,
                options: []
            };
            for (const d of el.data) {
                const opt = {
                    value: `${d.gene}_${d.x}`,
                    label: d.gene,
                    pos: d.x,
                    database: el.name
                };
                currentOpts.options.push(opt);
                if (this.props.zoomInitialGene){
                    if (d.gene === this.props.zoomInitialGene.gene && el.name === this.props.zoomInitialGene.database){
                        this.initialGeneSelection = opt
                    }
                }
            }
            options.push(currentOpts);
        }

        return options;
    };

    componentDidMount(){

        if (this.initialGeneSelection){
            setTimeout(() => {this.props.zoomAbrSelection(this.initialGeneSelection)}, 500)
        }
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
                minWidth: "45px",
                height: "37px",
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
                    <Button onClick={() => {this.props.zoomAbrSelection(this.state.selected)}} variant={"contained"} color={"primary"} style={style.button} >
                        <CrosshairsGpsIcon color={"#fff"}/>
                    </Button>
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