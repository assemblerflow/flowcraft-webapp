// React imports
import React from "react"

import classNames from "classnames";

import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";

import SkullIcon from "mdi-react/SkullIcon";
import ChevronLeftIcon from "mdi-react/ChevronLeftIcon";

import {Header} from "../Header";

const styles = require("../../styles/drawer.css");

export class ReportsHeader extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            drawerOpen: false
        }
    }

    openDrawer = () => {
        this.setState({drawerOpen: true})
    };

    closeDrawer = () => {
        this.setState({drawerOpen: false})
    };

    render () {
        return (
            <div>
                <Header headerTitle={"Reports"}
                        drawerButton={true}
                        drawer={this.state.drawerOpen}
                        openDrawer={this.openDrawer}/>

                <Drawer variant={"permanent"}
                        open={this.props.drawerOpen}
                        classes={{paper: classNames(styles.drawerPaper, !this.state.drawerOpen && styles.drawerPaperClose)}}>
                    <div className={styles.toolbar}>
                        <IconButton className={styles.closeDrawerButton} onClick={this.closeDrawer}>
                            <ChevronLeftIcon/>
                        </IconButton>
                    </div>
                    <Divider/>
                    <List>
                        <ListItem button className={styles.drawerRow}>
                            <ListItemIcon>
                                <ChevronLeftIcon/>
                            </ListItemIcon>
                            <ListItemText primary={"Testeas dasda sda sd"}/>
                        </ListItem>
                    </List>
                </Drawer>
                <main className={classNames(styles.content, this.state.drawerOpen && styles.contentShift)}>
                    {this.props.children}
                </main>
            </div>
        )
    }
}