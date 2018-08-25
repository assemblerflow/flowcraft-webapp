import React from "react";
import ReactDOM from "react-dom";
import {BrowserRouter, Link, Route, Switch} from "react-router-dom";
import {Header} from "./Header";
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import {Main} from "./Main";

// Theme imports
import {themes} from "./reports/themes";
import {theme} from "../../config.json";


class App extends React.Component {
    render() {
        return (
            <div>
                <Main/>
            </div>
        )
    };
}

ReactDOM.render((
    <BrowserRouter>
        <MuiThemeProvider theme={themes[theme]}>
            <App/>
        </MuiThemeProvider>
    </BrowserRouter>
), document.getElementById("app"));
