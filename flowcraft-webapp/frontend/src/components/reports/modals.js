import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';

import CloseCircleIcon from "mdi-react/CloseCircleIcon";
import FileTreeIcon from "mdi-react/FileTreeIcon";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import CloseIcon from '@material-ui/icons/Close';
import WarningIcon from '@material-ui/icons/Warning';

import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import {TableButton} from "./tables";

import Select from '../SelectPlusAll';

import {themes} from "./themes";
import {theme} from "../../../config";

import styles from "../../styles/reports.css";

// Import Colors
import red from "@material-ui/core/colors/red";
import green from '@material-ui/core/colors/green';
import orange from '@material-ui/core/colors/orange';
import grey from '@material-ui/core/colors/grey';

import classNames from 'classnames';


export class PositionedSnackbar extends React.Component {

    state = {
        open: false,
        message: "",
        type: "info"
    };

    // Required to set reference on parent component to allow state change
    componentDidMount() {
        this.props.onRef(this);
    }

    componentWillUnmount() {
        this.props.onRef(undefined);
    }

    handleClose = () => {
        this.setState({open: false});
    };

    // USed on parent component to set the snackbar state
    handleOpen = (message, type) => {
        console.log("ANNND OPEN!")
        this.setState({open: true, message, type});
    };

    render() {

        // Different icons and colours are used depending on the selected
        // snackbar message type
        const variantIcon = {
            success: CheckCircleIcon,
            warning: WarningIcon,
            error: ErrorIcon,
            info: InfoIcon,
        };

        const style = {
            success: {
                backgroundColor: themes[theme].palette.success.main,
            },
            error: {
                backgroundColor: themes[theme].palette.error.main,
            },
            info: {
                backgroundColor: themes[theme].palette.info.main,
            },
            warning: {
                backgroundColor: themes[theme].palette.warning.main,
            },
            loading: {
                backgroundColor: themes[theme].palette.info.main
            },
            loadingCircle: {
                color: themes[theme].palette.success.main
            },
            icon: {
                fontSize: 20,
                color: "white"
            },
            iconVariant: {
                opacity: 0.9,
                marginRight: "50px"
            },
            message: {
                color: "white",
                display: "flex",
                alignItems: "center",
                marginLeft: "10px",
                fontSize: "16px"
            }
        };

        const {open, message, type} = this.state;
        const Icon = variantIcon[type];

        return (
            <div>
                <Snackbar
                    anchorOrigin={{
                        vertical: this.props.vertical,
                        horizontal: this.props.horizontal
                    }}
                    open={open}
                    autoHideDuration={
                        (this.props.autoHideDuration) ?
                            this.props.autoHideDuration : 6000
                    }
                    onClose={this.handleClose}
                >
                    <SnackbarContent
                        style={style[type]}
                        action={[
                            <IconButton
                                onClick={this.handleClose}
                                key="close"
                                style={style.icon}
                            >
                                <CloseIcon/>
                            </IconButton>
                        ]}
                        message={
                            <span id="message-snackbar" style={style.message}>
                                {
                                    type === "loading" ?
                                        <CircularProgress size={30} style={style.loadingCircle}/> :
                                         <Icon className={classNames(style.icon, style.iconVariant)}/>
                                }
                                <Typography
                                    style={style.message}>{message}</Typography>
                            </span>}
                    />
                </Snackbar>
            </div>
        );
    }
}


export class BasicModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: false
        };
    }

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
        // Trigger setModalState available on parent component
        this.props.setModalState(false);
    };

    // Handle modal open and close based on props provided from parent
    componentDidUpdate() {
        if (!this.state.open && this.props.openModal) {
            this.handleOpen();
        }
        else if (!this.props.openModal && this.state.open) {
            this.handleClose();
        }
    }

    render() {

        return (
            <div>
                <Modal
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                    open={this.state.open}
                    onClose={this.handleClose}
                >
                    <div className={styles.centralModal}>
                        <div className={styles.modalBody}>
                            <div className={styles.modalHeader}>
                                <Typography style={{"flexGrow": 1}}
                                            variant="title" id="modal-title">
                                    {this.props.title}
                                </Typography>
                                <IconButton className={styles.modalCloseButton}
                                            onClick={this.handleClose}>
                                    <CloseCircleIcon size={30}
                                                     color={red[300]}/>
                                </IconButton>
                            </div>
                            <Divider/>
                            {this.props.children}
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}

/**
 * Modal that allows to send requests to the PHYLOViZ Online service according
 to the selected profiles in the report.
 */
export class PhylovizModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            open: false,
            missings: true,
            missingsCharacter: "0",
            speciesValues: [],
            closestStrains: 0,
            phylovizUser: "",
            phylovizPass: "",
            makePublic: false,
            description: "",
            selection: {keys: []},
            // Intervals used to retrieve status of phyloviz trees processing
            intervalCheckTree: {},
            intervalCheckPhylovizTrees: {},
            additionalInfoValues: [],
            additionalData: {},
            versions: []
        };
    }

    static getDerivedStateFromProps(props, state) {
        return {
            // Pass table selection data to modal
            selection: props.selection
        }
    }

    /*
    Get available column entries on the report to pass to PHYLOViZ has
     additional data
     */
    getAvailableColumnEntries = () => {

        const processToOptions = {};
        const mergedOptions = [];
        let count = 0;

        for (const [table, vals] of this.props.tableData.entries()) {
            for (const val of vals) {
                if (!processToOptions.hasOwnProperty(val.processName)) {
                    count += 1;
                    processToOptions[val.processName] = {
                        key: count,
                        label: val.processName,
                        options: [],
                        fieldKeys: []
                    }
                }
                else {
                    if (!processToOptions[val.processName].fieldKeys.includes(val.header)) {
                        processToOptions[val.processName].fieldKeys.push(val.header);
                        processToOptions[val.processName].options.push(
                            {
                                label: val.header,
                                value: val.header,
                                process: val.processName
                            }
                        )
                    }
                }
            }
        }

        for (const vals of Object.values(processToOptions)) {
            mergedOptions.push(vals);
        }

        return mergedOptions;

    };

    /*
    Set the additionalData object to pass to PHYLOViZ Online (PROTOTYPE)
     */
    setAdditionaData = () => {

        const additionalData = {};
        // Get job identifier from selection data
        const sampleNames = this.state.selection.rows.map((s) => {
            return `${s._id}`
        });

        for (const sample of sampleNames) {
            additionalData[sample] = {};
            for (const infoKey of this.state.additionalInfoValues) {
                for (const [table, vals] of this.props.tableData.entries()) {
                    for (const val of vals) {
                        // Check if process, sample and property match the
                        // report entry
                        if (val.rowId === sample && val.processName === infoKey.process && val.header === infoKey.value) {
                            // Add each gene as part of the additionalData
                            // in case of AMR
                            if (val.table === "abricate") {
                                for (const gene of val.geneList) {
                                    additionalData[sample][gene] = true
                                }
                            } else {
                                // Add the value of each of the selected
                                // table fields to the additionalData
                                additionalData[sample][infoKey.value] = val.value
                            }
                        }
                    }
                }
            }
        }

        return additionalData;

    };


    /*
    Handle change state for modal Open
     */
    handleOpen = () => {

        if (this.state.selection.keys.length === 0) {
            const message = "Please select some profiles first!";
            this.snackBar.handleOpen(message, "info");

        } else {
            this.setState({
                open: true,
                speciesValues: []
            });
        }
    };

    /*
    Handle change state for modal Close
     */
    handleClose = () => {
        this.setState({open: false});
    };

    /*
    Handle change on input values state
     */
    handleChange = name => event => {
        this.setState({
            [name]: event.target.value,
        });
    };

    /*
    Handle close of Snackbar
     */
    handleSnackClose = () => {
        this.setState({
            openSnack: false
        })
    };

    /*
    Handle change on checkbox checked state
     */
    handleChangeCheckbox = name => event => {
        this.setState({
            [name]: event.target.checked
        })
    };

    /*
    Handle value selection on Select element
     */
    handleSelectChange(speciesValues) {
        this.setState({speciesValues});
    };

    /*
    Handle value selection on Select element
     */
    handleVersionChange(versions) {
        this.setState({versions});
    };

    /*
    Set additional information values
     */
    handleSelectInfoChange(additionalInfoValues) {
        console.log(additionalInfoValues);
        this.setState({additionalInfoValues});
    }

    /*
    Set the options for the available species
     */
    setSpeciesOptions = () => {
        return [this.props.specie()];
    };

    /*
    Set version options
     */
    setVersionOptions = () => {
        return this.props.schemaVersions();
    };

    /*
    Method to send the request to PHYLOViZ Online service according to the
     modal form.
     */
    sendToPHYLOViZ = (e) => {
        // Prevents form from redirecting to the same page
        e.preventDefault();

        if (this.props.additionalInfo && this.props.additionalInfo.innuendo) {

            let jobIds = [];

            for (const row of this.state.selection.rows) {
                let entry = row.raw["INF_chewbbaca"];
                jobIds.push(`${entry.projectId}:${entry.pipelineId}:${entry.processId}`)
            }

            // Get job identifier from selection data
            /*const jobIds = this.state.selection.rows.map((s) => {
                return `${s.projectId}:${s.pipelineId}:${s.processId}`
            });*/

            // Set data object to send to PHYLOViZ Online
            const data = {
                job_ids: jobIds.join(","),
                dataset_name: this.state.name,
                dataset_description: this.state.description,
                additional_data: JSON.stringify(this.setAdditionaData()),
                max_closest: this.state.closestStrains,
                database_to_include: this.state.speciesValues[0].label,
                database_version: this.state.versions[0].label,
                species_id: this.state.speciesValues[0].value,
                missing_data: this.state.missings,
                missing_char: this.state.missingsCharacter,
                phyloviz_user: this.state.phylovizUser,
                phyloviz_pass: this.state.phylovizPass,
                makePublic: this.state.makePublic,
                user_id: this.props.additionalInfo.innuendo.getUserId()
            };

            // Trigger request and give message to the user. Set interval to
            // get phyloviz job status
            this.props.additionalInfo.innuendo.sendToPHYLOViZ(data).then((response) => {

                let message = "Your request was sent to PHYLOViZ Online server. " +
                    "You will be notified when the tree is ready to be visualized. " +
                    "All available trees can be found on the PHYLOViZ Table" +
                    " at the Reports menu.";

                // Open Snackbar with the message
                this.snackBar.handleOpen(message, "info");

                const intervalCheck = this.state.intervalCheckTree;

                // Set interval to know when the data processing is
                // completed when sending profiles to phyloviz online
                intervalCheck[response.data] = setInterval(() => {
                    this.fetchTreeJob(response.data);
                }, 5000);

                this.setState({
                    intervalCheckTree: intervalCheck
                });

            }).catch((response) => {
                console.log(response);
            });
        }
        else {
            console.log("no innuendo instance attached to reports");
        }

    };

    /*
    Method to retrieve information on when the redis job for profile data
     processing to send to phyloviz is completed. After completion, a new
      interval is set to know when the tree is ready to be visualized by
       asking to phyloviz online
     */
    fetchTreeJob = async (redisJobId) => {
        // Fetch redis job information
        const response = await this.props.additionalInfo.innuendo.fetchJob(redisJobId);

        let message = "";

        // If completed, set the new interval to ask for the tree on
        // phyloviz online
        if (response.data.status === true && response.data.result.message === undefined) {

            clearInterval(this.state.intervalCheckTree[redisJobId]);

            // Case missmatch between user and password on phyloviz
            if (response.data.result === 404) {
                message = "PHYLOViZ Online: Bad credentials.";

                this.snackBar.handleOpen(message, "warning");

            }
            else {
                // Retrieve phyloviz online job id
                const phylovizJob = response.data.result[0].jobid.replace(/\s/g, '');

                const intervalCheck = this.state.intervalCheckPhylovizTrees;

                // Set interval to retrieve job id
                intervalCheck[phylovizJob] = setInterval(() => {
                    this.fetchPhylovizJob(phylovizJob);
                }, 5000);

                this.setState({
                    intervalCheckPhylovizTrees: intervalCheck
                });
            }
        }
        // Case some error occurried when data is being processed by
        // phyloviz online
        else if (response.data.status === true && response.data.result.message !== undefined) {

            clearInterval(this.state.intervalCheckTree[redisJobId]);

            this.snackBar.handleOpen(response.data.result.message, "error");

        }
        // Case other unexpected error
        else if (response.data.status === false) {

            clearInterval(this.state.intervalCheckTree[redisJobId]);

            message = "There was an error when sending the request to" +
                " PHYLOViZ Online.";

            this.snackBar.handleOpen(message, "error");
        }

    };

    /*
    Method to fetch tree information from phyloviz online
     */
    fetchPhylovizJob = async (phylovizJob) => {

        const response = await this.props.additionalInfo.innuendo.fetchPhyloviz(phylovizJob);

        // Case the tree is ready to be visualized
        if (response.data.status === "complete") {

            let message = "Your tree is ready to be visualized! Go to the PHYLOViZ Table at the Reports menu.";

            clearInterval(this.state.intervalCheckPhylovizTrees[phylovizJob]);

            this.snackBar.handleOpen(message, "success");

            // Get total number of trees for the innuendo user
            const resultsPhyloviz = await this.props.additionalInfo.innuendo.getPhylovizTrees({
                user_id: this.props.additionalInfo.innuendo.getUserId()
            });

            // Update report data. Add new tree to reportData object
            const newReportsData = [...this.props.reportData];

            for (const result of resultsPhyloviz.data) {
                let exists = false;
                for (const report of this.props.reportData) {
                    if (report.hasOwnProperty("phyloviz_user") && report.name === result.name) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    newReportsData.push(result);
                }
            }

            // Update reportData state on ReportsRedirect through prop made
            // available by React Context
            this.props.updateState(newReportsData, this.props.additionalInfo, this.props.filters, this.props.highlights);
        }
    };

    render() {

        const style = {
            groupRow: {
                width: "100%"
            },
            databaseRow: {
                width: "100%",
                display: "inline-block"
            },
            rowComponent: {
                marginBottom: "2%"

            },
            modalContent: {
                marginLeft: "5%",
                marginRight: "5%",
                height: "85%",
                overflow: "auto"
            },
            select: {
                marginBottom: '1%'
            },
            buttonDiv: {
                width: "100%",
                alignItems: "center"
            },
            buttonSubmit: {
                width: "40%"
            },
            centralModal: {
                backgroundColor: "white",
                opacity: "1",
                position: "absolute",
                width: "80%",
                height: "80%",
                top: "10%",
                left: "10%",
                overflowX: "auto"
            },
            modalBody: {
                margin: "2%"
            },
            buttonSendDiv: {
                display: "inline-block"
            },
            icon: {
                fill: "white"
            },
            groupName: {
                flexGrow: "1",
                fontWeight: "bold",
            },
            databaseDiv: {
                width: "45%",
                display: "inline-block",
                marginRight: "5%"
            }
        };

        const formatGroupLabel = data => (
            <div key={data.key}>
                <div style={{display: "flex"}}>
                    <Typography
                        style={style.groupName}>{data.label}</Typography>
                    <Typography
                        style={style.groupCount}>{data.options.length}</Typography>
                </div>
                <Divider/>
            </div>
        );


        return (
            <div style={style.buttonSendDiv}>
                <PositionedSnackbar
                    vertical="top"
                    horizontal="right"
                    handleClose={this.handleSnackClose}
                    onRef={ref => (this.snackBar = ref)}
                />
                <TableButton tooltip={"Send To PHYLOViZ"}
                             onClick={this.handleOpen}>
                    <FileTreeIcon style={style.icon}/>
                </TableButton>
                <Modal
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                    open={this.state.open}
                    onClose={this.handleClose}
                >
                    <div style={style.centralModal}>
                        <div style={style.modalBody}>
                            <div className={styles.modalHeader}>
                                <Typography style={{"flexGrow": 1}}
                                            variant="title"
                                            id="modal-title">
                                    Send the Closest Profiles to
                                    PHYLOViZ Online
                                </Typography>
                                <IconButton
                                    className={styles.modalCloseButton}
                                    onClick={this.handleClose}>
                                    <CloseCircleIcon size={30}
                                                     color={red[300]}/>
                                </IconButton>
                            </div>
                            <Divider/>
                            <div style={style.modalContent}>
                                <form onSubmit={this.sendToPHYLOViZ}>
                                    <FormGroup style={style.groupRow}>
                                        <TextField
                                            id="datasetName"
                                            label="Dataset Name"
                                            value={this.state.datasetName}
                                            onChange={this.handleChange("name")}
                                            margin="normal"
                                            required
                                        />
                                        <TextField
                                            id="datasetDescription"
                                            label="Dataset Description"
                                            multiline
                                            rows="2"
                                            margin="normal"
                                            value={this.state.description}
                                            onChange={this.handleChange("description")}
                                        />
                                    </FormGroup>
                                    <FormGroup row
                                               style={style.groupRow}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={this.state.missings}
                                                    onChange={this.handleChangeCheckbox('missings')}
                                                    value="checkedMissing"
                                                />
                                            }
                                            label="Missing Data"
                                        />
                                        {
                                            this.state.missings &&
                                            <TextField
                                                id="missingCharacter"
                                                label="Missing Character"
                                                value={this.state.missingsCharacter}
                                                onChange={this.handleChange("missingsCharacter")}
                                                margin="normal"
                                                style={style.rowComponent}
                                            />
                                        }
                                    </FormGroup>
                                    <div style={style.groupRow}>
                                        <div style={style.databaseDiv}>
                                            <label
                                                htmlFor="speciesDatabase">
                                                <Typography>Species
                                                    Database</Typography>
                                            </label>
                                            <Select
                                                id="speciesDatabase"
                                                closeMenuOnSelect={false}
                                                isMulti
                                                value={this.state.speciesValues}
                                                onChange={(values) => {
                                                    this.handleSelectChange(values);
                                                }}
                                                options={this.setSpeciesOptions()}
                                                style={style.rowComponent}
                                                required
                                            />
                                        </div>
                                        <div style={style.databaseDiv}>
                                            <label
                                                htmlFor="versionDatabase">
                                                <Typography>Database Version</Typography>
                                            </label>
                                            <Select
                                                id="versionDatabase"
                                                closeMenuOnSelect={false}
                                                isMulti
                                                value={this.state.versions}
                                                onChange={(values) => {
                                                    this.handleVersionChange(values);
                                                }}
                                                options={this.setVersionOptions()}
                                                style={style.rowComponent}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <FormGroup style={style.groupRow}>
                                        <label
                                            htmlFor="speciesDatabase">
                                            <Typography>Additional
                                                Info</Typography>
                                        </label>
                                        <Select
                                            id="additionalInfo"
                                            closeMenuOnSelect={false}
                                            isMulti
                                            value={this.state.additionalInfoValues}
                                            onChange={(values) => {
                                                this.handleSelectInfoChange(values);
                                            }}
                                            options={this.getAvailableColumnEntries()}
                                            style={style.rowComponent}
                                            required
                                            formatGroupLabel={formatGroupLabel}
                                        />
                                        <TextField
                                            id="closestStrains"
                                            label="Closest Strains"
                                            type="number"
                                            value={this.state.closestStrains}
                                            onChange={this.handleChange('closestStrains')}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            margin="normal"
                                            style={style.rowComponent}
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup style={style.groupRow}>
                                        <TextField
                                            id="phylovizUser"
                                            label="PHYLOViZ Username"
                                            value={this.state.phylovizUser}
                                            onChange={this.handleChange("phylovizUser")}
                                            required
                                        />
                                        <TextField
                                            id="phylovizPass"
                                            label="PHYLOViZ Password"
                                            type="password"
                                            value={this.state.phylovizPass}
                                            onChange={this.handleChange("phylovizPass")}
                                            required
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={this.state.makePublic}
                                                    onChange={this.handleChangeCheckbox('makePublic')}
                                                    value="checkedMissing"
                                                />
                                            }
                                            label="Make Public"
                                        />
                                    </FormGroup>
                                    <FormGroup style={style.buttonDiv}>
                                        <Button
                                            type="submit"
                                            variant={"contained"}
                                            color={"primary"}
                                            /*onClick={this.sendToPHYLOViZ}*/
                                            style={style.buttonSubmit}
                                        >
                                            Send To PHYLOViZ
                                        </Button>
                                    </FormGroup>
                                </form>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}

