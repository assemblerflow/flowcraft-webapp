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

    // Stores the unique table signatures found
    let tables = [];

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
                !tables.includes(cell.table) && tables.push(cell.table)
            }
        }
    }

    return tables;

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