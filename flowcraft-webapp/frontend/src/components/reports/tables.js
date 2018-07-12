import React from "react";
import ReactTable from "react-table";
import checkboxHOC from "react-table/lib/hoc/selectTable";

import {CSVLink} from 'react-csv';

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import Popover from "@material-ui/core/Popover";
import Tooltip from "@material-ui/core/Tooltip";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import styles from "../../styles/reports.css"

// Import Colors
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import yellow from "@material-ui/core/colors/yellow";
import amber from "@material-ui/core/colors/amber";

import {genericTableParser, qcParseAdditionalData} from "./parsers";

const CheckboxTable = checkboxHOC(ReactTable);

import ApprovalIcon from "mdi-react/ApprovalIcon";
import AlertOctagonIcon from "mdi-react/AlertOctagonIcon";
import AlertIcon from "mdi-react/AlertIcon";


const statusColor = {
    "fail": red[300],
    "pass": green[300],
    "warning": yellow[300]
};


export class FCTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selection: [],
            selectAll: false
        }
    }


    toggleSelection = (key, shift, row) => {

        // start off with the existing state
        let selection = [...this.state.selection];
        const keyIndex = selection.indexOf(key);
        // check to see if the key exists
        if (keyIndex >= 0) {
          // it does exist so we will remove it using destructing
          selection = [
            ...selection.slice(0, keyIndex),
            ...selection.slice(keyIndex + 1)
          ];
        } else {
          // it does not exist so add it
          selection.push(key);
        }
        this.props.setSelection(selection);
        // update the state
        this.setState({ selection });
    };


    toggleAll = () => {
        const selectAll = !this.state.selectAll;
        const selection = [];
        if (selectAll) {
          // we need to get at the internals of ReactTable
          const wrappedInstance = this.checkboxTable.getWrappedInstance();
          // the 'sortedData' property contains the currently accessible records based on the filter and sort
          const currentRecords = wrappedInstance.getResolvedState().sortedData;
          // we just push all the IDs onto the selection array
          currentRecords.forEach(item => {
            selection.push(item._original._id);
          });
        }
        this.props.setSelection(selection);
        this.setState({ selectAll, selection });
    };

    isSelected = key => {
        // Return if selection array includes the provided key
        return this.state.selection.includes(key);
    };

    render () {

        const style = {
            toolbar: {
                marginBottom: "20px",
            }
        };

        const { toggleSelection, toggleAll, isSelected } = this;
        const { selectAll } = this.state;

        const checkboxProps = {
            selectAll,
            toggleSelection,
            isSelected,
            toggleAll,
            selectType: "checkbox",
            getTrProps: (s, r) => {

                if(!r) return {};

                const selected = this.isSelected(r.original._id);
                return {
                    style: {
                        backgroundColor: selected ? green[100] : "inherit"
                    }
                };
            }
        };

        return (
            <div>
                <div style={style.toolbar}>
                    <ExportTooltipButton tableData={this.props.rawData}
                                         tableHeaders={this.props.rawColumns} />
                </div>
                <CheckboxTable
                    ref={r => (this.checkboxTable = r)}
                    data={this.props.data}
                    columns={this.props.columns}
                    defaultPageSize={10}
                    className={"-striped -highlight"}
                    {...checkboxProps}
                />
            </div>
        )
    }

}


export class QualityControlTable extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            tableData: genericTableParser(props.tableData),
            selection: []
        };
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    render () {
        const tableData = genericTableParser(this.props.tableData);
        qcParseAdditionalData(tableData, this.props.tableData,
            this.props.qcInfo, "qc");

        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Quality control</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                        />
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
            tableData: genericTableParser(props.tableData),
            selection: []
        };
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    render () {
        const tableData = genericTableParser(this.props.tableData);
        qcParseAdditionalData(tableData, this.props.tableData,
            this.props.qcInfo, "assembly");

        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Assembly</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                        />
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

    setSelection = (selection) => {
        this.setState({selection});
    };

    render () {
        const tableData = genericTableParser(this.props.tableData);

        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>AMR table</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                        />
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}

export class ChewbbacaTable extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            tableData: genericTableParser(props.tableData)
        };
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    chewbbacaParser = (tableData, originalData) => {

        const refDict = {"fail": "label-danger", "warning": "label-warning", "pass": "label-success"};

        // Add status header to table columns
        tableData.columnsArray.splice(1, 0, {
            Header: <Typography>Status</Typography>,
            accessor: "status",
            minWidth: 90
        });

        for (const row of tableData.tableArray){

            for (const process of originalData){
                if(process.processName.indexOf("chewbbaca") > -1){
                    const statusDict = process.reportJson.status;

                    for (const statusData of statusDict){

                        if(statusData.sample.indexOf(row._id) > -1) {
                            const lnfPercentage = parseFloat(statusData.lnfPercentage) * 100;

                            const labelLnf = <TableLabel
                                content={statusData.status}
                                color={statusColor[statusData.status]}
                                tooltip={`${lnfPercentage.toFixed(2)}%`}/>;

                            row["status"] = labelLnf;
                        }
                    }
                }
            }
        }
    };

    render () {
        const tableData = genericTableParser(this.props.tableData);
        this.chewbbacaParser(tableData, this.props.reportData);

        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>chewBBACA table</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <TableButtons>
                            <Button>Export</Button>
                        </TableButtons>
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                        />
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}

/*
    SUB COMPONENTS FOR TABLES
 */

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

/**
 * This component renders a cell label with tooltip showing extra values.
 * Also has option to show tooltip.
 * props:
 *  - tooltip -> text to show on tooltip
 *  - content -> text to show on paper
 *  - color -> color of the background of the label
 *             associated with the cell.
 */
export class TableLabel extends React.Component {
    render () {
        return (
            <div className={styles.centralCell}>
                <Tooltip id="tooltip-icon" title={this.props.tooltip} placement="right">
                    <Paper className={styles.cellLabel} style={{backgroundColor: this.props.color}}>
                        <Typography className={styles.cellLabelText}>{this.props.content}</Typography>
                    </Paper>
                </Tooltip>
            </div>
        )
    }
}

export class TableButtons extends React.Component {
    render () {
        return (
            <div className={styles.tableButtonsDiv}>
                {this.props.children}
            </div>
        )
    }
}


class ExportTooltipButton extends React.Component {

    render () {
        return (
            <div>
                <CSVLink data={this.props.tableData} filename="table_data.csv" style={{"textDecoration": "none"}}>
                    <Button onClick={this.handleClickOpen} variant={"contained"} color={"primary"}>Export CSV</Button>
                </CSVLink>
            </div>
        )
    }
}

export class QcPopover extends React.Component {

    state = {
        anchorEl: null,
    };

    style = {
        container: {
            padding: "15px",
            backgroundColor: this.props.status === "pass" ? green[200] : this.props.status === "warnings" ? yellow[200] : red[200]
        },
        qcIcon: {
            cursor: "pointer",
            display: "block",
            margin: "auto"
        }
    };

    icons = {
        "pass": <ApprovalIcon color={green[300]} style={this.style.qcIcon}/>,
        "warnings": <AlertIcon color={amber[300]} style={this.style.qcIcon}/>,
        "fail": <AlertOctagonIcon color={red[300]} style={this.style.qcIcon}/>
    };

    handleClick = event => {
        this.setState({
            anchorEl: event.currentTarget,
        });
    };

    handleClose = () => {
        this.setState({
            anchorEl: null,
        });
    };

    render() {
        const {anchorEl} = this.state;

        return (
            <div>
                <div onClick={this.handleClick}>
                    {this.icons[this.props.status]}
                </div>
                <Popover open={Boolean(anchorEl)}
                         anchorEl={anchorEl}
                         onClose={this.handleClose}
                         anchorOrigin={{
                             vertical: "center",
                             horizontal: "right"
                         }}
                         transformOrigin={{
                             vertical: "center",
                             horizontal: "left"
                         }}>
                    <div style={this.style.container}>
                        {this.props.content}
                    </div>
                </Popover>
            </div>
        )
    }
}