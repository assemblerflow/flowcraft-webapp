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
import Badge from "@material-ui/core/Badge";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

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
import FileDelimitedIcon from "mdi-react/FileDelimitedIcon";
import AlertOctagonIcon from "mdi-react/AlertOctagonIcon";
import AlertIcon from "mdi-react/AlertIcon";
import Magnify from "mdi-react/MagnifyIcon";

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


const statusColor = {
    "fail": red[300],
    "pass": green[300],
    "warning": yellow[300]
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
            // Selection has table data and only row keys
            selection: {
                rows: [],
                keys: []
            },
            selectAll: false
        }
    }


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

    componentDidUpdate = () => {

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
                marginLeft: "5px"
            },
            toolbarHeader: {
                fontWeight: "bold",
                fontSize: "13px",
                color: "#bababa"
            },
            selectionContainer: {
                marginLeft: "10px",
                borderLeft: "1px solid #bababa"
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

        return (
            <div>
                <ReportAppConsumer>
                    {
                        ({tableSamples}) => (
                            <LoadingComponent>
                                <div style={style.toolbar}>
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
                                        </fieldset>
                                    }
                                </div>
                                <CheckboxTable
                                    ref={r => (this.checkboxTable = r)}
                                    data={this.props.data}
                                    columns={this.props.columns}
                                    defaultPageSize={10}
                                    className={"-striped -highlight"}
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

    render() {
        const tableData = genericTableParser(this.props.tableData);
        console.log("render abricate table")

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
        }

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

        // Add status header to table columns
        tableData.columnsArray.splice(1, 0, {
            Header: <Typography>Status</Typography>,
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

        console.log(dataToUse);

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
        return (
            <div className={styles.columnCellContainer}>
                <div className={styles.columnCell}
                     style={{width: `${(this.props.value / this.props.max) * 100}%`}}>
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
        return (
            <div className={styles.centralCell}>
                <Tooltip id="tooltip-icon" title={this.props.tooltip}
                         placement="right">
                    <Paper className={styles.cellLabel}
                           style={{backgroundColor: this.props.color}}>
                        <Typography
                            className={styles.cellLabelText}>{this.props.content}</Typography>
                    </Paper>
                </Tooltip>
            </div>
        )
    }
}

export class TableButtons extends React.Component {
    render() {
        return (
            <div className={styles.tableButtonsDiv}>
                {this.props.children}
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
                    <FileDelimitedIcon style={{fill: "#fff"}}/>
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