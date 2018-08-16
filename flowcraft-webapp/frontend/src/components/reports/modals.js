import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';

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
            speciesValues: [],
            closestStrains: 0,
            phylovizUser: "",
            phylovizPass: "",
            makePublic: false,

        };
    }

    /*
    Handle change state for modal Open
     */
    handleOpen = () => {
        this.setState({open: true});
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
        return [{"value": "test", "label": "test"}];
    };

    /*
    Method to send the request to PHYLOViZ Online service according to the
     modal form.
     */
    sendToPHYLOViZ = () => {
        console.log(this.state);
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
                height: "100%",
                margin: "2%"
            }
        };

        return (
            <div>
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

                                <FormGroup style={style.groupRow}>
                                    <TextField
                                        id="datasetName"
                                        label="Dataset Name"
                                        value={this.state.datasetName}
                                        onChange={this.handleChange("name")}
                                        margin="normal"
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
                                            value={this.state.missingCharacter}
                                            onChange={this.handleChange("missingCharacter")}
                                            defaultValue="0"
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
                                        onClose={console.log("close")}
                                        closeOnSelect={false}
                                        multi
                                        allowSelectAll={true}
                                        value={this.state.speciesValues}
                                        onChange={(values) => {
                                            this.handleSelectChange(values);
                                        }}
                                        options={this.setSpeciesOptions()}
                                        style={style.rowComponent}
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
                                        variant={"contained"}
                                        color={"primary"}
                                        onClick={this.sendToPHYLOViZ()}
                                        style={style.buttonSubmit}
                                    >
                                        Send To PHYLOViZ
                                    </Button>
                                </FormGroup>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}

