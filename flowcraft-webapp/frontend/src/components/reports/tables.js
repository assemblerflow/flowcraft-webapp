import React from "react";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";

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
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Quality control</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div>table</div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}