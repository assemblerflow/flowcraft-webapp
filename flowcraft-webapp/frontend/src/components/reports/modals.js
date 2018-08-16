import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import CloseCircleIcon from "mdi-react/CloseCircleIcon";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";

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


export class PhylovizModal extends React.Component {

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
    };

    handleChange = () => {

    };

    render() {

        const style = {
            phylovizModal: {
                padding: "20px"
            },
            sendButtonDiv: {
                textAlign: "center"
            },
            sendButton: {
                width: "100%",
                marginTop: "10px"
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
                    <div className={styles.centralModal}>
                        <div className={styles.modalBody}>
                            <div className={styles.modalHeader}>
                                <Typography style={{"flexGrow": 1}}
                                            variant="title" id="modal-title">
                                    Send the closest profiles to PHYLOViZ Online
                                </Typography>
                                <IconButton className={styles.modalCloseButton}
                                            onClick={this.handleClose}>
                                    <CloseCircleIcon size={30}
                                                     color={red[300]}/>
                                </IconButton>
                            </div>
                            <Divider/>
                            <form onSubmit={this.sendToPHYLOViZ}
                                  styles={style.phylovizModal}>
                                <div>
                                    <label htmlFor="dataset_name">Dataset
                                        Name:</label>
                                    <input type="text"
                                           placeholder="Enter a dataset name"
                                           name="dataset_name"/>
                                </div>
                                <div>
                                    <label><input
                                        type="checkbox"
                                        onChange={this.handleChange}
                                                  id="missing_data_checkbox"
                                                  checked/>Missing data</label>
                                </div>
                                <div>
                                    <label
                                           htmlFor="missingCharacter">Missing
                                        character</label>
                                    <input type="text"
                                           id="missingCharacter"
                                           name="missing_data_character"
                                           default="0"/>
                                </div>
                                <div>
                                    <label
                                           htmlFor="datasetDescription">Description</label>
                                    <textarea rows="3"
                                              id="datasetDescription"
                                              name="dataset_description"
                                              placeholder="Enter a dataset description"/>
                                </div>
                                <div>
                                    <label
                                           htmlFor="speciesDatabase">Include strains
                                        from database:</label>
                                    <select type="text" id="speciesDatabase"

                                            data-live-search="true">
                                    </select>
                                </div>
                                <div>
                                    <label
                                           htmlFor="closestStrains">Number of
                                        closest strains</label>
                                    <input type="number" id="closestStrains"
                                            min="2" max="40"
                                           required value="0"/>
                                </div>
                                <div>
                                    <span onClick={this.showAdditionalDataModal}
                                          >Add Additional Data</span>
                                </div>
                                <div>
                                    <label
                                           htmlFor="phylovizPass">PHYLOViZ
                                        User</label>
                                    <input id="phylovizUser"
                                            required
                                           placeholder="PHYLOViZ Username"/>
                                    <input type="password" id="phylovizPass"
                                            required
                                           placeholder="PHYLOViZ password"/>
                                </div>
                                <div>
                                    <label><input
                                        type="checkbox"
                                        onChange={this.handleChange}
                                                  id="makePublic" checked/>Make
                                        dataset publicly available to other
                                        users</label>
                                </div>
                                <div styles={style.sendButton}>
                                    <div styles={style.sendButtonDiv}>
                                        <button type="submit">Send to PHYLOViZ
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}

