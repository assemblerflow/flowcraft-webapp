import React from "react";

export class QualityControlTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            data: this.prepareData(props.reportArray),
            columns: this.prepareHeaders(props.reportArray)
        }
    }

    prepareData(reportsArray) {

    }

    prepareHeaders(reportsArray) {

    }

    render () {
        return (
            <div>
                QC table
            </div>
        )
    }
}