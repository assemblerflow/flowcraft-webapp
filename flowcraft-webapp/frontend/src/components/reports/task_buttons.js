// React imports
import React from "react"

import Select from "react-select";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Tooltip from "@material-ui/core/Tooltip";
import Divider from "@material-ui/core/Divider";
import Button from '@material-ui/core/Button';
import Dialog from "@material-ui/core/Dialog";

import PlusIcon from "mdi-react/PlusIcon";
import MagnifyIcon from "mdi-react/MagnifyIcon";
import FilterIcon from "mdi-react/FilterIcon";
import FileExportIcon from "mdi-react/FileExportIcon";
import {
    ReportDataConsumer,
    ReportAppConsumer,
} from './contexts';
import {sendFile} from './utils';


import styles from "../../styles/reports.css";

/**
 * This component wraps all Task buttons (e.g. Search, Filter). It controls
 * their order and show/hide behaviour. It is also the entry point of
 * callbacks that may need to be be passed to the Task activities themselves
 */
export class TaskButtons extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            active: false
        };

        this.showTaskButtons = this.showTaskButtons.bind(this);
        this.hideTaskButtons = this.hideTaskButtons.bind(this);
    }

    showTaskButtons(e) {
        this.setState({"active": true})
    }

    hideTaskButtons(e) {
        this.setState({"active": false})
    }

    render() {
        return (
            <div className={styles.moreOptionsButton}
                 onMouseLeave={this.state.active ? this.hideTaskButtons : () => {
                 }}
                 onMouseEnter={!this.state.active ? this.showTaskButtons : () => {
                 }}
                 onTouchStart={this.showTaskButtons}
                 onClick={this.hideTaskButtons}>
                {/*<FilterTask tableData={this.props.tableData} tableSamples={this.props.tableSamples} active={this.state.active}/>
                <SearchTask tableData={this.props.tableData} tableSamples={this.props.tableSamples} active={this.state.active}/>*/}
                <ReportDataConsumer>
                    {
                        ({reportData}) => (
                            <ReportAppConsumer>
                                {
                                    ({filters, highlights}) => (
                                        <ExportTask
                                            active={this.state.active}
                                            data={reportData}
                                            highlights={highlights}
                                            filters={filters}
                                        />
                                    )
                                }
                            </ReportAppConsumer>
                        )
                    }
                </ReportDataConsumer>
                <Button variant={"fab"} color={"primary"}>
                    <PlusIcon color={"white"}/>
                </Button>
            </div>
        )
    }
}

/**
 * The Search Task Button and dialog wrapper.
 */
class SearchTask extends React.Component {

    state = {
        open: false,
    };

    handleClickOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    render() {
        return (
            <div className={styles.taskButton} style={{
                "opacity": this.props.active ? 1 : 0,
                "marginBottom": this.props.active ? "15px" : "0"
            }}>
                <Button mini variant={"fab"} color={"default"}
                        onClick={this.handleClickOpen}>
                    <Tooltip id={"tooltip-search"} title={"Search samples"}
                             placement={"left"}>
                        <MagnifyIcon/>
                    </Tooltip>
                </Button>
                <SearchDialog
                    open={this.state.open}
                    onClose={this.handleClose}
                    tableData={this.props.tableData}
                    tableSamples={this.props.tableSamples}
                />
            </div>
        )
    }
}

/**
 * Dialog for the Search task.
 */
class SearchDialog extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tableSamples: this.fetchTableSamples(props.tableSamples),
            values: []
        }
    }

    fetchTableSamples = (tableSamples) => {

        const suggestions = [];

        for (const sample of tableSamples) {
            suggestions.push({
                "value": sample,
                "label": sample
            })
        }

        return suggestions
    };

    handleChange = (values) => {
        this.setState({values});
    };

    render() {

        const style = {
            selectContainer: {
                width: "100%",
                zIndex: 1000,
                paddingTop: "10px",
                paddingBottom: "20px"
            }
        };

        return (
            <Dialog classes={{paper: styles.taskDialogContainer}}
                    open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle>Search samples</DialogTitle>
                <div style={style.selectContainer}>
                    <Select name={"teste"}
                            value={this.state.values}
                            multi={true}
                            autoFocus
                            onChange={(vals) => {
                                this.handleChange(vals)
                            }}
                            options={this.state.tableSamples}/>
                </div>
                <DialogActions>
                    <Button color={"primary"} variant={"contained"}>
                        Search
                    </Button>
                    <Button onClick={this.props.onClose} color={"default"}
                            variant={"contained"}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}

/**
 * The Search Task Button and dialog wrapper.
 */
class FilterTask extends React.Component {
    render() {
        return (
            <div className={styles.taskButton} style={{
                "opacity": this.props.active ? 1 : 0,
                "marginBottom": this.props.active ? "15px" : "0"
            }}>
                <Button mini variant={"fab"} color={"default"}>
                    <Tooltip id={"tooltip-filter"} title={"Filter samples"}
                             placement={"left"}>
                        <FilterIcon/>
                    </Tooltip>
                </Button>
            </div>
        )
    }
}

/**
 * The Export Task Button and export data function. It allows the export of
 * reportData, highlights and filters applied to the reports
 */
class ExportTask extends React.Component {

    exportData = () => {
        const exportObject = {
            data: {
                results: this.props.data,
                highlights: this.props.highlights,
                filters: this.props.filters
            }
        };

        console.log(exportObject);
        const dataString = JSON.stringify(exportObject);
        sendFile("report.json", dataString, "application/json");

    };

    render() {
        return (
            <div className={styles.taskButton} style={{
                "opacity": this.props.active ? 1 : 0,
                "marginBottom": this.props.active ? "15px" : "0"
            }}>
                <Button mini variant={"fab"} color={"default"}
                        onClick={this.exportData}>
                    <Tooltip id={"tooltip-filter"} title={"Export Report"}
                             placement={"left"}>
                        <FileExportIcon/>
                    </Tooltip>
                </Button>
            </div>
        )
    }
}