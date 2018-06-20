import React from "react";

import {genericTableDataParser} from "./parsers";

export class QualityControlTable extends React.Component {

    constructor(props) {
        super(props);

        this.qcTableParser(props.reportData)

    }

    qcTableParser(reportArray){

        const tableData = genericTableDataParser(reportArray, "qc");
        console.log(tableData)
    }

    render () {
        return (
            <div>
                QC table
            </div>
        )
    }
}