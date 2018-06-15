// React imports
import React from "react"
import {Header} from "./Header";

import {HomeInput} from "./Inspect";
import {findTableSignatures} from "./reports/parsers";

export class Reports extends React.Component {

    render() {
        return(
            <div>
                REPORT!
            </div>
        )
    }
}

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
                            < HomeInput route={"reports"}/>
                        </div>
                }
            </div>
        )
    }
}

class ReportsApp extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            reportData: props.reportData,
            tables: findTableSignatures(props.reportData)
        }
    }

    render(){
        console.log(this.state);
        return(
            <div>
                The actual app
            </div>
        )
    }
}