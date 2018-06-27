// React imports
import React from "react"
import ReactDOM from "react-dom";
import { Link, DirectLink, Element, Events, animateScroll as scroll, scrollSpy, scroller } from 'react-scroll'

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
import HeartIcon from "mdi-react/HeartIcon";
import PillIcon from "mdi-react/PillIcon";


import {Header} from "../Header";

const styles = require("../../styles/drawer.css");

export class ReportsHeader extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            drawerOpen: false,
            headers: props.headers,
            headerMap: {
                "qc": {"icon": <HeartIcon/>, "text": "Quality Control"},
                "assembly": {"icon": <SkullIcon/>, "text": "Assembly"},
                "abricate": {"icon": <PillIcon/>, "text": "AMR"}
            }
        }
    }

    openDrawer = () => {
        this.setState({drawerOpen: true})
    };

    closeDrawer = () => {
        this.setState({drawerOpen: false})
    };

    scrollTo(anchor){
        const anchorNode = ReactDOM.findDOMNode(anchor)
        console.log(anchorNode)
    }

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
                        {
                            this.state.headers.map((h) => {
                                return (
                                    <Link activeClass={styles.activeSideButton} key={h} to={`${h}Table`} spy={true} smooth={true} duration={500} offset={-70}>
                                        <ListItem button className={styles.drawerRow}>
                                            <ListItemIcon>
                                                {this.state.headerMap[h].icon}
                                            </ListItemIcon>
                                            <ListItemText primary={this.state.headerMap[h].text}/>
                                        </ListItem>
                                    </Link>

                                )
                            })
                        }
                    </List>
                </Drawer>
                <main className={classNames(styles.content, this.state.drawerOpen && styles.contentShift)}>
                    {this.props.children}
                </main>
            </div>
        )
    }
}