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

/**
 * A generic parser of the reports JSON array. It searches for JSON with
 * the corresponding table signatures and returns a data Map object with
 * the table rows, and a column headers Map object.
 * @param reportArray : array of JSON objects
 * @param table : string with the target table signature
 * @returns {{dataMap: Map<any, any>, columnsMap: Map<any, any>}}
 */
export const genericTableDataParser = (reportArray, table) => {

    let dataMap = new Map();
    let columnsMap = new Map();

    for (const r of reportArray) {
        // Skip objects missing the tableRow signature
        if (!r.reportJson.hasOwnProperty("tableRow")) {
            continue
        }

        for (const tr of r.reportJson.tableRow) {
            // Skip objects without the standard data key
            if (!tr.hasOwnProperty("data")) {
                continue
            }

            const sample = tr.sample;

            for (const cell of tr.data) {

                // Skip tables with different signature
                if (cell.table !== table) {
                    continue
                }

                // Check if sample has been added. If not, add if the
                // dataMap Map object
                if (!dataMap.has(sample)) {
                    dataMap.set(sample, new Map([[cell.header, cell.value]]))
                } else {
                    dataMap.get(sample).set(cell.header, cell.value)
                }

                // Add column, if not already present
                if (!columnsMap.has(cell.header)) {
                    // The processIs is added to sort the columns.
                    columnsMap.set(cell.header, r.processId)
                }
            }
        }
    }

    return {
        dataMap,
        columnsMap
    }

};