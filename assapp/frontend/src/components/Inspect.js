// React imports
import React from "react"
import ReactTable from "react-table";

//Material UI imports
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import CircularProgress from "@material-ui/core/CircularProgress";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ListItemText from "@material-ui/core/ListItemText";
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

// Other imports
import axios from "axios";
import moment from "moment";
import prismjs from "prismjs";
import PrismCode from "react-prism";

// CSS imports
const styles = require("../styles/inspect.css")

// TreeDag import

import TreeDag from "./treeDag";

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
 */

class InspectApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            badRequest: false,
            runID: props.runID,
            generalData: {},
            runStatus: {},
            detailsData: {},
            processData: {},
            tableData: {},
            tagData: {},
            treeDag: {}
        };
    }

    updateJson(){
        axios.get(`api/status?run_id=${this.state.runID}`)
            .then(
                (response) => {
                    const dataStatus = response.data.status;
                    this.setState({loading: false});
                    // Set general overview data
                    this.setState({
                        generalData: dataStatus.generalOverview,
                        runStatus: {
                            status: dataStatus.runStatus,
                            timeStart: dataStatus.timeStart,
                            timeStop: dataStatus.timeStop,
                        },
                        treeDag: response.data.dag
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

        this.updateJson();

        const statusSocket = new WebSocket(
            "ws://" + window.location.host + "/ws/inspect/" +
            this.props.runID + "/"
        );

        statusSocket.onmessage = (e) => {
            this.updateJson()
        };

    }

    componentWillUnmount() {
        clearInterval(this.hook);
    }

    render () {
        return (
            <div>
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
                                    <div>waiting</div>
                                }
                            </div>
                }
            </div>
        )
    }
}

export class InspectHome extends React.Component {

    constructor(props) {
        super(props);

    }

    render () {
        return (
            <div className={styles.homeContainer}>
                <Paper className={styles.home}>
                    <TextField
                        id="runiD"
                        label="Provide assemblerflow's run ID"
                        fullWidth
                        margin="normal"/>

                </Paper>
            </div>
        )
    }
}

/*
MAIN INSPECTION PANEL CONTROLLER
 */

class InspectPannels extends React.Component {
    render () {
        return (
            <div>
                <ExpansionPanel defaultExpanded style={{margin: 0}}>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography className={styles.panelHeaderTitle} variant={"title"}>General Overview</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <GeneralOverview generalData={this.props.generalData}
                                         runStatus={this.props.runStatus}
                                         runId={this.props.runID}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel style={{marginTop: 0}}>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography className={styles.panelHeaderTitle} variant={"title"}>Details</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <DetailsOverview detailsData={this.props.detailsData}
                                         runId={this.props.runID}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography className={styles.panelHeaderTitle} variant={"title"}>Process submission</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <ProcessSubmission processData={this.props.processData}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography className={styles.panelHeaderTitle} variant={"title"}>Table overview</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <MainTable tableData={this.props.tableData}
                                   tagData={this.props.tagData}
                                   processData={this.props.processData}/>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary classes={{content: styles.panelHeader}} expandIcon={<ExpandMoreIcon />}>
                        <Typography className={styles.panelHeaderTitle} variant={"title"}>DAG overview</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails style={{display: "block"}}>
                        <MainDag treeDag={this.props.treeDag} processData={this.props.processData}
                                 runStatus = {this.props.runStatus}/>
                        <DagLegend></DagLegend>

                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </div>
        )
    }
}

/*
COMPONENTS
 */

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
class BadRequestPaper extends React.Component {
    render () {
        return (
            <div>
                <Paper className={styles.badrequest}>
                    <Typography>
                    The requested runID does not exist: {this.props.runID}
                    </Typography>
                </Paper>
            </div>
        )
    }
}

/*
GENERAL OVERVIEW
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

    getDuration () {

        const start = moment(this.props.runStatus.timeStart);

        let stop;
        if (this.props.runStatus.timeStop === "-"){
            stop = moment();
        } else {
            stop = moment(this.props.runStatus.timeStop);
        }

        const d = stop.diff(start);
        this.setState({duration: moment.utc(d).format("HH:mm:ss")})
    }

    render () {

        const statusColorMap = {
            "complete": green[300],
            "running": blue[300],
            "aborted": red[300],
        };
        const status = this.props.runStatus.status.value;
        const timeStart = moment(this.props.runStatus.timeStart).format("D/M/YYYY, h:mm:ss");
        const timeStop = this.props.runStatus.timeStop === "-" ? "-" :
            moment(this.props.runStatus.timeStop).format("D/M/YYYY, h:mm:ss");

        return (
            <Paper elevation={6} style={{padding: 10, backgroundColor: statusColorMap[status]}}>
                <div style={{marginBottom: 5}}>
                    <span style={{color: "white"}} className={styles.statusTitle}> Status: {status}</span>
                </div>
                <div>
                    <span className={styles.cardHeader}> Start time: {timeStart}</span>
                </div>
                <div>
                    <span className={styles.cardHeader}> Stop time: {timeStop}</span>
                </div>
                <div style={{marginTop: 10}}>
                    <span style={{fontWeight: "bold"}} className={styles.cardHeader}> Duration: {this.state.duration}</span>
                    {status === "aborted" &&
                        <ViewLogModal title={this.props.runStatus.status.abortCause}
                                      buttonLabel={"View Log"}
                                      content={this.props.runStatus.status.logLines.join("\n")}
                                      buttonStyle={{float: "right", marginTop: "-5px"}}/>}
                </div>
            </Paper>
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
                <Modal aria-labelledby="simple-modal-title"
                       aria-describedby="simple-modal-description"
                       open={this.state.open}
                       onClose={this.handleClose}>
                    <Paper className={styles.tagModal}>
                        <Typography variant={"title"} gutterBottom>
                            {this.props.title}
                        </Typography>
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
            <span>
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
                        <Typography variant={"title"} gutterBottom>
                            {this.props.title}
                        </Typography>
                        <Divider/>
                        <div className={styles.logModal}>
                            <pre>
                                {this.props.content}
                            </pre>
                        </div>
                    </Paper>
                </Modal>
            </span>
        )
    }
}

/*
Header component of the inspection with summary information
 */
class DetailsOverview extends React.Component {
    render () {

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
Process submission components
 */

class ProcessSubmission extends React.Component {

    countSubmissions () {

        let counts = {
            "submitted": 0,
            "retry": 0,
            "failed": 0,
            "finished": 0
        };

        for (const [k, v] of Object.entries(this.props.processData)) {
            for (const header of Object.keys(counts)) {
                counts[header] += v[header].length
            }
        }

        return counts
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
        const counts = this.countSubmissions();

        return (
            <Grid container justify={"center"} spacing={24}>
                {Object.entries(headerMap).map(([header, key]) => {
                    return (
                        <Grid key={header} item xs={3} style={{minWidth: 200}}>
                            <SubmissionCard header={header}
                                            value={counts[key.header]}
                                            color={key.color}/>
                        </Grid>
                    )
                })}
            </Grid>
        )
    }
}

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
            </div>
        )
    }
}


/*
Main table component
*/
class MainTable extends React.Component {
    render () {
        return (
            <TableOverview header={this.props.tableData.header}
                           data={this.props.tableData.data}
                           mappings={this.props.tableData.mappings}
                           tagData={this.props.tagData}
                           processData={this.props.processData}/>
        )
    }
}

/*
Table overview component
 */

const sortIgnoreNA = (a, b) => {

    a = a === "-" ? -1 : a;
    b = b === "-" ? -1 : b;

    return a > b ? 1 : -1;

};

class TableOverview extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            "data": props.data,
            "columns": this.prepareColumns()
        };

    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.data && nextProps.data !== prevState.data) {
            return {data: nextProps.data}
        } else {
            return null
        }
    }

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
            procesID = processStr;
            lane = "-";
            processId = "-"
        }

        return {
            processName,
            lane,
            processId
        }

    }

    prepareData(data) {

        const listToLength = ["running", "complete", "error"];

        return data.map(processInfo => {
            let dt = {};
            Object.keys(processInfo).forEach(header => {
                if (listToLength.includes(header)) {
                    // dt[header] = <Button className={styles.tableButton}>{processInfo[header].length}</Button>;
                    dt[header] = <TagInspectionModal tagList={processInfo[header]}
                                                     process={processInfo["process"]}
                                                     header={header}
                                                     tagData={this.props.tagData}
                                                     processData={this.props.processData}/>
                } else if (header === "process") {
                    const res = this.parseProcessNames(processInfo[header]);
                    dt[header] = res.processName;
                    dt["lane"] = res.lane;
                    dt["pid"] = res.processId;
                } else if (header === "maxMem"){
                    if (Object.keys(processInfo["memWarn"]).length !== 0 && processInfo["m" +
                    "emWarn"].constructor === Object){
                        dt[header] = <div>{processInfo[header]} <WarningPopover warningType={"memory"} warnings={processInfo["memWarn"]} /></div>
                    } else {
                        dt[header] = processInfo[header];
                    }
                } else {
                    dt[header] = processInfo[header];
                }
            });
            return dt;
        })
    }

    prepareColumns() {

        const mainWidth = 90;

        return [
            {
                Header: "",
                accessor: "barrier",
                minWidth: 25,
                className: styles.tableBarrier,
                Cell: row => (
                    <div>
                        {row.value === "C" ?
                            <Icon size={30}>check_circle</Icon> :
                            row.value === "W" ?
                                <Icon size={30}>access_time</Icon> :
                                <CircularProgress size={25} style={{ color: green[500] }}/>
                        }
                    </div>
                )
            },
            {
                Header: <Tooltip id="lane" title="Process lane"><div>Lane</div></Tooltip>,
                accessor: "lane",
                minWidth: 40,
                className: styles.tableCell
            },
            {
                Header: <Tooltip id="pid" title="Process Identifier"><div>ID</div></Tooltip>,
                accessor: "pid",
                minWidth: 30,
                className: styles.tableCell
            },
            {
                // Header: <Tooltip id="pname" title="Process name"><div>Process</div></Tooltip>,
                Header: "Process",
                accessor: "process",
                minWidth: 180,
                className: styles.tableProcess
            }, {
                // Header:  <Tooltip id="running" title="Submitted/Running processes"><div>Running</div></Tooltip>,
                Header: "Running",
                accessor: "running",
                minWidth: mainWidth,
                className: styles.tableCell
            }, {
                // Header:  <Tooltip id="completed" title="Completed processes"><div>Complete</div></Tooltip>,
                Header: "Complete",
                accessor: "complete",
                minWidth: mainWidth,
                className: styles.tableCell
            }, {
                // Header:  <Tooltip id="error" title="Process exited with error"><div>Error</div></Tooltip>,
                Header: "Error",
                accessor: "error",
                minWidth: mainWidth,
                className: styles.tableCell
            }, {
                // Header:  <Tooltip id="avgtime" title="Average time each process took"><div>Avg Time</div></Tooltip>,
                Header: "Avg Time",
                accessor: "avgTime",
                minWidth: mainWidth,
                className: styles.tableCell
            }, {
                // Header:  <Tooltip id="cpuhour" title="Cumulative CPU/hour measurement"><div>CPU/hour</div></Tooltip>,
                Header: "CPU/Hour",
                accessor: "cpuhour",
                minWidth: mainWidth,
                className: styles.tableCell
            }, {
                // Header:  <Tooltip id="maxmem" title="Maximum RAM used (MB)"><div>Max Mem</div></Tooltip>,
                Header: "Max Mem",
                accessor: "maxMem",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortIgnoreNA
            }, {
                // Header:  <Tooltip id="avgread" title="Average disk read (MB)"><div>Avg Read</div></Tooltip>,
                Header: "Avg Read",
                accessor: "avgRead",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortIgnoreNA
            }, {
                // Header:  <Tooltip id="avgwrite" title="Average disk write (MB)"><div>Avg Write</div></Tooltip>,
                Header: "Avg Write",
                accessor: "avgWrite",
                minWidth: mainWidth,
                className: styles.tableCell,
                sortMethod: sortIgnoreNA
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
                        <Typography variant={"title"} gutterBottom>
                            Showing '{this.props.header}' tags for process '{this.props.process}'
                            </Typography>
                        <Divider/>
                        <TagTabs header={this.props.header}
                                 processData={this.props.processData[this.props.process]}
                                 tagData={this.props.tagData[this.props.process]}/>
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
            let dt = {"sample": sample};
            headers.forEach((header) => {
                // Skip entries on in the header
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
                        dt[header] = this.state.tagData[sample][header]
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
            <TreeDag data={this.props.treeDag} processData={this.props.processData}
                     runStatus = {this.props.runStatus}/>

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
            "Queued": blue[100],
            "Running": blue[300],
            "Completed": green[500],
            "Aborted": red[300]
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
                                <Grid item xs={4}>
                                    <Icon size={30} style={{color: this.legendObj[k]}}>lens
                                    </Icon>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography align={"left"} style={{lineHeight: "25px"}}>{k}</Typography>
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
