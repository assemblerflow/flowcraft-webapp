// React imports
import React from "react"

import {findTableSignatures, findChartSignatures} from "./reports/parsers";
import {QualityControlTable, AssemblyTable, AbricateTable} from "./reports/tables";
import {FastQcCharts} from "./reports/charts";
import {ReportsHeader} from "./reports/drawer";
import {HomeInput} from "./Inspect";
import {Header} from "./Header";

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
        // Add event listeners for drag and drop functionality
        window.addEventListener("drop", this._drop.bind(this));
        window.addEventListener("dragover", this._dragOver);
    }

    componentWillUnmount(){
        // Remove event listeners for drag and drop functionality
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

        const tableData = findTableSignatures(props.reportData);
        const charts = findChartSignatures(props.reportData);

        this.state = {
            reportData: props.reportData,
            tables: [ ...tableData.keys() ],
            tableData,
            charts,
        };
    }

    render(){
        //
        // This is the main element where the Reports components will be added,
        // Their addition should be conditional on the presence of relevant
        // data in the this.state.reportData array, and each component should
        // be responsible for handling the data in any way they see fit.
        //
        console.log(this.state);

        const test = this.state.tableData.get("qc");

        return(
            <div>
                <ReportsHeader headers={this.state.tables}>
                    {
                        this.state.tables.includes("qc") &&
                            <QualityControlTable tableData={test}/>
                    }
                    {
                        this.state.tables.includes("assembly") &&
                            <AssemblyTable tableData={this.state.tableData.get("assembly")}/>
                    }
                    {
                        this.state.tables.includes("abricate") &&
                            <AbricateTable tableData={this.state.tableData.get("abricate")}/>

                    }
                    {
                        this.state.charts.includes("base_n_content") &&
                            <FastQcCharts rawReports={this.state.reportData}/>
                    }
                </ReportsHeader>
            </div>
        )
    }
}