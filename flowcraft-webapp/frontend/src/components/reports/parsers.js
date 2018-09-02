import _ from "lodash";
import React from "react";

import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";

import HeartPulseIcon from "mdi-react/HeartPulseIcon";

import {CellBar} from "./tables";
import {QcPopover} from "./tables";
import {getHighlight} from "./utils";

import {sortByPropsValue, sortQcValues, sortColor} from "./utils";
import {ColorPaper} from "./overview";

import styles from "../../styles/reports.css"
import MarkerIcon from "mdi-react/MarkerIcon";

/**
 * Parses the reportData array and search for all unique table signatures.
 * Returns an array with the table signatures found
 *
 * This will check each object in report Array for the presence of the
 * following signature:
 *      object["report_json"]["tableRow"]
 *
 * If present, this will be an array of objects, each containing an individual
 * entry belonging to table defined by the `table` key.
 *
 * @param reportArray : Raw reports array of objects
 */
export const findTableSignatures = (reportArray, highlights) => {

    // Set default highlight values
    if (!highlights){
        highlights = {
            samples: [],
            projects: []
        }
    }

    console.log(highlights)

    // Stores the unique table signatures found and sets the value as the
    // array of JSON for those tables
    let tables = new Map();

    // Stores the list of samples
    let samples = [];

    const signatures = ["tableRow"];

    for (const r of reportArray) {

        // Only process if entry is a report
        // Pass if metadata
        if (r.hasOwnProperty("reportJson")) {
            for (const s of signatures) {

                // Skip entries without the tableRow signture
                if (!r.reportJson.hasOwnProperty(s)) {
                    continue
                }

                for (const tr of r.reportJson[s]) {
                    if (!tr.hasOwnProperty("data")) {
                        continue
                    }

                    for (const cell of tr.data) {

                        // Add to samples array, if new sample
                        !samples.includes(tr.sample) && samples.push(tr.sample);

                        // Add highlight, if present. Sample takes precedence over
                        // project.
                        const highlightElement = getHighlight(highlights, tr.sample, r.projectid)

                        cell.rowId = tr.sample;
                        cell.projectId = r.projectid;
                        cell.processName = r.processName;
                        cell.processId = r.processId;
                        cell.pipelineId = r.pipelineId;
                        cell.highlight = highlightElement ? highlightElement : null;

                        if (!tables.has(cell.table)) {
                            tables.set(cell.table, [cell])
                        } else {
                            tables.get(cell.table).push(cell)
                        }
                    }
                }

            }
        }
        else {
            if (r.hasOwnProperty("phyloviz_user")) {
                parsePhylovizTrees(r, tables);
            }
            else if (r.hasOwnProperty("strain_metadata")) {
                // Case metadata in report
                parseInnuendoMetadata(r, tables);
            }
        }

    }

    return {
        tableData: tables,
        tableSamples: samples,
    };

};


/**
 * Parses the INNUENDO metadata entries to construct the metadata table.
 * Uses metadata as processName and processId since they are required to
 * construct the general table headers.
 * Header text is defined by the mapping available in the configuration file.
 * @param metadataEntry
 */
const parseInnuendoMetadata = (metadataEntry, tables) => {

    const parsedFields = JSON.parse(metadataEntry.strain_metadata);
    const headers = Object.keys(parsedFields);

    let row = {};

    // Metadata fields from reports and mapping for table headers
    const metadataMapping = {
        "species_id": "Species ID",
        "Location": "Location",
        "SampleReceivedDate": "Sample Received Date",
        "source_Source": "Source",
        "AdditionalInformation": "Additional Information",
        "File_1": "File 1",
        "Accession": "Accession",
        "Owner": "Owner",
        "Food-Bug": "Case ID",
        "Submitter": "Submitter",
        "SamplingDate": "Sampling Date",
        "File_2": "File 2"
    };

    for (const header of headers) {
        let cell = {};

        // Add cell case it exists in innuendo metadataMapping from the
        // config.json
        // Constructs the cells to fill the requirements of the general
        // table parser.
        if (metadataMapping.hasOwnProperty(header)) {
            cell.header = metadataMapping[header];
            cell.value = parsedFields[header];
            cell.table = "metadata";
            cell.columnBar = true;
            cell.processName = "metadata";
            cell.processId = "metadata";
            cell.projectId = "metadata";
            cell.pipelineId = "metadata";
            cell.rowId = metadataEntry.strainID;
            cell.hideOverview = true;

            if (!tables.has(cell.table)) {
                tables.set(cell.table, [cell])
            } else {
                tables.get(cell.table).push(cell)
            }
        }
    }
};

const parsePhylovizTrees = (treeEntry, tables) => {

    const headers = Object.keys(treeEntry);
    let row = {};

    // Trees fields from reports and mapping for table headers
    const treesMapping = {
        "name": "Name",
        "phyloviz_user": "PHYLOViZ User",
        "timestamp": "Timestamp"
    };

    const columnOrder = ["phyloviz_user", "timestamp"];

    for (const header of columnOrder) {
        let cell = {};

        // Add cell case it exists in innuendo metadataMapping from the
        // config.json
        // Constructs the cells to fill the requirements of the general
        // table parser.
        if (treesMapping.hasOwnProperty(header)) {
            cell.header = treesMapping[header];
            cell.value = treeEntry[header];
            cell.table = "phyloviz";
            cell.columnBar = true;
            cell.processName = "phyloviz";
            cell.processId = "phyloviz";
            cell.projectId = "phyloviz";
            cell.pipelineId = "phyloviz";
            cell.rowId = treeEntry.name;
            cell.uri = treeEntry.uri;
            cell.hideOverview = true;

            if (!tables.has(cell.table)) {
                tables.set(cell.table, [cell])
            } else {
                tables.get(cell.table).push(cell)
            }
        }
    }

};


/**
 * Parses the reportData array and search for all unique chart signatures.
 * Returns an array object with the chart signatures.
 *
 * This will check each object in report Array for the presence of the
 * following signature:
 *      object["report_json"]["plotData"]
 *
 * @param reportArray
 * @returns {Array}
 */
export const findChartSignatures = (reportArray) => {

    let charts = [];
    let samples = [];

    for (const r of reportArray) {
        if (r.hasOwnProperty("reportJson")) {
            // Skip entries without the plotData signature
            if (!r.reportJson.hasOwnProperty("plotData")) {
                continue
            }

            for (const el of r.reportJson.plotData) {

                if (!el.hasOwnProperty("data")) {
                    continue
                }

                for (const plot of Object.keys(el.data)) {

                    !charts.includes(plot) && charts.push(plot);
                    !samples.includes(el.sample) && samples.push(el.sample);
                }
            }
        }
    }

    return {
        charts,
        chartSamples: samples
    };
};

/**
 * This method searches the raw report JSON for warnings and fails. This
 * information will be stored in a Map object that will contain the following
 * structure:
 *      {<table>: {
 *          <sample>: {
 *              fail: [<fail object>]
 *              warnings: [<warning object>]
 *          }
 *      }}
 *
 * NOTE: This function will only populate the Map object when the warnings/fails
 * exist. Otherwise, the entries will not appear. For instance, if there are no
 * warnings/fails for a given table, that table will not appear in the Map object.
 *
 * @param reportArray
 * @returns {Map<any, any>}
 */
export const findQcWarnings = (reportArray) => {

    let qcInfo = new Map();

    for (const r of reportArray) {

        if (r.hasOwnProperty("reportJson")) {
            // Parse fails
            if (r.reportJson.hasOwnProperty("fail")) {
                for (const f of r.reportJson.fail) {

                    const failObj = {
                        process: r.processName,
                        project: r.projectid,
                        message: f.value
                    };

                    // In case the table does not exist yet
                    if (!qcInfo.has(f.table)) {
                        qcInfo.set(f.table, new Map([[f.sample, {"fail": [failObj]}]]))
                        // When the table already exists, but not the current sample
                    } else if (!qcInfo.get(f.table).has(f.sample)) {
                        qcInfo.get(f.table).set(f.sample, {"fail": [failObj]})
                    } else {
                        // When the table and sample exist, but not the fail entry
                        if (qcInfo.get(f.table).get(f.sample).hasOwnProperty("fail")) {
                            qcInfo.get(f.table).get(f.sample)["fail"].push(failObj)
                        } else {
                            qcInfo.get(f.table).get(f.sample)["fail"] = [failObj]
                        }
                    }
                }
            }

            // Parse warnings
            if (r.reportJson.hasOwnProperty("warnings")) {
                for (const f of r.reportJson.warnings) {

                    const warnObj = {
                        process: r.processName,
                        project: r.projectid,
                        message: f.value,
                        sample: f.sample
                    };

                    // In case the table does not exist yet
                    if (!qcInfo.has(f.table)) {
                        qcInfo.set(f.table, new Map([[f.sample, {"warnings": [warnObj]}]]))
                        // When the table already exists, but not the current sample
                    } else if (!qcInfo.get(f.table).has(f.sample)) {
                        qcInfo.get(f.table).set(f.sample, {"warnings": [warnObj]})
                    } else {
                        // When the table and sample exist, but not the fail entry
                        if (qcInfo.get(f.table).get(f.sample).hasOwnProperty("warnings")) {
                            qcInfo.get(f.table).get(f.sample)["warnings"].push(warnObj)
                        } else {
                            qcInfo.get(f.table).get(f.sample)["warnings"] = [warnObj]
                        }
                    }
                }
            }
        }
    }

    return qcInfo;
};


/**
 * Method used to retrieve the JSON array needed for the column tableHeaders of
 * a ReactTable component. The Headers are sorted by their processId attribute.
 * @param dataArray
 * @returns {{tableHeaders: {accessor: string, Header: *, processName: *}[], duplicateAccessors: Array}}
 */
export const getTableHeaders = (dataArray) => {

    // Stores the unsorted columns gathered from the dataArray in a Map object.
    // The keys will be temporary accessor built from the column header name
    // and the corresponding process without PID (e.g.: 'Reads___integrity_coverage')
    let columnsMap = new Map();
    // A Map object that will store the sample names (rowId) as keys and the
    // corresponding column accessors (the same as columnsMap). When more than
    // one temporary accessor is found for any given sample, that accessor
    // is added to the duplicateAccessors array to indicate that this column
    // should appear multiple times in the table, with different process names
    let speciesMap = new Map();
    // Stores duplicated temporary accessors
    let duplicateAccessors = [];
    // Stores the processNames of each column header. This is used to fetch
    // the processNames of column when there are duplicate accessors.
    let headerPidMap = new Map();

    // Build the unsorted Map object for each column header
    for (const el of dataArray) {
        const headerStrip = el.header.split(" ").join("");
        const columnAccessor = `${headerStrip}___${el.processName.replace(el.processId, "").slice(0, -1)}`;
        const processNum = el.processId.split("_").slice(-1);

        // Update the headerPidMap object with the processNames associated to each
        // column header
        if (!headerPidMap.has(headerStrip)) {
            headerPidMap.set(headerStrip, [el.processName])
        } else if (!headerPidMap.get(headerStrip).includes(el.processName)) {
            headerPidMap.get(headerStrip).push(el.processName)
        }

        // Update and check whether there are duplicate accessors of column headers
        // for the same sample (rowID)
        if (!speciesMap.has(el.rowId)) {
            speciesMap.set(el.rowId, [columnAccessor]);
        } else {
            if (speciesMap.get(el.rowId).includes(columnAccessor) && !duplicateAccessors.includes(columnAccessor)) {
                duplicateAccessors.push(columnAccessor);
            } else {
                speciesMap.get(el.rowId).push(columnAccessor);
            }
        }

        if (!columnsMap.has(columnAccessor)) {
            columnsMap.set(columnAccessor, {
                num: parseInt(processNum),
                header: el.header,
                processName: el.processName,
                processId: el.processId
            })
        }
    }

    // Sort the column tableHeaders according to the processId
    const sortedColumns = [...columnsMap.entries()].sort((a, b) => {
        return a[1].num - b[1].num
    });


    // Build the final table headers. If a column header was found to be duplicated
    // for the same sample, create duplicate column headers with the corresponding
    // process names. This happens when there is a fork in a pipeline and there
    // are multiple identical headers from different process in the pipeline.
    let tableHeaders = [];
    for (const v of sortedColumns) {

        // In case there are duplicate headers
        if (duplicateAccessors.includes(v[0])) {
            const headerStrip = v[1].header.split(" ").join("");
            // Add each individual header with the different process names
            for (const pname of headerPidMap.get(headerStrip)) {
                tableHeaders.push({
                    accessor: `${headerStrip}${pname}`,
                    Header: v[1].header,
                    processName: pname,
                    processId: v[1].processId
                })
            }
            // When there are no header duplications
        } else {
            tableHeaders.push({
                accessor: `${v[0].split("___")[0]}_${v[1].processName.replace(v[1].processId, "").slice(0, -1)}`,
                Header: v[1].header,
                processName: v[1].processName,
                processId: v[1].processId
            })
        }
    }

    // console.log(duplicateAccessors)

    return {
        tableHeaders,
        duplicateAccessors
    }

};


/**
 * Returns the maximum numeric values for each header in the reportArray. Returns
 * a Map object with tableHeaders as keys and the maximum values as values.
 * @param reportArray
 * @returns {Map<any, any>}
 */
const getColumnMax = (reportArray) => {

    let columnMax = new Map();

    for (const cell of reportArray) {

        if (!columnMax.has(cell.header)) {
            columnMax.set(cell.header, parseFloat(cell.value))
        } else if (parseFloat(cell.value) > columnMax.get(cell.header)) {
            columnMax.set(cell.header, parseFloat(cell.value))
        }

    }

    return columnMax
};


/**
 * Generic parser for simple numeric table data. This simply assumes that each
 * JSON in the reportArray argument has a numeric value that should be displayed
 * as is. Additional modifications to the table cell can still be performed
 * conditional on the present of certain keys in the JSON (columnBar for instance)
 * @param reportArray
 * @returns {{tableArray: Array, columnsArray: Array, rawTableArray: Array}}
 */
export const genericTableParser = (reportArray, action) => {

    if (!action){
        action = undefined;
    }

    // Temporary data object. Will be used to generate the finalDataDict array
    let dataDict = {};

    // Stores the final processed data to display in the table, already
    // with the final components of the table cells
    let tableArray = [];

    // Stores the final array, but contains the raw values, instead of the
    // processed cell components used in the tableArray.
    let rawDataDict = {};
    let rawTableArray = [];


    const {tableHeaders, duplicateAccessors} = getTableHeaders(reportArray);

    const columnMaxVals = getColumnMax(reportArray);

    // Add ID to columns
    let columnsArray = [{
        Header: <MarkerIcon/>,
        headerStyle: {
            margin: "auto"
        },
        accessor: "highlight",
        sortMethod: sortColor,
        minWidth: 40,
        width: 40,
        style: {
            margin: "auto",
            textAlign: "center"
        }
    }, {
        Header: <Typography style={{fontWeight: "bold"}}>ID</Typography>,
        headerStyle: {
            margin: "auto",
        },
        filterMethod: (filter, rows) => {
            return rows.rowId.props.children.includes(filter.value)
        },
        accessor: "rowId",
        minWidth: 150
    }];

    // Add tableHeaders with typography and minWidth
    for (const h of tableHeaders) {

        columnsArray.push({
            Header: <div>
                <Typography
                    className={styles.tableMainHeader}>{h.Header}</Typography>
                <Typography
                    className={styles.tableSecondaryHeader}>{h.processName}</Typography>
            </div>,
            accessor: h.accessor,
            minWidth: 120,
            sortMethod: sortByPropsValue
        })
    }

    for (const cell of reportArray) {

        // Check if the header is repeated for the same sample. If so, the
        // accessor should used the processName variable. Otherwise, use only
        // the header.
        const header = `${cell.header.split(" ").join("")}___${cell.processName.replace(cell.processId, "").slice(0, -1)}`;
        const accessor = duplicateAccessors.includes(header) ?
            `${cell.header.split(" ").join("")}${cell.processName}` :
            `${cell.header.split(" ").join("")}_${cell.processName.replace(cell.processId, "").slice(0, -1)}`;

        // Add values to dictionary by rowId
        if (!dataDict.hasOwnProperty(cell.rowId)) {
            // Add rowId in the _id field to have checkbox on Checkbox
            // React-table

            let initialDataObject = {
                "_id": String(cell.rowId),
            };

            // Add all cell values to row data object. They will then be
            // modified according with the accessor. All data defined as
            // part of a cell in findTableSignatures will be available as
            // part of the data available in the row selection
            for (const key of Object.keys(cell)){
                if (key === "rowId"){
                    initialDataObject[key] = <Typography className={styles.tableCell}>{cell[key]}</Typography>
                } else if (key === "highlight"){
                    initialDataObject[key] = cell.highlight ? <ColorPaper idx={cell.highlight.idx} color={cell.highlight.color}/> : null
                } else {
                    initialDataObject[key] = cell[key];
                }
            }

            dataDict[cell.rowId] = initialDataObject;

            rawDataDict[cell.rowId] = {
                "rowId": cell.rowId
            };
        }

        // When an action is provided as argument, add the callback to a clic
        // event on the tabel cell.
        dataDict[cell.rowId][accessor] =
            <CellBar action={action ? () => {action(cell)} : () => {}} value={cell.value} max={columnMaxVals.get(cell.header)}/>;
        rawDataDict[cell.rowId][accessor] = cell.value;
    }

    // Create array of data by row
    for (const id in dataDict) {
        tableArray.push(dataDict[id]);
        rawTableArray.push(rawDataDict[id])
    }

    return {
        tableArray,
        columnsArray,
        rawTableArray,
    }

};


/**
 * This function extends the table data retrieve from the genericTableParser
 * to include information about the quality control of each sample. It adds
 * a new "QC" column and an icon button with information about the quality
 * control.
 * @param tableData : Object Processed table data retrieved from genericTableParser
 * @param originalData : Array Original table data received in the component's props
 * @param qcInfo : Map qcInfo Map object in the component's props
 * @param signature: String The signature of the QC data that will be fetched from qcInfo
 */
export const qcParseAdditionalData = (tableData, originalData, qcInfo, signature) => {

    const style = {
        qcColumn: {
            margin: "auto",
            textAlign: "center"
        },
        qcTextHeader: {
            fontWeight: "bold",
            marginBottom: "10px",
            marginTop: "5px",
        },
        header: {
            fontWeight: "bold"
        },
        headerContainer: {
            margin: "auto"
        }
    };

    // Add new column
    tableData.columnsArray.splice(1, 0, {
        Header: <Tooltip placement={"top"} title={"Quality control messages"}><HeartPulseIcon/></Tooltip>,
        headerStyle: style.headerContainer,
        accessor: "qc",
        minWidth: 55,
        style: style.qcColumn,
        sortMethod: sortQcValues
    });

    // Iterate over each row in table and add the corresponding QC icon and
    // content
    for (const row of tableData.tableArray) {

        const sample = row.rowId.props.children;

        // The default QC icon if no warnings/fails are found for this sample
        row["qc"] = <QcPopover status={"pass"}
                               content={<Typography><b>Sample '{sample}' has
                                   passed all quality control
                                   checks!</b></Typography>}/>;
        let status = "pass";
        let content = [];
        let badgeCount = 0;

        if (qcInfo.has(signature)) {
            if (qcInfo.get(signature).has(sample)) {
                // Check for fail messages for sample
                if (qcInfo.get(signature).get(sample).hasOwnProperty("warnings")) {
                    status = "warnings";
                    badgeCount += qcInfo.get(signature).get(sample).warnings.length;
                    content.push(
                        <div key={"warnings"}>
                            <Typography style={style.qcTextHeader}>Sample
                                '{sample}' has quality control
                                warnings:</Typography>
                            {
                                qcInfo.get(signature).get(sample).warnings.map((el) => {
                                    return (
                                        <div key={el.process}>
                                            <Typography>
                                                <b>Process:</b> {el.process}
                                            </Typography>
                                            <Typography
                                                style={{"marginBottom": "7px"}}><b>Cause: </b>{el.message.join("; ")}
                                            </Typography>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    );
                }

                // Check for warning messages for sample
                if (qcInfo.get(signature).get(sample).hasOwnProperty("fail")) {
                    status = "fail";
                    badgeCount += qcInfo.get(signature).get(sample).fail.length;
                    content.push(
                        <div key={"fail"}>
                            <Typography style={style.qcTextHeader}>Sample
                                '{sample}' has failed quality control
                                checks:</Typography>
                            {
                                qcInfo.get(signature).get(sample).fail.map((el) => {
                                    return (
                                        <div key={el.process}>
                                            <Typography><b>Process:</b> {el.process}
                                            </Typography>
                                            <Typography
                                                style={{"marginBottom": "7px"}}><b>Cause: </b>{el.message.join("; ")}
                                            </Typography>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    );
                }
            }
            if (status !== "pass") {
                row["qc"] = <QcPopover status={status}
                                       content={content}
                                       badgeCount={badgeCount}/>;
            }
        }
    }
};


export const findNfMetadata = (reportsArray) => {

    let nfMetadata = [];

    for (const el of reportsArray){

        if (el.hasOwnProperty("nfMetadata")){
            nfMetadata.push(el);
        }
    }

    return nfMetadata;
};


export const InnuendoReportsTableParser = (reportsArray) => {

    let columnsArray = [];
    let tableArray = [];

    const headers = [
        {header: "Name", accessor: "name"},
        {header: "Username", accessor: "username"},
        {header: "Description", accessor: "description"},
        {header: "Timestamp", accessor: "timestamp"}];

    for (const header of headers) {
        columnsArray.push({
            Header: <div>
                <Typography
                    className={styles.tableMainHeader}>{header.header}</Typography>
            </div>,
            accessor: header.accessor,
            minWidth: 90
        })
    }

    for (const report of reportsArray) {
        report['_id'] = report.name;
        tableArray.push(report);
    }

    return {
        tableArray,
        columnsArray,
        // rawTableData is the same as finalDataArray in this case
        rawTableArray: tableArray
    }
};
