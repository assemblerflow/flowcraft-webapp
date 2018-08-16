import React from "react";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import Collapse from '@material-ui/core/Collapse';
import CheckBox from "@material-ui/core/Checkbox";
import Divider from "@material-ui/core/Divider"
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import Grid from "@material-ui/core/Grid";

import styles from "../../styles/reports.css";

import indigo from "@material-ui/core/colors/indigo";
import {FCTable} from "./tables";



export class ReportOverview extends React.Component{

    constructor(props){
        super(props);

        this.state = {
            revealList: false,
            elements: []
        }
    }

    _getProjectQcInfo = (projectid, qcInfo) => {

        let projectQcInfo = [];

        for (const [pname, samples] of qcInfo.entries()){
            for (const [sample, vals] of samples.entries()){
                if (vals.hasOwnProperty("warnings")){
                    for (const el of vals.warnings){
                        if (el.project === projectid){
                            projectQcInfo.push(el)
                        }
                    }
                }
                if (vals.hasOwnProperty("fail")){
                    for (const el of val.fail){
                        if (el.project === projectid){
                            projectQcInfo.push(el)
                        }
                    }
                }
            }
        }

        return projectQcInfo;

    };

    getReportOverview = (reportData, qcInfo) => {

        let projects = [];
        let components = [];

        let x;

        for (const el of reportData){
            // Update project Id
            if (el.hasOwnProperty("projectid")){
                if (!projects.includes(el.projectid)){
                    projects.push(el.projectid);
                    x = this._getProjectQcInfo(el.projectid, qcInfo);
                    console.log(x)
                }
            }

            // Update components
            if (el.hasOwnProperty("processName")){
                !components.includes(el.processName) && components.push(el.processName);
            }
        }

        return {
            projects,
            components
        }

    };

    getSamplesOverview = (sampleList, qcInfo) => {
        let samples = [];

        console.log(qcInfo);

        for (const sample of sampleList){
            samples.push({
                "_id": sample,
                "rowId": <Typography>{sample}</Typography>
            })
        }

        return {
            samples
        }
    };

    updateElements = (elements) => {
        this.setState({elements});

        if (!this.state.revealList){
            this.setState({revealList: true})
        }
    };

    closeList = () => {
        this.setState({
            revealList: false,
            elements: [],
        })
    };

    render(){

        const uniqueSamples = [...new Set([...this.props.tableSamples, ...this.props.chartSamples])];
        const {samples} = this.getSamplesOverview(uniqueSamples, this.props.qcInfo);
        const {projects, components} = this.getReportOverview(this.props.reportData, this.props.qcInfo);

        return(
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Report overview</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Grid style={{width: "100%"}} container justify={"center"} spacing={40}>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateElements(uniqueSamples)}} header={"Samples"} value={uniqueSamples.length}/>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateElements(projects)}} header={"Projects"} value={projects.length}/>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateElements(components)}} header={"Components"} value={components.length}/>
                        </Grid>
                    </Grid>
                </ExpansionPanelDetails>
                <div>
                    <Divider/>
                    <Collapse in={this.state.revealList}>
                        <OverviewTable closeList={this.closeList}
                                       data={samples}
                                       rawData={samples.data} />
                    </Collapse>
                </div>
            </ExpansionPanel>
        )
    }
}

class OverviewCard extends React.Component{
    render(){

        const style = {
            header: {
                fontSize: "20px",
                textAlign: "left",
                fontWeight: "bold",
                color: "#5b5b5b",
            },
            value: {
                fontSize: "50px",
                textAlign: "center",
                width: "100%",
                color: indigo[500]
            },
            button: {
                width: "100%",
                color: "#ff4b69"
            }
        };

        return(
            <div>
                <Typography style={style.header}>{this.props.header}</Typography>
                <Button onClick={this.props.action} style={style.value}>{this.props.value}</Button>
            </div>
        )
    }
}

class OverviewTable extends React.Component{
    render(){

        const style = {
            iconBtn: {
                textAlign: "right",
                paddingRight: "10px"
            },
            tableContainer: {
                padding: "20px"
            }
        };

        const columns = [{
            Header: "Sample",
            accessor: "rowId"
        }];

        return(
            <div>
                <div style={style.iconBtn}>
                    <IconButton  onClick={this.props.closeList}>
                        <ExpandLessIcon />
                    </IconButton>
                </div>
                <div style={style.tableContainer}>
                    <FCTable data={this.props.data}
                             columns={columns}/>
                </div>
            </div>
        )
    }
}