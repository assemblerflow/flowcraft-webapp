// React imports
import React from "react"

import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";

import {findTableSignatures} from "./reports/parsers";
import {QualityControlTable} from "./reports/tables";
import {ReportsHeader} from "./reports/drawer";
import {HomeInput} from "./Inspect";
import {Header} from "./Header";


export class Reports extends React.Component {

    render() {
        return(
            <div>
                REPORT!
            </div>
        )
    }
}


/**
 * Full component for Reports home page. It is responsible for handling
 * the Drag and Drop of report files OR the specification of runID for
 * fetching report data to the database. It then mounts the actual ReportsApp
 * component.
 *
 * On drag and drop: The ReportsApp is mounted on the current URL.
 * On runID: The ReportsApp is mount on the runID URL.
 */
export class ReportsHome extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            "runId": "",
            "reportData": "",
        };
    }

    componentDidMount(){
        window.addEventListener("drop", this._drop.bind(this));
        window.addEventListener("dragover", this._dragOver);
    }

    componentWillUnmount(){
        window.removeEventListener("drop", this._drop);
        window.removeEventListener("dragover", this._dragOver);
    }

    _drop(ev){
        ev.preventDefault();
        const data = ev.dataTransfer.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                this.setState({"reportData": JSON.parse(e.target.result).data.results});
            } catch(e) {
                console.log(e);
            }
        }.bind(this);

        reader.readAsText(data);
        console.log(this.state)
    }

    _dragOver(ev){
        ev.preventDefault();
        ev.stopPropagation();
    }

    render() {
        return(
            <div>
                {
                    this.state.reportData ?
                        <ReportsApp reportData={this.state.reportData}/> :
                        <div>
                            <Header headerTitle={"Reports"}/>
                            <HomeInput route={"reports"}/>
                        </div>
                }
            </div>
        )
    }
}

/**
 * Main Reports application component. It requires the reportData array of
 * JSONs to correctly render. The rendering of the specific components in the
 * reports is conditional on the data provided in the reportData array.
 */
class ReportsApp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            reportData: props.reportData,
            tables: findTableSignatures(props.reportData),
            drawerOpen: false,
        };
    }

    render(){
        return(
            <div>
                <ReportsHeader>
                    {
                        this.state.tables.includes("qc") &&
                        <ExpansionPanel defaultExpanded >
                            <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                                <Typography variant={"headline"}>Quality control</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <QualityControlTable/>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    }
                </ReportsHeader>
            </div>
        )
    }
}