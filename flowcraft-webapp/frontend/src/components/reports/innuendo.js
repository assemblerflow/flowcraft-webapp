// React imports
import React from "react"

// React imports
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Paper from "@material-ui/core/Paper";
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Select from 'react-select';

// styles
import {withStyles} from '@material-ui/core/styles';
import styles from "../../styles/innuendo.css";
import "../../styles/innuendo.css";
import 'react-select/dist/react-select.css';

// Import Colors
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import yellow from "@material-ui/core/colors/yellow";

// Icons
import ImportContactsIcon from '@material-ui/icons/ImportContacts';
import BugReportIcon from '@material-ui/icons/BugReport';
import TimelineIcon from '@material-ui/icons/Timeline';

// Innuendo requests
import {
    getInnuendoSpecies,
    getInnuendoProjects,
    getInnuendoProjectStrains,
    getInnuendoReportsByFilter,
    getInnuendoStrainsMetadata,
    tryLogin,
    getStatistics
} from "./requests"

// utils
import {parseProjectSearch, getMetadataMapping} from "./utils"


/**
 * Starting component of the INNUENDO section in the Reports. Loads the
 * Login or the available Tabs.
 */
export class HomeInnuendo extends React.Component {

    state = {
        showProjects: false
    };

    showProjects = () => {
        this.setState({showProjects: true});
    };

    render() {
        return (
            <div>
                {
                    this.state.showProjects ?
                        <InnuendoHomePage/> :
                        <InnuendoLogin
                            showProjects={this.showProjects}/>
                }
            </div>
        )
    }
}

/**
 * Login component to the INNUENDO Platform. Checks for username and
 * password triggers component load if credentials are correct.
 */
class InnuendoLogin extends React.Component {

    state = {
        username: '',
        password: '',
        error: false

    };

    /*
    * Login to innuendo platform externally.
    * Try to login according to the provided username and password
    */
    tryLogin = () => {
        tryLogin(this.state.username, this.state.password)
            .then(
                (response) => {
                    if (response.data !== null && response.data.access === true) {
                        this.props.showProjects();
                    }
                    else {
                        this.setState({error: true});
                    }
                }
            )
    };

    handleChange = event => {
        const target = event.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value,
            error: false
        });
    };

    handleSubmit = event => {
        this.tryLogin();
        event.preventDefault();
    };

    render() {
        return (
            <Paper className={styles.innuendoHomeContainer}>
                <form onSubmit={this.handleSubmit}>
                    <div className={styles.innuendoLogin}>
                        <div className={styles.innuendoLoginDiv}>
                            <Typography variant="title">Sign In</Typography>
                        </div>
                        <div className={styles.innuendoFormDiv}>
                            <TextField className={styles.innuendoInputForm}
                                       required
                                       id="username"
                                       name="username"
                                       label="Username"
                                       defaultValue=""
                                       onChange={this.handleChange}
                            />
                        </div>
                        <div className={styles.innuendoFormDiv}>
                            <TextField
                                className={styles.innuendoInputForm}
                                required
                                id="password"
                                name="password"
                                label="Password"
                                type="password"
                                autoComplete="current-password"
                                onChange={this.handleChange}
                            />
                        </div>
                        <div className={styles.innuendoFormDiv}>
                            <Button variant="contained" color="primary"
                                    type="submit">
                                Submit
                            </Button>
                        </div>
                        {
                            this.state.error &&
                            <div className={styles.innuendoFormDiv}>
                                <Typography color="error">Invalid username or
                                    password.</Typography>
                            </div>
                        }
                    </div>
                </form>
            </Paper>
        )
    }
}


class InnuendoHomePage extends React.Component {

    render() {

        //Inline style
        const style = {
            paper: {
                height: 'auto'
            }
        };

        return (
            <div>
                <InnuendoGeneralStatistics/>
                <Paper style={style.paper}>
                    <InnuendoTabs/>
                </Paper>
            </div>
        )
    }
}


/**
 * Component that defines the general statistics part of the INNUENDO
 * reports home page
 */
class InnuendoGeneralStatistics extends React.Component {

    constructor(props) {
        super(props);

        this.getStatistics();

        this.state = {
            totalProjects: 0,
            totalSpecies: 0,
            totalWgMLST: 0

        }
    }

    getStatistics = () => {
        getStatistics().then((response) => {

            let totalSpecies = 0;
            let totalProjects = 0;
            let totalWgMLST = 0;

            for (const specieData in response.data) {
                totalSpecies += 1;
                totalProjects += response.data[specieData][1];
                totalWgMLST += response.data[specieData][2];
            }

            this.setState({
                totalProjects: totalProjects,
                totalSpecies: totalSpecies,
                totalWgMLST: totalWgMLST
            })
        })
    };


    render() {

        //Inline style
        const style = {
            icon: {
                fontSize: 45
            },
            basicMargin: {
                marginTop: '5%',
                marginBottom: '3%'
            }
        };

        return (
            <div style={style.basicMargin}>
                <Grid container justify="center"
                      spacing={8}>
                    <Grid item xs={12} sm={4}>
                        <InnuendoCard
                            title="Species"
                            icon={<BugReportIcon style={style.icon}/>}
                            text={`${this.state.totalSpecies} Species available`}
                            color={red[300]}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <InnuendoCard
                            title="Projects"
                            icon={<ImportContactsIcon style={style.icon}/>}
                            text={`${this.state.totalProjects} Projects available`}
                            color={green[300]}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <InnuendoCard
                            title="wgMLST profiles"
                            icon={<TimelineIcon style={style.icon}/>}
                            text={`${this.state.totalWgMLST} wgMLST profiles available`}
                            color={yellow[300]}
                        />
                    </Grid>
                </Grid>
            </div>
        )
    }
}

/**
 * Innuendo Card definition.
 * @param title
 * @param icon
 * @param text
 * @returns {XML}
 * @constructor
 */
const InnuendoCard = ({title, icon, text, color}) => {

    const style = {
        cardIcon: {
            margin: 'auto',
            textAlign: 'center',
        },
        cardText: {
            textAlign: 'left',
            color: 'white'
        },
        text: {
            marginTop: '2%'
        },
        card: {
            backgroundColor: color
        }
    };

    return (
        <Card style={style.card}>
            <CardContent>
                <Grid container>
                    <Grid item xs={12} sm={4} style={style.cardIcon}>
                        {icon}
                    </Grid>
                    <Grid item xs={12} sm={8} style={style.cardText}>
                        <Typography variant="title">{title}</Typography>
                        <Divider/>
                        <Typography style={style.text}>{text}</Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
};


/**
 * Tab container definition.
 * @param children
 * @param dir
 * @returns {XML}
 * @constructor
 */
const TabContainer = ({children, dir}) => {
    const style = {
        typography: {
            padding: 8 * 3,
        }
    };

    return (
        <Typography component="div" dir={dir} style={style.typography}>
            {children}
        </Typography>
    );
};


/**
 * Loads the components according to the tabs selected.
 */
class InnuendoTabs extends React.Component {

    state = {
        value: 0
    };

    handleChange = (event, value) => {
        this.setState({value});
    };

    render() {

        //Inline style
        const style = {
            swipeView: {
                overflow: 'none'
            }
        };

        return (
            <Grid container spacing={8}>
                <Grid item xs={12} sm={12}>
                    <AppBar position="static" color="default">
                        <Tabs
                            value={this.state.value}
                            onChange={this.handleChange}
                            indicatorColor="primary"
                            textColor="primary"
                            fullWidth
                            centered
                        >
                            <Tab label="Project Select"/>
                            <Tab label="Saved Projects"/>
                        </Tabs>
                    </AppBar>
                    {
                        this.state.value === 0 &&
                        <TabContainer>
                            <InnuendoProjects></InnuendoProjects>
                        </TabContainer>
                    }
                    {
                        this.state.value === 1 &&
                        <TabContainer>
                            <InnuendoSavedReports/>
                        </TabContainer>
                    }

                </Grid>
            </Grid>

        )
    }
}

/**
 * Main INNUENDO Component. Has all functions required to load species,
 * projects and strains information.
 * Also loads the required components dynamically.
 */
class InnuendoProjects extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedProjects: [],
            selectedStrains: [],
            projects: [],
            strains: [],
            species: {},
            selectedProjectIds: [],
            projectNameToId: {},
            minDate: "",
            maxDate: "",
            reportInfo: [],
            resultsReports: [],
            resultsMetadata: []
        };

        this.loadInnuendoData();

    }

    async loadInnuendoData() {
        await this.getSpecies();
        await this.getProjects();
    };

    /*
    Get all the available species at the INNUENDO Platform
     */
    getSpecies = () => {

        getInnuendoSpecies().then((response) => {
            let speciesObject = {};

            response.data.map(r => {
                speciesObject[r.id] = r.name;
            });

            this.setState({species: speciesObject});

        });
    };


    /*
    Get all the available projects. Those are then mapped to their specific
     species.
     */
    getProjects = () => {

        getInnuendoProjects().then((response) => {
            const species = this.state.species;
            let projects = [];
            let projectNamesToIds = {};

            response.data.map(r => {
                projects.push(`${species[r.species_id]}: ${r.name}`);
                projectNamesToIds[`${species[r.species_id]}: ${r.name}`] = r.id;
            });

            this.setState({
                projects: projects,
                projectNameToId: projectNamesToIds
            });
        });
    };

    /*
    Get all strains associated with a given project. The response is then
     parsed to get min and max date for filtering.
     */
    getProjectStrains = () => {

        getInnuendoProjectStrains(this.state.selectedProjectIds).then((response) => {
            const responseData = parseProjectSearch(response.data);

            this.setState({
                strains: responseData.totalNames,
                minDate: responseData.minDate,
                maxDate: responseData.maxDate,
                reportInfo: response.data
            })

        });
    };

    /*
    Request to get all reports for a set of strains in a given time interval.
     */
    getReportsByFilter = getInnuendoReportsByFilter;

    /*
    Get all metadata associated with a set of strains.
     */
    getStrainsMetadata = getInnuendoStrainsMetadata;

    /*
    Loads all reports according with the chosen strains.
     */
    submitStrains = async () => {

        const strainsForRequest = [];

        for (const el of this.state.reportInfo) {
            if (this.state.selectedStrains.includes(el.sample_name)) {
                const dt = new Date(el.timestamp);
                const mind = new Date(this.state.minDate);
                const maxd = new Date(this.state.maxDate);
                if (dt >= mind && dt <= maxd && !strainsForRequest.includes(el.sample_name)) {
                    strainsForRequest.push(el.sample_name);
                }
            }
        }

        const metadataMap = await getMetadataMapping(this.state.reportInfo, this.state.selectedStrains);

        const resultsReports = await this.getReportsByFilter({
            selectedProjects: this.state.selectedProjectIds.join(),
            selectedStrains: strainsForRequest.join()

        });

        const resultsMetadata = await this.getStrainsMetadata({
            selectedProjects: metadataMap[0],
            selectedStrains: metadataMap[1]
        });

        this.setState({
            resultsReports: resultsReports,
            resultsMetadata: resultsMetadata
        })

    };

    handleChangeProjects = (selectedValues) => {

        const projectIndexes = [];
        const selectedProjects = [];

        for (const entry of selectedValues) {
            projectIndexes.push(this.state.projectNameToId[entry.value]);
            selectedProjects.push(entry.value);
        }

        this.setState({
            selectedProjects: selectedProjects,
            selectedProjectIds: projectIndexes,
        });

    };

    handleChangeStrains = (selectedValues) => {

        const selectedStrains = [];

        for (const entry of selectedValues) {
            selectedStrains.push(entry.value);
        }

        this.setState({
            selectedStrains: selectedStrains
        });
    };

    updateDate = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        this.setState({
            [name]: value
        })
    };

    render() {

        return (
            <Grid container>
                <Grid item xs={12} sm={12}>
                    <InnuendoProjectSelector
                        handleChangeProjects={this.handleChangeProjects}
                        projects={this.state.projects}
                        getProjectStrains={this.getProjectStrains}
                    />
                </Grid>
                {
                    this.state.strains.length > 0 &&
                    <Grid item xs={12} sm={12}>
                        <InnuendoFilters
                            handleChangeStrains={this.handleChangeStrains}
                            strains={this.state.strains}
                            minDate={this.state.minDate}
                            maxDate={this.state.maxDate}
                            updateDate={this.updateDate}
                            submitStrains={this.submitStrains}
                        />
                    </Grid>
                }

            </Grid>
        )
    }
}

class InnuendoSavedReports extends React.Component {
    render() {
        return (
            <div>BAH</div>
        )
    }
}

/**
 * Component that renders the INNUENDO projects selector.
 */
class InnuendoProjectSelector extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            values: []
        };

    }

    setOptions = () => {
        return this.props.projects.map(name => {
            return {'value': name, 'label': name}

        });
    };

    handleSelectChange(values) {
        this.setState({values});
    };

    render() {

        // Inline styling
        const style = {
            baseDiv: {
                textAlign: 'center',
                marginLeft: '20%',
                marginRight: '20%'
            },
            typoText: {
                color: 'black',
                marginBottom: '5px'
            },
            selectDiv: {
                width: '100%',
                zIndex: 1000,

            },
            select: {
                marginBottom: '1%'
            }
        };

        return (
            <div style={style.baseDiv}>
                <div style={style.selectDiv}>
                    <Typography variant="title" style={style.typoText}>Choose
                        Projects</Typography>
                    <Select
                        onClose={this.props.getProjectStrains}
                        closeOnSelect={false}
                        multi
                        value={this.state.values}
                        onChange={(values) => {
                            this.props.handleChangeProjects(values);
                            this.handleSelectChange(values);
                        }}
                        options={this.setOptions()}
                        style={style.select}
                    />
                    <Typography style={style.typoText}>Or drag and drop a report file to the page!</Typography>
                </div>
            </div>
        )
    }
}

/**
 * Component that renders the Filters section.
 */
class InnuendoFilters extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            values: []
        };

    }

    setOptions = () => {
        return this.props.strains.map(name => {
            return {'value': name, 'label': name}

        });
    };

    handleSelectChange(values) {
        this.setState({values});
    };


    render() {

        //Inline style
        const style = {
            divider: {
                height: '3px',
                marginTop: '2%',
                marginBottom: '2%'

            },
            filterTitle: {
                color: 'black',
                marginBottom: '1%'
            },
            filterStrainText: {
                color: 'black',
                textAlign: 'left',
                fontSize: '12px'
            },
            formControl: {
                width: '100%',
                textAlign: 'center'
            },
            submitButton: {
                backgroundColor: green[300],
                color: 'white'
            }
        };

        return (
            <div>
                <Divider style={style.divider}/>
                <Typography variant="title"
                            style={style.filterTitle}>Filters:</Typography>
                <FormControl style={style.formControl}>
                    <Grid container spacing={8}>
                        <Grid item sm={6}>
                            <Typography
                                style={style.filterStrainText}>Strains</Typography>
                            <Select
                                closeOnSelect={false}
                                multi
                                label="Strains"
                                value={this.state.values}
                                onChange={(values) => {
                                    this.props.handleChangeStrains(values);
                                    this.handleSelectChange(values)
                                }}
                                options={this.setOptions()}
                            />
                        </Grid>
                        <Grid item sm={2}>

                            <TextField
                                id="startDate"
                                label="From"
                                type="date"
                                name="minDate"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                defaultValue={this.props.minDate}
                            />
                        </Grid>
                        <Grid item sm={2}>
                            <TextField
                                id="endDate"
                                label="To"
                                type="date"
                                name="maxDate"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                defaultValue={this.props.maxDate}
                                onChange={this.props.updateDate}
                            />
                        </Grid>
                        <Grid item sm={2}>
                            <Button className={styles.innuendoInputForm}
                                    variant="contained"
                                    size="large"
                                    style={style.submitButton}
                                    onClick={this.props.submitStrains}>
                                Submit
                            </Button>
                        </Grid>
                    </Grid>
                </FormControl>
            </div>
        )
    }
}
