// React imports
import React from "react"

import Button from '@material-ui/core/Button';
import Tooltip from "@material-ui/core/Tooltip";

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
                 onMouseEnter={this.showTaskButtons}>
                <FilterTask active={this.state.active}/>
                <SearchTask active={this.state.active}/>
                <Button variant={"fab"} color={"primary"}>
                    <PlusIcon color={"white"}/>
                </Button>
            </div>
        )
    }
}


class SearchTask extends React.Component {
    render () {
        return (
            <div className={styles.taskButton} style={{"opacity": this.props.active ? 1 : 0, "marginBottom": this.props.active ? "15px" : "0" }}>
                <Tooltip id={"tooltip-search"} title={"Search samples"} placement={"left"}>
                    <Button mini variant={"fab"} color={"default"}>
                        <MagnifyIcon/>
                    </Button>
                </Tooltip>
            </div>
        )
    }
}


class FilterTask extends React.Component {
    render () {
        return (
            <div className={styles.taskButton} style={{"opacity": this.props.active ? 1 : 0, "marginBottom": this.props.active ? "15px" : "0" }}>
                <Tooltip id={"tooltip-filter"} title={"Filter samples"} placement={"left"}>
                    <Button mini variant={"fab"} color={"default"}>
                        <FilterIcon/>
                    </Button>
                </Tooltip>
            </div>
        )
    }
}