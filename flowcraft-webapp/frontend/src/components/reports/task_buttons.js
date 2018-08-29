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
import {InfoDrawer} from "../ReportsInformation";
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import PlusIcon from "mdi-react/PlusIcon";
import ContentSaveIcon from "mdi-react/ContentSaveIcon";
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
                <InfoTask active={this.state.active}/>
                <ReportDataConsumer>
                    {
                        ({reportData, additionalInfo}) => (
                            <ReportAppConsumer>
                                {
                                    ({filters, highlights}) => (
                                        <div>
                                            <ExportTask
                                                active={this.state.active}
                                                data={reportData}
                                                highlights={highlights}
                                                filters={filters}
                                            />
                                            {
                                                additionalInfo.innuendo &&
                                                <SaveInnuendoTask
                                                    active={this.state.active}
                                                    data={reportData}
                                                    filters={filters}
                                                    highlights={highlights}
                                                    additionalInfo={additionalInfo}
                                                />
                                            }
                                        </div>
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
 * A button to get all information regarding the software used, reports
 * version and developers.
 */
class InfoTask extends React.Component {

    render() {
        return (
            <div className={styles.taskButton} style={{
                "opacity": this.props.active ? 1 : 0,
                "marginBottom": this.props.active ? "15px" : "0"
            }}>
                <InfoDrawer/>
            </div>
        )
    }
}

/**
 * A button to save the current report at the INNUENDO database
 */
class SaveInnuendoTask extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: false,
            reportName: "",
            reportDescription: "",
            public: false
        }
    }

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleChange = name => event => {
        this.setState({
            [name]: event.target.value,
        });
    };

    handleChangeCheckbox = name => event => {
        this.setState({
            [name]: event.target.checked
        })
    };

    saveReport = () => {
        if (this.state.reportName !== "") {
            const strainNames = [];
            const strainToProjects = {};
            const finalMapping = [[],[]];

            // Get strains available in the innuendo reports
            for (const report of this.props.data) {
                if (report.hasOwnProperty("strainID")) {
                    strainNames.push(report.strainID);
                    strainToProjects[report.strainID] = [];
                }
            }

            // Get the reports associated with each strain
            for (const strain of strainNames) {
                for (const report of this.props.data) {
                    if (report.hasOwnProperty("reportJson") && report.sample_name === strain) {
                        if(!strainToProjects[strain].includes(report.projectid)) {
                            strainToProjects[strain].push(report.projectid);
                        }
                    }
                }
            }

            // Set projects and strains mapping
            for (const strain in strainToProjects) {
                for (const project of strainToProjects[strain]) {
                    finalMapping[0].push(strain);
                    finalMapping[1].push(project);

                }
            }

            const data = {
                projects_id: finalMapping[1].join(),
                strain_names: finalMapping[0].join(),
                filters: JSON.stringify(this.props.filters),
                highlights: JSON.stringify(this.props.highlights),
                user_id: this.props.additionalInfo.innuendo.getUserId(),
                username: this.props.additionalInfo.innuendo.getUsername(),
                description: this.state.reportDescription,
                name: this.state.reportName,
                is_public: this.state.public
            };

            console.log(data);

            this.props.additionalInfo.innuendo.saveReport(data).then((response) => {
                console.log(response);
            }).catch((response) => {
                console.log(response);
            });

        }
    };

    render() {

        const style = {
            selectContainer: {
                width: "100%",
                zIndex: 1000,
                paddingTop: "10px",
                paddingBottom: "20px"
            },
            groupRow: {
                width: "100%",
                marginBottom: "5px"
            },
            input: {
                width: "100%"
            },
            title: {
                textAlign: "center"
            }
        };

        return (
            <div>
                <div className={styles.taskButton} style={{
                    "opacity": this.props.active ? 1 : 0,
                    "marginBottom": this.props.active ? "15px" : "0"
                }}>
                    <Button mini variant={"fab"} color={"default"}
                            onClick={this.handleOpen}>
                        <Tooltip id={"tooltip-filter"} title={"Save INNUENDO" +
                        " Report"}
                                 placement={"left"}>
                            <ContentSaveIcon/>
                        </Tooltip>
                    </Button>
                </div>
                <Dialog classes={{paper: styles.taskDialogContainer}}
                        open={this.state.open}>
                    <DialogTitle style={style.title}>Save INNUENDO Report</DialogTitle>
                    <div style={style.selectContainer}>
                        <FormGroup row style={style.groupRow}>
                            <TextField
                                id="reportName"
                                label="Report Name"
                                style={style.input}
                                value={this.state.reportName}
                                onChange={this.handleChange("reportName")}
                                required
                            />
                        </FormGroup>
                        <FormGroup row style={style.groupRow}>
                            <TextField
                                id="reportDescription"
                                label="Report Description"
                                style={style.input}
                                value={this.state.reportDescription}
                                onChange={this.handleChange("reportDescription")}
                                required
                            />
                        </FormGroup>
                        <Typography><b>NOTE:</b> Only strain reports available
                            in the INNUENDO Platform will be
                            stored.</Typography>
                        <FormGroup row style={style.groupRow}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.public}
                                        onChange={this.handleChangeCheckbox('public')}
                                        value="checkedPublic"
                                    />
                                }
                                label="Is Public"
                            />
                        </FormGroup>
                    </div>
                    <DialogActions>
                        <Button color={"primary"} variant={"contained"}
                                onClick={this.saveReport}
                        >
                            Save
                        </Button>
                        <Button onClick={this.handleClose} color={"default"}
                                variant={"contained"}>
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
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