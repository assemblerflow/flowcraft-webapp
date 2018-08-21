// React imports
import React from "react"
import { Link, DirectLink } from 'react-scroll'

import classNames from "classnames";

import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import Paper from "@material-ui/core/Paper";
import List from "@material-ui/core/List";

import ChevronLeftIcon from "mdi-react/ChevronLeftIcon";
import HeartIcon from "mdi-react/HeartIcon";
import PillIcon from "mdi-react/PillIcon";
import AlienIcon from "mdi-react/AlienIcon";
import TableLargeIcon from "mdi-react/TableLargeIcon";
import ChartLineIcon from "mdi-react/ChartLineIcon";
import FileDocumentBoxIcon from "mdi-react/FileDocumentBoxIcon";
import InformationIcon from "mdi-react/InformationIcon";


import {Header} from "../Header";

const styles = require("../../styles/drawer.css");


class TableOfContents extends React.Component {

    render() {

        return (
            <List style={{"paddingTop": 0}}>
                {this.props.tableHeaders &&
                <TableDrawer tableHeaders={this.props.tableHeaders}/>}
                {this.props.chartHeaders &&
                <ChartDrawer chartHeaders={this.props.chartHeaders}/>}
            </List>
        )
    }
}

export class ReportsHeader extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            drawerOpen: false,
            tabValue: "0"
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
                    <Link activeClass={styles.activeSideButton} to={"reportOverview"} smooth={true} duration={500} offset={-70}>
                        <DrawerButtonEntry icon={<InformationIcon/>}
                                           text={"Report Overview"} />
                    </Link>
                    {this.state.tabValue === "0" &&
                        <TableOfContents tableHeaders={this.props.tableHeaders}
                                         chartHeaders={this.props.chartHeaders}
                        />
                    }
                </Drawer>
                <main className={classNames(styles.content, this.state.drawerOpen && styles.contentShift)}>
                    {this.props.children}
                </main>
            </div>
        )
    }
}


class ChartDrawer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            expanded: true
        };

        this.toggleDrawer = this.toggleDrawer.bind(this)
    }

    toggleDrawer() {
        this.setState({"expanded": !this.state.expanded});
    }

    render () {

        const headerMap =  {
            "base_n_content": {"icon": <HeartIcon/>, "text": "FastQC"},
            "size_dist": {"icon": <FileDocumentBoxIcon/>, "text": "Contig size distribution"},
        };

        return (
            <div>
                <DrawerHeader onClick={this.toggleDrawer} icon={<ChartLineIcon/>} text={"Charts"}/>
                <div className={classNames(this.state.expanded ? styles.subDrawerOpen : styles.subDrawerClose)}>
                    {
                        this.props.chartHeaders.map((h) => {
                            if (headerMap.hasOwnProperty(h)){
                                return (
                                    <Link activeClass={styles.activeSideButton} key={h} to={`${h}Chart`} smooth={true} duration={500} offset={-70}>
                                        <DrawerButtonEntry key={h} icon={headerMap[h].icon}
                                                           text={headerMap[h].text}/>
                                    </Link>
                                )
                            }
                        })
                    }
                </div>
            </div>
        )
    }
}


class TableDrawer extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            expanded: true
        };

        this.toggleDrawer = this.toggleDrawer.bind(this)
    }

    toggleDrawer() {
        this.setState({"expanded": !this.state.expanded});
    }

    render () {

        const headerMap =  {
            "qc": {"icon": <HeartIcon/>, "text": "Quality Control"},
            "assembly": {"icon": <FileDocumentBoxIcon/>, "text": "Assembly"},
            "abricate": {"icon": <PillIcon/>, "text": "AMR"},
            "chewbbaca": {"icon": <AlienIcon/>, "text": "chewBBACA"},
            "typing": {"icon": <PillIcon/>, "text": "Typing"},
            "metadata": {"icon": <PillIcon/>, "text": "Metadata"},
            "phyloviz": {"icon": <PillIcon/>, "text": "PHYLOViZ"}
        };

        return (
            <div>
                <DrawerHeader onClick={this.toggleDrawer} icon={<TableLargeIcon/>} text={"Tables"}/>
                <div className={classNames(this.state.expanded ? styles.subDrawerOpen : styles.subDrawerClose)}>
                    {
                        this.props.tableHeaders.map((h) => {
                            return (
                                <Link activeClass={styles.activeSideButton} key={h} to={`${h}Table`} smooth={true} duration={500} offset={-70}>
                                    <DrawerButtonEntry icon={headerMap[h].icon}
                                                       text={headerMap[h].text} />
                                </Link>
                            )
                        })
                    }
                </div>
            </div>
        )
    }
}


class DrawerButtonEntry extends React.Component {

    render () {
        return(
                <ListItem button>
                    <ListItemIcon>
                        {this.props.icon}
                    </ListItemIcon>
                    <ListItemText primary={this.props.text}/>
                </ListItem>
        )
    }
}

class DrawerHeader extends React.Component {
    render () {
        return(
            <Paper onClick={this.props.onClick} className={styles.drawerHeader}>
                <ListItem>
                    <ListItemIcon>
                        {this.props.icon}
                    </ListItemIcon>
                    <ListItemText primary={this.props.text}/>
                </ListItem>
            </Paper>
        )
    }
}
