import React from "react";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import Typography from "@material-ui/core/Typography";
import Collapse from '@material-ui/core/Collapse';
import Divider from "@material-ui/core/Divider"
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

import indigo from "@material-ui/core/colors/indigo";
import {FCTable} from "./tables";
import matchSorter from "match-sorter";


export class ReportOverview extends React.Component{

    constructor(props){
        super(props);

        this.state = {
            showTable: false,
            tableData: null,
            activeTable: null,
            filtered: {
                samples: [],
                projects: [],
                components: [],
            }
        }
    }

    _getQcInfo = (key, value, qcInfo) => {

        let projectQcInfo = {
            "warnings": [],
            "fail": []
        };

        for (const [pname, samples] of qcInfo.entries()){
            for (const [sample, vals] of samples.entries()){
                if (vals.hasOwnProperty("warnings")){
                    for (const el of vals.warnings){
                        if (el[key] === value){
                            projectQcInfo.warnings.push(el)
                        }
                    }
                }
                if (vals.hasOwnProperty("fail")){
                    for (const el of val.fail){
                        if (el[key] === value){
                            projectQcInfo.fail.push(el)
                        }
                    }
                }
            }
        }

        return projectQcInfo;

    };

    _getSampleQcInfo = (sample, qcInfo) => {

        let sampleQcInfo = {
            "warnings": [],
            "fail": []
        };

        for (const [pname, samples] of qcInfo.entries()){
            for (const [smpl, vals] of samples.entries()){
                if (sample === smpl){

                    if (vals.hasOwnProperty("warnings")){
                        sampleQcInfo.warnings = sampleQcInfo.warnings.concat(vals.warnings)
                    }
                    if (vals.hasOwnProperty("fail")){
                        sampleQcInfo.fail = sampleQcInfo.fail.concat(vals.fail)
                    }

                }
            }
        }

        return sampleQcInfo

    };

    getSamplesOverview = (sampleList, qcInfo) => {

        let samples = [];
        let columns = [{
            Header: <Typography>Sample</Typography>,
            accessor: "rowId",
            filterable: true,
            filterMethod: (filter, rows) =>
                matchSorter(rows, filter.value, {keys: ["rowId.props.children"]}),
            filterAll: true
        }, {
            Header: <Typography>Warnings</Typography>,
            accessor: "warnings"
        }, {
            Header: <Typography>Fails</Typography>,
            accessor: "fail"
        }];
        let sampleQcInfo;

        for (const sample of sampleList){

            sampleQcInfo = this._getSampleQcInfo(sample, qcInfo);

            samples.push({
                "_id": sample,
                "rowId": <Typography>{sample}</Typography>,
                "warnings": sampleQcInfo.warnings.length,
                "fail": sampleQcInfo.fail.length
            })
        }

        return {
            data: samples,
            columns
        }
    };

    getReportOverview = (reportData, qcInfo) => {

        // These variables store the projects and components table data
        let _projects = new Map();
        let _components = new Map();

        for (const el of reportData){

            let projectQcInfo;
            let componentQcInfo;

            // Update project Id
            if (el.hasOwnProperty("projectid")){
                if (!_projects.has(el.projectid)){

                    projectQcInfo = this._getQcInfo("project", el.projectid, qcInfo);

                    _projects.set(el.projectid, {
                        "_id": el.projectid,
                        "project": el.projectid,
                        "warnings": projectQcInfo.warnings.length,
                        "fail": projectQcInfo.fail.length
                    })
                }
            }

            // Update components
            if (el.hasOwnProperty("processName")){
                if (!_components.has(el.processName)){

                    componentQcInfo = this._getQcInfo("process", el.processName, qcInfo);

                    _components.set(el.processName, {
                        "_id": el.processName,
                        "component": el.processName,
                        "warnings": componentQcInfo.warnings.length,
                        "fail": componentQcInfo.fail.length
                    })
                }
            }
        }

        const projectColumns = [{
            Header: "Project",
            accessor: "project"
        }, {
            Header: "Warnings",
            accessor: "warnings"
        }, {
            Header: "Fails",
            accessor: "fail"
        }];
        const componentColumns = [{
            Header: "Component",
            accessor: "component"
        }, {
            Header: "Warnings",
            accessor: "warnings"
        }, {
            Header: "Fails",
            accessor: "fail"
        }];

        return {
            projects: {
                data: [..._projects.values()],
                columns: projectColumns
            },
            components: {
                data: [..._components.values()],
                columns: componentColumns
            }
        }

    };

    setSelection = (selection) => {

        let filtered = this.state.filtered;
        filtered[this.state.activeTable] = selection;

        this.setState({
            filtered
        });
    };

    updateData = (data, table) => {
        this.setState({
            tableData: data,
            activeTable: table
        });

        if (!this.state.showTable){
            this.setState({showTable: true})
        }
    };

    closeTable = () => {
        this.setState({
            showTable: false,
            tableData: null,
        })
    };

    render(){

        const uniqueSamples = [...new Set([...this.props.tableSamples, ...this.props.chartSamples])];
        const samples = this.getSamplesOverview(uniqueSamples, this.props.qcInfo);
        const {projects, components} = this.getReportOverview(this.props.reportData, this.props.qcInfo);

        return(
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Report overview</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Grid style={{width: "100%"}} container justify={"center"} spacing={40}>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(samples, "samples")}} header={"Samples"} value={samples.data.length}/>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(projects, "projects")}} header={"Projects"} value={projects.data.length}/>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(components, "components")}} header={"Components"} value={components.data.length}/>
                        </Grid>
                    </Grid>
                </ExpansionPanelDetails>
                <div>
                    <Divider/>
                    <Collapse in={this.state.showTable}>
                        {
                            this.state.tableData &&
                            <OverviewTable closeTable={this.closeTable}
                                           data={this.state.tableData}
                                           rawData={this.state.data}
                                           selection={this.state.filtered[this.state.activeTable]}
                                           setSelection={this.setSelection}/>
                        }
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
            btnContainer: {
                textAlign: "center",
            },
            btn: {
                width: "100%",
            },
            tableContainer: {
                paddingRight: "20px",
                paddingLeft: "20px",
                paddingBottom: "20px"
            }
        };

        return(
            <div>
                <div style={style.btnContainer}>
                    <Button color={"primary"} style={style.btn} onClick={this.props.closeTable}>
                        <ExpandLessIcon />
                    </Button>
                </div>
                <div style={style.tableContainer}>
                    <FCTable data={this.props.data.data}
                             columns={this.props.data.columns}
                             initialSelection={this.props.selection}
                             setSelection={this.props.setSelection}/>
                </div>
            </div>
        )
    }
}