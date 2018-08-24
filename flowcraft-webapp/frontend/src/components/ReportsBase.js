// React imports
import React from "react"

import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import {BasicModal} from "./reports/modals";
import styles from "../styles/reports.css";


/**
 * This is a base component that provides drag and drop functionality to the
 * reports home and reports app routes. It should be used as an extension
 * for these components only, not for general use.
 */
export class DraggableView extends React.Component {

    /*
    Add event listeners for drag and drop functionality
     */
    componentDidMount() {
        window.addEventListener("drop", this._drop.bind(this));
        window.addEventListener("dragover", this._dragOver);
    }

    /*
    Remove event listeners for drag and drop functionality
     */
    componentWillUnmount() {
        window.removeEventListener("drop", this._drop);
        window.removeEventListener("dragover", this._dragOver);
    }

    /*
     Toggle the open state of the modal
     */
    setModalState = (value) => {
        this.setState({openModal: value});
    };

    /*
    Trigger component update only when there is a change on the report data
    that is stored in the state.
     */
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.loading !== nextState.loading)
            return true;

        if (this.state.reportData === nextState.reportData &&
            this.state.openModal === nextState.openModal) {
            return false
        } else {
            return true
        }
    }

    /*
    Sets the reportData state of the child component. It overwrites the
    previous one. For merging, see mergeReports method.
     */
    loadReports = ({reportData, filters, highlights}) => {
        // Change state to trigger re-rendering of the app
        this.setState({
            reportData,
            filters,
            highlights
        });
        // Close modal
        this.setModalState(false);
    };

    /*
    Function to merge uploaded reportData with previous available data and
    then loads reports
     */
    mergeReports = (reportData) => {
        const mergedData = [...reportData, ...this.state.reportData];
        this.loadReports(mergedData);
    };

    /*
    Function triggered when a file is dropped in view.
    */
    _drop(ev) {
        ev.preventDefault();

        const data = ev.dataTransfer.files[0];
        const reader = new FileReader();
        this.setState({"loading": true});

        reader.onload = function (e) {

            try {
                const parsedString = JSON.parse(e.target.result);
                const reportData = parsedString.data.results;

                let filters, highlights;

                // Check if report file has the filters object. If not, add
                // empty
                if (parsedString.data.filters !== undefined) {
                    filters = parsedString.data.filters;
                }
                // Check if report file has the highlights object. If not, add
                // empty
                if (parsedString.data.highlights !== undefined){
                    highlights = parsedString.data.highlights;
                }

                const jsonData = {
                    reportData,
                    filters,
                    highlights
                };

                // Case no processes on current report, load reports directly
                // Else, launch modal to ask user if wants to merge reports
                // or just show the uploaded one
                if (this.state.reportData === null) {
                    this.loadReports(jsonData);
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this);

        reader.readAsText(data);
    }

    _dragOver(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    render() {
        return (
            <div>
                <span>
                    {this.props.children}
                </span>
            </div>
        )
    }
}

/**
 * Simple modal that is shown when a new reports file is drag and dropped
 * into the reports app.
 */
export class DragAndDropModal extends React.Component {
    render() {

        return (
            <BasicModal openModal={this.props.openModal}
                        setModalState={this.props.setModalState}
                        title="">

                <div className={styles.modalBody}>

                    {/* Prototype for modal content */}
                    <Typography
                        className={styles.centeredContent}>
                        Uploaded {
                            this.props.dropData.reportData === undefined ? 0 : this.props.dropData.reportData.length
                        } new processes!</Typography>
                    <Typography className={styles.centeredContent}>What do you
                        want to do?!</Typography>

                    {/* dropData: is the current data uploaded using
                             dragNdrop */}
                    <div className={styles.centeredContent}>
                        <Button color="primary"
                                onClick={() => {
                                    this.props.mergeReports(this.props.dropData)
                                }}>Merge</Button>
                        <Button color="secondary"
                                onClick={() => {
                                    // Gets the information of filters and
                                    // highlights only from the drop file
                                    // and not from the concatenated version.
                                    this.props.loadReports({
                                        reportData: this.props.dropData.reportData,
                                        filters: this.props.dropData.dropFilters,
                                        highlights: this.props.dropData.dropHighlights
                                    })
                                }}>
                            Remove Previous
                        </Button>
                    </div>
                </div>
            </BasicModal>
        )
    }
}


export class LoadingComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            show: false
        }
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({show: true})
        }, 500)
    }

    render() {

        const style = {
            loadingDiv: {
                textAlign: "center"
            }
        };
        return (
            <div>
                {
                    this.state.show ?
                        this.props.children
                        :
                        <div style={style.loadingDiv}>
                            <CircularProgress/>
                        </div>
                }
            </div>
        )
    }

}


export class LoadingScreen extends React.Component {

    render() {

        const style = {
            loadingSpinner: {
                "top": "0",
                "bottom": "0",
                "left": "0",
                "right": "0",
                "margin": "auto",
                "position": "absolute"
            }
        };

        return (
            <CircularProgress style={style.loadingSpinner}/>
        )
    }
}