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
