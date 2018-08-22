import React from "react"

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

import {updateLabels, highLightScatter, highlightHist} from "./reports/sample_specific_utils";

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
        console.log("dialog")

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