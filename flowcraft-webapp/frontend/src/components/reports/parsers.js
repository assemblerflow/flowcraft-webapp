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
        if (r["report_json"].hasOwnProperty("tableRow")){
            for (const tr of r["report_json"]["tableRow"]){
                !tables.includes(tr.table) && tables.push(tr.table)
            }
        }
    }

    return tables;

};


export const retrieveTableData = (reportArray, table) => {

    let data = new Map();
    let tableData = new Map();

    for (const r of reportArray){
        if (r["report_json"].hasOwnProperty("tableRow")){
            for (const tr of r["report_json"]["tableRow"]){
                if (tr.table === table){

                    const sample = r["pipeline_id"];

                    // Check if sample has been added. If not, add if the
                    // data Map object
                    if (!data.has(sample)){
                        data.set(sample, new Map([
                            [tr.header, tr.value]
                        ]));
                    } else {
                        data.get(sample).set(tr.header, tr.value)
                    }
                }
            }
        }
    }

    return {
        data,
        tableData
    }

};