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

    amrTableParser (reportArray) {

        let dataDict = {};
        let columnsArray = [];
        let finalDataDict = [];

        const tableHeaders = getTableHeaders(reportArray);

        // Add ID to columns
        columnsArray.push({
            Header: <Typography>ID</Typography>,
            accessor: "rowId",
            minWidth: 90
        });

        // Add headers with typography and minWidth
        for (const h of tableHeaders){
            columnsArray.push({
                Header: <Typography>{h.Header}</Typography>,
                accessor: h.accessor,
                minWidth: 90
            })
        }

        for (const cell of reportArray) {

            const joinHeader = cell.header.split(" ").join("");

            // Add values to dictionary by rowId
            if (!dataDict.hasOwnProperty(cell.rowId)) {
                dataDict[cell.rowId] = {
                    "rowId": <Typography>{cell.rowId}</Typography>
                };
                dataDict[cell.rowId][joinHeader] = <Typography>{cell.value.length}</Typography>;
            } else {
                dataDict[cell.rowId][joinHeader] = <Typography>{cell.value.length}</Typography>;
            }
        }

        // Create array of data by row
        for (const id in dataDict){
            finalDataDict.push(dataDict[id]);
        }

        return [
            finalDataDict,
            columnsArray
        ]
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