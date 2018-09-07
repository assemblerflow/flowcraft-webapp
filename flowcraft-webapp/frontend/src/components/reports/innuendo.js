// React imports
import React from "react";
import {Redirect} from "react-router-dom";

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
import Select from '../SelectPlusAll';
import {FCTable} from './tables';

// styles
import styles from "../../styles/innuendo.css";
import "../../styles/innuendo.css";
// import 'react-select/dist/react-select.css';

// Import Colors
import red from "@material-ui/core/colors/red";
import green from "@material-ui/core/colors/green";
import yellow from "@material-ui/core/colors/yellow";

// Icons
import ImportContactsIcon from '@material-ui/icons/ImportContacts';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import BugReportIcon from '@material-ui/icons/BugReport';
import TimelineIcon from '@material-ui/icons/Timeline';
import ExportIcon from "mdi-react/ExportIcon";

// utils
import {parseProjectSearch, getMetadataMapping} from "./utils"
import axios from "axios";

import {ReportsHome} from "../Reports";
import {TableButton} from "./tables";
import {PositionedSnackbar} from "./modals";

//parsers
import {InnuendoReportsTableParser} from './parsers';

// Other imports
import {address} from "../../../config.json";


/////////////////////// INNUENDO Class ///////////////////////////////


/*
Class with INNUENDO specific methods. Trees, profiles and other requests
 that are made directly to the INNUENDO platform associated with the reports.
 */
export class Innuendo {
    constructor() {
        this.userId = "";
        this.species = {};
        this.username = "";
    }

    setUserId(userId) {
        this.userId = userId;
    }

    setUsername(username) {
        this.username = username;
    }

    getUsername() {
        return this.username;
    }

    getUserId() {
        return this.userId;
    }

    setSpecies(species) {
        this.species = species;
    }

    getSpecies() {
        return this.species;
    }

    /*
    * Login to innuendo platform externally.
    * Try to login according to the provided username and password
    */
    tryLogin(username, password) {
        return axios({
            method: "post",
            url: address + `app/api/v1.0/user/external/login/`,
            data: {
                username: username,
                password: password
            }
        })
    }

    /*
    Check INNUENDO user
     */
    checkUser() {
        return axios({
            method: "get",
            url: address + `app/api/v1.0/user/check/`
        })
    }

    /*
    Get global Innuendo platform statistics
     */
    getStatistics() {
        return axios({
            method: "get",
            url: address + `app/api/v1.0/strains/statistics/`,
        })
    }

    /*
    Get all the available species at the INNUENDO Platform
    */
    getInnuendoSpecies() {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/species/",

        })
    }

    /*
    Resource to get all the available versions of chewbbaca schemas
     */
    getInnuendoSchemasVersions() {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/species/chewbbaca/versions/",

        })
    }

    /*
    Get all the available projects. Those are then mapped to their specific
    species.
    */
    getInnuendoProjects() {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/projects/all/",

        })
    }

    getInnuendoTrees() {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/phyloviz/trees/user/",
            params: {
                user_id: this.userId
            }
        })
    }

    /*
    Method to get the required data from the INNUENDO Platform database
     */
    submissionRoutine = async (selectedStrains, selectedProjects, metadataMap) => {

        const resultsReports = await this.getInnuendoReportsByFilter({
            selectedProjects: selectedProjects.join(),
            selectedStrains: selectedStrains.join()

        });

        const resultsMetadata = await this.getInnuendoStrainsMetadata({
            selectedProjects: metadataMap[0],
            selectedStrains: metadataMap[1]
        });

        const resultsPhyloviz = await this.getPhylovizTrees({
            user_id: this.getUserId()
        });

        // Merge reports and metadata results
        const finalResults = [...resultsReports.data, ...resultsMetadata.data, ...resultsPhyloviz.data];

        return {
            resultsReports: finalResults,
            resultsMetadata: resultsMetadata.data
        };

    };

    /*
    Get all strains associated with a given project. The response is then
    parsed to get min and max date for filtering.
    */
    getInnuendoProjectStrains(projectIds) {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/reports/project/info/",
            params: {
                project_id: projectIds.join(",")
            }

        })
    }

    /*
    Request to get all reports for a set of strains in a given time interval.
     */
    async getInnuendoReportsByFilter(filter) {
        return await
            axios({
                method: "post",
                url: address + "app/api/v1.0/reports/project/filter/",
                data: filter

            });
    }

    /*
    Get all metadata associated with a set of strains.
     */
    getInnuendoStrainsMetadata(filter) {
        return axios({
            method: "post",
            url: address + "app/api/v1.0/strains/name/",
            data: filter

        });
    }

    /*
    Get all trees for a given user.
     */
    getPhylovizTrees(data) {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/phyloviz/trees/user/",
            params: data

        });
    }

    /*
    Get innuendo saved reports
     */
    getSavedReports() {
        return axios({
            method: 'get',
            url: address + 'app/api/v1.0/reports/saved/',
            params: {
                user_id: this.userId
            }
        })
    }

    deleteReport(reportId) {
        return axios({
            method: 'delete',
            url: address + 'app/api/v1.0/reports/saved/',
            params: {
                user_id: this.userId,
                report_id: reportId
            }
        })
    }

    sendToPHYLOViZ(requestObject) {
        return axios({
            method: "post",
            url: address + "app/api/v1.0/phyloviz/",
            data: requestObject
        });
    }

    saveReport(requestObject) {
        return axios({
            method: "post",
            url: address + "app/api/v1.0/reports/saved/",
            data: requestObject
        });
    }

    getSavedReports(userId) {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/reports/saved/",
            params: {
                user_id: userId
            }
        });
    }

    //Request to get PHYLOViZ Online Platform job status
    fetchJob(redisJobId) {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/phyloviz/",
            params: {
                job_id: redisJobId
            }
        });

    };

    fetchPhyloviz(phylovizJob) {
        return axios({
            method: "get",
            url: address + "app/api/v1.0/phyloviz/job/",
            params: {
                jobid: phylovizJob
            }
        });

    };

}


/////////////////// React Components ///////////////////////////////////


/**
 * Starting component of the INNUENDO section in the Reports. Loads the
 * Login or the available Tabs.
 */
export class HomeInnuendo extends React.Component {

    state = {
        showProjects: false,
        innuendo: new Innuendo(),
        initialProjects: [],
        initialStrains: []
    };

    showProjects = () => {
        this.setState({showProjects: true});
    };

    setCredentials = (innuendoClass) => {
        this.props.setAdditionalInfo({innuendo: innuendoClass});
        this.setState({
            innuendo: innuendoClass
        })
    };

    // Method used to parse message form iframe
    receiveMessage = (e) => {

        // Verify if message comes from INNUENDO platform
        if (e.origin === address.substring(0, address.length - 1)) {
            if (typeof e.data === "object" && e.data.current_user_id !== undefined) {
                try {
                    // Set userId on INNUENDO state
                    this.state.innuendo.setUserId(e.data.current_user_id);
                    this.state.innuendo.setUsername(e.data.current_user_name);

                    this.props.setAdditionalInfo({innuendo: this.state.innuendo});

                    this.setState({
                        showProjects: true,
                        initialProjects: e.data.projects,
                        initialStrains: e.data.strains
                    });

                } catch (e) {
                    return;
                }
            }
        }
    };

    componentDidMount() {
        if (this.props.bypassLogin !== undefined && !this.state.showProjects) {
            if (this.props.bypassLogin.additionalInfo !== undefined) {

                const additionalInfo = JSON.parse(this.props.bypassLogin.additionalInfo);

                if (additionalInfo.innuendo !== undefined) {
                    this.state.innuendo.setUserId(additionalInfo.innuendo.userId);
                    this.state.innuendo.setUsername(additionalInfo.innuendo.username);

                    this.setState({
                        showProjects: true
                    })
                }
            }
        }
        // Event to receive message from iframe
        window.addEventListener('message', this.receiveMessage);
    }

    componentWillUnmount() {
        // Remove event on component unmount
        window.removeEventListener('message', this.receiveMessage);
    }

    render() {
        return (
            <div>
                {
                    this.state.showProjects ?
                        <InnuendoHomePage
                            innuendo={this.state.innuendo}
                            initialProjects={this.state.initialProjects}
                            initialStrains={this.state.initialStrains}
                        /> :
                        <InnuendoLogin
                            showProjects={this.showProjects}
                            setCredentials={this.setCredentials}
                            innuendo={this.state.innuendo}
                        />
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
    _tryLogin = () => {
        this.props.innuendo.tryLogin(this.state.username, this.state.password)
            .then(
                (response) => {
                    if (response.data !== null && response.data.access === true) {
                        this.props.showProjects();
                        this.props.innuendo.setUserId(response.data.user_id);
                        this.props.innuendo.setUsername(this.state.username);
                        this.props.setCredentials(this.props.innuendo);
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
        this._tryLogin();
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
                <InnuendoGeneralStatistics
                    innuendo={this.props.innuendo}
                />
                <Paper style={style.paper}>
                    <InnuendoTabs
                        innuendo={this.props.innuendo}
                        initialProjects={this.props.initialProjects}
                        initialStrains={this.props.initialStrains}
                    />
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

        this._getStatistics();

        this.state = {
            totalProjects: 0,
            totalSpecies: 0,
            totalWgMLST: 0

        }
    }

    _getStatistics = () => {
        this.props.innuendo.getStatistics().then((response) => {

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
            <div>
                <AppBar position="static" color="default">
                    <Tabs
                        value={this.state.value}
                        onChange={this.handleChange}
                        indicatorColor="primary"
                        textColor="primary"
                        fullWidth
                        centered
                    >
                        <Tab label="Project Selection"/>
                        <Tab label="Saved Reports"/>
                    </Tabs>
                </AppBar>
                {
                    this.state.value === 0 &&
                    <TabContainer>
                        <InnuendoProjects
                            innuendo={this.props.innuendo}
                            initialProjects={this.props.initialProjects}
                            initialStrains={this.props.initialStrains}
                        />
                    </TabContainer>
                }
                {
                    this.state.value === 1 &&
                    <TabContainer>
                        <InnuendoSavedReports innuendo={this.props.innuendo}/>
                    </TabContainer>
                }
            </div>

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
            resultsMetadata: [],
        };

        if (props.initialStrains.length > 0) {
            this.loadInitialStrains();
        }
        else {
            this.loadInnuendoData();
        }

    }

    async loadInitialStrains () {
        await this.getSpecies();
        await this.getSchemasVersions();
        await this.submitInitialStrains();
    }

    async loadInnuendoData() {
        await this.getSpecies();
        await this.getSchemasVersions();
        await this.getProjects();
    };

    /*
    Get all the available species at the INNUENDO Platform
     */
    getSpecies = () => {

        return this.props.innuendo.getInnuendoSpecies().then((response) => {

            let speciesObject = {};

            for (const r of response.data) {
                speciesObject[r.id] = {
                    name: r.name
                };
            }

            this.setState({species: speciesObject});

        });
    };

    /*
    Get innuendo schemas
     */
    getSchemasVersions = () => {

        this.props.innuendo.getInnuendoSchemasVersions().then((versions) => {

            let speciesObject = this.state.species;
            let intermediate = {};

            for (const r in speciesObject) {
                intermediate[r] = {
                    name: speciesObject[r].name,
                    schemaVersions: versions.data[speciesObject[r].name]
                }
            }

            this.setState({species: intermediate});

        });

    };


    /*
    Get all the available projects. Those are then mapped to their specific
     species.
     */
    getProjects = () => {

        return this.props.innuendo.getInnuendoProjects().then((response) => {
            const species = this.state.species;
            let projects = [];
            let projectNamesToIds = {};

            for (const r of response.data) {
                projects.push(`${species[r.species_id].name}: ${r.name}`);
                projectNamesToIds[`${species[r.species_id].name}: ${r.name}`] = r.id;
            }

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

        if (this.state.selectedProjectIds.length > 0) {
            this.props.innuendo.getInnuendoProjectStrains(this.state.selectedProjectIds)
                .then((response) => {
                    const responseData = parseProjectSearch(response.data);

                    this.setState({
                        strains: responseData.totalNames,
                        minDate: responseData.minDate,
                        maxDate: responseData.maxDate,
                        reportInfo: response.data
                    })

                });
        }
        else {
            this.setState({
                strains: [],
                minDate: '',
                maxDate: '',
                reportInfo: []
            })
        }
    };

    /*
    Request to get all reports for a set of strains in a given time interval.
     */
    getReportsByFilter = this.props.innuendo.getInnuendoReportsByFilter;

    /*
    Get all metadata associated with a set of strains.
     */
    getStrainsMetadata = this.props.innuendo.getInnuendoStrainsMetadata;

    /*

     */
    getPhylovizTrees = this.props.innuendo.getPhylovizTrees;

    /*
    Method used for submission of initial strains requested by the INNUENDO
     Platform directly from a project
     */
    submitInitialStrains = async () => {

        let metadataMap = [[], []];

        for (const strain of this.props.initialStrains) {
            metadataMap[0].push(this.props.initialProjects);
            metadataMap[1].push(strain);
        }

        metadataMap[0] = metadataMap[0].join();
        metadataMap[1] = metadataMap[1].join();

        const results = await this.props.innuendo.submissionRoutine(this.props.initialStrains, [this.props.initialProjects], metadataMap);

        this.setState({
            resultsReports: results.resultsReports,
            resultsMetadata: results.resultsMetadata
        });

    };


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

        const results = await this.props.innuendo.submissionRoutine(strainsForRequest, this.state.selectedProjectIds, metadataMap);

        this.setState({
            resultsReports: results.resultsReports,
            resultsMetadata: results.resultsMetadata
        });

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
            <div>
                {
                    this.state.resultsReports.length > 0 &&
                    <Redirect to={{
                        pathname: "/reports/innuendo",
                        state: {
                            data: this.state.resultsReports,
                            additionalInfo: {
                                innuendo: {
                                    userId: this.props.innuendo.getUserId(),
                                    species: this.state.species,
                                    username: this.props.innuendo.getUsername()
                                }
                            }
                        }
                    }}
                    />
                }
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
            </div>
        )
    }
}


/**
 * Component that defines the saved reports section of the innuendo
 * Loads a table with the saved reports and gets the selected reports upon
 * user input.
 */
class InnuendoSavedReports extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tableData: [],
            selection: [],
            resultsReports: [],
            filters: undefined,
            highlights: undefined,
            species: {}
        };

        this._getSavedReports();
        this._getSpecies();

    }

    setSelection = (selection) => {
        this.setState({selection});
    };

    _getSavedReports = () => {
        this.props.innuendo.getSavedReports(this.props.innuendo.getUserId()).then((response) => {
            this.setState({
                tableData: response.data
            });
        });
    };

    _getSpecies = () => {
        this.props.innuendo.getInnuendoSpecies().then((response) => {
            let speciesObject = {};

            response.data.map(r => {
                speciesObject[r.id] = r.name;
            });

            this.setState({species: speciesObject});

        });
    };

    /*
    SHows the available saved reports for the authentication used in the
     INNUENDO Platform.
     */
    showReport = async () => {
        if (this.state.selection.rows === undefined || this.state.selection.rows.length === 0) {
            let message = "Please select an entry first!";
            this.snackBar.handleOpen(message, "warning");
            return false;
        }

        // Get strain names and projects ids associated with the report
        const selectionRow = this.state.selection.rows[0];
        const strains = selectionRow.strain_names.split(",");
        const projects = selectionRow.projects_id.split(",");

        // Get save dreports filters and highlights to pass to the ReportsApp
        const filters = JSON.parse(selectionRow.filters);
        const highlights = JSON.parse(selectionRow.highlights);

        let metadataMap = [[], []];

        // Create mapping between strains and projects
        for (const [index, strain] of strains.entries()) {
            metadataMap[0].push(projects[index]);
            metadataMap[1].push(strain);
        }

        // Fetch report data
        const results = await this.props.innuendo.submissionRoutine(strains, projects, metadataMap);

        this.setState({
            resultsReports: results.resultsReports,
            filters,
            highlights
        })
    };

    /*
    Deletes a saved report
     */
    deleteReport = async () => {
        if (this.state.selection.rows === undefined || this.state.selection.rows.length === 0) {
            let message = "Please select an entry first!";
            this.snackBar.handleOpen(message, "warning");
            return false;
        }

        const selectionRow = this.state.selection.rows[0];
        const result = await this.props.innuendo.deleteReport(selectionRow.report_id);

        this._getSavedReports();
    };


    render() {
        const tableData = InnuendoReportsTableParser(this.state.tableData);

        const style = {
            icon: {
                fill: "white"
            }
        };

        return (
            <div>
                <PositionedSnackbar
                    vertical="top"
                    horizontal="right"
                    handleClose={this.handleSnackClose}
                    onRef={ref => (this.snackBar = ref)}
                />
                {
                    this.state.resultsReports.length > 0 &&
                    <Redirect to={{
                        pathname: "/reports/innuendo",
                        state: {
                            data: this.state.resultsReports,
                            filters: this.state.filters,
                            highlights: this.state.highlights,
                            additionalInfo: {
                                innuendo: {
                                    userId: this.props.innuendo.getUserId(),
                                    species: this.state.species,
                                    username: this.props.innuendo.getUsername()
                                }
                            }
                        }
                    }}
                    />
                }
                {
                    tableData.tableArray.length > 0 ?
                        <FCTable
                            data={tableData.tableArray}
                            columns={tableData.columnsArray}
                            rawData={tableData.rawTableArray}
                            setSelection={this.setSelection}
                            withoutSamples
                            hideGeneralButtons
                            singleActions={
                                <div>
                                    <TableButton tooltip={"Show Report"}
                                                 onClick={this.showReport}>
                                        <ExportIcon style={style.icon}/>
                                    </TableButton>
                                    <TableButton tooltip={"Delete Report"}
                                                 onClick={this.deleteReport}>
                                        <DeleteForeverIcon style={style.icon}/>
                                    </TableButton>
                                </div>
                            }
                        >
                        </FCTable> :
                        <Typography>No saved reports available!</Typography>
                }
            </div>
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
                        onMenuClose={this.props.getProjectStrains}
                        closeMenuOnSelect={false}
                        isMulti
                        allowSelectAll={true}
                        value={this.state.values}
                        onChange={(values) => {
                            this.props.handleChangeProjects(values);
                            this.handleSelectChange(values);
                        }}
                        options={this.setOptions()}
                        style={style.select}
                    />
                    <Typography style={style.typoText}>Or drag and drop a report
                        file to the page!</Typography>
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
                        <Grid item xs={12} sm={6}>
                            <Typography
                                style={style.filterStrainText}>Strains</Typography>
                            <Select
                                closeMenuOnSelect={false}
                                isMulti
                                allowSelectAll={true}
                                label="Strains"
                                value={this.state.values}
                                onChange={(values) => {
                                    this.props.handleChangeStrains(values);
                                    this.handleSelectChange(values)
                                }}
                                options={this.setOptions()}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>

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
                        <Grid item xs={12} sm={2}>
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
                        <Grid item xs={12} sm={2}>
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
