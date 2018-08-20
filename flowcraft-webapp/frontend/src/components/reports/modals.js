import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Snackbar from '@material-ui/core/Snackbar';

import CloseCircleIcon from "mdi-react/CloseCircleIcon";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";

import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import Select from '../SelectPlusAll';

import styles from "../../styles/reports.css";

// Import Colors
import red from "@material-ui/core/colors/red";


export class PositionedSnackbar extends React.Component {
    state = {
        open: false
    };

    static getDerivedStateFromProps(props, state) {
        if (props.open !== state.open) {
            return {
                open: props.open
            }
        }
        return null
    }

    handleClose = () => {
        this.props.handleClose();
    };

    render() {
        const style = {
            message: {
                width: "80%",
                color: "white"
            }
        }
        const {open} = this.state;
        return (
            <div>
                <Snackbar
                    anchorOrigin={{
                        vertical: this.props.vertical,
                        horizontal: this.props.horizontal
                    }}
                    open={open}
                    onClose={this.handleClose}
                    action={[
                        <Button color="secondary" size="small"
                                key="close"
                                onClick={this.handleClose}>
                            CLOSE
                        </Button>
                    ]}
                    message={<Typography
                        style={style.message}>{this.props.message}</Typography>}
                />
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

/*
Modal that allows to send requests to the PHYLOViZ Online service according
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
            selection: [],
            openSnack: false,
            snackMessage: ""

        };
    }

    static getDerivedStateFromProps(props, state) {
        return {
            selection: props.selection
        }
    }

    /*
    Handle change state for modal Open
     */
    handleOpen = () => {
        this.setState({
            open: true,
            speciesValues: []
        });
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

    handleSnackClose = () => {
        this.setState({
            openSnack: false
        })
    }

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
    Set the options for the available species
     */
    setSpeciesOptions = () => {
        return [this.props.specie()];
    };

    /*
    Method to send the request to PHYLOViZ Online service according to the
     modal form.
     */
    sendToPHYLOViZ = (e) => {
        // Prevents form from redirecting to the same page
        e.preventDefault();

        if (this.props.additionalInfo && this.props.additionalInfo.innuendo) {

            // Get job identifier from selection data
            const jobIds = this.state.selection.rows.map((s) => {
                return `${s.projectId}:${s.pipelineId}:${s.processId}`
            });

            // Set data object to send to PHYLOViZ Online
            const data = {
                job_ids: jobIds.join(","),
                dataset_name: this.state.name,
                dataset_description: this.state.description,
                additional_data: "{}",
                max_closest: this.state.closestStrains,
                database_to_include: this.state.speciesValues[0].label,
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
                this.setState({
                    openSnack: true,
                    snackMessage: "Your request was sent to PHYLOViZ Online server. " +
                    "You will be notified when the tree is ready to be visualized. " +
                    "All available trees can be found on the PHYLOViZ Table at the Reports menu."
                })

            }).catch((response) => {
                console.log(response);
            });
        }
        else {
            console.log("no innuendo instance attached to reports");
        }

    };

    render() {

        const style = {
            groupRow: {
                width: "100%"
            },
            rowComponent: {
                marginBottom: "2%"

            },
            buttonSubmit: {
                width: "50%"
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
                left: "10%"
            },
            modalBody: {
                margin: "2%"
            }
        };

        return (
            <div>
                <PositionedSnackbar
                    vertical="top"
                    horizontal="right"
                    open={this.state.openSnack}
                    handleClose={this.handleSnackClose}
                    message={this.state.snackMessage}
                />
                <Button onClick={this.handleOpen} variant={"contained"}
                        color={"primary"}>
                    Send To PHYLOViZ
                </Button>
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
                                            variant="title" id="modal-title">
                                    Send the Closest Profiles to PHYLOViZ Online
                                </Typography>
                                <IconButton className={styles.modalCloseButton}
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
                                    <FormGroup row style={style.groupRow}>
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
                                    <FormGroup style={style.groupRow}>
                                        <label htmlFor="speciesDatabase">
                                            <Typography>Species
                                                Database</Typography>
                                        </label>
                                        <Select
                                            id="speciesDatabase"
                                            /*onClose={console.log("close")}*/
                                            closeOnSelect={false}
                                            value={this.state.speciesValues}
                                            multi
                                            onChange={(values) => {
                                                this.handleSelectChange(values);
                                            }}
                                            options={this.setSpeciesOptions()}
                                            style={style.rowComponent}
                                            required
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

