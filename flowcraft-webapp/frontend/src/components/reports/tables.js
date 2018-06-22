import React from "react";
import ReactTable from "react-table";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";

import styles from "../../styles/reports.css"

import {genericTableParser} from "./parsers";


export class QualityControlTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tableData: genericTableParser(props.tableData)
        }

    }

    render () {
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Quality control</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <ReactTable data={this.state.tableData[0]}
                                    columns={this.state.tableData[1]}
                                    defaultPageSize={10}
                                    className="-striped -highlight"/>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}


export class AssemblyTable extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            tableData: genericTableParser(props.tableData)
        };
    }

    render () {
        console.log(this.state)
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Assembly</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <ReactTable data={this.state.tableData[0]}
                                    columns={this.state.tableData[1]}
                                    defaultPageSize={10}
                                    className="-striped -highlight"/>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}


export class AbricateTable extends React.Component {
    constructor(props){
        super(props);
    }

    render () {
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>AMR table</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div>Abricate table</div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}