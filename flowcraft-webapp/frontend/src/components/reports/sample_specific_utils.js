
export const updateLabels = (el, fw, idx) => {

        const AxisStyle = {
            title: {
                style: {
                    fontWeight: fw,
                }
            },
        };

        let AxisArray;

        if ( idx === 0 ) {
            AxisArray = [{}, AxisStyle];
        } else {
            AxisArray = [AxisStyle, {}];
        }

        el.chart.update({
            yAxis: AxisArray,
            xAxis: AxisArray
        });
    };


export const getContig = (position, xBars) => {

    let contig = 1;
    let prevPosition = 0;

    for (const val of xBars){
        if (position <= val && position >= prevPosition){
            return contig
        }
        contig = xBars.indexOf(val) + 1;
        prevPosition = val;
    }

};