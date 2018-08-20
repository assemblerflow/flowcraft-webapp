import React from "react";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import Typography from "@material-ui/core/Typography";
import Collapse from "@material-ui/core/Collapse";
import Tooltip from "@material-ui/core/Tooltip";
import Popover from "@material-ui/core/Popover";
import Divider from "@material-ui/core/Divider"
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

import indigo from "@material-ui/core/colors/indigo";
import {FCTable} from "./tables";
import matchSorter from "match-sorter";

import MarkerIcon from "mdi-react/MarkerIcon";
import FilterIcon from "mdi-react/FilterIcon";

import {sortByContent} from "./utils";


export class ReportOverview extends React.Component{

    constructor(props){
        super(props);

        this.state = {
            showTable: false,
            tableData: null,
            activeTable: null,
            selected: {
                samples: [],
                projects: [],
                components: [],
            }
        }
    }

    /*
    Retrieves an object with two key:value pairs for warnings and fails for all
    objects in qcInfo Map whose key matches a given value. For instance,
    the qcInfo objects with 'projectid' === '1'.
     */
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
                    for (const el of vals.fail){
                        if (el[key] === value){
                            projectQcInfo.fail.push(el)
                        }
                    }
                }
            }
        }

        return projectQcInfo;

    };

    /*
    Retrieves an object with two key:value pairs with the warnings and fails for
    a given sample.
     */
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

    /*
    Returns the table data (columns and data) for the sample overview.
     */
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
            accessor: "warnings",
            sortMethod: sortByContent
        }, {
            Header: <Typography>Fails</Typography>,
            accessor: "fail",
            sortMethod: sortByContent
        }];
        let sampleQcInfo;

        for (const sample of sampleList){

            sampleQcInfo = this._getSampleQcInfo(sample, qcInfo);

            samples.push({
                "_id": sample,
                "rowId": <Typography>{sample}</Typography>,
                "warnings": <OverviewQcPopover content={sampleQcInfo.warnings}/>,
                "fail": <OverviewQcPopover content={sampleQcInfo.fail}/>
            })
        }

        return {
            data: samples,
            columns
        }
    };

    /*
    Returns the table data (columns and data) for the projects and components
     */
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
                        "warnings": <OverviewQcPopover content={projectQcInfo.warnings}/>,
                        "fail": <OverviewQcPopover content={projectQcInfo.fail}/>
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
                        "warnings": <OverviewQcPopover content={componentQcInfo.warnings}/>,
                        "fail": <OverviewQcPopover content={componentQcInfo.fail}/>
                    })
                }
            }
        }

        const projectColumns = [{
            Header: "Project",
            accessor: "project"
        }, {
            Header: "Warnings",
            accessor: "warnings",
            sortMethod: sortByContent
        }, {
            Header: "Fails",
            accessor: "fail",
            sortMethod: sortByContent
        }];
        const componentColumns = [{
            Header: "Component",
            accessor: "component"
        }, {
            Header: "Warnings",
            accessor: "warnings",
            sortMethod: sortByContent
        }, {
            Header: "Fails",
            accessor: "fail",
            sortMethod: sortByContent
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

    /*
    Update the state of the filtered selection for the currently active table
     */
    setSelection = (selection) => {

        let selected = this.state.selected;
        selected[this.state.activeTable] = selection;

        this.setState({
            selected
        });
    };

    /*
    Updates the table data in the state, which is used to render the overview table
     */
    updateData = (data, table) => {
        this.setState({
            tableData: data,
            activeTable: table
        });

        if (!this.state.showTable){
            this.setState({showTable: true})
        }
    };

    /*
    Triggers the animation for closing the overview table
     */
    closeTable = () => {
        this.setState({
            showTable: false,
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
                            <OverviewCard action={() => {this.updateData(samples, "samples")}} header={"Samples"} value={samples.data.length} filtered={this.props.filters.samples.length}/>
                            <Collapse in={this.state.showTable}>
                                <SelectedFootnote filtered={this.props.filters.samples.length} selected={this.state.selected.samples.length}/>
                            </Collapse>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(projects, "projects")}} header={"Projects"} value={projects.data.length} filtered={this.props.filters.projects.length}/>
                            <Collapse in={this.state.showTable}>
                                <SelectedFootnote filtered={this.props.filters.projects.length} selected={this.state.selected.projects.length}/>
                            </Collapse>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(components, "components")}} header={"Components"} value={components.data.length} filtered={this.props.filters.components.length}/>
                            <Collapse in={this.state.showTable}>
                                <SelectedFootnote filtered={this.props.filters.components.length} selected={this.state.selected.components.length}/>
                            </Collapse>
                        </Grid>
                    </Grid>
                </ExpansionPanelDetails>
                <div>
                    <Divider/>
                    <Collapse in={this.state.showTable}>
                        <div>
                            {
                                this.state.tableData &&
                                <OverviewTable closeTable={this.closeTable}
                                               data={this.state.tableData}
                                               rawData={this.state.data}
                                               selection={this.state.selected[this.state.activeTable]}
                                               setSelection={this.setSelection}/>
                            }
                        </div>
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
                color: "#636363",
                marginBottom: "5px"
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
            },
            filterContainer: {
                display: "flex"
            },
            filterChild: {
                display: "flex",
                width: "100%"
            },
            filterIcon: {
                marginRight: "5px",
                fill: "#636363"
            },
            filterText: {
                fontWeight: "bold",
                color: "#636363"
            }
        };

        return(
            <div>
                <Typography style={style.header}>{this.props.header}</Typography>
                    <div style={style.filterContainer}>
                        <div style={style.filterChild}>
                            <Tooltip title={"Filtered elements"}>
                                <FilterIcon size={17} style={style.filterIcon}/>
                            </Tooltip>
                            <Typography style={style.filterText}>{this.props.filtered}</Typography>
                        </div>
                        <div style={style.filterChild}>
                            <Tooltip title={"Highlighted elements"}>
                                <MarkerIcon size={17} style={style.filterIcon}/>
                            </Tooltip>
                            <Typography style={style.filterText}>{this.props.filtered}</Typography>
                        </div>
                    </div>
                <Button onClick={this.props.action} style={style.value}>{this.props.value}</Button>
            </div>
        )
    }
}


class SelectedFootnote extends React.Component{
    render(){
        const style = {
            text: {
                marginTop: "5px"
            }
        };

        return (
            <div>
                <Divider/>
                <Typography style={style.text}>Selected: <b>{this.props.selected}</b></Typography>
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
            toolbar:{
                textAlign: "right",
                paddingRight: "20px"
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
                <div style={style.toolbar}>
                    <Tooltip title={"Filter and keep only selection"} placement={"bottom"}>
                        <Button color={"primary"} variant={"contained"}><FilterIcon color={"#fff"}/></Button>
                    </Tooltip>
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


class OverviewQcPopover extends React.Component{

    state = {
        anchorEl: null
    };

    handleClick = event => {
        this.setState({
            anchorEl: event.currentTarget,
        });
    };

    handleClose = () => {
        this.setState({
            anchorEl: null,
        });
    };

    groubByComponent = (content) => {

        let contentMap = new Map();

        for (const el of content){
            if (!contentMap.has(el.process)){
                contentMap.set(el.process, [el])
            } else {
                contentMap.get(el.process).push(el)
            }
        }

        return contentMap

    };

    render(){
        const {anchorEl} = this.state;

        const style = {
            container: {
                padding: "15px"
            },
            btn: {
                width: "100%"
            },
            componentHeader: {
                fontWeight: "bold",
                marginBottom: "5px",
                marginTop: "15px"
            },
            warningMsg: {
                marginLeft: "10px"
            }
        };

        const groupedContent = this.groubByComponent(this.props.content);

        return(
            <div>
                <Button style={style.btn} onClick={this.handleClick}>{this.props.content.length}</Button>
                <Popover open={Boolean(anchorEl)}
                         anchorEl={anchorEl}
                         onClose={this.handleClose}
                         anchorOrigin={{
                             vertical: "center",
                             horizontal: "right"
                         }}
                         transformOrigin={{
                             vertical: "center",
                             horizontal: "left"
                         }}>
                    <div style={style.container}>
                        <Typography>Total: {this.props.content.length}</Typography>
                        <Divider/>
                        <div>
                            {
                                Array.from(groupedContent, ([key, elList]) => {
                                    return(
                                        <div key={key}>
                                            <Typography style={style.componentHeader}>Component: {key}</Typography>
                                            {
                                                elList.map((el, i) => {
                                                    return (
                                                        <Typography style={style.warningMsg} key={i}>{el.sample}: {el.message}</Typography>
                                                    )
                                                })
                                            }
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </Popover>
            </div>
        )
    }
}