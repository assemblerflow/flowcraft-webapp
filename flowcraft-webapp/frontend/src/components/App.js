import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import {Header} from "./Header";
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import {Main} from "./Main";

// Color imports
import green from "@material-ui/core/colors/green";
import indigo from "@material-ui/core/colors/indigo";

const theme = createMuiTheme({
    palette: {
        primary: {
            main: indigo[400]
        },
        secondary: green,
    },
    typography: {
        // Use the system font instead of the default Roboto font.
        fontWeightMedium: 500,
        body1: {
            fontWeight: 500,
        },
        headline: {
            fontSize: 22,
            fontWeight: "bold",
            color: indigo[400],
        },
        display1: {
            fontSize: 20,
            fontWeight: "bold",
            color: "#f2f2f2",
            letterSpacing: "6px"
        }
    },
});


class App extends React.Component {
    render () {
        return(
            <div>
                <Main />
            </div>
        )
    };
}

ReactDOM.render((
    <BrowserRouter>
        <MuiThemeProvider theme={theme}>
            <App />
        </MuiThemeProvider>
    </BrowserRouter>
), document.getElementById("app"));
