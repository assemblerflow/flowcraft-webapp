import React from "react";

import { Link } from "react-router-dom";

import Typography from "@material-ui/core/Typography"
import Button from "@material-ui/core/Button";
import Fade from '@material-ui/core/Fade';
import Grid from "@material-ui/core/Grid";

// Theme imports
import {themes} from "../reports/themes";
import {theme, service, address} from "../../../config.json";
import logo from "../../../resources/innuendo.svg";

export class HomeInnuendo extends React.Component{

    state = {
        showInspectTooltip: false,
        showReportsTooltip: false
    };

    render () {

        const style = {
            root: {
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
            },
            title: {
                fontSize: "2.5vmax",
                fontWeight: "bold",
                color: "#4572c1",
                textAlign: "left",
                position: "relative",
                marginBottom: "0px",
                top: "55%"
            },
            titleDiv: {
              position: "relative",
              bottom: "0",
              left: "0",
            },
            headerText: {
                fontSize: "1.5vmax",
                fontWeight: "bold",
                color: "#6e6e6e",
            },
            headerTip: {
                fontSize: "0.8vmax",
                float: "right",
                marginBottom: "5px"
            },
            headerTipDiv: {
                textAlign: "left"
            },
            logo: {
                height: "auto",
                width: "300px",
                position: "relative",
                top: "10%"
            },
            logoContainer: {
                display: "flex",
                textAlign: "center"
            },
            logoText: {
                fontSize: "1em",
                fontWeight: "bold",
                color: themes[theme].palette.primary.main,
                position: "absolute",
                bottom: "10px"
            },
            mainColor: {
                color: "#4572c1"
            },
            buttonContainer: {
                justifyContent: "center",
                marginTop: "30px"
            },
            mainButton: {
                minWidth: "180px",
                marginRight: "24px",
                marginBottom: "24px",
                fontSize: "20px"
            },
            notice: {
                marginTop: "10px",
                textAlign: "center",
                fontSize: "1.3vmax"
            },
            tooltipContainer: {
                position: "relative"
            },
            tooltip: {
                position: "absolute",
                top: 0,
                fontSize: "1.4vmax"
            }
        };

        return (
            <div style={style.root}>
                <div style={{"display": "flex"}}>
                    <div style={style.titleDiv}>
                        <Typography style={style.title}>INNUENDO Platform</Typography>
                    </div>
                    <div>
                        <img style={style.logo} src={logo} alt={"logo"}/>
                    </div>
                </div>
                <Typography style={style.headerText}>Integrating genomics into foodborne pathogens surveillance</Typography>
                <div  style={style.headerTipDiv}>
                    <Typography style={style.headerTip}>powered by <span style={style.mainColor}>FlowCraft</span></Typography>
                </div>
                <div style={{marginTop: "40px"}}>
                    <Typography style={style.notice}>Select one of the following options:</Typography>
                    <Grid container spacing={24} style={style.buttonContainer}>
                        <a href={`${address}app/`} style={{textDecoration: "none"}}>
                            <Button
                                onMouseEnter={() => {this.setState({showInspectTooltip: true})}}
                                onMouseLeave={() => {this.setState({showInspectTooltip: false})}}
                                variant={"outlined"}
                                color={"primary"}
                                style={style.mainButton}>App</Button>
                        </a>
                        <Link to={"reports"} style={{textDecoration: "none"}}>
                            <Button
                                onMouseEnter={() => {this.setState({showReportTooltip: true})}}
                                onMouseLeave={() => {this.setState({showReportTooltip: false})}}
                                variant={"outlined"}
                                color={"primary"}
                                style={style.mainButton}>Reports</Button>
                        </Link>
                    </Grid>
                </div>
                <div style={style.tooltipContainer}>
                    <Fade in={this.state.showInspectTooltip}>
                        <Typography style={style.tooltip} align={"center"}>Application for project creation and job submission</Typography>
                    </Fade>
                    <Fade in={this.state.showReportTooltip}>
                        <Typography style={style.tooltip} align={"center"}>See the interactive reports from a Flowcraft pipeline execution</Typography>
                    </Fade>
                </div>
            </div>
        )
    }
}