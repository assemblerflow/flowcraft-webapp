import React from "react";
import {Link} from "react-router-dom";

import classNames from "classnames";

import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import AppBar from "@material-ui/core/AppBar";
import Paper from "@material-ui/core/Paper";
import Badge from "@material-ui/core/Badge";
import Fade from "@material-ui/core/Fade";

import {withStyles} from '@material-ui/core/styles';

import GithubCircleIcon from "mdi-react/GithubCircleIcon";
import InboxArrowDown from "mdi-react/InboxArrowDownIcon";
import InboxIcon from "mdi-react/InboxIcon";
import RecordIcon from "mdi-react/RecordIcon"
import MenuIcon from "mdi-react/MenuIcon";
import HomeIcon from "mdi-react/HomeIcon"
import TriangleIcon from "mdi-react/TriangleIcon"
import MagnifyIcon from "mdi-react/MagnifyIcon"
import FinanceIcon from "mdi-react/FinanceIcon"

import {ReportBroadcastConsumer, ReportDataConsumer} from "./reports/contexts";
// CSS imports
// const styles = require("../styles/header.css");
import {version} from "../../../package.json";
// Theme imports
import {themes} from "./reports/themes";
import {service, theme} from "../../config.json";
import axios from "axios";

const styles = {
    secTitle: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#fff",
        minWidth: "100px"
    },
    appBar: {
        zIndex: "1300",
        "-webkit-transition": "width .5s",
        "transition": "width .5s"
    },
    appBarShift: {
        marginLeft: "280px",
        width: "calc(100% - 280px)",
        "-webkit-transition": "width .5s",
        "transition": "width .5s"
    },
    menuButton: {
        [themes[theme].breakpoints.up("xs")]: {
            marginLeft: "-12px",
        }
    },
    logo: {
        [themes[theme].breakpoints.down("xs")]: {
            display: "none",
        }
    },
    title: {
        [themes[theme].breakpoints.down("xs")]: {
            display: "none",
        }
    },
    badge: {
        border: `2px solid ${themes[theme].palette.grey[200]}`,
        color: "#fff",
        top: "-14px",
        right: "-16px",
    },
    liveIndicatorContainer: {
        display: "flex"
    },
    recordIndicator: {
        margin: "auto"
    },
    notification: {
        position: "absolute",
        top: "12px",
        right: "-10px",
        minWidth: "230px",
        maxWidth: "230px",
        padding: "10px",
        backgroundColor: themes[theme].palette.error.main,
    },
    notificationMarker: {
        position: "absolute",
        // top: "45px",
        right: "10px",
        height: "15px",
        zIndex: "100",
        fill: themes[theme].palette.error.main,
    },
    notificationText: {
        color: "#fff",
        fontWeight: "bold"
    }
};


class Header extends React.Component {

    state = {
        reportRedirect: false,
    };

    componentDidMount(){
        console.log(this.props)

        if (this.props.headerTitle === "Inspect" && this.props.runId){
            axios.get(`/reports/broadcast/api/reports/exists?run_id=${this.props.runId}`)
                .then(
                    (response) => {
                        if (response.data.message === true){
                            this.setState({reportRedirect: true})
                        }
                    },
                    (error) => {
                        console.log(error)
                    })
        } else if (this.props.headerTitle === "Reports" && this.props.runId) {
            axios.get(`/inspect/api/status/exists?run_id=${this.props.runId}`)
                .then(
                    (response) => {
                        console.log(response)
                        if (response.data.message === true){
                            this.setState({reportRedirect: true})
                        }
                    },
                    (error) => {
                        console.log(error)
                    }
                )
        }

    }

    render() {

        const { classes } = this.props;

        const style = {
            icon: {
                fill: "#fff"
            }
        };

        return (
            <ReportBroadcastConsumer>
                {
                    ({liveReport, runId, fetchReports}) => (
                        <div style={{marginBottom: 85}}>
                            <AppBar position={"fixed"} color="primary"
                                    className={classNames(classes.appBar, this.props.drawer && classes.appBarShift)}>
                                <Toolbar>
                                    {(this.props.drawerButton && !this.props.drawer) &&
                                    <IconButton onClick={this.props.openDrawer}
                                                className={classes.menuButton}>
                                        <MenuIcon style={style.icon}/>
                                    </IconButton>}
                                    {
                                        this.props.homeRef &&
                                        <ReportDataConsumer>
                                            {
                                                ({additionalInfo}) => (
                                                    <IconButton
                                                        style={{paddingTop: "5px"}}>
                                                        <Link to={{
                                                            pathname: this.props.homeRef,
                                                            state: {"additionalInfo": JSON.stringify(additionalInfo)}
                                                        }}><HomeIcon
                                                            style={style.icon}/></Link>
                                                    </IconButton>
                                                )
                                            }
                                        </ReportDataConsumer>
                                    }
                                    <Typography style={{width: "100%", flex: 1}}
                                                align={"center"}
                                                className={classes.secTitle}><span
                                        style={{color: "#f2f2f2"}}>{this.props.headerTitle}</span>
                                        <span
                                            className={classes.title}
                                            style={{
                                                fontSize: "12px",
                                                color: "#cbcbcb",
                                                marginLeft: "5px"
                                            }}>Beta</span></Typography>
                                    {
                                        this.state.reportRedirect &&
                                        <AppSwitcher
                                            runId={this.props.runId}
                                            header={this.props.headerTitle}/>
                                    }
                                    {
                                        (typeof liveReport !== "undefined" && liveReport === true) &&
                                            <LiveReportTracker runId={runId} updateCallback={fetchReports}/>
                                    }
                                    <IconButton
                                        href={"https://github.com/assemblerflow/flowcraft"}
                                        target={"_blank"}>
                                        <GithubCircleIcon style={style.icon}/>
                                    </IconButton>
                                </Toolbar>
                            </AppBar>
                        </div>
                    )
                }
            </ReportBroadcastConsumer>
        )
    }
}
export default withStyles(styles)(Header);

class AppSwitcher extends React.Component{

    state = {
        showNotification: this.props.header === "Inspect" ? true : false
    };

    componentDidMount(){
        // The automatic notification in only ON for inspect app to avoid
        // notification conflict with the live tracker icon of the reports app
        if (this.props.header === "Inspect"){
            setTimeout(
                () => {this.setState({showNotification: false})},
                5000
            )
        }
    }

    render() {

        const {classes} = this.props;

        const message = this.props.header === "Inspect" ?
            "Report data is available for this inspect ID" :
            "Inspect data is available for this report ID";
        const pathname = this.props.header === "Inspect" ?
            `/reports/broadcast/${this.props.runId}` :
            `/inspect/${this.props.runId}`;
        console.log(pathname)

        return(
            <div>
                <Tooltip title={"Click to open reports app for this inspect ID"}>
                    <IconButton>
                        <Link to={{
                            pathname: pathname
                        }}>
                            {
                                this.props.header === "Inspect" ?
                                    <FinanceIcon style={{"fill": "#fff"}}/> :
                                    <MagnifyIcon style={{"fill": "#fff"}}/>

                            }
                        </Link>
                    </IconButton>
                </Tooltip>
                <Fade in={this.state.showNotification}>
                    <div style={{position: "relative"}}>
                        <TriangleIcon className={classes.notificationMarker}/>
                        <Paper elevation={5} className={classes.notification}>
                            <Typography className={classes.notificationText}>{message}</Typography>
                        </Paper>
                    </div>
                </Fade>
            </div>
        )
    }
}
AppSwitcher = withStyles(styles)(AppSwitcher);

class LiveReportTracker extends React.Component{

    state = {
        reportQueue: 0,
        status: null,
        showNotification: false
    };

    getRunStatus = () => {
        axios.get(`api/reports?run_id=${this.props.runId}&status=true`)
            .then((response) => {
                    this.setState({status: response.data.status})
                },
                (error) => {
                    console.log(error)
                }
            )
    };

    componentDidMount(){

        this.getRunStatus();

        const reportsSocket = new WebSocket(
            "ws://" + window.location.host + "/ws/report/" +
            this.props.runId + "/"
        );

        reportsSocket.onmessage = (e) => {
            const message = parseInt(JSON.parse(e.data).message);
            this.setState({reportQueue: this.state.reportQueue + message})
            this.getRunStatus();
            console.log(this.state.reportQueue)
        };
    }

    componentDidUpdate(prevPros, prevState){
        if (prevState.reportQueue === 0 && this.state.reportQueue > 0){
            this.setState({showNotification: true});
            setTimeout(() => {this.setState({showNotification: false})}, 6000);
        }
    }

    render(){

        const {classes} = this.props;

        const indicatorColor = {
            "running": themes[theme].palette.secondary.main,
            "aborted": themes[theme].palette.error.main,
            "complete": themes[theme].palette.success.main
        };

        return(
            <div>
                <div className={classes.liveIndicatorContainer}>
                    {
                        this.state.status &&
                        <Tooltip title={`Pipeline run status: ${this.state.status}`}>
                            <div className={classes.recordIndicator}>
                                <RecordIcon size={14} color={indicatorColor[this.state.status]}/>
                            </div>
                        </Tooltip>
                    }
                    <Tooltip title={(this.state.reportQueue > 0) ?
                        `There are ${this.state.reportQueue} new reports available. Click to update.` :
                        `There are no new reports available`}>
                        <IconButton onClick={() => {this.props.updateCallback(); this.setState({reportQueue: 0, showNotification: false})}}>
                            {
                                (this.state.reportQueue !== 0) ?
                                    <Badge classes={{badge: classes.badge}}
                                           badgeContent={this.state.reportQueue}
                                           color={"error"}>
                                        <InboxArrowDown color={"#fff"}/>
                                    </Badge> :
                                    <InboxIcon color={"#c4c4c4"}/>
                            }
                        </IconButton>
                    </Tooltip>
                </div>
                <Fade in={this.state.showNotification}>
                    <div style={{position: "relative"}}>
                        <TriangleIcon className={classes.notificationMarker}/>
                        <Paper elevation={5} className={classes.notification}>
                            <Typography className={classes.notificationText}>New report data is available</Typography>
                        </Paper>
                    </div>
                </Fade>
            </div>
        )
    }
}
LiveReportTracker = withStyles(styles)(LiveReportTracker);