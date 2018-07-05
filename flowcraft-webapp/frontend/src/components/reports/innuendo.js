// React imports
import React from "react"

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Paper from "@material-ui/core/Paper";
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SwipeableViews from 'react-swipeable-views';

import {findTableSignatures, findChartSignatures} from "./parsers";
import {QualityControlTable, AssemblyTable, AbricateTable, ChewbbacaTable} from "./tables";
import {BasicModal} from "./modals";
import {FastQcCharts} from "./charts";
import {ReportsHeader} from "./drawer";
import {HomeInput} from "../Inspect";
import {Header} from "../Header";

import { Link, DirectLink, Element, Events, animateScroll as scroll, scrollSpy, scroller } from 'react-scroll'

import styles from "../../styles/reports.css";

export class HomeInnuendo extends React.Component {

    render () {
        return (
            <div className={styles.innuendoHomeContainer}>
                <Paper className={styles.innuendoHome}>
                    <InnuendoTabs></InnuendoTabs>
                </Paper>
            </div>
        )
    }
}

function TabContainer({ children, dir }) {
  return (
    <Typography component="div" dir={dir} style={{ padding: 8 * 3 }}>
      {children}
    </Typography>
  );
}

class InnuendoTabs extends React.Component {
  state = {
    value: 0,
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  handleChangeIndex = index => {
    this.setState({ value: index });
  };

  render() {

    return (
      <div>
        <AppBar position="static" color="default">
          <Tabs
            value={this.state.value}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
            fullWidth
          >
            <Tab label="Item One" />
            <Tab label="Item Two" />
            <Tab label="Item Three" />
          </Tabs>
        </AppBar>
        <SwipeableViews
          index={this.state.value}
          onChangeIndex={this.handleChangeIndex}
        >
          <TabContainer>Item One</TabContainer>
          <TabContainer>Item Two</TabContainer>
          <TabContainer>Item Three</TabContainer>
        </SwipeableViews>
      </div>
    );
  }
}