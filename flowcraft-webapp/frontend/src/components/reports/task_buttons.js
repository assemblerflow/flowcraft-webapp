// React imports
import React from "react"

import Select from "react-select";

import DialogActions from "@material-ui/core/DialogActions";
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
                 onMouseLeave={this.hideTaskButtons}
                 onMouseEnter={this.showTaskButtons}
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

    handleChange = (selectedOption) => {
        this.setState({ selectedOption });
        // selectedOption can be null when the `x` (close) button is clicked
        if (selectedOption) {
            console.log(`Selected: ${selectedOption.label}`);
        }
    };

    render () {

        const style = {
            selectContainer: {
                width: "100%",
                zIndex: 1000
            }
        };

        console.log(this.state)
        return (
            <Dialog classes={{paperScrollPaper: styles.taskDialogContainer}} open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle>Search samples</DialogTitle>
                <div style={style.selectContainer}>
                    <Select name={"teste"}
                            value={"none"}
                            onChange={this.handleChange}
                            options={this.state.tableSamples} />
                </div>
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