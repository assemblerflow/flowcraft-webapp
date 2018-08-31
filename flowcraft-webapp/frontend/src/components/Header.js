import React from "react";
import {Link} from "react-router-dom";

import classNames from "classnames";

import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";

import GithubCircleIcon from "mdi-react/GithubCircleIcon";
import HomeIcon from "mdi-react/HomeIcon"
import MenuIcon from "mdi-react/MenuIcon";

// CSS imports
const styles = require("../styles/header.css");
import {version} from "../../../package.json";

import {ReportDataConsumer} from './reports/contexts';


export class Header extends React.Component {

    render() {

        const style = {
            icon: {
                fill: "#fff"
            }
        };

        return (
            <div style={{marginBottom: 85}}>
                <AppBar position={"fixed"} color="primary"
                        className={classNames(styles.appBar, this.props.drawer && styles.appBarShift)}>
                    <Toolbar>
                        {(this.props.drawerButton && !this.props.drawer) &&
                        <IconButton onClick={this.props.openDrawer}
                                    className={styles.menuButton}>
                            <MenuIcon style={style.icon}/>
                        </IconButton>}
                        <img
                            src={"https://github.com/assemblerflow/flowcraft-webapp/raw/master/flowcraft-webapp/frontend/resources/flowcraft_text_white.png"}
                            alt={"logo"} height={"15"}/>
                        {
                            this.props.homeRef &&
                            <ReportDataConsumer>
                                {
                                    ({additionalInfo}) => (
                                        <IconButton>
                                            <Link to={{ pathname: this.props.homeRef, state: { "additionalInfo": JSON.stringify(additionalInfo) } }}><HomeIcon style={style.icon}/></Link>
                                        </IconButton>
                                    )
                                }
                            </ReportDataConsumer>
                        }
                        <Typography style={{width: "100%", flex: 1}}
                                    align={"center"}
                                    className={styles.secTitle}><span
                            style={{color: "#f2f2f2"}}>{this.props.headerTitle}</span>
                            <span
                                style={{fontSize: "12px"}}>v{version}</span></Typography>
                        <IconButton
                            href={"https://github.com/assemblerflow/flowcraft"}
                            target={"_blank"}>
                            <GithubCircleIcon style={style.icon}/>
                        </IconButton>
                    </Toolbar>
                </AppBar>
            </div>
        )
    }
};
