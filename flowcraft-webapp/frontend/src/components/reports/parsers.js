import React from "react";
import Typography from "@material-ui/core/Typography";

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
 * Returns the column array ready for ReactTable from an data array provide
 * by findTableSignatures.
 * @param dataArray
 */
export const getTableHeaders = (dataArray) => {

    let columnsMap = new Map();

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

    const sortedColumns = [...columnsMap.entries()].sort((a, b) => {return a[1].num - b[1].num});

    return sortedColumns.map((v) => {
        return {
            accessor: v[0],
            Header: v[1].header,
            processName: v[1].processName,
        }
    })

};


export const genericTableParser = (reportArray) => {

    let dataDict = {};
    let columnsArray = [];
    let finalDataDict = [];


    const tableHeaders  = getTableHeaders(reportArray);

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
                "rowId": <Typography>{cell.rowId}</Typography>
            };
            dataDict[cell.rowId][joinHeader] = <Typography>{cell.value}</Typography>;
        } else {
            dataDict[cell.rowId][joinHeader] = <Typography>{cell.value}</Typography>;
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

}