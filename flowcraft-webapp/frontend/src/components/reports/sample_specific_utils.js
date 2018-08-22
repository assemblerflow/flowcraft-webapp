
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

