// React imports
import React from "react"

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Paper from "@material-ui/core/Paper";

import {findTableSignatures, findChartSignatures} from "./reports/parsers";
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
 * Full component for Reports home page. It is responsible for handling
 * the Drag and Drop of report files OR the specification of runID for
 * fetching report data to the database. It then mounts the actual ReportsApp
 * component.
 *
 * On drag and drop: The ReportsApp is mounted on the current URL.
 * On runID: The ReportsApp is mount on the runID URL.
 */
export class ReportsHome extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            "runId": "",
            "reportData": null,
            "openModal": false,
            "dropData": []
        };
    }

    componentDidMount(){
        // Add event listeners for drag and drop functionality
        window.addEventListener("drop", this._drop.bind(this));
        window.addEventListener("dragover", this._dragOver);
    }

    componentWillUnmount(){
        // Remove event listeners for drag and drop functionality
        window.removeEventListener("drop", this._drop);
        window.removeEventListener("dragover", this._dragOver);
    }

    /*
     Required to trigger modal open and close
     */
    setModalState = (value) => {
        this.setState({openModal:value});
    };

    /*
    Function to load reports app by changing the state of the reportData
     */
    loadReports = (reportData) => {
        this.setState({"reportData": reportData});
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

    render() {
        return(
            <div>
                {
                    this.state.reportData &&
                    <BasicModal openModal={this.state.openModal}
                                setModalState={this.setModalState}
                                title="">

                        <div className={styles.modalBody}>

                            {/* Prototype for modal content */}
                            <Typography className={styles.centeredContent}>Uploaded {this.state.dropData.length} new processes!</Typography>
                            <Typography className={styles.centeredContent}>What do you want to do?!</Typography>

                            {/* dropData: is the current data uploaded using
                             dragNdrop */}
                            <div className={styles.centeredContent}>
                                <Button color="primary"
                                        onClick={() => {this.mergeReports(this.state.dropData)}}>Merge</Button>
                                <Button color="secondary"
                                        onClick={() => {this.loadReports(this.state.dropData)}}>
                                    Remove Previous
                                </Button>
                            </div>
                        </div>

                    </BasicModal>
                }
                {
                    this.state.reportData ?
                        <ReportsApp reportData={this.state.reportData}/> :
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
 * Main Reports application component. It requires the reportData array of
 * JSONs to correctly render. The rendering of the specific components in the
 * reports is conditional on the data provided in the reportData array.
 */
class ReportsApp extends React.Component {

    constructor(props) {
        super(props);

        const tableData = findTableSignatures(props.reportData);
        const charts = findChartSignatures(props.reportData);

        this.state = {
            reportData: props.reportData,
            tables: [ ...tableData.keys() ],
            tableData,
            charts,
        };
    }

    static getDerivedStateFromProps(props, state) {

        const tableData = findTableSignatures(props.reportData);
        const charts = findChartSignatures(props.reportData);

        return {
            reportData: props.reportData,
            tables: [ ...tableData.keys() ],
            tableData: tableData,
            charts: charts,
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
                <TaskButtons tableData={this.state.tableData}/>
                <ReportsHeader tableHeaders={this.state.tables} chartHeaders={this.state.charts}>
                    {
                        this.state.tables.includes("qc") &&
                            <Element name={"qcTable"} className={styles.scrollElement}>
                                <QualityControlTable tableData={this.state.tableData.get("qc")}/>
                            </Element>
                    }
                    {
                        this.state.tables.includes("assembly") &&
                             <Element name={"assemblyTable"} className={styles.scrollElement}>
                                <AssemblyTable tableData={this.state.tableData.get("assembly")}/>
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