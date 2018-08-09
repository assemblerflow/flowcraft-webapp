// React imports
import React from "react"

import {Redirect} from "react-router-dom";

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import {
    findTableSignatures,
    findChartSignatures,
    findQcWarnings
} from "./reports/parsers";

import {QualityControlTable, AssemblyTable, AbricateTable, ChewbbacaTable} from "./reports/tables";
import {BasicModal} from "./reports/modals";
import {AssemblySizeDistChart, FastQcCharts} from "./reports/charts";
import {ReportsHeader} from "./reports/drawer";
import {HomeInnuendo} from "./reports/innuendo";
import {HomeInput} from "./Inspect";
import {Header} from "./Header";

import { Link, DirectLink, Element, Events, animateScroll as scroll, scrollSpy, scroller } from 'react-scroll'

import styles from "../styles/reports.css";
import {service} from "../../config.json"

import {TaskButtons} from "./reports/task_buttons"


/**
 * Entry point for /reports URL
 *
 * Full component for Reports home page. It is responsible for handling
 * the Drag and Drop of report files OR the specification of runID for
 * fetching report data to the database. Other Home components can be
 * added depending on the service option stored in
 * flowcraft/frontend/config.json
 *
 * These components are responsible for gathering the report data JSON array
 * and then redirect to the /reports/app URL providing the report data in
 * the state of the URL.
 *
 */
export class ReportsHome extends DraggableView{

    constructor(props){
        super(props);

        this.props.history.push("/reports");

        this.state = {
            "runId": "",
            "reportData": null,
            "openModal": false,
            "dropData": []
        };
    }

    render() {

        return(
            <div>
                {
                    this.state.reportData &&
                    <DragAndDropModal openModal={this.state.openModal}
                                      setModalState={this.setModalState}
                                      dropData={this.state.dropData}
                                      mergeReports={this.mergeReports}
                                      loadReports={this.loadReports}/>
                }
                {
                    this.state.reportData ?
                        <Redirect to={{
                            pathname: "/reports/app",
                            state: {"data": this.state.reportData}
                        }}/> :
                        <div>
                            {
                                service === "innuendo" ?
                                    <div>
                                        <Header headerTitle={"INNUENDO Reports"}/>
                                        <HomeInnuendo route={"reports"}/>
                                    </div>:
                                    <div>
                                        <Header headerTitle={"Reports"}/>
                                        <HomeInput route={"reports"}/>
                                    </div>
                            }
                        </div>
                }
            </div>
        )
    }
}


/**
 * This is a base component that provides drag and drop functionality to the
 * reports home and reports app routes. It should be used as an extension
 * for these components only, not for general use.
 */
export class DraggableView extends React.Component {

    /*
    Add event listeners for drag and drop functionality
     */
    componentDidMount(){
        window.addEventListener("drop", this._drop.bind(this));
        window.addEventListener("dragover", this._dragOver);
    }

    /*
    Remove event listeners for drag and drop functionality
     */
    componentWillUnmount(){
        window.removeEventListener("drop", this._drop);
        window.removeEventListener("dragover", this._dragOver);
    }

    /*
     Toggle the open state of the modal
     */
    setModalState = (value) => {
        this.setState({openModal:value});
    };

    /*
    Trigger component update only when there is a change on the report data
    that is stored in the state.
     */
    shouldComponentUpdate(nextProps, nextState){
        if (this.state.reportData === nextState.reportData &&
            this.state.openModal === nextState.openModal){
            return false
        } else {
            return true
        }
    }

    /*
    Sets the reportData state of the child component. It overwrites the
    previous one. For merging, see mergeReports method.
     */
    loadReports = (reportData) => {
        // Change state to trigger re-rendering of the app
        this.setState({"reportData": reportData});
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
    _drop(ev){
        ev.preventDefault();

        const data = ev.dataTransfer.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result).data.results;

                // Case no processes on current report, load reports directly
                // Else, launch modal to ask user if wants to merge reports
                // or just show the uploaded one
                if (this.state.reportData === null) {
                    this.loadReports(jsonData);
                }
                else {
                    this.setState({dropData: jsonData});
                    this.setModalState(true);
                }
            } catch(e) {
                console.log(e);
            }
        }.bind(this);

        reader.readAsText(data);
    }

    _dragOver(ev){
        ev.preventDefault();
        ev.stopPropagation();
    }

    render(){
        return(
            <span>
                {this.props.children}
            </span>
        )
    }
}

/**
 * Simple modal that is shown when a new reports file is drag and dropped
 * into the reports app.
 */
class DragAndDropModal extends React.Component {
    render() {
        return (
            <BasicModal openModal={this.props.openModal}
                        setModalState={this.props.setModalState}
                        title="">

                <div className={styles.modalBody}>

                    {/* Prototype for modal content */}
                    <Typography className={styles.centeredContent}>Uploaded {this.props.dropData.length} new processes!</Typography>
                    <Typography className={styles.centeredContent}>What do you want to do?!</Typography>

                    {/* dropData: is the current data uploaded using
                             dragNdrop */}
                    <div className={styles.centeredContent}>
                        <Button color="primary"
                                onClick={() => {this.props.mergeReports(this.props.dropData)}}>Merge</Button>
                        <Button color="secondary"
                                onClick={() => {this.props.loadReports(this.props.dropData)}}>
                            Remove Previous
                        </Button>
                    </div>
                </div>
            </BasicModal>
        )
    }
}


/**
 * This is the main component interface with the reports app. The reports
 * application should be mounted via Redirect to this component for two reasons:
 *
 *  1. It provides drag and drop functionality for more reports
 *  2. It allows the state of the reports to be saved and associated with the
 *  URL. In this way, refreshing the reports app will retain the last saved
 *  data set.
 */
export class ReportsRedirect extends DraggableView {

    constructor(props){
        super(props);

        this.state = {
            "reportData": this.props.location.state.data,
            "openModal": false,
            "dropData": []
        };
    }

    /*
    Method that restores the state of the URL to the last saved report data
    state.
     */
    _restoreUrlState(){
        this.props.history.replace("/reports/app", {
            data: this.state.reportData
        });
    }

    /*
    Overwrites the method from the DraggableView component
     */
    componentDidMount(){
        window.addEventListener("drop", this._drop.bind(this));
        window.addEventListener("dragover", this._dragOver);
        this.props.history.replace("/reports/app", {data: []});
        this.props.history.state = {data: []};
        window.addEventListener("beforeunload", this._restoreUrlState.bind(this))
    }

    /*
    Overwrites the method from the DraggableView component
     */
    componentWillUnmount(){
        window.removeEventListener("drop", this._drop);
        window.removeEventListener("dragover", this._dragOver);
    }

    render () {
        return(
            <div>
                <DragAndDropModal openModal={this.state.openModal}
                                  setModalState={this.setModalState}
                                  dropData={this.state.dropData}
                                  mergeReports={this.mergeReports}
                                  loadReports={this.loadReports}/>
                <ReportsApp reportData={this.state.reportData}/>
            </div>
        )
    }
}

/**
 * Main Reports application component. It requires the reportData array of
 * JSONs to correctly render. The rendering of the specific components in the
 * reports is conditional on the data provided in the reportData array.
 */
class ReportsApp extends React.Component {

    constructor(props) {
        super(props);

        const {tableData, tableSamples} = findTableSignatures(props.reportData);
        const charts = findChartSignatures(props.reportData);
        const qcInfo = findQcWarnings(props.reportData);

        this.state = {
            reportData: props.reportData,
            tables: [ ...tableData.keys() ],
            tableData,
            tableSamples,
            charts,
            qcInfo,
        };
    }

    static getDerivedStateFromProps(props, state) {

        const {tableData, tableSamples} = findTableSignatures(props.reportData);
        const charts = findChartSignatures(props.reportData);
        const qcInfo = findQcWarnings(props.reportData);

        return {
            reportData: props.reportData,
            tables: [ ...tableData.keys() ],
            tableData,
            tableSamples,
            charts: charts,
            qcInfo
        }
    }

    render(){
        //
        // This is the main element where the Reports components will be added,
        // Their addition should be conditional on the presence of relevant
        // data in the this.state.reportData array, and each component should
        // be responsible for handling the data in any way they see fit.
        //
        console.log(this.state)
        return(
            <div>
                <TaskButtons tableData={this.state.tableData}
                             tableSamples={this.state.tableSamples}/>
                <ReportsHeader tableHeaders={this.state.tables} chartHeaders={this.state.charts}>
                    {
                        this.state.tables.includes("qc") &&
                            <Element name={"qcTable"} className={styles.scrollElement}>
                                <QualityControlTable tableData={this.state.tableData.get("qc")}
                                                     qcInfo={this.state.qcInfo}/>
                            </Element>
                    }
                    {
                        this.state.tables.includes("assembly") &&
                             <Element name={"assemblyTable"} className={styles.scrollElement}>
                                <AssemblyTable tableData={this.state.tableData.get("assembly")}
                                               qcInfo={this.state.qcInfo}/>
                             </Element>
                    }
                    {
                        this.state.tables.includes("abricate") &&
                            <Element name={"abricateTable"} className={styles.scrollElement}>
                                <AbricateTable tableData={this.state.tableData.get("abricate")}/>
                            </Element>

                    }
                    {
                        this.state.tables.includes("chewbbaca") &&
                            <Element name={"chewbbacaTable"} className={styles.scrollElement}>
                                <ChewbbacaTable tableData={this.state.tableData.get("chewbbaca")}
                                                reportData={this.state.reportData}
                                />
                            </Element>

                    }
                    {
                        this.state.charts.includes("base_n_content") &&
                             <Element name={"base_n_contentChart"} className={styles.scrollElement}>
                                <FastQcCharts rawReports={this.state.reportData}/>
                             </Element>
                    }
                    {
                        this.state.charts.includes("size_dist") &&
                        <Element name={"size_distChart"} className={styles.scrollElement}>
                            <AssemblySizeDistChart rawReports={this.state.reportData}/>
                        </Element>
                    }
                </ReportsHeader>
            </div>
        )
    }
}