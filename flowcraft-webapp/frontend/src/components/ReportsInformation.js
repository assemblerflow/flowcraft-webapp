import React from "react";

import InfoIcon from "mdi-react/InformationIcon";
import ChevronRightIcon from "mdi-react/ChevronRightIcon";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import {MuiThemeProvider} from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import Divider from "@material-ui/core/Divider";

import Drawer from '@material-ui/core/Drawer';

// Theme imports
import {theme, service} from "../../config.json";

import {ReportDataConsumer} from "./reports/contexts";

/**
 * Right Drawer which can be used to set any informtion we want to display.
 * Used to display currently used software and its version.
 */
export class InfoDrawer extends React.Component {

    state = {
        open: false,
        right: false
    };

    handleClickOpen = () => {
        this.setState({open: true})
    };

    toggleDrawer = (side, open) => () => {
        this.setState({
            [side]: open,
        });
    };

    render() {
        return (
            <div>
                <Button mini variant={"fab"} color={"default"}
                        onClick={this.toggleDrawer('right', true)}>
                    <Tooltip id={"tooltip-filter"} title={"Information"}
                             placement={"left"}>
                        <InfoIcon/>
                    </Tooltip>
                </Button>
                <Drawer anchor="right" open={this.state.right}
                        onClose={this.toggleDrawer('right', false)}>
                    <div
                        tabIndex={0}
                        role="button"
                    >
                        <ReportDataConsumer>
                            {
                                ({reportData}) => (
                                    <SoftwareVersions
                                        reportData={reportData}/>

                                )
                            }
                        </ReportDataConsumer>
                    </div>
                </Drawer>
            </div>
        )
    }
}

/**
 * List with the software used to build the current Report and their versions
 */
class SoftwareVersions extends React.Component {

    constructor(props) {
        super(props);

        let versions = {};
        if (props.reportData) {
            versions = this.getSoftwareVersions();
        }

        this.state = {
            versions: versions
        }

    }

    // Update in case the list of current software or versions changes
    static componentShouldUpdate() {
        const getVersions = this.getSoftwareVersions();
        if (JSON.stringify(this.state.versions) !== JSON.stringify(getVersions)) {
            this.setState({
                versions: getVersions
            });

        }
        else {
            return false;
        }
    }

    // Gets the software versions from the ReportData
    getSoftwareVersions() {
        const versions = {};

        for (const report of this.props.reportData) {
            if (report.hasOwnProperty("versions") && Array.isArray(report.versions)) {
                for (const version of report.versions) {
                    if (!versions.hasOwnProperty(version.program)) {
                        versions[version.program] = [version.version];
                    }
                    if (versions.hasOwnProperty(version.program) && !versions[version.program].includes(version.version)) {
                        versions[version.program].push(version.version);
                    }
                }
            }
        }

        return versions;
    }

    render() {

        const style = {
            typography: {
                marginTop: "6%",
                marginBottom: "4%"
            }
        };

        return (
            <div style={{flexGrow: 1, textAlign: "center"}}>
                <Typography
                    variant="headline"
                    gutterBottom
                    style={style.typography}
                >
                    Software
                </Typography>
                <Divider/>
                <List>
                    {
                        Object.keys(this.state.versions).length > 0 &&
                        Object.keys(this.state.versions).map((software, i) => {
                            return <ListItem key={i}>
                                <Avatar>
                                    <ChevronRightIcon/>
                                </Avatar>
                                <ListItemText primary={software}
                                              secondary={this.state.versions[software].join(", ")}/>
                            </ListItem>
                        })
                    }
                </List>
            </div>

        )
    }
}
