import React from "react";

import { Link } from "react-router-dom"

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
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import indigo from "@material-ui/core/colors/indigo";
import {FCTable, TableButton} from "./tables";
import matchSorter from "match-sorter";

import BlockPicker from "react-color/lib/components/block/Block"

import MarkerIcon from "mdi-react/MarkerIcon";
import CloseIcon from "mdi-react/CloseIcon";
import FilterIcon from "mdi-react/FilterIcon";
import EyeIcon from "mdi-react/EyeIcon";
import EyeOffIcon from "mdi-react/EyeOffIcon";
import MagnifyIcon from "mdi-react/MagnifyIcon";

import {themes} from "./themes";
import {theme} from "../../../config"

import {sortByContent,sortColor} from "./utils";
import {SampleDialog} from "../ReportsSample";


export class ReportOverview extends React.Component{

    constructor(props){
        super(props);

        this.state = {
            showTable: false,
            activeTable: null,
            selected: {
                samples: {keys: []},
                projects: {keys: []},
                components: {keys: []},
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

        const headerStyle = {
            fontSize: "15px",
            fontWeight: "bold"
        };

        let rawSamples = [];
        let samples = [];
        let columns = [{
            Header: <FilterIcon/>,
            accessor: "visibility",
            sortMethod: sortByContent,
            minWidth: 40,
            width: 40,
            style: {
                margin: "auto",
                textAlign: "center"
            }
        }, {
            Header: <MarkerIcon/>,
            accessor: "highlight",
            sortMethod: sortColor,
            minWidth: 40,
            width: 40,
            style: {
                margin: "auto",
                textAlign: "center"
            }
        }, {
            Header: <Typography style={headerStyle}>Sample</Typography>,
            accessor: "rowId",
            filterable: true,
            filterMethod: (filter, rows) =>
                matchSorter(rows, filter.value, {keys: ["rowId.props.children"]}),
            filterAll: true,
            style: {
                margin: "auto",
                textAlign: "left"
            }
        }, {
            Header: <Typography style={headerStyle}>Warnings</Typography>,
            accessor: "warnings",
            sortMethod: sortByContent
        }, {
            Header: <Typography style={headerStyle}>Fails</Typography>,
            accessor: "fail",
            sortMethod: sortByContent
        }, {
            Header: <Typography style={headerStyle}>More options</Typography>,
            accessor: "moreOptions",
            style: {textAlign: "center"}
        }];
        let sampleQcInfo;

        for (const sample of sampleList){

            sampleQcInfo = this._getSampleQcInfo(sample, qcInfo);
            const sampleHighlight = this.props.highlights.samples.filter((v) => {
                return v.label === sample
            });

            rawSamples.push(sample);
            samples.push({
                "visibility": this.props.filters.samples.includes(sample) ? <EyeOffIcon/> : <EyeIcon/>,
                "highlight": sampleHighlight.length > 0 ? <ColorPaper idx={sampleHighlight[0].idx} color={sampleHighlight[0].color}/> : null,
                "_id": sample,
                "rowId": <Typography>{sample}</Typography>,
                "warnings": <OverviewQcPopover content={sampleQcInfo.warnings}/>,
                "fail": <OverviewQcPopover content={sampleQcInfo.fail}/>,
                "moreOptions": <SampleOptions charts={this.props.charts}
                                              reportData={this.props.reportData}
                                              sample={sample}/>
            })
        }

        return {
            data: samples,
            columns,
            rawSamples
        }
    };

    /*
    Returns the table data (columns and data) for the projects and components
     */
    getReportOverview = (reportData, qcInfo) => {

        // These variables store the projects and components table data
        let _projects = new Map();
        let _components = new Map();

        let rawProjects = [];
        let rawComponents = [];

        for (const el of reportData){

            let projectQcInfo;
            let componentQcInfo;

            // Update project Id
            if (el.hasOwnProperty("projectid")){
                if (!_projects.has(el.projectid)){

                    projectQcInfo = this._getQcInfo("project", el.projectid, qcInfo);
                    const projectHighlight = this.props.highlights.projects.filter((v) => {
                        return v.label === el.projectid
                    });

                    rawProjects.push(el.projectid);
                    _projects.set(el.projectid, {
                        "visibility": this.props.filters.projects.includes(el.projectid) ? <EyeOffIcon/> : <EyeIcon/>,
                        "highlight": projectHighlight.length > 0 ? <ColorPaper color={projectHighlight[0].color}/> : null,
                        "_id": el.projectid,
                        "project": <Typography>{el.projectid}</Typography>,
                        "warnings": <OverviewQcPopover content={projectQcInfo.warnings}/>,
                        "fail": <OverviewQcPopover content={projectQcInfo.fail}/>
                    })
                }
            }

            // Update components
            if (el.hasOwnProperty("processName")){
                if (!_components.has(el.processName)){

                    componentQcInfo = this._getQcInfo("process", el.processName, qcInfo);

                    rawComponents.push(el.processName);
                    _components.set(el.processName, {
                        "visibility": this.props.filters.components.includes(el.processName) ? <EyeOffIcon/> : <EyeIcon/>,
                        "_id": el.processName,
                        "component": <Typography>{el.processName}</Typography>,
                        "warnings": <OverviewQcPopover content={componentQcInfo.warnings}/>,
                        "fail": <OverviewQcPopover content={componentQcInfo.fail}/>
                    })
                }
            }
        }

        const headerStyle = {
            fontSize: "15px",
            fontWeight: "bold"
        };

        const projectColumns = [{
            Header: <FilterIcon/>,
            accessor: "visibility",
            sortMethod: sortByContent,
            minWidth: 40,
            width: 40,
            style: {
                margin: "auto",
                textAlign: "center"
            }
        }, {
            Header: <MarkerIcon/>,
            accessor: "highlight",
            sortMethod: sortColor,
            minWidth: 40,
            width: 40,
            style: {
                margin: "auto",
                textAlign: "center"
            }
        }, {
            Header: <Typography style={headerStyle}>Project</Typography>,
            accessor: "project",
            style: {
                margin: "auto",
                textAlign: "left"
            }
        }, {
            Header: <Typography style={headerStyle}>Warnings</Typography>,
            accessor: "warnings",
            sortMethod: sortByContent
        }, {
            Header: <Typography style={headerStyle}>Fails</Typography>,
            accessor: "fail",
            sortMethod: sortByContent
        }];
        const componentColumns = [{
            Header: <FilterIcon/>,
            accessor: "visibility",
            sortMethod: sortByContent,
            minWidth: 40,
            width: 40,
            style: {
                margin: "auto",
                textAlign: "center"
            }
        }, {
            Header: <Typography style={headerStyle}>Component</Typography>,
            accessor: "component",
            style: {
                margin: "auto",
                textAlign: "left"
            }
        }, {
            Header: <Typography style={headerStyle}>Warnings</Typography>,
            accessor: "warnings",
            sortMethod: sortByContent
        }, {
            Header: <Typography style={headerStyle}>Fails</Typography>,
            accessor: "fail",
            sortMethod: sortByContent
        }];

        return {
            projects: {
                data: [..._projects.values()],
                columns: projectColumns,
                rawProjects,
            },
            components: {
                data: [..._components.values()],
                columns: componentColumns,
                rawComponents,
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
    Clears all selected rows in a table
     */
    clearIndividualSelection = (tableKey) => {

        let newSelection = {};

        for (const key of Object.keys(this.state.selected)){
            if (key === tableKey){
                newSelection[key] = {keys: []};
            } else {
                newSelection[key] = this.state.selected[key]
            }
        }

        this.setState({selected: newSelection});

    };

    _updateSelectionArray = (arrayMap) => {

        let activeArray;
        let activeSelection;
        let filterArray;
        let newSelection = {};

        for (const key of Object.keys(arrayMap)){
            filterArray = [];
            activeArray = arrayMap[key].concat(this.props.filters[key]);
            activeSelection = this.state.selected[key];

            for (const el of activeArray){
                if (activeSelection.keys.length > 0 && !activeSelection.keys.includes(el)){
                    !filterArray.includes(el) && filterArray.push(el)
                }
            }

            newSelection[key] = filterArray;
        }

        return newSelection;

    };

    /*
    Updates the report filters with the provided selection
     */
    filterSelection = (samples, projects, components) => {

        const arrayMap = {
            "samples": samples,
            "projects": projects,
            "components": components,
        };

        this.props.updateFilters(this._updateSelectionArray(arrayMap));
    };

    /*
    Updates the report highlights with the provided selection
     */
    highlightSelection = (color) => {

        let newHighlights = {
            "samples": [],
            "projects": []
        };

        for (const key of Object.keys(this.props.highlights)){

            const keySelection = this.state.selected[key].keys;
            let addedElements = [];


            for (const el of keySelection){
                newHighlights[key].push({
                    label: el,
                    color: color,
                    idx: this.props.highlights[key].length + 1
                });
                addedElements.push(el)
            }


            for (const el of this.props.highlights[key]) {
                if (!addedElements.includes(el.label)) {
                    newHighlights[key].push(el)
                }
            }
        }

        console.log(newHighlights)

        this.props.updateHighlights(newHighlights)
    };

    clearIndividualFilter = (tableKey) => {

        let newFilters = {};

        for (const key of Object.keys(this.props.filters)){
            if (key === tableKey){
                newFilters[key] = [];
            } else {
                newFilters[key] = this.props.filters[key]
            }
        }

        this.props.updateFilters(newFilters);

    };

    clearIndividualHighlight = (tableKey) => {

        let newHighlight = {};

        for (const key of Object.keys(this.props.highlights)){
            if (key === tableKey){
                newHighlight[key] = [];
            } else {
                newHighlight[key] = this.props.highlights[key]
            }
        }

        this.props.updateHighlights(newHighlight);

    };

    /*
    Updates the table data in the state, which is used to render the overview table
     */
    updateData = (data, table) => {
        this.setState({
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
        const samples = this.getSamplesOverview(uniqueSamples.concat(this.props.filters.samples), this.props.qcInfo);
        const {projects, components} = this.getReportOverview(this.props.reportData, this.props.qcInfo);

        let tableData;
        if (this.state.activeTable){
            tableData = this.state.activeTable === "samples" ?
                samples : this.state.activeTable === "projects" ?
                    projects : components
        }

        return(
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Report overview</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Grid style={{width: "100%"}} container justify={"center"} spacing={40}>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(samples, "samples")}}
                                          header={"Samples"}
                                          active={this.state.activeTable === "samples" && this.state.showTable}
                                          clearIndividualFilter={this.clearIndividualFilter}
                                          clearIndividualHighlight={this.clearIndividualHighlight}
                                          value={samples.data.length}
                                          highlights={this.props.highlights.samples.length}
                                          filtered={this.props.filters.samples.length}/>
                            <Collapse in={this.state.showTable}>
                                <SelectedFootnote filtered={this.props.filters.samples.length}
                                                  tableKey={"samples"}
                                                  clearIndividualSelection={this.clearIndividualSelection}
                                                  selected={this.state.selected.samples.keys.length}/>
                            </Collapse>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(projects, "projects")}}
                                          header={"Projects"}
                                          value={projects.data.length}
                                          active={this.state.activeTable === "projects" && this.state.showTable}
                                          clearIndividualFilter={this.clearIndividualFilter}
                                          clearIndividualHighlight={this.clearIndividualHighlight}
                                          highlights={this.props.highlights.projects.length}
                                          filtered={this.props.filters.projects.length}/>
                            <Collapse in={this.state.showTable}>
                                <SelectedFootnote filtered={this.props.filters.projects.length}
                                                  tableKey={"projects"}
                                                  clearIndividualSelection={this.clearIndividualSelection}
                                                  selected={this.state.selected.projects.keys.length}/>
                            </Collapse>
                        </Grid>
                        <Grid item xs={3} style={{minWidth: 200}}>
                            <OverviewCard action={() => {this.updateData(components, "components")}}
                                          header={"Components"}
                                          value={components.data.length}
                                          active={this.state.activeTable === "components" && this.state.showTable}
                                          clearIndividualFilter={this.clearIndividualFilter}
                                          filtered={this.props.filters.components.length}/>
                            <Collapse in={this.state.showTable}>
                                <SelectedFootnote filtered={this.props.filters.components.length}
                                                  tableKey={"components"}
                                                  clearIndividualSelection={this.clearIndividualSelection}
                                                  selected={this.state.selected.components.keys.length}/>
                            </Collapse>
                        </Grid>
                    </Grid>
                </ExpansionPanelDetails>
                <div>
                    <Divider/>
                    <Collapse in={this.state.showTable}>
                        <div>
                            {
                                this.state.activeTable &&
                                <OverviewTable closeTable={this.closeTable}
                                               data={tableData}
                                               highlightSelection={(color) => {this.highlightSelection(color)}}
                                               filterSelection={() => {this.filterSelection(samples.rawSamples, projects.rawProjects, components.rawComponents)}}
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
                color: indigo[500],
                borderBottom: this.props.active ? "5px solid #5c6bc0" : "0px solid transparent"
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
            clearIcon: {
                marginLeft: "10px",
                fill: "#ff4b69",
                cursor: "pointer"
            },
            filterText: {
                fontWeight: "bold",
                color: "#636363"
            },
            clearButton: {
                height: "5px"
            }
        };

        return(
            <div>
                <Typography style={style.header}>{this.props.header}</Typography>
                    <div style={style.filterContainer}>
                        <div style={style.filterChild}>
                            <Tooltip title={"Filtered elements"} placement={"top"}>
                                <FilterIcon size={17} style={style.filterIcon}/>
                            </Tooltip>
                            <Typography style={style.filterText}>{this.props.filtered}</Typography>
                            {
                                this.props.filtered > 0 &&
                                    <Tooltip title={"Clear filter"} placement={"bottom"}>
                                        <CloseIcon onClick={() => {this.props.clearIndividualFilter(this.props.header.toLowerCase())}} size={19} style={style.clearIcon}/>
                                    </Tooltip>
                            }
                        </div>
                        {
                            this.props.highlights !== null &&
                            <div style={style.filterChild}>
                                <Tooltip title={"Highlighted elements"} placement={"top"}>
                                    <MarkerIcon size={17} style={style.filterIcon}/>
                                </Tooltip>
                                <Typography style={style.filterText}>{this.props.highlights}</Typography>
                                {
                                    this.props.highlights > 0 &&
                                    <Tooltip title={"Clear highlights"} placement={"bottom"}>
                                        <CloseIcon onClick={() => {this.props.clearIndividualHighlight(this.props.header.toLowerCase())}} size={19} style={style.clearIcon}/>
                                    </Tooltip>
                                }
                            </div>
                        }

                    </div>
                <Button onClick={this.props.action} style={style.value}>{this.props.value}</Button>
            </div>
        )
    }
}


class SelectedFootnote extends React.Component{
    render(){
        const style = {
            container: {
                display: "flex"
            },
            text: {
                marginTop: "5px",
                color: "#636363"
            },
            clearIcon: {
                marginTop: "5px",
                marginLeft: "5px",
                fill: "#ff4b69",
                cursor: "pointer"
            }
        };

        return (
            <div style={style.container}>
                <Divider/>
                <Typography style={style.text}>Selected: <b>{this.props.selected}</b></Typography>
                {
                    this.props.selected > 0 &&
                    <Tooltip title={"Clear selection"}>
                        <CloseIcon onClick={() => {this.props.clearIndividualSelection(this.props.tableKey)}} style={style.clearIcon} size={20}/>
                    </Tooltip>
                }

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
                    <Button color={"primary"}
                            style={style.btn}
                            onClick={this.props.closeTable}>
                        <ExpandLessIcon />
                    </Button>
                </div>
                <div style={style.tableContainer}>
                    <FCTable data={this.props.data.data}
                             columns={this.props.data.columns}
                             initialSelection={this.props.selection}
                             setSelection={this.props.setSelection}>
                        <TableButton onClick={this.props.filterSelection} tooltip={"Filter and keep only selection"}>
                            <FilterIcon color={"#fff"}/>
                        </TableButton>
                        <HighlightSelectionPopup action={this.props.highlightSelection}/>
                    </FCTable>
                </div>
            </div>
        )
    }
}


export class OverviewQcPopover extends React.Component{

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
                <Button variant={this.props.buttonContained ? "contained" : "text"} style={style.btn} onClick={this.handleClick}>{this.props.content.length}</Button>
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


class SampleOptions extends React.Component {
    render(){

        const style = {
            button: {
                padding: 0,
                minWidth: "50px",
                minHeight: "35px"
            }
        };

        const button = (
            <Tooltip title={"Open sample specific report"} placement={"top"}>
                <Button style={style.button} variant={"outlined"} color={"primary"}>
                    <MagnifyIcon style={{fill: themes[theme].palette.primary.main}}/>
                </Button>
            </Tooltip>
        );

        return(
            <div>
                <SampleDialog
                    button={button}
                    sample={this.props.sample}/>
            </div>
        )
    }
}


class HighlightSelectionPopup extends React.Component{


    state = {
        anchorEl: null,
        color: "#FF6900",
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

    handleColorChange = (color) => {
        this.setState({color: color.hex})
    };

    render(){

        const style = {
            root: {
                padding: "10px"
            },
            button: {
                marginTop: "20px",
                textAlign: "center",
                marginBottom: "10px"
            }
        };

        const {anchorEl} = this.state;

        return(
            <span>
                <TableButton onClick={this.handleClick} tooltip={"Highlight current selection"}>
                    <MarkerIcon color={"#fff"}/>
                </TableButton>
                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={this.handleClose}
                    anchorOrigin={{
                        vertical: "center",
                        horizontal: "right",
                    }}
                    transformOrigin={{
                        vertical: "center",
                        horizontal: "left",
                    }}>
                    <div style={style.root}>
                        <BlockPicker
                            color={this.state.color}
                            colors={['#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF']}
                            onChangeComplete={this.handleColorChange}
                            triangle={"hide"}/>
                        <div style={style.button}>
                            <Button onClick={() => {this.props.action(this.state.color)}} color={"primary"} variant={"contained"} >Highlight</Button>
                        </div>
                    </div>
                </Popover>
            </span>
        )
    }
}


export class ColorPaper extends React.Component{
    render(){

        const style = {
            root: {
                backgroundColor: this.props.color,
                width: "28px",
                height: "28px"
            }
        };

        return(
            <Paper style={style.root}> </Paper>
        )
    }
}