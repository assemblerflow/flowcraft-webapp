export const filterReportArray = (reportArray, filters) => {

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

export const updateFilterArray = (arrayMap, selected, filters) => {

    let activeArray;
    let activeSelection;
    let filterArray;
    let newSelection = {};

    for (const key of Object.keys(arrayMap)){
        filterArray = [];
        activeArray = arrayMap[key].concat(filters[key]);
        activeSelection = selected[key];

        for (const el of activeArray){
            if (activeSelection.keys.length > 0 && !activeSelection.keys.includes(el)){
                !filterArray.includes(el) && filterArray.push(el)
            }
        }

        newSelection[key] = filterArray;
    }

    console.log(newSelection);

    return newSelection;

};


export const updateHighlightArray = (arrayMap, selected, highlights, color) => {

    for (const key of Object.keys(arrayMap)){

        const keySelection = selected[key].keys;
        let addedElements = [];

        for (const el of keySelection){
            arrayMap[key].push({
                label: el,
                color: color,
                idx: highlights[key].length + 1
            });
            addedElements.push(el)
        }

        for (const el of highlights[key]) {
            if (!addedElements.includes(el.label)) {
                arrayMap[key].push(el)
            }
        }
    }

    return arrayMap
};


/*
This method takes a highcharts data array, which should have the 'name' attribute
with the sample name information, and modified the array to highlight a given
sample
 */
export const highlightChartSample = (sample, chartRef) => {

    const chartObj = chartRef.getChart();

    for (const series of chartObj.series){
        if (series.name === sample){
            series.userOptions.lastColor = series.color;
            series.update({
                color: "red",
                zIndex: 100,
            });
        } else if (series.name !== sample && series.color === "red" ){
            series.update({
                color: series.userOptions.lastColor ? series.userOptions.lastColor : null,
                zIndex: 1,
            })
        }
    }

};