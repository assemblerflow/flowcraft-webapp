// React imports
import React from "react";
import ReactTable from "react-table";

//Material UI imports
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import CircularProgress from "@material-ui/core/CircularProgress";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import SwipeableViews from "react-swipeable-views";
import ListItem from "@material-ui/core/ListItem";
import Tooltip from "@material-ui/core/Tooltip";
import Divider from "@material-ui/core/Divider";
import Popover from "@material-ui/core/Popover";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Modal from "@material-ui/core/Modal";
import Grid from "@material-ui/core/Grid";
import Icon from "@material-ui/core/Icon";
import List from "@material-ui/core/List";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

// Color imports
import orange from "@material-ui/core/colors/orange";
import green from "@material-ui/core/colors/green";
import blue from "@material-ui/core/colors/blue";
import red from "@material-ui/core/colors/red";
import grey from "@material-ui/core/colors/grey";

// Icon imports
import AlertOctagonIcon from "mdi-react/AlertOctagonIcon";
import SleepIcon from "mdi-react/SleepIcon";
import SkullIcon from "mdi-react/SkullIcon";
import CloseCircleIcon from "mdi-react/CloseCircleIcon"

// Highcharts imports
const ReactHighcharts = require("react-highcharts");


// Other imports
import axios from "axios";
import moment from "moment";
import momentTz from "moment-timezone";
import prismjs from "prismjs";
import PrismCode from "react-prism";
import matchSorter from "match-sorter";
import {Link} from "react-router-dom";

// CSS imports
const styles = require("../styles/inspect.css");

// TreeDag import

import TreeDag from "./treeDag";
import Header from "./Header";
import {Footer} from "./Footer";

/*
ENTRY POINT FOR inspect
Main component for the Inspect application
 */
export class Inspect extends React.Component {

    constructor(props) {
        super(props);

        // Fetch the URL parameter, if any
        const runId = this.props.match.params.runId;

        this.state = {
            runId: runId
        };

    }

    render() {

        // Depending on whether the runID url parameter was provided, mount
        // the inspect application or the default home page
        if (this.state.runId) {
            return(<InspectApp runID={this.state.runId}/>)
        } else {
            return(<InspectHome/>)
        }
    }
}

/*
MAIN APP CONTROLLERS
This is the component that fetches the status data from the REST API. If the
GET is successfull, the data is passed down to the InspectPannels component
that renders the actual app. Otherwise, it will shows an error component.

NOTE: The relevant information from the REST API is used to set the state
of this component. This state is what will be passed down to the children
components
 */
class InspectApp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            // This will remain true until the first GET is completed
            loading: true,
            // This will become true when the GET is not successful
            badRequest: false,
            // The runID that is used to fetch the information in the database
            runID: props.runID,
            // Data for the GeneralOverview component. Contains the name and
            // tag of the pipeline, and the number of processes
            generalData: {},
            // Data with the run status (complete, running, etc) and time
            // start (and stop, if the pipeline finished) of the pipeline
            runStatus: {},
            // Data for the DetailsOverview component. Contains information
            // about the work directory, nextflow command, config files, etc.
            detailsData: {},
            // Data about each process, including the samples that are
            // submited, failing, finished, etc, the barrier status of the
            // process and the cpu/ram resources
            processData: {},
            // The stats data for the main table
            tableData: {},
            // Detailed information for each tag in each process
            tagData: {},
            // Information necessary for building and updating the DAG overview
            treeDag: {}
        };
    }

    updateJson(full){
        axios.get(`api/status?run_id=${this.state.runID}`)
            .then(
                (response) => {
                    const dataStatus = response.data.status;

                    // Set this only once. It should remain static
                    if (full) {
                        this.setState({
                            treeDag: response.data.dag
                        })
                    }

                    this.setState({loading: false});
                    // Set general overview data
                    this.setState({
                        generalData: dataStatus.generalOverview,
                        runStatus: {
                            status: dataStatus.runStatus,
                            timeStart: dataStatus.timeStart,
                            timeStop: dataStatus.timeStop,
                            timeLocale: dataStatus.timeLocale
                        },
                    });
                    // Set details data
                    this.setState({detailsData: dataStatus.generalDetails});
                    // Set process submission data
                    this.setState({processData: dataStatus.processInfo});
                    // Set table data
                    this.setState({
                        tableData: {
                            "data": dataStatus.tableData,
                            "mappings": dataStatus.tableMappings
                        },
                        tagData: dataStatus.processTags
                    });
                },
                (error) => {
                    this.setState({badRequest: true});
                    console.log(error);
                }
            );
    }

    componentDidMount() {

        // Perform first GET
        this.updateJson(true);

        // Create websocket connection and listen to message events to update
        // the app.
        const statusSocket = new WebSocket(
            "ws://" + window.location.host + "/ws/inspect/" +
            this.props.runID + "/"
        );
        statusSocket.onmessage = (e) => {
            this.updateJson(false)
        };

    }

    render () {
        return (
            <div>
                <Header headerTitle={"Inspect"}/>
                {
                    this.state.badRequest ?
                        // BAD request component
                        <BadRequestPaper runID={this.state.runID}/> :
                        this.state.loading ?
                            // Normal main inspect app
                            <Loader/> :
                            <div>
                                {this.state.tableData.data ?
                                    <InspectPannels {...this.state}/> :
                                    <Loader/>
                                }
                                <Footer/>
                            </div>
                }
            </div>
        )
    }
}

/*
Simple home page of the inspect app, shown when there is no runID provided in
the URL.
 */
export class InspectHome extends React.Component {

    constructor(props) {
        super(props);
    }

    render () {
        return (
            <div>
                <Header headerTitle={"Inspect"}/>
                <HomeInput route={"inspect"}/>
            </div>
        )
    }
}

export class HomeInput extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            "runId": "",
            "route": props.route
        };
    }

    inputSubmit = (ev) => {
        if (ev.key === 'Enter') {
            // Do code here

            ev.preventDefault();
        }
    };

    handleChange = (e) => {
        this.setState({
            "runId": e.target.value
        });
    };

    render () {
        return (
            <div className={styles.homeContainer}>
                <Paper className={styles.home}>
                    <TextField
                        id="runiD"
                        label="Provide FlowCraft's run ID"
                        fullWidth
                        autoFocus
                        value={this.state.runId}
                        onChange={this.handleChange}
                        onKeyPress={this.inputSubmit}
                        margin="normal"/>
                    <div style={{height: "100%", margin: "auto", marginLeft: "10px"}}>
                        <Button styles={{height: "40px"}} variant={"raised"} color={"primary"}
                                component={props => <Link to={`/${this.state.route}/${this.state.runId}`} {...props}/>}
                                >
                            GO!
                        </Button>
                    </div>
                </Paper>
            </div>
        )
    }
}

/*
MAIN INSPECTION PANEL CONTROLLER
This component is responsible for rendering the entier inspect app as
expansion pannels.
 */
class InspectPannels extends React.Component {
    render () {
        return (
            <div>
                <ExpansionPanel defaultExpanded style={{margin: 0}}>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography variant={"headline"}>General Overview</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <GeneralOverview generalData={this.props.generalData}
                                         runStatus={this.props.runStatus}
                                         runId={this.props.runID}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel style={{marginTop: 0}}>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography variant={"headline"}>Details</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <DetailsOverview detailsData={this.props.detailsData}
                                         runId={this.props.runID}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel defaultExpanded style={{marginBottom: 0}}>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography variant={"headline"}>Process submission</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <ProcessSubmission processData={this.props.processData}
                                           tagData={this.props.tagData}/>
                    </ExpansionPanelDetails>
                    <Divider/>
                    <ExpansionPanelDetails>
                        <ResourcesDetails processData={this.props.processData}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography variant={"headline"}>Table overview</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <MainTable tableData={this.props.tableData}
                                   tagData={this.props.tagData}
                                   processData={this.props.processData}
                                   runStatus={this.props.runStatus.status.value}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                {
                    Object.keys(this.props.treeDag).length > 0 &&
                    <ExpansionPanel defaultExpanded>
                        <ExpansionPanelSummary classes={{content: styles.panelHeader}}
                                               expandIcon={<ExpandMoreIcon />}>
                            <Typography variant={"headline"}>DAG overview</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails style={{display: "block"}}>
                            <MainDag treeDag={this.props.treeDag} processData={this.props.processData}/>
                            <DagLegend/>

                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                }
            </div>
        )
    }
}

/*
GENERAL OVERVIEW COMPONENTS
 */

/*
General overview main component. Contains the basic information about the
pipeline name/tag/processes (HeaderOverview) and the status of the run
(StatusPaper)
 */
class GeneralOverview extends  React.Component {
    render () {
        return (
            <Grid container className={styles.headerGrid}
                  justify={"center"}
                  spacing={24}>
                <Grid item className={styles.headerData}>
                    <HeaderOverview generalData={this.props.generalData}
                                    runId={this.props.runId}/>
                </Grid>
                <Grid item className={styles.headerStatus}>
                    <StatusPaper runStatus={this.props.runStatus}/>
                </Grid>
            </Grid>
        )
    }
}

/*
Populates the GeneralOverview component with ListItems containing general
information about the pipeline
 */
class HeaderOverview extends React.Component {
    render () {
        return(
            <div>
                <Grid container>
                    {this.props.generalData.map((v) => {
                        return(
                            <Grid key={v.header} item xs={4} className={styles.headerItem}>
                                <List>
                                    <ListItem>
                                        <ListItemText primary={v.header}
                                                      secondary={v.value}
                                                      classes={{primary: styles.headerTitle,
                                                                secondary: styles.headerValue}}/>
                                    </ListItem>
                                    <ListItem>
                                        {v.header === "Pipeline name" &&
                                        <RemoteLogModal title={"Pipeline file"}
                                                        buttonLabel={"View File"}
                                                        fileId={"pipelineFile"}
                                                        runId={this.props.runId}
                                                        buttonStyle={{marginTop: "-30px", minHeight: "30px"}}/>
                                        }
                                    </ListItem>
                                </List>
                            </Grid>
                        )
                    })}
                </Grid>
            </div>
        )
    }
}

/*
Renders the status card banner with the information about the pipeline running
status. Internally, it sets a timed function that updates the duration of the
pipeline while its running.
 */
class StatusPaper extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            duration: 0,
            status: ""
        };
    }

    componentDidMount(){
        this.timerID = setInterval(
            () => this.getDuration(),
            1000
        );
    }

    componentWillUnmount(){
        clearInterval(this.timerID);
    }

    /*
    Gets the duration of the pipeline, either from the timeStop attribute
    of this.props.runStatus when the pipeline has finished, or from the
    present time, when the pipeline is running.
     */
    getDuration () {

        const start = moment(this.props.runStatus.timeStart, "YYYY MMM-D HH:mm:ss:SSS", this.props.runStatus.timeLocale);

        let stop;
        if (this.props.runStatus.timeStop === "-"){
            stop = moment();
        } else {
            stop = moment(this.props.runStatus.timeStop, "YYYY MMM-D HH:mm:ss:SSS", this.props.runStatus.timeLocale);
        }

        const d = stop.diff(start);
        this.setState({duration: moment.utc(d).format("HH:mm:ss")})
    }

    render () {

        // Changes the color of the status paper component based on the
        // status of the pipeline run
        const statusColorMap = {
            "complete": green[300],
            "running": blue[300],
            "aborted": red[300],
        };

        // Get relevant information from props.
        const status = this.props.runStatus.status.value;
        const timeStart = moment(this.props.runStatus.timeStart, "YYYY MMM-D HH:mm:ss:SSS", this.props.runStatus.timeLocale).format("D/M/YYYY, h:mm:ss");
        const timeStop = this.props.runStatus.timeStop === "-" ? "-" :
            moment(this.props.runStatus.timeStop, "YYYY MMM-D HH:mm:ss:SSS", this.props.runStatus.timeLocale).format("D/M/YYYY, h:mm:ss");

        return (
            <Paper elevation={6} style={{padding: 10, backgroundColor: statusColorMap[status]}}>
                <div style={{marginBottom: 5}}>
                    <Typography style={{color: "white"}} className={styles.statusTitle}> Status: {status}</Typography>
                </div>
                <div>
                    <Typography className={styles.cardHeader}> Start time: {timeStart}</Typography>
                </div>
                <div>
                    <Typography className={styles.cardHeader}> Stop time: {timeStop}</Typography>
                </div>
                <div style={{marginTop: 10}}>
                    <Typography style={{fontWeight: "bold"}} className={styles.cardHeader}> Duration: {this.state.duration}</Typography>
                    {status === "aborted" &&
                        <ViewLogModal title={this.props.runStatus.status.abortCause}
                                      buttonLabel={"View Log"}
                                      content={this.props.runStatus.status.logLines.join("\n")}
                                      buttonStyle={{float: "right", marginTop: "-30px"}}/>}
                </div>
            </Paper>
        )
    }
}

/*
DETAILS OVERVIEW COMPONENTS
 */

/*
Component with the detail information about the pieline in a List-like format
 */
class DetailsOverview extends React.Component {
    render () {

        // Maps the keys of the configuration files in the props object
        // to their headers in the rendered List, and to the name of the file.
        const configFiles = {
            "configFile": ["Nextflow config", ".nextflow.config"],
            "paramsFile": ["Parameters config", "params.config"],
            "resourcesFile": ["Resources config", "resources.config"],
            "containersFile": ["Containers config", "containers.config"],
            "userFile": ["User config", "user.config"],
        };

        return (
            <Grid container spacing={8}>
                <Grid item xs={6} style={{minWidth: "300px"}}>
                    <List component="nav"
                          dense>
                        {this.props.detailsData.map((v) => {
                            return (
                                <ListItem key={v.header}>
                                    <ListItemText primary={v.header} secondary={v.value}/>
                                </ListItem>
                            )
                        })}
                    </List>
                </Grid>
                <Grid item xs={6} style={{minWidth: "300px"}}>
                    <List component="nav"
                          dense>
                    {Object.keys(configFiles).map((v) => {
                        return(
                            <ListItem key={v}>
                                <ListItemText primary={configFiles[v][0]} secondary={configFiles[v][1]}/>
                                <RemoteLogModal title={configFiles[v][0]}
                                                buttonLabel={"View File"}
                                                fileId={v}
                                                runId={this.props.runId}/>
                            </ListItem>
                        )
                    })}
                    </List>
                </Grid>
            </Grid>
        )
    }
}

/*
PROCESS SUBMISSION COMPONENTS
 */


/*
Main component that displays the processes that are currently submitted,
retrying, failing or complete. For each of these possible status, a
SubmissionCard component is rendered.
 */
class ProcessSubmission extends React.Component {

    /*
    Returns an object with the number of tags for each possible status and the
    samples that are failing for each process.
     */
    countSubmissions () {

        let counts = {
            "submitted": 0,
            "retry": 0,
            "failed": 0,
            "finished": 0
        };

        // This object will store the list of failing samples for each
        // process (e.g.: {processA: [sampleA, sampleB]}
        let failedTags = {};

        // Iterate of process and headers to obtain the counts
        for (const [k, v] of Object.entries(this.props.processData)) {
            failedTags[k] = [];
            for (const header of Object.keys(counts)) {
                counts[header] += v[header].length;
                // Update the object with the failing samples for each process
                if (header === "failed"){
                    failedTags[k].push.apply(failedTags[k], v[header])
                }
            }
        }

        return {
            counts,
            failedTags
        }
    }

    render () {

        const headerMap = {
            "Submmited": {
                "header": "submitted",
                "color": blue[300]
            },
            "Retrying": {
                "header": "retry",
                "color": orange[300]
            },
            "Failed": {
                "header": "failed",
                "color": red[300]
            },
            "Completed": {
                "header": "finished",
                "color": green[300]
            }
        };
        const res = this.countSubmissions();

        return (
            <Grid container justify={"center"} spacing={24} direction={"row"}>
                {Object.entries(headerMap).map(([header, key]) => {
                    return (
                        <Grid key={header} item xs={3} style={{minWidth: 200}}>
                            <SubmissionCard header={header}
                                            value={res.counts[key.header]}
                                            color={key.color}
                                            failedData={res.failedTags}
                                            tagData={this.props.tagData}/>
                        </Grid>
                    )
                })}
            </Grid>
        )
    }
}

/*
Renders the submission status of pipeline tags for the ProcessSubmission
component. Each possible status (submitted, retrying, etc) is rendered as a
separate SubmissionCard component
 */
class SubmissionCard extends React.Component {
    render () {
        return (
            <div>
                <Typography style={{color: this.props.color}} className={styles.submissionHeader}>
                    {this.props.header}
                </Typography>
                <Typography style={{color: this.props.color}} className={styles.submissionValue}>
                    {this.props.value}
                </Typography>
                {/* Only show the button to view failing samples for the Failed card and only when*/}
                {/* there are samples failing*/}
                {(this.props.header === "Failed" && this.props.value !== 0) && <FailedTableModal buttonLabel={"View"}
                                                                     failedData={this.props.failedData}
                                                                     tagData={this.props.tagData}/>}

            </div>
        )
    }
}

/*
Renders a button below the Failed ProcessSubmission SubmissionCard when at
least one sample is failing in the pipeline. It opens a model with a table
view of the failing samples.
 */
class FailedTableModal extends React.Component {

    state = {
        open: false,
    };

    handleOpen = () => {
        this.setState({ open: true });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    render () {
        return (
            <div>
                <Button style={{width: "100%"}}  onClick={this.handleOpen}>
                    {this.props.buttonLabel}
                </Button>
                <Modal
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                    open={this.state.open}
                    onClose={this.handleClose}>
                    <Paper className={styles.tagModal}>
                        <div className={styles.modalTitleContainer}>
                            <Typography className={styles.modalTitle} variant={"title"} gutterBottom>
                                Overview of failed samples
                            </Typography>
                            <IconButton onClick={this.handleClose}><CloseCircleIcon size={30} color={red[300]}/></IconButton>
                        </div>
                        <Divider/>
                        <FailedTagsTable failedData={this.props.failedData}
                                         tagData={this.props.tagData}/>
                    </Paper>
                </Modal>
            </div>
        )
    }
}

/*
Renders a table with all the sample that are currently failing in the pipeline.
It differs from the other tables because it may contain the information from
all processes
 */
class FailedTagsTable extends React.Component {
    constructor(props){
        super(props);
    }

    /*
    Prepares the table data for ReactTable component
     */
    prepareData(failedData, tagData) {

        const headers = ["workdir", "start", "log"];
        // The main table data array of objects
        let tableData = [];

        for (const [process, sampleArray] of Object.entries(failedData)) {
            // Skip processes without fails
            if (sampleArray.length === 0){continue}

            for (const sample of sampleArray) {
                // Create first instance of the process/tag object
                let dt = {
                    "process": <Typography>{process}</Typography>,
                    "sample": <Typography>{sample}</Typography>
                };
                const tagInfo = tagData[process][sample];
                // Skip process/tags not available in tagData object
                if (!tagInfo){continue}

                headers.forEach((header) => {
                    // The log column is special in that it should show a
                    // button that opens a modal to view the log file content
                    if (header === "log"){
                        // Handles cases where the log information is not
                        // available
                        if (tagInfo[header]) {
                            dt[header] = <ViewLogModal
                                title={`Log file for sample ${sample}`}
                                buttonLabel={"View log"}
                                content={tagInfo[header].join("\n")}
                                buttonStyle={{width: "100%"}}/>;
                        } else {
                            dt[header] = ""
                        }
                    } else {
                        dt[header] = <Typography>{tagInfo[header]}</Typography>
                    }
                });
                tableData.push(dt)
            }
        }
        return tableData
    }

    /*
    Prepare column data for ReactTable
     */
    prepareColumns() {
        return [
            {
                Header: "Process",
                accessor: "process",
                filterable: true,
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, {keys: ["process.props.children"]}),
                filterAll: true
            },
            {
                Header: "sample",
                accessor: "sample",
                minWidth: 90
            },
            {
                Header: "Work dir",
                accessor: "workdir",
                minWidth: 90,
                className: styles.tableCell
            },
            {
                Header: "Time start",
                accessor: "start",
                minWidth: 90,
                className: styles.tableCell
            },
            {
                Header: "Log",
                accessor: "log",
                minWidth: 100,
                width: 100,
                className: styles.tableCell
            }
        ]
    }

    render () {
        console.log(this.prepareData(this.props.failedData, this.props.tagData))
        return (
                <ReactTable
                    data={this.prepareData(this.props.failedData, this.props.tagData)}
                    columns={this.prepareColumns()}
                    className="-striped -highlight"/>
            )
    }
}

/*
Component that shows an estimation of the resources being used by the pipeline,
namely cpu and RAM.
 */
class ResourcesDetails extends React.Component {

    constructor(props) {
        super(props);
    }

    /*
    Estimates the resources (cpu and RAM) currently being used by the
    pipeline.
     */
    getActiveResources(){
        let activeCpus = 0;
        let unknownCpus = false;
        let allocMem = 0;
        let unknownMem = false;

        for (const vals of Object.values(this.props.processData)) {
            if (vals.submitted.length > 0) {
                if (vals.cpus) {
                    activeCpus += parseInt(vals.cpus) * vals.submitted.length;
                } else {
                    unknownCpus = true;
                }
                if (vals.memory){
                    allocMem += parseInt(vals.memory) * vals.submitted.length;
                }
            }
        }

        if (unknownCpus === true) {
            activeCpus = `${activeCpus}(+?)`
        } else {
            activeCpus = `${activeCpus}`
        }
        if (unknownMem === true) {
            allocMem = `${allocMem / 1024}Gb(+?)`
        } else {
            allocMem = `${allocMem / 1024}Gb`
        }

        return {
            cpus: activeCpus,
            memory: allocMem
        }
    }

    render () {
        const activeResources = this.getActiveResources();
        return (
            <Grid container justify={"center"} spacing={24} style={{width: "100%"}}>
                <Grid item xs={6}>
                    <Typography align={"center"} variant={"subheading"}>Cpus allocated: {activeResources.cpus}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography align={"center"} variant={"subheading"}>Memory allocated: {activeResources.memory}</Typography>
                </Grid>
            </Grid>
        )
    }
}

/*
MAIN TABLE COMPONENTS
 */

const convertToBytes = (value) => {

    let multipliers = {};
    multipliers.B = 1;
    multipliers.KB = ( multipliers.B * 1024 );
    multipliers.MB = ( multipliers.KB * 1024 );
    multipliers.GB = ( multipliers.MB * 1024 );
    multipliers.TB = ( multipliers.GB * 1024 );
    multipliers.PB = ( multipliers.TB * 1024 );
    multipliers.EB = ( multipliers.PB * 1024 );
    multipliers.ZB = ( multipliers.EB * 1024 );

    const matches = value.toUpperCase().match(/([KMGTPEZ]I?)?B$/);
    if (matches){
        const unit = matches[0].replace(/i/i, "");
        return (parseFloat(value) * multipliers[unit])
    } else {
        return 0
    }

};

const sortSizes = (a, b) => {

    const aValue = a.props.hasOwnProperty("buttonLabel") ? convertToBytes(a.props.buttonLabel) : "-1";
    const bValue = b.props.hasOwnProperty("buttonLabel") ? convertToBytes(b.props.buttonLabel) : "-1";

    return aValue > bValue ? 1 : -1;

};

const sortIgnoreNA = (a, b) => {

    a = a.props.children === "-" ? -1 : a.props.children;
    b = b.props.children === "-" ? -1 : b.props.children;

    return a > b ? 1 : -1;

};

const sortButtonTags = (a, b) => {

    const aValue = a.props.hasOwnProperty("tagList") ? a.props.tagList.length : -1;
    const bValue = b.props.hasOwnProperty("tagList") ? b.props.tagList.length : -1;

    return aValue > bValue ? 1 : -1;

};

/*
Renders the main table controler
*/
class MainTable extends React.Component {
    render () {
        return (
            <TableOverview header={this.props.tableData.header}
                           data={this.props.tableData.data}
                           mappings={this.props.tableData.mappings}
                           tagData={this.props.tagData}
                           processData={this.props.processData}
                           runStatus={this.props.runStatus}/>
        )
    }
}

/*
The component that acually renders the main table
 */
class TableOverview extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            "data": props.data,
            "columns": this.prepareColumns()
        };
    }

    /*
    This method determines that the component should only update when the
    data is changed.
     */
    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.data && nextProps.data !== prevState.data) {
            return {data: nextProps.data}
        } else {
            return null
        }
    }

    /*
    Parses the name of the process (e.g.: processA_1_1) and tries to retrieve
    the actuall process name (processA), lane (1) and process ID (1). When
    it cannot parse the lane and process ID, they return "-"
     */
    parseProcessNames(processStr) {

        const fields = processStr.split("_").reverse();
        let processName,
            lane,
            processId;

        // Check if the last two elements are integers. If so, they are
        // interpreted as the lane and process ID.
        if (!isNaN(fields[0]) && !isNaN(fields[1])) {
            processId = fields[0];
            lane = fields[1];
            processName = fields.slice(2,).reverse().join("_")
        } else {
            processName = processStr;
            lane = "-";
            processId = "-"
        }

        return {
            processName,
            lane,
            processId
        }

    }

    /*
    Prepare the data for ReactTable. The data parameter is an array of object,
    each containing the table data for a given process.
     */
    prepareData(data) {

        const listToLength = ["running", "complete", "error"];
        const plotButtons = ["maxMem", "avgRead", "avgWrite"];

        const tagDataMap = {
            "maxMem": "rss",
            "avgRead": "rchar",
            "avgWrite": "wchar"
        };

        // Iterate over the array of process stats
        return data.map(processInfo => {
            let dt = {};

            Object.keys(processInfo).forEach(header => {
                // For the Running, Complete and Error columns, the cell
                // content should be a button that opens a model with the
                // tabbed table view with the information about each tag
                // in that process
                if (listToLength.includes(header)) {
                    dt[header] = <TagInspectionModal tagList={processInfo[header]}
                                                     process={processInfo["process"]}
                                                     header={header}
                                                     tagData={this.props.tagData}
                                                     processData={this.props.processData}/>
                // For the process header, parse the process name and try to
                // Populate the process name, lane and process Id columns
                } else if (header === "process") {
                    const res = this.parseProcessNames(processInfo[header]);
                    dt[header] = <Typography style={{textAlign: "left"}} className={styles.tableCell}>{res.processName}</Typography>;
                    dt["lane"] = <Typography className={styles.tableCell}>{res.lane}</Typography>;
                    dt["pid"] = <Typography className={styles.tableCell}>{res.processId}</Typography>;
                    // For columns in the plotButtons array, the cell content
                    // should be a button that opens a model with a scatter
                    // plot showing the distribution of a particular resource
                    // for each sample.
                } else if (plotButtons.includes(header)) {
                    if (Object.keys(this.props.tagData[processInfo.process]).length !== 0 && this.props.tagData[processInfo.process].constructor === Object){
                        dt[header] = <ResourceScatterModal buttonLabel={processInfo[header]}
                                                           rawPlotData={this.props.tagData[processInfo.process]}
                                                           dataType={tagDataMap[header]}/>
                    } else {
                        dt[header] = <Typography className={styles.tableCell}>-</Typography>
                    }
                } else if (header === "barrier") {
                    dt[header] = processInfo[header]
                } else {
                    dt[header] = <Typography className={styles.tableCell}>{processInfo[header]}</Typography>;
                }
            });

            // Update the barrier letter of the column, based on the run status
            // of the pipeline and the number of failing samples.
            if (this.props.runStatus === "aborted") {
                // When the pipeline has been aborted, change the process
                // barrier signature to fail (will show a skull icon)
                if (processInfo.error.length > 0) {
                    dt.barrier = "F"
                // When the pipeline has been aborted but the process was still
                // running, change the signature to alert (shows an alert icon)
                } else if (dt.barrier === "R") {
                    dt.barrier = "A"
                }
            } else {
                if (processInfo.running.length === 0 && dt.barrier === "R"){
                    dt.barrier = "Z"
                }
            }
            return dt;
        })
    }

    prepareColumns() {

        const mainWidth = 90;

        // Sets the barrier icon based on its letter.
        const barrierIcons = {
            "C": <Icon style={{ color: green[300] }} size={30}>check_circle</Icon>,
            "W": <Icon size={30}>access_time</Icon>,
            "R": <CircularProgress size={25} style={{ color: green[500] }}/>,
            "F": <SkullIcon color={red[300]}/>,
            "A": <AlertOctagonIcon color={red[300]}/>,
            "Z": <SleepIcon color={green[300]}/>
        };

        return [
            {
                Header: "",
                accessor: "barrier",
                minWidth: 25,
                className: styles.tableBarrier,
                Cell: row => (
                    <div>
                        {barrierIcons[row.value]}
                    </div>
                )
            },
            {
                Header: <Tooltip id="lane" title="Process lane"><Typography>Lane</Typography></Tooltip>,
                accessor: "lane",
                minWidth: 40,
                className: styles.tableCell
            },
            {
                Header: <Tooltip id="pid" title="Process Identifier"><Typography>ID</Typography></Tooltip>,
                accessor: "pid",
                minWidth: 30,
                className: styles.tableCell
            },
            {
                // Header: <Tooltip id="pname" title="Process name"><div>Process</div></Tooltip>,
                Header: <Typography>Process</Typography>,
                accessor: "process",
                minWidth: 180,
                className: styles.tableProcess
            }, {
                // Header:  <Tooltip id="running" title="Submitted/Running processes"><div>Running</div></Tooltip>,
                Header: <Typography>Running</Typography>,
                accessor: "running",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortButtonTags
            }, {
                // Header:  <Tooltip id="completed" title="Completed processes"><div>Complete</div></Tooltip>,
                Header: <Typography>Complete</Typography>,
                accessor: "complete",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortButtonTags
            }, {
                // Header:  <Tooltip id="error" title="Process exited with error"><div>Error</div></Tooltip>,
                Header: <Typography>Error</Typography>,
                accessor: "error",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortButtonTags
            }, {
                // Header:  <Tooltip id="avgtime" title="Average time each process took"><div>Avg Time</div></Tooltip>,
                Header: <Typography>Avg Time</Typography>,
                accessor: "avgTime",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortIgnoreNA
            }, {
                // Header:  <Tooltip id="cpuhour" title="Cumulative CPU/hour measurement"><div>CPU/hour</div></Tooltip>,
                Header: <Typography>CPU/Hour</Typography>,
                accessor: "cpuhour",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortIgnoreNA
            }, {
                // Header:  <Tooltip id="maxmem" title="Maximum RAM used (MB)"><div>Max Mem</div></Tooltip>,
                Header: <Typography>Max Mem</Typography>,
                accessor: "maxMem",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortSizes
            }, {
                // Header:  <Tooltip id="avgread" title="Average disk read (MB)"><div>Avg Read</div></Tooltip>,
                Header: <Typography>Avg Read</Typography>,
                accessor: "avgRead",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortSizes
            }, {
                // Header:  <Tooltip id="avgwrite" title="Average disk write (MB)"><div>Avg Write</div></Tooltip>,
                Header: <Typography>Avg Write</Typography>,
                accessor: "avgWrite",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortSizes
            }
        ];
    }

    render () {
         return (
             <div className={styles.mainPaper}>
                 <ReactTable
                     data={this.prepareData(this.state.data)}
                     columns={this.state.columns}
                     defaultPageSize={this.state.data.length <= 10 ? this.state.data.length : 10}
                     className="-striped -highlight"
                 />
             </div>
        )
    }
}

/*
Component that controls the opening of the modal with the tab table component
with the running, complete and complete tags.
 */
class TagInspectionModal extends  React.Component {

    state = {
        open: false,
    };

    handleOpen = () => {
        this.setState({ open: true });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    render () {
        return(
            <div>
                <Button className={styles.tableButton}  onClick={this.handleOpen}>
                    {this.props.tagList.length}
                </Button>
                <Modal
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                    open={this.state.open}
                    onClose={this.handleClose}>
                    <Paper className={styles.tagModal}>
                        <div className={styles.modalTitleContainer}>
                            <Typography className={styles.modalTitle} variant={"title"} gutterBottom>
                                Showing tags for process '{this.props.process}'
                            </Typography>
                            <IconButton onClick={this.handleClose}><CloseCircleIcon size={30} color={red[300]}/></IconButton>
                        </div>
                        <Divider/>
                        <div className={styles.logModal}>
                            <TagTabs header={this.props.header}
                                     processData={this.props.processData[this.props.process]}
                                     tagData={this.props.tagData[this.props.process]}/>
                        </div>
                    </Paper>
                </Modal>
            </div>
            )
    }
}


class TagTabs extends React.Component {

    constructor(props){
        super(props);
        const tabMap = {
            "running": 0,
            "complete": 1,
            "error": 2
        };

        this.state = {
            value: tabMap[props.header],
            running: props.processData["submitted"],
            complete: props.processData["finished"],
            error: props.processData["failed"],
            tagData: props.tagData,
            header: props.header,
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.processData["submitted"] !== prevState.running) {
            return {
                running: nextProps.processData["submitted"],
                complete: nextProps.processData["finished"],
                error: nextProps.processData["failed"],
                tagData: nextProps.tagData
            }
        } else {
            return null
        }
    }

    handleChange = (event, value) => {
        this.setState({
            value,
            running: this.props.processData["submitted"],
            complete: this.props.processData["finished"],
            error: this.props.processData["failed"]
        });
    };

    handleChangeIndex = index => {
        this.setState({value: index});

    };

    render () {
        return (
            <div style={{height: "90%", maxHeight: "90%", padding: 10}}>
                <Tabs value={this.state.value}
                      onChange={this.handleChange}
                      indicatorColor="primary"
                      textColor="primary"
                      centered>
                    <Tab label={"Running"}/>
                    <Tab label={"Complete"}/>
                    <Tab label={"Error"}/>
                </Tabs>
                <div style={{overflow: "auto", height: "95%"}}>
                    <SwipeableViews index={this.state.value}
                                    onChangeIndex={this.handleChangeIndex}>
                        <TagTable tags={this.state.running}
                                  header={"running"}
                                  tagData={this.state.tagData} />
                        <TagTable tags={this.state.complete}
                                  header={"complete"}
                                  tagData={this.state.tagData}/>
                        <TagTable tags={this.state.error}
                                  header={"error"}
                                  tagData={this.state.tagData}/>
                    </SwipeableViews>
                </div>
            </div>
        )
    }
}

class TagTable extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            "tags": props.tags,
            "tagData": props.tagData,
            "columns": this.prepareColumns(),
            "header": props.header
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.tags && nextProps.tags !== prevState.tags) {
            return {
                tags: nextProps.tags,
                tagData: nextProps.tagData
            }
        } else {
            return null
        }
    }

    prepareData(tags) {

        const headers = ["workdir", "start", "realtime", "rss", "rchar",
            "wchar", "log"];

        return tags.map((sample) => {
            let dt = {"sample": <Typography>{sample}</Typography>};
            headers.forEach((header) => {
                // Skip entries not in the header
                if (this.state.tagData.hasOwnProperty(sample)){
                    // Handle special log case
                    if (header === "log") {
                        if (this.state.tagData[sample][header]){
                            dt[header] = <ViewLogModal title={`Log file for sample ${sample}`}
                                                       buttonLabel={"View log"}
                                                       content={this.state.tagData[sample][header].join("\n")}
                                                       buttonStyle={{width: "100%"}}/>;
                        } else {
                            dt[header] = "";
                        }
                    } else {
                        dt[header] = <Typography>{this.state.tagData[sample][header]}</Typography>
                    }
                }
            });
            return dt;
        });
    }

    prepareColumns() {
        return [
            {
                Header: "Sample",
                accessor: "sample",
                minWidth: 90,
                filterable: true,
                // Filter sample names. These are actually Typography components,
                // hence the sample.props.children.
                filterMethod: (filter, rows) =>
                    matchSorter(rows, filter.value, {keys: ["sample.props.children"]}),
                filterAll: true
            },
            {
                Header: "Work dir",
                accessor: "workdir",
                minWidth: 90,
                className: styles.tableCell
            },
            {
                Header: "Time start",
                accessor: "start",
                minWidth: 90,
                className: styles.tableCell
            },
            {
                Header: "Duration",
                accessor: "realtime",
                className: styles.tableCell,
                show: this.props.header === "complete"
            },
            {
                Header: "Max memory",
                accessor: "rss",
                className: styles.tableCell,
                show: this.props.header === "complete"
            },
            {
                Header: "Disk read",
                accessor: "rchar",
                className: styles.tableCell,
                show: this.props.header === "complete"
            },
            {
                Header: "Disk write",
                accessor: "wchar",
                className: styles.tableCell,
                show: this.props.header === "complete"
            },
            {
                Header: "Log",
                accessor: "log",
                minWidth: 100,
                width: 100,
                className: styles.tableCell,
                show: this.props.header === "error"
            }
        ]
    }

    render () {

        return (
            <ReactTable data={this.prepareData(this.props.tags)}
                        columns={this.state.columns}
                        className="-striped -highlight styles.logModal"
                        style={{ margin: 20}}
                        // defaultPageSize={this.state.tags.length <= 14 ? this.state.tags.length : 14}
            />
        )
    }
}

/*
Loader component displayed at the center of the page
 */
class Loader extends React.Component {
    render () {
        return (
            <CircularProgress className={styles.loader}
                              style={{ color: green[500] }}
                              size={50}/>
        )
    }
}

/*
Error Paper
 */
export class BadRequestPaper extends React.Component {
    render () {
        return (
            <div className={styles.badrequestContainer}>
                <Paper className={styles.badrequestPaper}>
                    <Typography>
                    The requested runID does not exist: {this.props.runID}
                    </Typography>
                </Paper>
            </div>
        )
    }
}

/*
View remote file modal
 */
class RemoteLogModal extends React.Component {

    state = {
        open: false,
        content: ""
    };

    getRemoteFile = () => {
        axios.get(`api/status?run_id=${this.props.runId}&pipeline_files=true`)
            .then(
                (response) => {
                    const fileData = response.data.files[this.props.fileId];
                    if (fileData) {
                        this.setState({content: fileData.join("\n")})
                    } else {
                        this.setState({content: `Could not retrieve ${this.props.fileId}`})
                    }
                }
            )
    };

    handleOpen = () => {
        this.setState({ open: true });
        this.getRemoteFile();
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    render () {
        return (
            <span>
                <Button variant={"raised"}
                        size={"small"}
                        style={this.props.buttonStyle}
                        onClick={this.handleOpen}>
                    {this.props.buttonLabel}
                </Button>
                <Modal open={this.state.open}
                       onClose={this.handleClose}>
                    <Paper className={styles.tagModal}>
                        <div className={styles.modalTitleContainer}>
                            <Typography className={styles.modalTitle} variant={"title"} gutterBottom>
                                {this.props.title}
                            </Typography>
                            <IconButton onClick={this.handleClose}><CloseCircleIcon size={30} color={red[300]}/></IconButton>
                        </div>
                        <Divider/>
                        <div className={styles.logModal}>
                            {this.state.content ?
                                <PrismCode component={"pre"} className={"language-groovy"}>
                                    {this.state.content}
                                </PrismCode> :
                                <Loader/>
                            }
                        </div>
                    </Paper>
                </Modal>
            </span>
        )
    }
}

/*
Button and modal for displaying error logs
 */
class ViewLogModal extends React.Component {

    state = {
        open: false,
    };

    handleOpen = () => {
        this.setState({ open: true });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    render () {
        return (
            <div>
                <Button variant={"raised"}
                        size={"small"}
                        style={this.props.buttonStyle}
                        onClick={this.handleOpen}>
                    {this.props.buttonLabel}
                </Button>
                <Modal aria-labelledby="simple-modal-title"
                       aria-describedby="simple-modal-description"
                       open={this.state.open}
                       onClose={this.handleClose}>
                    <Paper className={styles.tagModal}>
                        <div className={styles.modalTitleContainer}>
                            <Typography className={styles.modalTitle} variant={"title"} gutterBottom>
                                Abortion cause: {this.props.title}
                            </Typography>
                            <IconButton onClick={this.handleClose}><CloseCircleIcon size={30} color={red[300]}/></IconButton>
                        </div>
                        <Divider/>
                        <div className={styles.logModal}>
                            <pre>
                                {this.props.content}
                            </pre>
                        </div>
                    </Paper>
                </Modal>
            </div>
        )
    }
}



/*
Process submission components
 */
class ResourceScatterPlot extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            plotData: this.preparePlotData(props.rawPlotData, props.dataType)
        };
    }

    preparePlotData(dataObj, dataType) {

        if (!dataObj){
            return null
        }

        let data = [];
        let c = 1;
        // const total = Object.keys(dataObj).length;

        for (const [sample, info] of Object.entries(dataObj)) {
            if (info[dataType] === "-"){
                continue
            }
            data.push({
                name: sample,
                data: [[c, info[dataType]]],
                marker: {
                    symbol: 'circle'
                },
                color: "gray"
            });
            c += 1
        }

        return data;
    }

    render() {

        const tagDataMap = {
            "rss": "Max Memory (MB)",
            "rchar": "Average Disk Read (MB)",
            "wchar": "Average Disk Write (MB)"
        };

        let config = {
            chart: {
                type: "scatter",
                zoomType: "x",
            },
            legend: {
                enabled: false
            },
            tooltip: {
                formatter() {
                    const title = this.series.yAxis.userOptions.title.text;
                    return "<b>" + title + "</b><br>" +
                        "<b>" + this.point.series.name +"</b>:  " + this.y + "Mb"
                },
            },
            xAxis: {
                title: {
                    enabled: true,
                    text: "Tags"
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true,
                labels: {
                    enabled: false
                }
            },
            yAxis: {
                title: {
                    text: tagDataMap[this.props.dataType],
                },
            },
            title: {
                text: "Distribution of " + tagDataMap[this.props.dataType]
            },
            series: this.state.plotData
        };
        return (
            <div style={{paddingTop: 20}}>
                <ReactHighcharts style={{height: "100%"}} config={config} ref="chart"></ReactHighcharts>
            </div>
        );
    }
}

class ResourceScatterModal extends React.Component {

    state = {
        open: false,
    };

    handleOpen = () => {
        this.setState({ open: true });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    render () {
        return (
            <div>
                <Button className={styles.tableButton}  onClick={this.handleOpen}>
                    {this.props.buttonLabel}
                </Button>
                <Modal
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                    open={this.state.open}
                    onClose={this.handleClose}>
                    <Paper className={styles.tagModal}>
                        <div className={styles.modalTitleContainer}>
                            <Typography className={styles.modalTitle} variant={"title"} gutterBottom>
                                Resource distrbution for '{this.props.dataType}'
                            </Typography>
                            <IconButton onClick={this.handleClose}><CloseCircleIcon size={30} color={red[300]}/></IconButton>
                        </div>
                        <Divider/>
                        <div>
                            <ResourceScatterPlot rawPlotData={this.props.rawPlotData}
                                       dataType={this.props.dataType}/>
                        </div>
                    </Paper>
                </Modal>
            </div>
        )
    }
}


class FcModalContainer extends React.Component {
    render () {
        return (
            <Paper className={styles.tagModal}>
                <Typography variant={"title"} gutterBottom>
                    {this.props.title}
                </Typography>
                <Divider/>
                <div className={styles.logModal}>
                    {this.props.children}
                </div>
            </Paper>
        )
    }
}


class WarningPopover extends React.Component {

    state = {
        anchorEl: null,
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

    render() {
        const { anchorEl } = this.state;
        const title = this.props.warningType === "memory" ?
            "Excessive RAM usage" :
            "Excessive CPU usage";

        return(
            <span>
                <Icon onClick={this.handleClick} className={styles.warningIcon}>
                    warning-outline
                </Icon>
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
                    <List>
                        <ListItem>
                            <ListItemText primary={title}/>
                        </ListItem>
                    </List>
                    <Divider/>
                    <List style={{ maxHeight: 200, overflow: "auto"}}>
                        {Object.keys(this.props.warnings).map(val => {
                            return (
                                <ListItem key={val}>
                                    <ListItemText primary={val} secondary={`${this.props.warnings[val].value}Mb`}/>
                                </ListItem>
                            )
                        })}
                    </List>
                </Popover>
            </span>
        )
    }
}

/*
Table and DAG controller
 */
class MainDag extends React.Component {
    render () {
        return (
            <TreeDag data={this.props.treeDag}
                     processData={this.props.processData}/>
        )
    }
}


/**
 * Legend for DAG
 */
class DagLegend extends React.Component{

    constructor() {
        super();

        this.legendObj = {
            "Waiting": grey[300],
            "Running": blue[300],
            "Completed": green[300],
            "Retry": orange[300],
            "Aborted": red[300],
            "Fully completed process": green[800]
        }
    }

    render() {
        return(
        <div>
            <Grid container justify={"center"} spacing={24}>
                {Object.keys(this.legendObj).map( (k) => {
                    return (
                        <Grid item key={k}>
                            <Grid container>
                                <Grid item>
                                    <Icon size={30} style={{color: this.legendObj[k]}}>lens
                                    </Icon>
                                </Grid>
                                <Grid item>
                                    <Typography style={{lineHeight: "25px"}}>{k}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    )
                })}
            </Grid>
        </div>
        )
    }
}

// export default withStyles(styles)({Inspect, InspectHome});
