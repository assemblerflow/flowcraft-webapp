// React imports
import React from "react"
import ReactTable from "react-table";

//Material UI imports
import CircularProgress from "@material-ui/core/CircularProgress";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import green from "@material-ui/core/colors/green";
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

// Other imports
import axios from "axios";

// CSS imports
const styles = require("../styles/inspect.css");

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
            headerInfo: {},
            tableData: {},
            tagData: {},
        };
    }

    updateJson(){
        axios.get(`api/status?run_id=${this.state.runID}`)
            .then(
                (response) => {
                    this.setState({loading: false});
                    this.setState({headerInfo: {
                            "pipelineTag": response.data.pipelineTag,
                            "pipelineName": response.data.pipelineName,
                            "runStatus": response.data.runStatus,
                            "numProcesses": response.data.processes.length,
                        }});
                    this.setState({tableData: {
                            "data": response.data.tableData,
                            "mappings": response.data.tableMappings
                        }});
                    this.setState({tagData: response.data.processTags})
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
                                <HeaderCard headerInfo={this.state.headerInfo}/>
                                {this.state.tableData.data ?
                                    <div>
                                        <MainTable tableData={this.state.tableData}
                                                   tagData={this.state.tagData}/>
                                        <MainDag/>
                                    </div>  :
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
                        margin="normal"
                        className={styles.textRunId}/>

                </Paper>
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
                              style={{ color: "#26af64" }}
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
Header component of the inspection with summary information
 */
class HeaderCard extends React.Component {
    render () {
        return (
            <PaperContainer title={"Pipeline overview"}>
                <Grid container className={styles.headerGrid}
                      justify={"center"}
                      spacing={24}>
                      <Grid item>
                          <HeaderPaper header={"Pipeline name"}
                                       value={this.props.headerInfo.pipelineName}/>
                      </Grid>
                      <Grid item>
                          <HeaderPaper header={"Pipeline tag"}
                                       value={this.props.headerInfo.pipelineTag}/>
                      </Grid>
                      <Grid item>
                          <HeaderPaper header={"Number of processes"}
                                       value={this.props.headerInfo.numProcesses}/>
                      </Grid>
                      <Grid item >
                          <HeaderPaper header={"Run status"}
                                       value={this.props.headerInfo.runStatus}/>
                      </Grid>
                </Grid>
            </PaperContainer>
        )
    }
}

/*
Main table component
*/
class MainTable extends React.Component {
    render () {
        return (
            <Paper className={styles.mainPaper}>
                <h2>Table Overview</h2>
                 <TableOverview header={this.props.tableData.header}
                                data={this.props.tableData.data}
                                mappings={this.props.tableData.mappings}
                                tagData={this.props.tagData}/>
            </Paper>
        )
    }
}

/*
Table and DAG controller
 */
class MainDag extends React.Component {
    render () {
        return (
            <Paper xs={12} md={6} className={styles.mainPaper}>
                <h2>DAG Overview</h2>
            </Paper>
        )
    }
}

/*
Main paper components
 */

class PaperContainer extends React.Component {
    render () {
        return (
            <div>
                <Paper className={styles.paperContainer}>
                    <Typography gutterBottom align={"center"} variant={"headline"}>{this.props.title}</Typography>
                    <div>{this.props.children}</div>
                </Paper>
            </div>
        )
    }
}

/*
Individual card components
 */
class HeaderPaper extends React.Component {
    render () {
        return (
            <div>
                <Paper className={styles.headerPaper}>
                    <p className={styles.cardHeader}>
                        {this.props.header}
                    </p>
                    <p className={styles.cardValue}>
                        {this.props.value}
                    </p>
                </Paper>
            </div>
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
                                                     tagData={this.props.tagData}/>
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
                minWidth: 25,
                className: styles.tableCell
            },
            {
                Header: <Tooltip id="pid" title="Process Identifier"><div>ID</div></Tooltip>,
                accessor: "pid",
                minWidth: 25,
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
             <div className={styles.tableRoot}>
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
                        <List>
                            {this.props.tagList.map((t) => {
                                return (
                                <ListItem key={t}>
                                    <ListItemText primary={t}/>
                                </ListItem>
                                )
                            })}
                        </List>
                    </Paper>
                </Modal>
            </div>
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

// export default withStyles(styles)({Inspect, InspectHome});
