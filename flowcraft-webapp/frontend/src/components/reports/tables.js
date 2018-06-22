import React from "react";
import ReactTable from "react-table";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";

import styles from "../../styles/reports.css"

import {genericTableParser, getTableHeaders} from "./parsers";


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

        this.state = {
            tableData: genericTableParser(props.tableData)
        };
    }

    render () {
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>AMR table</Typography>
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

/**
 * This component renders a simple table cell bar, whose with is a percentage
 * of its props.value, relative to the props.max. The bar is rendered behing the
 * cell text.
 */
export class CellBar extends React.Component {
    render () {
        return (
            <div className={styles.columnCellContainer}>
                <div className={styles.columnCell} style={{width: `${(this.props.value / this.props.max) * 100}%`}}>
                </div>
                <Typography className={styles.tableCell}>{this.props.value}</Typography>
            </div>
        )
    }
}