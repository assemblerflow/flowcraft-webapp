import React from "react"
import { Link } from "react-router-dom"
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";
import Grid from "@material-ui/core/Grid";

// Color imports
import green from "@material-ui/core/colors/green";

// CSS imports
const styles = require("../styles/header.css");

export class Header extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            headerTitle: props.headerTitle
        }
    }

    render () {
        return (
            <div style={{marginBottom: 25}}>
                <AppBar position={"static"} color="primary">
                    <Toolbar>
                        <IconButton>
                            <Icon>keyboard_arrow_left</Icon>
                        </IconButton>
                        <Grid container>
                            <Grid item xs={6} style={{minWidth: "200px"}}>
                                <Typography className={styles.secTitle}>Flowcraft</Typography>
                            </Grid>
                            <Grid item xs={6} style={{minWidth: "200px"}}>
                                <Typography className={styles.secTitle}>{this.state.headerTitle}</Typography>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
            </div>
        )
    }
};
