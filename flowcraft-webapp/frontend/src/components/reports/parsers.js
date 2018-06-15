/**
* Parses the reportData array and search for all unique table signatures.
* Returns an array with the table signatures found
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