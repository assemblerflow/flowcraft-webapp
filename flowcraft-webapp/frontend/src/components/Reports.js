// React imports
import React from "react"

import {
    DraggableView,
    DragAndDropModal,
    LoadingScreen
} from "./ReportsBase"
import {
    findTableSignatures,
    findChartSignatures,
    findQcWarnings
} from "./reports/parsers";
import {
    QualityControlTable,
    AssemblyTable,
    AbricateTable,
    ChewbbacaTable,
    MetadataTable
} from "./reports/tables";
import {AssemblySizeDistChart, FastQcCharts} from "./reports/charts";
import {ReportsHeader} from "./reports/drawer";


import {
    Link,
    DirectLink,
    Element,
    Events,
    animateScroll as scroll,
    scrollSpy,
    scroller
} from 'react-scroll'

import styles from "../styles/reports.css";

import {TaskButtons} from "./reports/task_buttons"

/**
 * This is the main component interface with the reports app. The reports
 * application should be mounted via Redirect to this component for two reasons:
 *
 *  1. It provides drag and drop functionality for more reports
 *  2. It allows the state of the reports to be saved and associated with the
 *  URL. In this way, refreshing the reports app will retain the last saved
 *  data set.
 */
export class ReportsRedirect extends React.Component {

    constructor(props) {
        super(props);

        console.log("redirect start")

        this.state = {
            "reportData": this.props.location.state.data,
            "loading": true
        };
    }

    /*
    Method that restores the state of the URL to the last saved report data
    state. This is trigger on page unloading/reloading
     */
    _restoreUrlState() {
        this.props.history.replace("/reports/app", {
            data: this.state.reportData
        });
    }

    /*
    Method that clears the state associated with the URL when the component
    is mounted. This is done to prevent performance issues when scrolling the
    app with very big reports.
     */
    _clearUrlState() {
        this.props.history.replace("/reports/app", {data: []});
        this.props.history.state = {data: []};
    }

    _cancelLoading() {
        this.setState({loading: false})
    }

    /*
    Callback that can be passed to children components to update the reportData
    state.
     */
    _updateState(reportData){
        this.setState({reportData: reportData})
    }

    componentDidMount() {
        // Add method that restores URL state on page relog
        window.addEventListener("beforeunload", this._restoreUrlState.bind(this));
        // Clear the current URL state with setTimeout to prevent blocking
        setTimeout(this._clearUrlState.bind(this), 100);
        // Clear the loading component
        setTimeout(this._cancelLoading.bind(this), 1000);
    }

    render() {
        return (
            <div>
                {
                    this.state.loading ?
                        <LoadingScreen/> :
                        <div>
                            <ReportsApp reportData={this.state.reportData}
                                        updateState={this._updateState.bind(this)}/>
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
class ReportsApp extends DraggableView {

    constructor(props) {
        super(props);

        const {tableData, tableSamples} = findTableSignatures(props.reportData);
        const charts = findChartSignatures(props.reportData);
        const qcInfo = findQcWarnings(props.reportData);

        this.state = {
            reportData: props.reportData,
            tables: [...tableData.keys()],
            tableData,
            tableSamples,
            charts,
            qcInfo,
            openModal: false,
            dropData: [],
        };
    }

    static getDerivedStateFromProps(props, state) {

        if (props.reportData === state.reportData) {
            return null
        }

        const {tableData, tableSamples} = findTableSignatures(state.reportData);
        const charts = findChartSignatures(state.reportData);
        const qcInfo = findQcWarnings(state.reportData);

        return {
            reportData: state.reportData,
            dropData: state.dropData,
            tables: [...tableData.keys()],
            tableData,
            tableSamples,
            charts: charts,
            qcInfo
        }
    }

    componentDidUpdate(){
        if (this.props.updateState){
            this.props.updateState(this.state.reportData)
        }
    }

    render() {
        //
        // This is the main element where the Reports components will be added,
        // Their addition should be conditional on the presence of relevant
        // data in the this.state.reportData array, and each component should
        // be responsible for handling the data in any way they see fit.
        //
        console.log(this.state)
        return (
            <div>
                <DragAndDropModal openModal={this.state.openModal}
                                  setModalState={this.setModalState}
                                  dropData={this.state.dropData}
                                  mergeReports={this.mergeReports}
                                  loadReports={this.loadReports}/>
                <TaskButtons tableData={this.state.tableData}
                             tableSamples={this.state.tableSamples}/>
                <ReportsHeader tableHeaders={this.state.tables}
                               chartHeaders={this.state.charts}>
                    {
                        this.state.tables.includes("metadata") &&
                        <Element name={"metadataTable"}
                                 className={styles.scrollElement}>
                            <MetadataTable
                                tableData={this.state.tableData.get("metadata")}
                                reportData={this.state.reportData} />
                        </Element>
                    }
                    {
                        this.state.tables.includes("qc") &&
                        <Element name={"qcTable"}
                                 className={styles.scrollElement}>
                            <QualityControlTable
                                tableData={this.state.tableData.get("qc")}
                                qcInfo={this.state.qcInfo}/>
                        </Element>
                    }
                    {
                        this.state.tables.includes("assembly") &&
                        <Element name={"assemblyTable"}
                                 className={styles.scrollElement}>
                            <AssemblyTable
                                tableData={this.state.tableData.get("assembly")}
                                qcInfo={this.state.qcInfo}/>
                        </Element>
                    }
                    {
                        this.state.tables.includes("abricate") &&
                        <Element name={"abricateTable"}
                                 className={styles.scrollElement}>
                            <AbricateTable
                                tableData={this.state.tableData.get("abricate")}/>
                        </Element>
                    }
                    {
                        this.state.tables.includes("chewbbaca") &&
                        <Element name={"chewbbacaTable"}
                                 className={styles.scrollElement}>
                            <ChewbbacaTable
                                tableData={this.state.tableData.get("chewbbaca")}
                                reportData={this.state.reportData}
                            />
                        </Element>
                    }
                    {
                        this.state.charts.includes("base_n_content") &&
                        <Element name={"base_n_contentChart"}
                                 className={styles.scrollElement}>
                            <FastQcCharts rawReports={this.state.reportData}/>
                        </Element>
                    }
                    {
                        this.state.charts.includes("size_dist") &&
                        <Element name={"size_distChart"}
                                 className={styles.scrollElement}>
                            <AssemblySizeDistChart
                                rawReports={this.state.reportData}/>
                        </Element>
                    }
                </ReportsHeader>
            </div>
        )
    }
}