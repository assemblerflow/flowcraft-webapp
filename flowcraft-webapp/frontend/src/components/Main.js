import "babel-polyfill";

import React from "react";

import { Switch, Route } from "react-router-dom";

import Home from "./Home";
import {NotFound} from "./NotFound";
import {Inspect, InspectHome} from "./Inspect";
import {ReportsRedirect, ReportsBroadcast} from "./Reports";
import {ReportsHome} from "./ReportsHome";

import styles from "../styles/main.css"

export class Main extends React.Component {
    render(){
        return (
            <main className={styles.mainContainer}>
                <Switch>
                    <Route exact path="/" component={Home}/><Route exact path="/inspect" component={InspectHome}/>
                    <Route exact path="/inspect/:runId" component={Inspect} setHeader={this.props.setHeader}/>
                    <Route exact path="/reports" component={ReportsHome}/>
                    <Route exact path="/reports/innuendo" component={ReportsRedirect}/>
                    <Route exact path="/reports/app" component={ReportsRedirect}/>
                    <Route exact path="/reports/app" component={ReportsRedirect}/>
                    <Route exact path="/reports/broadcast/:runId" component={ReportsBroadcast}/>
                    <Route component={NotFound}/>
                </Switch>
            </main>
        )
    }
}


