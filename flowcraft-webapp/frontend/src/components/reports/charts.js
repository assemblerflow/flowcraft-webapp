import React from "react";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import SwipeableViews from "react-swipeable-views";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

const ReactHighcharts = require("react-highcharts");

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

    handleChangeIndex = index => {
        this.setState({tabValue: index});

    };

    render () {
        console.log(this.state)
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Quality control</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <Tabs value={this.state.tabValue}
                              onChange={this.handleChange}
                              indicatorColor={"primary"}
                              textColor={"primary"}
                              scrollable
                              scrollButtons={"auto"}>
                            <Tab label={"Base sequence quality"}/>
                            <Tab label={"Base GC content"}/>
                            <Tab label={"Sequence quality"}/>
                            <Tab label={"Sequence length"}/>
                            <Tab label={"Base sequence content"}/>
                        </Tabs>
                        <div style={{overflow: "auto", height: "95%"}}>
                            <SwipeableViews index={this.state.tabValue}
                                            onChangeIndex={this.handleChangeIndex}>
                               <FastqcBaseSequenceQuality plotData={this.state.chartData["base_sequence_quality"]}/>
                                <div>Base GC content</div>
                                <div>Sequence quality</div>
                                <div>BSequence length</div>
                                <div>Base sequence content</div>
                            </SwipeableViews>
                        </div>
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

        let config = {
            chart: {
                type: "line",
                zoomType: "x",
            },
            legend: {
                enabled: false
            },
            xAxis: {
                title: {
                    enabled: true,
                    text: "Tags"
                },
                margin: 30,
                style: {
                    fontSize: 20,
                    fontWeight: "bold",
                }
            },
            yAxis: {
                title: {
                    text: "FastQC plot"
                },
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
            },
            title: {
                text: "Distribution of "
            },
            series: this.state.plotData
        };

        return (
            <div>
                <ReactHighcharts style={{height: "100%", width: "100%"}} config={config} ref="chart"></ReactHighcharts>
            </div>
        )
    }
 }