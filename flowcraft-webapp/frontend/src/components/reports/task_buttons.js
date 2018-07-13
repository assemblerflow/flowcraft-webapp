// React imports
import React from "react"

import Select from "react-select";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Tooltip from "@material-ui/core/Tooltip";
import Divider from "@material-ui/core/Divider";
import Button from '@material-ui/core/Button';
import Dialog from "@material-ui/core/Dialog";

import PlusIcon from "mdi-react/PlusIcon"
import MagnifyIcon from "mdi-react/MagnifyIcon"
import FilterIcon from "mdi-react/FilterIcon"

import styles from "../../styles/reports.css";

export class TaskButtons extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            active: false
        };

        this.showTaskButtons = this.showTaskButtons.bind(this);
        this.hideTaskButtons = this.hideTaskButtons.bind(this);
    }

    showTaskButtons (e) {
        this.setState({"active": true})
    }

    hideTaskButtons (e) {
        this.setState({"active": false})
    }

    render () {
        return (
            <div className={styles.moreOptionsButton}
                 onMouseLeave={this.state.active ? this.hideTaskButtons :  () => {}}
                 onMouseEnter={!this.state.active ? this.showTaskButtons : () => {}}
                 onTouchStart={this.showTaskButtons}
                 onClick={this.hideTaskButtons}>
                <FilterTask tableData={this.props.tableData} tableSamples={this.props.tableSamples} active={this.state.active}/>
                <SearchTask tableData={this.props.tableData} tableSamples={this.props.tableSamples} active={this.state.active}/>
                <Button variant={"fab"} color={"primary"} >
                    <PlusIcon color={"white"}/>
                </Button>
            </div>
        )
    }
}


class SearchTask extends React.Component {

    state = {
        open: false,
    };

    handleClickOpen = () => {
        console.log(this)
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    render () {
        return (
            <div className={styles.taskButton} style={{"opacity": this.props.active ? 1 : 0, "marginBottom": this.props.active ? "15px" : "0" }}>
                <Button mini variant={"fab"} color={"default"} onClick={this.handleClickOpen}>
                    <Tooltip id={"tooltip-search"} title={"Search samples"} placement={"left"}>
                        <MagnifyIcon/>
                    </Tooltip>
                </Button>
                <SearchDialog
                    open={this.state.open}
                    onClose={this.handleClose}
                    tableData={this.props.tableData}
                    tableSamples={this.props.tableSamples}
                />
            </div>
        )
    }
}

class SearchDialog extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            tableSamples: this.fetchTableSamples(props.tableSamples),
            values: []
        }
    }

    fetchTableSamples = (tableSamples) => {

        const suggestions = [];

        for (const sample of tableSamples){
            suggestions.push({
                "value": sample,
                "label": sample
            })
        }

        return suggestions
    };

    handleChange = (values) => {
        this.setState({ values });
        // selectedOption can be null when the `x` (close) button is clicked
        // if (selectedOption) {
        //     console.log(`Selected: ${selectedOption}`);
        // }
    };

    render () {

        const style = {
            selectContainer: {
                width: "100%",
                zIndex: 1000,
                paddingTop: "10px",
                paddingBottom: "20px"
            }
        };

        return (
            <Dialog classes={{paper: styles.taskDialogContainer}} open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle>Search samples</DialogTitle>
                <div style={style.selectContainer}>
                    <Select name={"teste"}
                            value={this.state.values}
                            multi={true}
                            autoFocus
                            onChange={(vals) => {this.handleChange(vals)}}
                            options={this.state.tableSamples} />
                </div>
                <DialogActions>
                    <Button color={"primary"} variant={"contained"}>
                        Search
                    </Button>
                    <Button color={"default"} variant={"contained"}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}


class FilterTask extends React.Component {
    render () {
        return (
            <div className={styles.taskButton} style={{"opacity": this.props.active ? 1 : 0, "marginBottom": this.props.active ? "15px" : "0" }}>
                <Button mini variant={"fab"} color={"default"}>
                    <Tooltip id={"tooltip-filter"} title={"Filter samples"} placement={"left"}>
                        <FilterIcon/>
                    </Tooltip>
                </Button>
            </div>
        )
    }
}