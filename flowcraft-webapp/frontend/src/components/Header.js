import React from "react"
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";

import GithubCircleIcon from "mdi-react/GithubCircleIcon"

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
                        <img src={"https://github.com/assemblerflow/flowcraft-webapp/raw/master/flowcraft-webapp/frontend/resources/flowcraft_text_white.png"} alt={"logo"} height={"15"}/>
                        <Typography style={{width: "100%", flex: 1}} align={"center"} className={styles.secTitle}><span style={{color: "#f2f2f2"}}>{this.state.headerTitle}</span> <span style={{fontSize: "12px"}}>v0.1</span></Typography>
                        <IconButton href={"https://github.com/assemblerflow/flowcraft"} target={"_blank"}>
                            <GithubCircleIcon color={"#fff"}/>
                        </IconButton>
                    </Toolbar>
                </AppBar>
            </div>
        )
    }
};
