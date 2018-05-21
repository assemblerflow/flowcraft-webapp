import React from "react";
import { Switch, Route } from "react-router-dom";
import Home from "./Home";
import {Inspect, InspectHome} from "./Inspect";

import styles from "../styles/main.css"


// The Main component renders one of the three provided
// Routes (provided that one matches). Both the /roster
// and /schedule routes will match any pathname that starts
// with /roster or /schedule. The / route will only match
// when the pathname is exactly the string "/"
const Main = () => (
  <main className={styles.mainContainer}>
    <Switch>
      <Route exact path="/" component={Home}/>
      <Route exact path="/inspect" component={InspectHome}/>
      <Route exact path="/inspect/:runId" component={Inspect}/>
    </Switch>
  </main>
);

export default Main;