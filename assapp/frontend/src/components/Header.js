import React from "react"
import { Link } from "react-router-dom"
import AppBar from "material-ui/AppBar";
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";
import IconButton from "material-ui/IconButton";
import Icon from "material-ui/Icon";
import { withStyles } from 'material-ui/styles';

const styles = theme => ({
    icon: {
        color: "#26af64",
    }
});

const Header = (props) => {

    const {classes} = props;

    return (
        <div>
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