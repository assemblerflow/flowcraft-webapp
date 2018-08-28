// File where all themes are available

import {createMuiTheme} from '@material-ui/core/styles';

// Color imports
import lightblue from "@material-ui/core/colors/lightBlue"
import green from "@material-ui/core/colors/green";
import indigo from "@material-ui/core/colors/indigo";
import grey from "@material-ui/core/colors/grey";
import red from "@material-ui/core/colors/red";
import amber from "@material-ui/core/colors/amber";


// Base theme used for FlowCraft reporting system
const base = createMuiTheme({
    palette: {
        primary: {
            main: indigo[400]
        },
        secondary: {
            main: lightblue[500]
        },
        success: {
            main: green[300]
        },
        error: {
            main: red[600]
        },
        info: {
            main: grey[600],
        },
        warning: {
            main: amber[300]
        }
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
        subheading: {
            fontSize: 18,
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


// Theme for the INNUENDO Platform
const innuendo = createMuiTheme({
    palette: {
        primary: {
            main: grey[900]
        },
        secondary: {
            main: green[400]
        },
        success: {
            main: green[300]
        },
        error: {
            main: red[600]
        },
        info: {
            main: grey[600],
        },
        warning: {
            main: amber[300]
        }
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
            color: grey[900],
        },
        subheading: {
            fontSize: 18,
            fontWeight: "bold",
            color: grey[900],
        },
        display1: {
            fontSize: 20,
            fontWeight: "bold",
            color: "#f2f2f2",
            letterSpacing: "6px"
        }
    },
});

// How themes will be available
export const themes = {
    base: base,
    innuendo: innuendo
};