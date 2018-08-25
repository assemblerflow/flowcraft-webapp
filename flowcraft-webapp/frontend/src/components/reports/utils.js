
import {address} from "../../../config.json"

/**
 * Converts a Date object to string format in yyyy-mm-dd
 *
 * @param {Date} date - Date object
 * @returns {string} - Date string in yyyy-mm-dd
 */
const convertDateInverse = (date) => {
    let dd = date.getDate();
    let mm = date.getMonth() + 1;
    if(dd<10){
        dd="0" + dd;
    }
    if(mm<10){
        mm="0" + mm;
    }
    return date.getFullYear() + "-" + mm + "-" + dd;
};

/**
 * Function to send file to user, client-side
 * @param filename
 * @param text
 */
export const sendFile = (filename, text) => {

    window.URL = window.URL || window.webkitURL;

    const csvData = new Blob([text], { type: "application/json" });
    const csvUrl = window.URL.createObjectURL(csvData);

    const element = document.createElement("a");
    element.href =  csvUrl;
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

/**
 * Get strain related files from INNUENDO instances
 * @param filePath
 * @param sampleNames
 * @returns {Promise.<void>}
 */
export const getFile = async (filePath, sampleNames) => {

    const url = address + "app/api/v1.0/reports/strain/files/?path=" +
        filePath + "&sampleNames=" + sampleNames ;

    const link = document.createElement("a");
    link.download = filePath.split('/').slice(-1)[0];
    link.href = url;
    link.click();

};

/**
 * Get the assembly location on the INNUENDO instance
 * @param sampleId
 * @param pipelineId
 * @returns {[null,null]}
 */
const getAssemblyPath = (sampleId, reportData) => {

    let assemblySuffix = '/results/assembly/';
    let filePath;
    let sampleName;

    for (const el of reportData){
        let wantedTask = false;
        try{
            wantedTask = el.task.indexOf("pilon") > -1;
        }
        catch(e){
            wantedTask = false;
        }
        if (wantedTask){
            const pid = `${el.projectid}.${el.reportJson.tableRow[0].sample}`;
            if (sampleId === pid){
                //assemblySuffix = assemblySuffix + el.report_json.task + `/${el.sample_name}_trim_spades3111_proc_filt_polished.fasta`;
                assemblySuffix = assemblySuffix + el.task +
                    `/${el.reportJson.tableRow[0].sample}_trim_spades3111_proc_filt_polished.fasta`;
                filePath = el.workdir.split("/").slice(0, -3).join("/") + assemblySuffix;
                sampleName = el.sample_name
            }
        }
    }

    return [filePath, sampleName];
};

/**
 * Get the assembly paths and strain names from the selected rows on the
 * assembly table
 * @param dt
 * @returns {[null,null]}
 */
export const getAssemblies = (rows, reportData) => {

    let fileList = [];
    let sampleNames = [];

    for (const row of rows) {
        const pid = `${row.projectId}.${row._id}`;
        const res = getAssemblyPath(pid, reportData);
        fileList.push(res[0]);
        sampleNames.push(res[1]);
    }

    return [fileList, sampleNames];
};


/**
 * Populates the sample and date picker filters according to the data from the
 * selected projects.
 *
 * This function is responsible for updating the pickers of both home and
 * navbar elements.
 *
 * @param {Array} projectsData - Array of objects, each with information of
 * a project
 */
export const parseProjectSearch = (projectsData) => {
    let totalDates = [];
    let totalNames = [];

    projectsData.map((entry) => {
        if(totalDates.indexOf(entry.timestamp) < 0){
            totalDates.push(new Date(entry.timestamp));
        }
        if(totalNames.indexOf(entry.sample_name) < 0){
            totalNames.push(entry.sample_name);
        }
    });

    const maxDate = convertDateInverse(new Date(Math.max.apply(null, totalDates)));
    const minDate = convertDateInverse(new Date(Math.min.apply(null, totalDates)));

    return {
        maxDate: maxDate,
        minDate: minDate,
        totalNames: totalNames
    }

};

/**
 * Filter metadata based on the selected strains
 * @param reportInfo
 * @param selectedSamples
 * @returns {[null,null]}
 */
export const getMetadataMapping = (reportInfo, selectedSamples) => {

    let projectAr = [];
    let sampleAr = [];

    for (const el of reportInfo) {
        if (selectedSamples.includes(el.sample_name)){
            projectAr.push(el.project_id);
            sampleAr.push(el.sample_name);
        }
    }

    const projectStr = projectAr.join();
    const sampleStr = sampleAr.join();

    return [projectStr, sampleStr];

};


export const sortByContent = (a, b) => {

    const aValue = a.props.hasOwnProperty("content") ? a.props.content.length : -1;
    const bValue = b.props.hasOwnProperty("content") ? b.props.content.length : -1;

    return aValue > bValue ? 1 : -1;

};


export const sortByPropsValue = (a, b) => {

    const aValue = a.props.hasOwnProperty("value") ? a.props.value : -1;
    const bValue = b.props.hasOwnProperty("value") ? b.props.value : -1;

    return aValue > bValue ? 1 : -1;

};


export const sortNumber = (a, b) => {
    return a - b
};