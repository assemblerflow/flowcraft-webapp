import React from "react"
import { Link } from "react-router-dom";

import Typography from "@material-ui/core/Typography"
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

import logo from  "../../resources/Logo_small.png";

// Theme imports
import {themes} from "./reports/themes";
import {theme} from "../../config.json";

class Home extends React.Component {

    render () {

        const style = {
            root: {
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
            },
            headerText: {
                fontSize: "1.7vmax",
                fontWeight: "bold",
                color: "#6e6e6e",
            },
            logo: {
                height: "20%",
                width: "80%"
            },
            logoContainer: {
                display: "flex"
            },
            logoText: {
                fontSize: "1em",
                fontWeight: "bold",
                color: themes[theme].palette.primary.main,
                position: "absolute",
                bottom: "10px"
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
            }
        };

        return (
            <div style={style.root}>
                <div style={style.logoContainer}>
                    <img style={style.logo} src={logo} alt={"logo"}/>
                </div>
                <Typography style={style.headerText}>A Nextflow workflow assembler for genomics</Typography>
                <Typography style={style.notice}>We are currently building the website but the following services are already available:</Typography>
                <Grid container spacing={24} style={style.buttonContainer}>
                    <Link to={"inspect"} style={{textDecoration: "none"}}>
                        <Button variant={"outlined"} color={"primary"} style={style.mainButton}>Inspect</Button>
                    </Link>
                    <Link to={"reports"} style={{textDecoration: "none"}}>
                        <Button variant={"outlined"} color={"primary"} style={style.mainButton}>Reports</Button>
                    </Link>
                </Grid>
            </div>
        )
    }
}

export default Home