// React imports
import React from "react"
import FileDrop from 'react-file-drop';

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
    MetadataTable,
    PhylovizTable
} from "./reports/tables";
import {Innuendo} from "./reports/innuendo";
import {ReportsSample} from "./ReportsSample";
import {ReportsHeader} from "./reports/drawer";
import {ReportOverview} from "./reports/overview";
import {AssemblySizeDistChart, FastQcCharts} from "./reports/charts";
import PositionedSnackbar from './reports/modals';
import {
    ReportDataProvider,
    ReportAppProvider,
} from './reports/contexts';


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
 * This is the main wrapper of the reports app. The reports
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

        console.log("redirect start");

        let additionalInfo = this.props.location.state.additionalInfo;

        if (additionalInfo && additionalInfo.innuendo) {
            const userId = additionalInfo.innuendo.userId;
            const species = additionalInfo.innuendo.species;
            // Set instance of class innuendo based on the userId collected
            // from history
            const innuendo = new Innuendo();
            innuendo.setUserId(userId);
            innuendo.setSpecies(species);

            additionalInfo = {innuendo: innuendo};

        }
        else {
            additionalInfo = {};
        }

        // Variables with history state
        const rData = this.props.location.state.data;
        const filters = this.props.location.state.filters;
        const highlights = this.props.location.state.highlights;

        this.state = {
            // Retrieve the initial state of reportData from the URL state
            "reportData": rData === undefined ? [] : rData,
            // Additional info has additional information that can be passed
            // by the reportsRedirect. In this case, it can be user
            // information collected from INNUENDO
            "additionalInfo": additionalInfo,
            // Filters to be applied to the reports
            "filters": filters === undefined ? null : filters,
            // Highlights to be applied to the reports
            "highlights": highlights === undefined ? null : highlights,
            // Set to true to display a loading spinner while processing data
            "loading": true,
            // Property that controls the showing of the File drag and drop modal
            "openModal": false,
            // Stores the intermediate reportData before merging or removing
            // reportData.
            "dropData": []
        };

        this.handleDrop = this.handleDrop.bind(this)
    }

    // URL STATE HANDLING
    /*
    Method that restores the state of the URL to the last saved report data
    state. This is trigger on page unloading/reloading
     */
    _restoreUrlState() {

        // Get additional info object
        const additionalInfo = this.state.additionalInfo;

        // Set new additionalInfo userId for innuendo based on the current class
        // instance
        if (additionalInfo.innuendo) {
            additionalInfo.innuendo = {
                userId: additionalInfo.innuendo.getUserId(),
                species: additionalInfo.innuendo.getSpecies()
            }
        }

        // Set new history based on the current reportData and additionalInfo
        this.props.history.replace("/reports/app", {
            data: this.state.reportData,
            additionalInfo: additionalInfo,
            filters: this.state.filters,
            highlights: this.state.highlights
        });
    }

    /*
    Method that clears the state associated with the URL when the component
    is mounted. This is done to prevent performance issues when scrolling the
    app with very big reports.
     */
    _clearUrlState() {
        this.props.history.replace("/reports/app", {data: []});
        this.props.history.state = {data: [], additionalInfo: {}};
    }

    _cancelLoading() {
        this.setState({loading: false})
    }

    /*
    Callback that can be passed to children components to update the reportData
    state.
     */
    _updateState(reportData, additionalInfo, filters, highlights) {
        this.setState({
            reportData,
            additionalInfo,
            filters,
            highlights
        })
    }

    // DRAG AND DROP METHODS
    /*
    Updates the reportData state and closes drag and drop modal
     */
    loadReports = ({reportData, filters, highlights}) => {
        this.setState({
            reportData,
            filters,
            highlights
        });
        this.setModalState(false)
    };

    /*
    Merges the report JSON data provided in the dropped files with the existing
    reportData and triggers the update of the reportData state.
     */
    mergeReports = ({reportData, filters, highlights}) => {
        const mergedData = [...reportData, ...this.state.reportData];
        this.loadReports({
            reportData: mergedData,
            filters,
            highlights
        });
    };

    /*
    Set the state of the drag and drop modal. True shows the modal.
     */
    setModalState = (value) => {
        this.setState({openModal: value})
    };

    /*
    Function triggered when files are dropped into the reports.
     */
    handleDrop(files, event) {

        const data = files[0];
        const reader = new FileReader();

        reader.onload = function (e) {

            try {
                const parsedString = JSON.parse(e.target.result);
                const reportData = parsedString.data.results;

                let globalFilters = {};
                let globalHighlights = {};
                let dropFilters = {};
                let dropHighlights = {};

                // Check if report file has the filters object. If not, add
                // empty
                if (parsedString.data.filters !== undefined) {
                    dropFilters = parsedString.data.filters;
                }
                dropFilters.samples = dropFilters.samples === undefined ? [] : dropFilters.samples;
                dropFilters.projects = dropFilters.projects === undefined ? [] : dropFilters.projects;
                dropFilters.components = dropFilters.components === undefined ? [] : dropFilters.components;

                // Check if report file has the highlights object. If not, add
                // empty
                if (parsedString.data.highlights !== undefined) {
                    dropHighlights = parsedString.data.highlights;
                }
                dropHighlights.samples = dropHighlights.samples === undefined ? [] : dropHighlights.samples;
                dropHighlights.projects = dropHighlights.projects === undefined ? [] : dropHighlights.projects;

                // Update state filters by updating filters by concatenating
                // unique state and drop filters
                if (this.state.filters !== undefined) {
                    globalFilters.samples = [...new Set([
                        ...(this.state.filters === null ? [] : this.state.filters.samples),
                        ...dropFilters.samples])];
                    globalFilters.projects = [...new Set([
                        ...(this.state.filters === null ? [] : this.state.filters.projects),
                        ...dropFilters.projects])];
                    globalFilters.components = [...new Set([
                        ...(this.state.filters === null ? [] : this.state.filters.components),
                        ...dropFilters.components])];
                }

                // Update state highlights by concatenating
                // unique state and drop highlights
                if (this.state.highlights !== undefined) {
                    globalHighlights.samples = [...new Set([
                        ...(this.state.highlights === null ? [] : this.state.highlights.samples),
                        ...dropHighlights.samples])];
                    globalHighlights.projects = [...new Set([
                        ...(this.state.highlights === null ? [] : this.state.highlights.projects),
                        ...dropHighlights.projects])];
                }

                // Build dropData object to pass to state. It has the
                // filters and highlights obtained from the file but also
                // the concatenation with the previous ones
                const jsonData = {
                    reportData,
                    filters: globalFilters,
                    highlights: globalHighlights,
                    dropFilters: dropFilters,
                    dropHighlights: dropHighlights
                };

                if (this.state.reportData === null) {
                    this.loadReports(jsonData);
                } else {
                    this.setState({dropData: jsonData});
                    this.setModalState(true)
                }
            } catch (e) {
                console.log(e);
            }
        }.bind(this);

        reader.readAsText(data)
    }

    componentDidMount() {
        // Add method that restores URL state on page relog
        window.addEventListener("beforeunload", this._restoreUrlState.bind(this));
        // Clear the current URL state with setTimeout to prevent blocking
        setTimeout(this._clearUrlState.bind(this), 100);
        // Clear the loading component
        setTimeout(this._cancelLoading.bind(this), 1000);
    }

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

    render() {
        /*console.log("RENDER", this.state.reportData, this.state.filters, this.state.highlights);*/
        return (
            <div>
                <FileDrop onDrop={this.handleDrop}>
                    <DragAndDropModal openModal={this.state.openModal}
                                      setModalState={this.setModalState}
                                      dropData={this.state.dropData}
                                      mergeReports={this.mergeReports}
                                      loadReports={this.loadReports}/>
                    {

                        this.state.loading ?
                            <LoadingScreen/> :
                            <div>
                                {/*Add updateState to Context, allowing its
                                 use on child components without the need of
                                  passing it as prop*/}
                                <ReportDataProvider value={{
                                    updateState: this._updateState.bind(this),
                                    reportData: this.state.reportData,
                                    additionalInfo: this.state.additionalInfo
                                }}>
                                    <ReportsApp
                                        reportData={this.state.reportData}
                                        filters={this.state.filters}
                                        highlights={this.state.highlights}
                                        additionalInfo={this.state.additionalInfo}
                                        updateState={this._updateState.bind(this)}
                                    />
                                </ReportDataProvider>
                            </div>
                    }
                </FileDrop>
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

        let filters = {
            samples: [],
            projects: [],
            components: []
        };
        let highlights = {
            samples: [],
            projects: []
        };

        if (props.filters) {
            filters = props.filters;
        }

        if (props.highlights) {
            highlights = props.highlights;
        }

        this.state = {
            filters,
            highlights,
            // Variable used to know if is currently on filtering or updating
            filterAndHighlighting: false
        }
    }

    updateFilters = (filters) => {
        // Set filterAndHighlighting to true prevents updating filters and
        // highlights from props in the getDerivedStateFromProps function
        this.setState({
            filters,
            filterAndHighlighting: true
        })
    };

    updateHighlights = (highlights) => {
        this.setState({
            highlights,
            filterAndHighlighting: true
        })
    };

    filterReportArray = (reportArray, filters) => {

        // Stores the JSON keys inside the reportJSON object that contain sample
        // names. This method will check for the absence of sample names in the
        // arrays corresponding to these keys and remove samples that are not
        // selected
        const sampleKeys = ["plotData", "tableRow", "warnings", "fails"];

        let filteredReport = [];
        let save = true;

        for (const el of JSON.parse(JSON.stringify(reportArray))) {
            // Skip entries not present in project selection
            if (filters.projects.includes(el.projectid)) {
                save = false
            }

            // Skip entries not present in component selection
            if (filters.components.includes(el.processName)) {
                save = false
            }

            if (!save) {
                save = true;
                continue
            }

            filteredReport.push(el);

            // Filter samples from entries
            if (el.hasOwnProperty("reportJson")) {
                for (const key of sampleKeys) {
                    let filteredSamples = [];
                    if (el.reportJson.hasOwnProperty(key)) {
                        for (const sample of el.reportJson[key]) {
                            if (!filters.samples.includes(sample.sample)) {
                                filteredSamples.push(sample);
                            }
                        }
                    }
                    el.reportJson[key] = filteredSamples;
                }
            }


            save = true
        }

        return filteredReport

    };

    static getDerivedStateFromProps(props, state) {

        let update = false;

        // Check if filters or highlights props are different from the
        // current state. Also prevent the update if performing a filter
        // or highlight
        if (!state.filterAndHighlighting && (JSON.stringify(state.filters) !== JSON.stringify(props.filters) && props.filters ||
            JSON.stringify(state.highlights) !== JSON.stringify(props.highlights) && props.highlights)) {
            update = true;
        }
        // Update filters and highlights if from dragNdrop
        if (update) {
            let filters = props.filters;
            let highlights = props.highlights;

            return {
                filters,
                highlights
            };

        } else if (state.filterAndHighlighting) {
            return {
                filterAndHighlighting: false
            }
        }
        return null;

    }

    componentDidUpdate() {
        // Updates the reportData state and any additional information
        // passed to the component
        if (this.props.updateState) {
            this.props.updateState(
                this.props.reportData,
                this.props.additionalInfo,
                this.state.filters,
                this.state.highlights
            )
        }

    }

    /*shouldComponentUpdate(nextProps, nextState) {

        console.log(nextProps.filters, nextState.filters, this.state.filters);
        if (nextProps.reportData !== this.props.reportData) {
            return true
        } else if (nextState.filters === this.state.filters) {
            return true
        } else {
            return false
        }

    }*/

    render() {

        const activeReports = this.filterReportArray(this.props.reportData, this.state.filters);
        // const activeReports = this.props.reportData;

        const {tableData, tableSamples} = findTableSignatures(activeReports);
        const {charts, chartSamples} = findChartSignatures(activeReports);
        const qcInfo = findQcWarnings(activeReports);
        const tables = [...tableData.keys()];

        //
        // This is the main element where the Reports components will be added,
        // Their addition should be conditional on the presence of relevant
        // data in the this.state.reportData array, and each component should
        // be responsible for handling the data in any way they see fit.
        //
        return (
            <div>
                <ReportAppProvider value={{
                    highlights: this.state.highlights,
                    updateHighlights: this.updateHighlights.bind(this),
                    filters: this.state.filters,
                    updateFilters: this.updateFilters.bind(this),
                    charts: charts,
                    tableData,
                    qcInfo,
                    reportData: this.props.reportData
                }}>
                    <ReportsHeader tableHeaders={tables}
                                   chartHeaders={charts}>
                        <TaskButtons/>
                        <Element name={"reportOverview"}
                                 className={styles.scrollElement}>
                            <ReportOverview
                                reportData={this.props.reportData}
                                tableSamples={tableSamples}
                                chartSamples={chartSamples}
                                charts={charts}
                                filters={this.state.filters}
                                updateFilters={this.updateFilters}
                                qcInfo={qcInfo}/>
                        </Element>
                        {
                            tables.includes("metadata") &&
                            <Element name={"metadataTable"}
                                     className={styles.scrollElement}>
                                <MetadataTable
                                    tableData={tableData.get("metadata")}
                                    reportData={activeReports}/>
                            </Element>
                        }
                        {
                            tables.includes("qc") &&
                            <Element name={"qcTable"}
                                     className={styles.scrollElement}>
                                <QualityControlTable
                                    tableData={tableData.get("qc")}
                                    qcInfo={qcInfo}/>
                            </Element>
                        }
                        {
                            tables.includes("assembly") &&
                            <Element name={"assemblyTable"}
                                     className={styles.scrollElement}>
                                <AssemblyTable
                                    tableData={tableData.get("assembly")}
                                    qcInfo={qcInfo}
                                    additionalInfo={this.props.additionalInfo}
                                    reportData={this.props.reportData}
                                />
                            </Element>
                        }
                        {
                            tables.includes("abricate") &&
                            <Element name={"abricateTable"}
                                     className={styles.scrollElement}>
                                <AbricateTable
                                    tableData={tableData.get("abricate")}/>
                            </Element>
                        }
                        {
                            tables.includes("chewbbaca") &&
                            <Element name={"chewbbacaTable"}
                                     className={styles.scrollElement}>
                                <ChewbbacaTable
                                    tableData={tableData.get("chewbbaca")}
                                    reportData={activeReports}
                                    additionalInfo={this.props.additionalInfo}
                                />
                            </Element>
                        }
                        {
                            tables.includes("phyloviz") &&
                            <Element name={"phylovizTable"}
                                     className={styles.scrollElement}>
                                <PhylovizTable
                                    tableData={tableData.get("phyloviz")}
                                    reportData={activeReports}/>
                            </Element>
                        }
                        {
                            charts.includes("base_n_content") &&
                            <Element name={"base_n_contentChart"}
                                     className={styles.scrollElement}>
                                <FastQcCharts rawReports={activeReports}/>
                            </Element>
                        }
                        {
                            charts.includes("size_dist") &&
                            <Element name={"size_distChart"}
                                     className={styles.scrollElement}>
                                <AssemblySizeDistChart
                                    rawReports={activeReports}/>
                            </Element>
                        }
                    </ReportsHeader>
                </ReportAppProvider>
            </div>
        )
    }
}