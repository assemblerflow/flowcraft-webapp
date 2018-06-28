import React from "react";
import ReactTable from "react-table";
import checkboxHOC from "react-table/lib/hoc/selectTable";

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import styles from "../../styles/reports.css"

import {genericTableParser, getTableHeaders} from "./parsers";

const CheckboxTable = checkboxHOC(ReactTable);


// Table selection functions


class FCTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            data: props.data,
            columns: props.columns,
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
        const selectAll = this.state.selectAll ? false : true;
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
                        backgroundColor: selected ? "lightgreen" : "inherit"
                    }
                };
            }
        };

        return (
            <CheckboxTable
                ref={r => (this.checkboxTable = r)}
                data={this.state.data}
                columns={this.state.columns}
                defaultPageSize={10}
                className="-striped -highlight"
                {...checkboxProps}
            />
        )
    }

}


export class QualityControlTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tableData: genericTableParser(props.tableData)
        }

    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    render () {
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Quality control</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={this.state.tableData[0]}
                            columns={this.state.tableData[1]}
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
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Assembly</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={this.state.tableData[0]}
                            columns={this.state.tableData[1]}
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
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>AMR table</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={this.state.tableData[0]}
                            columns={this.state.tableData[1]}
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
            tableData: chewbbacaTableParser(props.tableData)
        };
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    render () {
        return (
            <ExpansionPanel defaultExpanded >
                <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>chewBBACA table</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={this.state.tableData[0]}
                            columns={this.state.tableData[1]}
                            setSelection={this.setSelection}
                        />
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