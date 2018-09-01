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