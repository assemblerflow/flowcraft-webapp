import React from "react"
import { Link } from "react-router-dom"
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    icon: {
        color: "#26af64",
    }
});

const Header = (props) => {

    const {classes} = props;

    return (
        <div style={{ marginBottom: 25}}>
            <AppBar position={"static"} color="default">
                <Toolbar>
                    <IconButton>
                        <Icon className={classes.icon}>keyboard_arrow_left</Icon>
                    </IconButton>
                    <Typography>
                        Assemblerflow
                    </Typography>
                </Toolbar>
            </AppBar>
        </div>
    )
};

export default withStyles(styles)(Header);