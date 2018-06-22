import React from "react";
import Typography from "@material-ui/core/Typography";

import {CellBar} from "./tables";

import styles from "../../styles/reports.css"

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
export const findTableSignatures = (reportArray) => {

    // Stores the unique table signatures found and sets the value as the
    // array of JSON for those tables
    let tables = new Map();

    for (const r of reportArray){

        // Skip entries without the tableRow signture
        if (!r.reportJson.hasOwnProperty("tableRow")){
            continue
        }

        for (const tr of r.reportJson.tableRow){
            if (!tr.hasOwnProperty("data")){
                continue
            }

            for (const cell of tr.data){

                cell.rowId = tr.sample;
                cell.projectId = r.projectid;
                cell.processName = r.processName;
                cell.processId = r.processId;

                if (!tables.has(cell.table)){
                    tables.set(cell.table, [cell])
                } else {
                    tables.get(cell.table).push(cell)
                }
            }
        }
    }

    return tables;

};


/**
 * Method used to retrieve the JSON array needed for the column headers of
 * a ReactTable component. The Headers are sorted by their processId attribute.
 * @param dataArray
 * @returns {{accessor: *, Header: *, processName: *}[]}
 */
export const getTableHeaders = (dataArray) => {

    let columnsMap = new Map();

    // Build the unsorted Map object for each column eader
    for (const el of dataArray){
        const columnAccessor = el.header.split(" ").join("");
        const processNum = el.processId.split("_").slice(-1);
        if (!columnsMap.has(columnAccessor)) {
            columnsMap.set(columnAccessor, {
                num: parseInt(processNum),
                header: el.header,
                processName: el.processName
            })
        }
    }

    // Sort the column headers according to the processId
    const sortedColumns = [...columnsMap.entries()].sort((a, b) => {return a[1].num - b[1].num});

    return sortedColumns.map((v) => {
        return {
            accessor: v[0],
            Header: v[1].header,
            processName: v[1].processName,
        }
    })

};


/**
 * Returns the maximum numeric values for each header in the reportArray. Returns
 * a Map object with headers as keys and the maximum values as values.
 * @param reportArray
 * @returns {Map<any, any>}
 */
const getColumnMax = (reportArray) => {

    let columnMax = new Map();

    for (const cell of reportArray){

        if (!columnMax.has(cell.header)){
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
 * @returns {*[]}
 */
export const genericTableParser = (reportArray) => {

    let dataDict = {};
    let columnsArray = [];
    let finalDataDict = [];


    const tableHeaders  = getTableHeaders(reportArray);
    const columnMaxVals = getColumnMax(reportArray);

    // Add ID to columns
    columnsArray.push({
        Header: <Typography>ID</Typography>,
        accessor: "rowId",
        minWidth: 90
    });

    // Add headers with typography and minWidth
    for (const h of tableHeaders){
        columnsArray.push({
            Header: <Typography>{h.Header}</Typography>,
            accessor: h.accessor,
            minWidth: 90
        })
    }

    for (const cell of reportArray) {

        const joinHeader = cell.header.split(" ").join("");

        // Add values to dictionary by rowId
        if (!dataDict.hasOwnProperty(cell.rowId)) {
            dataDict[cell.rowId] = {
                "rowId": <Typography className={styles.tableCell}>{cell.rowId}</Typography>
            };
            dataDict[cell.rowId][joinHeader] = <CellBar value={cell.value} max={columnMaxVals.get(cell.header)}/>;
        } else {
            dataDict[cell.rowId][joinHeader] = <CellBar value={cell.value} max={columnMaxVals.get(cell.header)}/>;
        }
    }

    // Create array of data by row
    for (const id in dataDict){
        finalDataDict.push(dataDict[id]);
    }

    return [
        finalDataDict,
        columnsArray
    ]

};