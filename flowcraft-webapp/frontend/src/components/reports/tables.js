import React from "react";
import ReactTable from "react-table";
import checkboxHOC from "react-table/lib/hoc/selectTable";

import {CSVLink} from 'react-csv';

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ListSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton"
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import CloseIcon from "@material-ui/icons/Close";
import ListItem from "@material-ui/core/ListItem";
import Checkbox from "@material-ui/core/Checkbox";
import Toolbar from "@material-ui/core/Toolbar";
import Popover from "@material-ui/core/Popover";
import Tooltip from "@material-ui/core/Tooltip";
import Divider from "@material-ui/core/Divider";
import AppBar from "@material-ui/core/AppBar"
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import Slide from "@material-ui/core/Slide";
import Badge from "@material-ui/core/Badge";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";

import styles from "../../styles/reports.css";
import classNames from "classnames";

import {themes} from "./themes";
import {theme} from "../../../config.json";

// Import Colors
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import yellow from "@material-ui/core/colors/yellow";
import amber from "@material-ui/core/colors/amber";

import {genericTableParser, qcParseAdditionalData} from "./parsers";

const CheckboxTable = checkboxHOC(ReactTable);

import ApprovalIcon from "mdi-react/ApprovalIcon";
import ExportIcon from "mdi-react/ExportIcon";
import DownloadIcon from "mdi-react/DownloadIcon";
import TableIcon from "mdi-react/TableIcon";
import AlertOctagonIcon from "mdi-react/AlertOctagonIcon";
import AlertIcon from "mdi-react/AlertIcon";
import Magnify from "mdi-react/MagnifyIcon";
import EyeIcon from "mdi-react/EyeIcon";
import MapMarkerRadiusIcon from "mdi-react/MapMarkerRadiusIcon";

import {LoadingComponent} from "../ReportsBase";
import {PhylovizModal, PositionedSnackbar} from "./modals";
import {ReportDataConsumer, ReportAppConsumer} from './contexts';
import {
    getAssemblies,
    getFile,
    downloadChewbbacaProfiles,
    getSpeciesMapping
} from "./utils";
import {SampleDialog} from "../ReportsSample";
import {HighlightSelectionPopup} from "./overview";
import {updateFilterArray, updateHighlightArray} from "./filters_highlights";
import FilterIcon from "../../../../node_modules/mdi-react/FilterIcon";
import {FindDistributionChart} from "./charts";


const statusColor = {
    "fail": themes[theme].palette.error.main,
    "pass":  themes[theme].palette.success.main,
    "warning":  themes[theme].palette.warning.main
};

/**
 * General component for rendering a React Table. It accepts four main props:
 *
 *  - rawData: Array of JSON objects with the raw table data.
 *  - data: Array of JSON objects with the processed and final table data that
 *          will be feed into the react table
 *  - columns: Array of JSON objects with the header information for react table
 *
 *  Additional buttons to the button toolbar above the table can be provided
 *  as the content of the component and accessible in the props.children.
 */
export class FCTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            columns: props.columns,
            // Selection has table data and only row keys
            selection: {
                rows: [],
                keys: []
            },
            selectAll: false,
            rowFilter: ""
        }
    }


    handleSearchChange = (e) => {
        this.setState({rowFilter: e.target.value})
    };

    filterSelection = (filters, updateCallback) => {

        const arrayMap = {
            "samples": []
        };
        const selection = {
            "samples": this.state.selection
        };

        const wrappedInstance = this.checkboxTable.getWrappedInstance();
        // the 'sortedData' property contains the currently accessible records based on the filter and sort
        const currentRecords = wrappedInstance.getResolvedState().sortedData;
        // we just push all the IDs onto the selection array
        currentRecords.forEach(item => {
            arrayMap.samples.push(item._original._id);
        });

        updateCallback(updateFilterArray(arrayMap, selection, filters))

    };


    highlightSelection = (highlights, updateCallback, color) => {

        const arrayMap = {
            "samples": []
        };
        const selection = {
            "samples": this.state.selection
        };

        updateCallback(updateHighlightArray(arrayMap, selection, highlights, color))

    };

    /*
    Toggles the column visibility of a single column, given an accessor.
    The currently shown columns are stored in state.columns, while the complete
    original columns are in props.columns. When a column is to be hidden, that
    column is removed from the state. Otherwise, the column is reestablished in
    the state using the one in the props.
     */
    toggleColumnVisibility = (colAcessor) => {

        // Array containing the new visible columns
        let newColumns = [];

        // Check if column is visible, that is, in the state columns
        if (this.state.columns.some((v) => {return v.accessor === colAcessor})){
            // Remove this column from state
            for (const col of this.state.columns){
                if (col.accessor !== colAcessor){
                    newColumns.push(col)
                }
            }
        } else {
            for (const col of this.props.columns){
                if (this.state.columns.some((v) => {return v.accessor === col.accessor}) || col.accessor === colAcessor){
                    newColumns.push(col)
                }
            }
        }

        this.setState({columns: newColumns})
    };


    toggleSelection = (key, shift, row) => {
        // start off with the existing state
        let rows = [...this.state.selection.rows];
        let keys = [...this.state.selection.keys];

        let keyIndex = null;

        for (const index in rows) {
            if (String(rows[index]._id).indexOf(key) >= 0) {
                keyIndex = index
            }
        }

        // check to see if the key exists
        if (keyIndex !== null) {
            // it does exist so we will remove it using destructing
            rows.splice(keyIndex, 1);
            keys.splice(keyIndex, 1);
        } else {
            // it does not exist so add it
            rows.push(row);
            keys.push(key);
        }

        const selection = {
            rows: rows,
            keys: keys
        };

        this.props.setSelection(selection);
        // update the state
        this.setState({selection});
    };

    toggleAll = () => {
        const selectAll = !this.state.selectAll;
        const rows = [];
        const keys = [];

        if (selectAll) {
            // we need to get at the internals of ReactTable
            const wrappedInstance = this.checkboxTable.getWrappedInstance();
            // the 'sortedData' property contains the currently accessible records based on the filter and sort
            const currentRecords = wrappedInstance.getResolvedState().sortedData;
            // we just push all the IDs onto the selection array
            currentRecords.forEach(item => {
                rows.push(item._original);
                keys.push(item._original._id);
            });
        }

        const selection = {
            rows: rows,
            keys: keys
        };

        this.props.setSelection(selection);
        this.setState({selectAll, selection});
    };

    isSelected = key => {
        // Return if selection array includes the provided key
        let keyIndex = null;

        for (const index in this.state.selection.rows) {
            if (String(this.state.selection.rows[index]._id).indexOf(key) >= 0) {
                keyIndex = index
            }
            ;
        }

        if (keyIndex !== null)
            return true;
        else
            return false;
    };

    componentDidUpdate = (nextProps, nextState) => {

        // Update table columns when the props have been updated. This means
        // that the original columns have changed.
        if (this.props.columns !== nextProps.columns){
            this.setState({columns: this.props.columns})
        }

        if (this.props.initialSelection && JSON.stringify(this.state.selection.keys) !== JSON.stringify(this.props.initialSelection.keys)) {
            let selection = this.props.initialSelection;

            if (Object.keys(this.props.initialSelection).length === 0 || this.props.initialSelection.keys !== undefined && this.props.initialSelection.keys.length === 0) {
                selection = {rows: [], keys: []};
            }
            else if (this.props.initialSelection.keys !== undefined) {

                selection = {rows: [], keys: this.props.initialSelection.keys};

                // get data from checkbox table
                const wrappedInstance = this.checkboxTable.getWrappedInstance();
                // get the records from the table
                const currentRecords = wrappedInstance.getResolvedState().sortedData;

                // Pass the table records wto the selection rows if their
                // keys are present in the initialSelection object
                for (const key of this.props.initialSelection.keys) {
                    currentRecords.forEach(item => {
                        if (item._original._id === key) {
                            selection.rows.push(item._original)
                        }
                    });
                }

            }
            if (selection.rows !== undefined) {
                this.setState({selection: selection});
            }

        }

    };

    render() {

        const style = {
            toolbar: {
                marginBottom: "20px",
                display: "flex"
            },
            fieldset: {
                border: "1px #bababa solid",
                padding: "4px",
                borderRadius: "3%",
                marginRight: "5px",
                marginLeft: "5px",
            },
            toolbarHeader: {
                fontWeight: "bold",
                fontSize: "13px",
                color: "#bababa"
            },
            selectionContainer: {
                marginLeft: "10px",
                borderLeft: "1px solid #bababa"
            },
            searchContainer: {
                flexGrow: "1",
                margin: "auto"
            },
            searchField: {
                width: "300px",
                float: "right",
            }
        };

        const {toggleSelection, toggleAll, isSelected} = this;
        const {selectAll} = this.state;

        const checkboxProps = {
            selectAll,
            toggleSelection,
            isSelected,
            toggleAll,
            selectType: "checkbox",
            getTrProps: (s, r) => {

                if (!r) return {};

                const selected = this.isSelected(r.original._id);
                return {
                    style: {
                        backgroundColor: selected ? green[100] : "inherit"
                    }
                };
            }
        };

        const hideSelectionToolbar = this.props.hideSelectionToolbar ? this.props.hideSelectionToolbar : false;

        let defaultSort = [];
        if (this.props.data.some((v) => {return v.highlight})){
            defaultSort = [{
                id: "highlight",
                desc: true
            }]
        }

        return (
            <div>
                <ReportAppConsumer>
                    {
                        ({tableSamples, filters, updateFilters, highlights, updateHighlights}) => (
                            <LoadingComponent>
                                <Grid container style={style.toolbar}>
                                    {
                                        (this.props.rawData || this.props.children) &&
                                        <fieldset style={style.fieldset}>
                                            <legend><Typography
                                                style={style.toolbarHeader}>Toolbar</Typography>
                                            </legend>
                                            {
                                                this.props.rawData &&
                                                <ExportTooltipButton
                                                    tableData={this.props.rawData}/>
                                            }
                                            <ColumnVisibilityPopover
                                                onToggleColumn={this.toggleColumnVisibility}
                                                allColumns={this.props.columns}
                                                stateColumns={this.state.columns}/>
                                        </fieldset>
                                    }
                                    {
                                        this.props.children &&
                                            <fieldset style={style.fieldset}>
                                                <legend><Typography
                                                    style={style.toolbarHeader}>Contextual</Typography>
                                                </legend>
                                                {this.props.children}
                                            </fieldset>
                                    }
                                    {
                                        (this.state.selection.keys.length > 0 && !hideSelectionToolbar ) &&
                                        <fieldset style={style.fieldset}>
                                            <legend><Typography
                                                style={style.toolbarHeader}>Selection</Typography>
                                            </legend>
                                            {
                                                (this.state.selection.keys.length === 1 && tableSamples.length > 0) &&
                                                <SampleDialog
                                                    sample={this.state.selection.keys[0]}
                                                    button={<TableButton
                                                        tooltip={"Open sample specific report"}><Magnify
                                                        style={{fill: "#fff"}}/></TableButton>}/>
                                            }
                                            <TableButton onClick={() => {this.filterSelection(filters, updateFilters)}} tooltip={"Filter and keep only selection"}>
                                                <FilterIcon color={"#fff"}/>
                                            </TableButton>
                                            <HighlightSelectionPopup action={(color) =>{this.highlightSelection(highlights, updateHighlights, color)}} />
                                            <FindDistributionPopover columns={this.props.columns}
                                                                     selection={this.state.selection.keys}
                                                                     data={this.props.data}/>
                                        </fieldset>
                                    }
                                    <div style={style.searchContainer}>
                                        <TextField
                                            style={style.searchField}
                                            id="name"
                                            value={this.state.rowFilter}
                                            onChange={this.handleSearchChange}
                                            label="Search ID column"/>
                                    </div>
                                </Grid>
                                <CheckboxTable
                                    ref={r => (this.checkboxTable = r)}
                                    data={this.props.data}
                                    columns={this.state.columns}
                                    filtered={this.state.rowFilter ? [{"id": "rowId", "value": this.state.rowFilter}] : []}
                                    defaultPageSize={10}
                                    className={"-striped -highlight"}
                                    defaultSorted={defaultSort}
                                    {...checkboxProps}
                                />
                            </LoadingComponent>
                        )
                    }
                </ReportAppConsumer>
            </div>
        )
    }

}

export class MetadataTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selection: {keys: []}
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.tableData !== this.props.tableData) {
            return true
        } else if (nextState.selection !== this.state.selection) {
            return true
        }

        return false
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    render() {

        // Metadata fields are obtained by the absence of reportJson object
        // inside each report entry. If reportJson doesnt exist, the entry
        // goes to the Innuendo metadata parser.
        const tableData = genericTableParser(this.props.tableData);

        return (
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Metadata</Typography>
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

export class PhylovizTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selection: {keys: []}
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.tableData !== this.props.tableData) {
            return true
        } else if (nextState.selection !== this.state.selection) {
            return true
        }

        return false
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    showTree = () => {
        if (this.state.selection.keys.length > 0) {
            window.open(this.state.selection.rows[0].uri, "_blank");
        }
        else {
            const message = "Please select an entry from the table first!";
            this.snackBar.handleOpen(message, "info");
        }
    };

    render() {

        // Metadata fields are obtained by the absence of reportJson object
        // inside each report entry. If reportJson doesnt exist, the entry
        // goes to the Innuendo metadata parser.
        const tableData = genericTableParser(this.props.tableData);
        console.log("render phyloviz table");

        const style = {
            icon: {
                fill: "white"
            }
        };

        return (
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>PHYLOViZ
                        Online Trees</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <PositionedSnackbar
                            vertical="top"
                            horizontal="right"
                            handleClose={this.handleSnackClose}
                            onRef={ref => (this.snackBar = ref)}
                        />
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                            hideSelectionToolbar
                        >
                            <TableButton tooltip={"Show Trees"}
                                         onClick={this.showTree}>
                                <ExportIcon style={style.icon}/>
                            </TableButton>
                        </FCTable>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}


export class QualityControlTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selection: {keys: []}
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.tableData !== this.props.tableData) {
            return true
        } else if (nextState.selection !== this.state.selection) {
            return true
        }

        return false
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    render() {
        const tableData = genericTableParser(this.props.tableData);
        qcParseAdditionalData(tableData, this.props.tableData,
            this.props.qcInfo, "qc");

        console.log("render qc table")

        return (
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Quality
                        control</Typography>
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
    constructor(props) {
        super(props);

        this.state = {
            selection: {keys: []}
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.tableData !== this.props.tableData) {
            return true
        } else if (nextState.selection !== this.state.selection) {
            return true
        }

        return false
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    downloadAssemblies = async () => {
        console.log(this.state.selection);
        const res = await getAssemblies(
            this.state.selection.rows,
            this.props.reportData
        );

        console.log(res);

        const fileStr = res[0].join(";");
        const sampleStr = res[1].join(";");

        getFile(fileStr, sampleStr);
        /*getFile()*/

    };

    render() {
        const tableData = genericTableParser(this.props.tableData);
        qcParseAdditionalData(tableData, this.props.tableData,
            this.props.qcInfo, "assembly");
        console.log("render assembly table");

        const style = {
            icon: {
                fill: "white"
            }
        };

        return (
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>Assembly</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                        >
                            {
                                (this.props.additionalInfo && this.props.additionalInfo.innuendo) &&
                                <TableButton
                                    tooltip={"Download assemblies as Fasta"}
                                    onClick={this.downloadAssemblies}>
                                    <DownloadIcon style={style.icon}/>
                                </TableButton>
                            }
                        </FCTable>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}

export class TypingTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selection: {keys: []}
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.tableData !== this.props.tableData) {
            return true
        } else if (nextState.selection !== this.state.selection) {
            return true
        }

        return false
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    render() {
        const tableData = genericTableParser(this.props.tableData);

        console.log("render qc table")

        return (
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>In silico Typing</Typography>
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
    constructor(props) {
        super(props);

        this.state = {
            selection: {keys: []}
        };
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    exportGeneNames = (data, columns) => {

        let dataMap = new Map();
        let finalData = [];

        for (const cell of data) {
            let header = cell.header;
            let geneList = cell.geneList;
            if (!dataMap.has(cell.rowId)) {
                dataMap.set(cell.rowId, {
                    rowId: cell.rowId
                })
            }

            dataMap.get(cell.rowId)[header] = geneList.join(";")
        }

        for (const [rowId, row] of dataMap.entries()) {
            finalData.push(row);
        }
        return finalData;

    };

    handleCellClick = (cell) => {
        console.log(cell)
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.tableData !== this.props.tableData) {
            return true
        } else if (nextState.selection !== this.state.selection) {
            return true
        }

        return false
    }

    render() {
        const tableData = genericTableParser(this.props.tableData, this.handleCellClick);
        // this.getGenesModalData(this.props.tableData);
        console.log("render abricate table")

        console.log(this.props.tableData)
        console.log(tableData)

        return (
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>AMR table</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div className={styles.mainPaper}>
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}>
                            {/*CSV export button that exports the table gene names*/}
                            <CSVLink
                                data={this.exportGeneNames(this.props.tableData)}>
                                <TableButton tooltip={"Download Gene List"}>
                                    <DownloadIcon style={{fill: "#fff"}}/>
                                </TableButton>
                            </CSVLink>
                        </FCTable>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        )
    }
}

export class ChewbbacaTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selection: {keys: []},
            specie: {},
            tabValue: 0,
            visibleData: null
        };

    }

    componentDidMount() {
        if (this.props.additionalInfo.innuendo) {
            this.handleClickSpecies(
                this.props.additionalInfo.innuendo.species["1"],
                0
            )
        }
    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    handleClickSpecies = (specie, tabValue) => {

        // Declare properties to be modified
        const reportData = this.props.reportData;
        let tableData = this.props.tableData;
        let newTableData = [];

        // Search on the reportData for the chewbbac and species signature
        // to visualize only those with the selected specie
        for (const data of reportData) {
            if (data.hasOwnProperty("species") && data.species === specie &&
                data.processName.indexOf("chewbbaca") > -1) {

                // Retrieve id from status since chewbbaca results are not
                // matching with the sample_name property of the reports
                for (const status of data.reportJson.status) {
                    for (const row of tableData) {
                        if (row.rowId === status.sample) {
                            newTableData.push(row);
                        }
                    }

                }
            }
        }

        // Set new visible table data according to the specie.
        const visibleData = newTableData;

        // Set current innuendo species id and name to pass to phyloviz modal
        const currentSpecie = {
            value: tabValue,
            label: specie
        };

        this.setState({
            tabValue,
            visibleData,
            specie: currentSpecie
        });

    };

    getCurrentSpecie = () => {
        return this.state.specie

    };

    downloadProfiles = () => {
        downloadChewbbacaProfiles(this.state.selection, this.props.reportData);
    };

    chewbbacaParser = (tableData, originalData) => {

        const style = {
            header: {
                fontWeight: "bold"
            },
            headerContainer: {
                margin: "auto"
            }
        };

        // Add status header to table columns
        tableData.columnsArray.splice(1, 0, {
            Header: <Typography style={style.header}>Status</Typography>,
            headerStyle: style.headerContainer,
            accessor: "status",
            minWidth: 90
        });

        for (const row of tableData.tableArray) {

            for (const process of originalData) {
                if (process.processName && process.processName.indexOf("chewbbaca") > -1) {
                    const statusDict = process.reportJson.status;

                    for (const statusData of statusDict) {

                        if (statusData.sample.indexOf(row._id) > -1) {
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

    openModal = () => {
        this.setState({openModal: true});
    };


    render() {
        const dataToUse = this.state.visibleData === null ?
            this.props.tableData : this.state.visibleData;

        const tableData = genericTableParser(dataToUse);
        this.chewbbacaParser(tableData, this.props.reportData);

        const style = {
            buttonBar: {
                "overflowX": "auto",
                "display": "flex",
                "justifyContent": "center",
                "marginBottom": "20px"
            },
            button: {
                minWidth: "150px",
            },
            mainPaper: {
                flexGrow: "1",
                width: "100%"
            },
            icon: {
                fill: "white"
            }
        };

        return (
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant={"headline"}>chewBBACA
                        table</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div style={style.mainPaper}>
                        <div style={style.buttonBar}>
                            {
                                this.props.additionalInfo.innuendo &&
                                Object.keys(this.props.additionalInfo.innuendo.species).map((item, index) => {
                                    let species = this.props.additionalInfo.innuendo.species;
                                    const speciesMapping = getSpeciesMapping();
                                    return <Button key={item}
                                                   style={style.button}
                                                   className={classNames(this.state.tabValue === index && styles.tabButton)}
                                                   onClick={() => {
                                                       this.handleClickSpecies(species[item], index);
                                                   }}>
                                        {
                                            speciesMapping[this.props.additionalInfo.innuendo.species[item]]
                                        }
                                    </Button>
                                })
                            }
                        </div>
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                        >
                            {/*Pass the context value (_updateState
                             function) from the ReportDataContext to
                              PhylovizModal as a prop to
                              allow reportData state update*/}
                            <ReportDataConsumer>
                                {
                                    ({updateState, filters, highlights}) => (
                                        <ReportAppConsumer>
                                            {
                                                ({tableData}) => (
                                                    <PhylovizModal
                                                        specie={this.getCurrentSpecie}
                                                        selection={this.state.selection}
                                                        additionalInfo={this.props.additionalInfo}
                                                        reportData={this.props.reportData}
                                                        filters={filters}
                                                        highlights={highlights}
                                                        updateState={updateState}
                                                        tableData={tableData}
                                                    />
                                                )
                                            }
                                        </ReportAppConsumer>
                                    )
                                }
                            </ReportDataConsumer>
                            <TableButton tooltip={"Download Profiles"}
                                         onClick={this.downloadProfiles}>
                                <DownloadIcon style={style.icon}/>
                            </TableButton>
                        </FCTable>
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
    render() {

        const style = {
            columnCellContainer: {
                position: "relative"
            },
            columnCell: {
                position: "absolute",
                background: "rgba(100, 100, 100, 0.2)",
                height: "100%",
                zIndex: "1",
                width: `${(this.props.value / this.props.max) * 100}%`,
            }
        };

        return (
            <div onClick={this.props.action} style={style.columnCellContainer}>
                <div style={style.columnCell}>
                </div>
                <Typography
                    className={styles.tableCell}>{this.props.value}</Typography>
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
    render() {

        const style = {
            centralCell: {
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
            },
            cellLabel: {
                paddingLeft: "10px",
                paddingRight: "10px",
                backgroundColor: this.props.color
            },
            cellLabelText: {
                color: "#fff",
                fontWeight: "bold"
            }
        };

        return (
            <div style={style.centralCell}>
                <Tooltip id="tooltip-icon" title={this.props.tooltip}
                         placement="right">
                    <Paper style={style.cellLabel}>
                        <Typography style={style.cellLabelText}>{this.props.content}</Typography>
                    </Paper>
                </Tooltip>
            </div>
        )
    }
}


class ExportTooltipButton extends React.Component {

    render() {

        return (
            <CSVLink data={this.props.tableData} filename="table_data.csv"
                     style={{"textDecoration": "none"}}>
                <TableButton tooltip={"Export table as CSV"}
                             onClick={this.handleClickOpen}>
                    <TableIcon style={{fill: "#fff"}}/>
                </TableButton>

            </CSVLink>
        )
    }
}

export class TableButton extends React.Component {
    render() {

        const style = {
            root: {
                marginLeft: "2.5px",
                marginRight: "2.5px",
                padding: 0,
                minWidth: "50px",
                height: "40px",
            }
        };

        return (
            <Tooltip title={this.props.tooltip} placement={"top"}>
                <Button {...this.props} variant={"contained"} color={"primary"}
                        style={style.root}>
                    {this.props.children}
                </Button>
            </Tooltip>
        )
    }
}


class ColumnVisibilityPopover extends React.Component{

    state = {
        anchorEl: null,
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

    render(){

        const style = {
            root: {
                padding: "15px"
            },
            header: {
                marginBottom: "10px"
            }
        };

        const {anchorEl} = this.state;

        return(
            <div style={{display: "inline-block"}}>
                <TableButton onClick={this.handleClick} tooltip={"Toggle column visibility"}>
                    <EyeIcon color={"#fff"}/>
                </TableButton>
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
                    <div style={style.root}>
                        <Typography style={style.header} variant={"subheading"}>Hide/show column</Typography>
                        <Divider/>
                        <List>
                            {
                                this.props.allColumns.map((col, i) => {
                                    return(
                                        <ListItem key={i}>
                                            <ListItemText primary={col.Header}/>
                                            <ListSecondaryAction>
                                                <Checkbox
                                                    color={"primary"}
                                                    onChange={() => {this.props.onToggleColumn(col.accessor)}}
                                                    checked={this.props.stateColumns.some((c) => {return c.accessor === col.accessor})}/>
                                            </ListSecondaryAction>
                                        </ListItem>
                                    )
                                })
                            }
                        </List>
                    </div>
                </Popover>
            </div>
        )
    }
}

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

export class FindDistributionPopover extends React.Component{

    state = {
        anchorEl: null,
        dialogOpen: false,
        column: "",
        data: []
    };

    handleClick = event => {
        this.setState({
            anchorEl: event.currentTarget,
        });
    };

    openDialog = (data, column, header) => {
        this.setState({
            dialogOpen: true,
            column: header,
            data: data
        })
    };

    handleClose = () => {
        this.setState({
            anchorEl: null,
        });
    };

    closeDialog = () => {
        this.setState({dialogOpen: false})
    };

    prepareData = (accessor, header, selection) => {

        let unsortedData = [];
        let c = 1;
        this.props.data.forEach((v) => {

            if (v.hasOwnProperty(accessor)){
                if (v[accessor].props.hasOwnProperty("value")){
                    unsortedData.push({
                        name: v._id,
                        data: [[ c, parseFloat(v[accessor].props.value)]],
                        marker: {
                            symbol: "circle"
                        },
                        color: selection.includes(v._id) ? "red" : "gray"
                    })
                }
            }
        });

        if (unsortedData.some((v) => {return isNaN(v.data[0][1])})){
            this.snackBar.handleOpen("This operation can only be performed on numeric data", "error")
        } else if (unsortedData.length === 0) {
            this.snackBar.handleOpen("There is no data to perform this operation", "error")
        } else {
            const sortedData = unsortedData.sort((a, b) => {return a.data[0][1] - b.data[0][1]}).map((v, i) => {
                v.data[0][0] = i;
                return v
            });
            this.openDialog(sortedData, accessor, header)
        }
    };

    render() {

        const style = {
            root: {
                padding: "15px"
            },
            header: {
                marginBottom: "10px"
            },
            dialogRoot: {
                marginTop: "60px",
                padding: "20px"
            },
            dialogHeaderContainer: {
                display: "flex",
                justifyContent: "center",
                marginTop: "15px",
                marginBottom: "15px"
            },
            dialogHeaderText: {
                marginRight: "15px",
                fontSize: "18px",
                fontWeight: "bold",
                lineHeight: "40px"
            }
        };

        const {anchorEl} = this.state;
        const skipAccessors = ["highlight", "rowId", "qc"];

        console.log(this.state.data)

        return(
            <div style={{display: "inline-block"}}>
                <TableButton onClick={this.handleClick} tooltip={"Identify sample values in column distribution"}>
                    <MapMarkerRadiusIcon color={"#fff"}/>
                </TableButton>
                <PositionedSnackbar
                    vertical="top"
                    horizontal="right"
                    onRef={ref => (this.snackBar = ref)}
                />
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
                    <div style={style.root}>
                        <Typography style={style.header} variant={"subheading"}>Select column distribution</Typography>
                        <Divider/>
                        <List>
                            {
                                this.props.columns.map((col) => {
                                    if (!skipAccessors.includes(col.accessor)){
                                        return(
                                            <ListItem onClick={() => {this.prepareData(col.accessor, col.Header, this.props.selection)}} button key={col.accessor}>
                                                <ListItemText primary={col.Header}/>
                                            </ListItem>
                                        )
                                    }
                                })
                            }
                        </List>
                    </div>
                </Popover>
                <Dialog
                    onClose={this.closeDialog}
                    open={this.state.dialogOpen}
                    TransitionComponent={Transition}
                    fullScreen>
                    <AppBar>
                        <Toolbar>
                            <IconButton color="inherit" onClick={this.closeDialog} aria-label="Close">
                                <CloseIcon />
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                    <div style={style.dialogRoot}>
                        <div style={style.dialogHeaderContainer}>
                            <Typography style={style.dialogHeaderText}>Viewing distribution of values for header: </Typography>
                            {this.state.column}
                        </div>
                        {
                            this.state.data.length > 0 &&
                                <FindDistributionChart data={this.state.data}/>
                        }
                    </div>
                </Dialog>
            </div>
        )
    }
}


export class QcPopover extends React.Component {

    state = {
        anchorEl: null,
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
        const badgeCount = this.props.badgeCount ? this.props.badgeCount : null;

        const style = {
            container: {
                padding: "15px",
                backgroundColor: this.props.status === "pass" ? green[200] : this.props.status === "warnings" ? yellow[200] : red[200]
            },
            qcIcon: {
                cursor: "pointer",
                display: "block",
                margin: "auto"
            },
            warningBadge: {
                fontSize: "13px",
                height: "18px",
                width: "18px",
                top: "-6px"
            }
        };

        const icons = {
            "pass": <ApprovalIcon color={green[300]} style={style.qcIcon}/>,
            "warnings": <AlertIcon color={amber[300]} style={style.qcIcon}/>,
            "fail": <AlertOctagonIcon color={red[300]} style={style.qcIcon}/>
        };

        return (
            <div>
                <div onClick={this.handleClick}>
                    {
                        badgeCount ?
                            <Badge badgeContent={badgeCount} color={"primary"}
                                   classes={{badge: styles.warningBadge}}> {icons[this.props.status]} </Badge> :
                            icons[this.props.status]
                    }
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
                    <div style={style.container}>
                        {this.props.content}
                    </div>
                </Popover>
            </div>
        )
    }
}