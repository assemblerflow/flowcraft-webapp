import React from "react";
import { Switch, Route } from "react-router-dom";
import Home from "./Home";
import {Inspect, InspectHome} from "./Inspect";

import styles from "../styles/main.css"

export class Main extends React.Component {
    render(){
        return (
            <main className={styles.mainContainer}>
                <Switch>
                    <Route exact path="/" component={Home}/>
                    <Route exact path="/inspect" component={InspectHome}/>
                    <Route exact path="/inspect/:runId" component={Inspect} setHeader={this.props.setHeader}/>
                </Switch>
            </main>
        )
    }
}
