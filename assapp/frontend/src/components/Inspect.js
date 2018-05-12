import React from "react"
import Paper from "material-ui/Paper";
import TextField from "material-ui/TextField"
import { CircularProgress } from 'material-ui/Progress';
import axios from "axios";
import Typography from "material-ui/Typography";
import Grid from "material-ui/Grid";
import Table, { TableBody, TableCell, TableHead, TableRow } from "material-ui/Table";

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
        }
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
            tableData: {}
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
                            "header": response.data.tableHeader,
                            "data": response.data.tableStats
                        }});
                    console.log(this.state.tableData);
                },
                (error) => {
                    this.setState({badRequest: true});
                    console.log(error);
                }
            );
    }

    componentDidMount() {
        this.hook = setInterval(
            () => this.updateJson(),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.hook);
    }

    render () {
        return (
            <div>
                {
                    this.state.badRequest ?
                        <BadRequestPaper runID={this.state.runID}/> :
                        this.state.loading ?
                            <Loader/> :
                            <div>
                                <HeaderCard headerInfo={this.state.headerInfo}/>
                                {this.state.tableData.header ?
                                    <MainPaper tableData={this.state.tableData}/> :
                                    <div>waiting</div>
                                }
                            </div>
                }
            </div>
        )
    }

}

export class InspectHome extends React.Component {
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
            <div>
                <Grid container className={styles.headerRoot}
                      justify={"center"}
                      spacing={24}
                      xs={12}>
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
            </div>
        )
    }
}

/*
Table and DAG controller
 */
class MainPaper extends React.Component {
    render () {
        return (
            <Grid container spacing={24} className={styles.headerRoot}>
                <Grid item xs={12} sm={6}>
                    <Paper xs={12} sm={6} className={styles.mainPaper}>
                        <h2>Table Overview</h2>
                        <TableOverview header={this.props.tableData.header}/>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Paper xs={12} sm={6} className={styles.mainPaper}>
                        <h2>DAG Overview</h2>
                    </Paper>
                </Grid>
            </Grid>
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
class TableOverview extends React.Component {

    render () {
        return (
            <div className={styles.tableRoot}>
                <Table className={styles.tableMain}>
                    <TableHead>
                        <TableRow>
                            {this.props.header.map(val => {
                                return (
                                    <TableCell>{val}</TableCell>
                                )
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>

                    </TableBody>
                </Table>
            </div>
        )
    }
}

// export default withStyles(styles)({Inspect, InspectHome});
