// React imports
import React from "react"

// React imports
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Paper from "@material-ui/core/Paper";
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

// styles
import styles from "../../styles/innuendo.css";

// Other imports
import axios from "axios";
import {address} from "../../../config.json"

// utils
import {parseProjectSearch, getMetadataMapping} from "./utils"


/**
 * Starting component of the INNUENDO section in the Reports. Loads the
 * Login or the available Tabs.
 */
export class HomeInnuendo extends React.Component {

    state = {
        showProjects: false
    }

    showProjects = () => {
        this.setState({showProjects: true});
    };

    render() {
        return (
            <Paper className={styles.innuendoHomeContainer}>
                {
                    this.state.showProjects ?
                        <InnuendoTabs/> :
                        <InnuendoLogin
                            showProjects={this.showProjects}/>
                }
            </Paper>
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
        axios({
            method: "post",
            url: address + `app/api/v1.0/user/external/login/`,
            data: {
                username: this.state.username,
                password: this.state.password
            }
        })
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
        )
    }
}


/**
 * Loads the components according to the tabs selected.
 */
class InnuendoTabs extends React.Component {

    state = {
        openTab: 0
    };

    handleClick = (index) => {
        this.setState({
            openTab: index
        });
    };

    render() {
        return (
            <div>
                <div className={styles.innuendoTabButtonsDiv}>
                    <Button
                        className={styles.innuendoTabButtons}
                        variant="contained"
                        color="primary"
                        name="0"
                        onClick={() => {
                            this.handleClick(0)
                        }}
                    >
                        <Typography variant="display1"
                                    className={styles.innuendoTabButtonText}>Select
                            Projects</Typography>
                    </Button>
                    <Button
                        className={styles.innuendoTabButtons}
                        variant="contained"
                        color="primary"
                        name="1"
                        onClick={() => {
                            this.handleClick(1)
                        }}
                    >
                        <Typography variant="display1"
                                    className={styles.innuendoTabButtonText}>Saved
                            Reports</Typography>
                    </Button>
                </div>
                <div>
                    {
                        this.state.openTab === 0 &&
                        <InnuendoProjects></InnuendoProjects>
                    }
                    {
                        this.state.openTab === 1 &&
                        <Typography>1</Typography>
                    }
                </div>
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

        this.loadInnuendoData();

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

    }

    async loadInnuendoData() {
        await this.getSpecies();
        await this.getProjects();
    };

    /*
    Get all the available species at the INNUENDO Platform
     */
    getSpecies = () => {
        axios({
            method: "get",
            url: address + "app/api/v1.0/species/",

        }).then((response) => {

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

        axios({
            method: "get",
            url: address + "app/api/v1.0/projects/all/",

        }).then((response) => {
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

        axios({
            method: "get",
            url: address + "app/api/v1.0/reports/project/info",
            params: {
                project_id: this.state.selectedProjectIds.join(",")
            }

        }).then((response) => {
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
    getReportsByFilter = async (filter) => {
        return await axios({
            method: "post",
            url: address + "app/api/v1.0/reports/project/filter/",
            data: filter

        });
    };

    /*
    Get all metadata associated with a set of strains.
     */
    getStrainsMetadata = async (filter) => {
        return await axios({
            method: "post",
            url: address + "app/api/v1.0/strains/name/",
            data: filter

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

    handleChangeProjects = event => {

        const projectIndexes = [];

        for (const value of event.target.value) {
            projectIndexes.push(this.state.projectNameToId[value])
        }

        this.setState({
            selectedProjects: event.target.value,
            selectedProjectIds: projectIndexes
        });
    };

    handleChangeStrains = event => {
        this.setState({selectedStrains: event.target.value});
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
            <div className={styles.innuendoLogin}>
                <InnuendoProjectSelector
                    selectedProjects={this.state.selectedProjects}
                    handleChangeProjects={this.handleChangeProjects}
                    projects={this.state.projects}
                    getProjectStrains={this.getProjectStrains}
                />
                {
                    this.state.strains.length > 0 &&
                    <InnuendoFilters
                        selectedStrains={this.state.selectedStrains}
                        handleChangeStrains={this.handleChangeStrains}
                        strains={this.state.strains}
                        minDate={this.state.minDate}
                        maxDate={this.state.maxDate}
                        updateDate={this.updateDate}
                        submitStrains={this.submitStrains}
                    />
                }
            </div>
        )
    }
}

/**
 * Component that renders the INNUENDO projects selector.
 */
class InnuendoProjectSelector extends React.Component {

    render() {
        return (
            <div>
                <div className={styles.innuendoLoginDiv}>
                    <FormControl className={styles.innuendoInputForm}>
                        <InputLabel
                            htmlFor="select-multiple-checkbox">Projects</InputLabel>
                        <Select
                            multiple
                            value={this.props.selectedProjects}
                            onChange={this.props.handleChangeProjects}
                            input={<Input id="select-multiple-checkbox"/>}
                            renderValue={selected => this.props.selectedProjects.join(', ')}
                        >
                            {
                                this.props.projects.map(name => (
                                    <MenuItem key={name} value={name}>
                                        <Checkbox
                                            checked={this.props.selectedProjects.indexOf(name) > -1}/>
                                        <ListItemText primary={name}/>
                                    </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                </div>
                <div className={styles.innuendoFormDiv}>
                    <Button className={styles.innuendoInputForm}
                            variant="contained" color="primary"
                            onClick={this.props.getProjectStrains}>
                        Submit
                    </Button>
                </div>
            </div>
        )
    }
}

/**
 * Component that renders the Filters section.
 */
class InnuendoFilters extends React.Component {

    render() {
        return (
            <div>
                <Divider className={styles.innuendoDivider}/>
                <Typography
                    className={styles.innuendoTitle}>Filters:</Typography>
                <FormControl className={styles.innuendoInputForm}>
                    <InputLabel
                        htmlFor="select-multiple-checkbox">Strains</InputLabel>
                    <Select
                        multiple
                        label="Strains"
                        value={this.props.selectedStrains}
                        onChange={this.props.handleChangeStrains}
                        input={<Input
                            id="select-multiple-checkbox"/>}
                        renderValue={selected => this.props.selectedStrains.join(', ')}
                    >
                        {
                            this.props.strains.map(name => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox
                                        checked={this.props.selectedStrains.indexOf(name) > -1}/>
                                    <ListItemText primary={name}/>
                                </MenuItem>
                            ))
                        }
                    </Select>

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
                </FormControl>

                <div className={styles.innuendoFormDiv}>
                    <Button className={styles.innuendoInputForm}
                            variant="contained" color="primary"
                            onClick={this.props.submitStrains}>
                        Submit
                    </Button>
                </div>

            </div>
        )
    }
}
