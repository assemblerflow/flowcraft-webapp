import axios from "axios";

// Other imports
import {address} from "../../../config.json"


/*
* Login to innuendo platform externally.
* Try to login according to the provided username and password
*/
export const tryLogin = (username, password) => {
    return axios({
        method: "post",
        url: address + `app/api/v1.0/user/external/login/`,
        data: {
            username: username,
            password: password
        }
    })
};

/*
Get global Innuendo platform statistics
 */
export const getStatistics = () => {
    return axios({
        method: "get",
        url: address + `app/api/v1.0/strains/statistics/`,
    })
};


/*
Get all the available species at the INNUENDO Platform
*/
export const getInnuendoSpecies = () => {
    return axios({
        method: "get",
        url: address + "app/api/v1.0/species/",

    })
};

/*
Get all the available projects. Those are then mapped to their specific
species.
*/
export const getInnuendoProjects = () => {

    return axios({
        method: "get",
        url: address + "app/api/v1.0/projects/all/",

    })
};


/*
Get all strains associated with a given project. The response is then
parsed to get min and max date for filtering.
*/
export const getInnuendoProjectStrains = (projectIds) => {

    return axios({
        method: "get",
        url: address + "app/api/v1.0/reports/project/info",
        params: {
            project_id: projectIds.join(",")
        }

    })
};

/*
Request to get all reports for a set of strains in a given time interval.
 */
export const getInnuendoReportsByFilter = async (filter) => {
    return await axios({
        method: "post",
        url: address + "app/api/v1.0/reports/project/filter/",
        data: filter

    });
};

/*
Get all metadata associated with a set of strains.
 */
export const getInnuendoStrainsMetadata = async (filter) => {
    return await axios({
        method: "post",
        url: address + "app/api/v1.0/strains/name/",
        data: filter

    });
};

/*
Get innuendo saved reports
 */
export const getSavedReports = async (userId) => {

    return await axios({
        method: 'get',
        url: address + 'app/api/v1.0/reports/saved/',
        params: {
            user_id: userId
        }
    })
};
