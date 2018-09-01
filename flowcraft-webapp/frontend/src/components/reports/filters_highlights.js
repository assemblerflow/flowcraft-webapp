export const updateSelectionArray = (arrayMap, selected, filters) => {

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