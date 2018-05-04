import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import TreeDag from "./treeDag";

/**
 * Function that handles the conditional rendering of the Wrapper component
 * @param {Object} props - Object with the props provided to WelcomeDag in the
 * Wrapper component render function.
 * @returns {*} - html element that will be rendered by Wrapper component
 * @constructor
 */
const WelcomeDag = (props) => {
    if (props.json) {
        return <TreeDag data={props.json}
                        size={[window.innerWidth, window.innerHeight / 2]}/>
    } else {
        return <h1>Please wait while we prepare your DAG tree...</h1>
    }
};


class Wrapper extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            json: props.json
        }
    }

    /**
     * Function that makes a get to the database to retrieve json_entry that
     * stores DAG related information. This information will after the request
     * be stored in this.state.json
     */
    updateJson(){

        const status_id = window.location.pathname.replace("/status_id", "");
        axios.get(`inspect/api/status?status_id=${status_id}`)
            .then((response) => {
                this.setState({json: response.data})
            })

    }

    componentDidMount() {
        // forces getting this.state.json from db asap
        this.updateJson();
        // then every x seconds a get request will be made
        // TODO make a websocket instead of this
        this.hook = setInterval(
            () => this.updateJson(),
            5000
        );
    }

    componentWillUnmount() {
        clearInterval(this.hook)
    }

    render () {
        return (
            <div>
                <WelcomeDag json={this.state.json}/>
                {/*TODO add more things here...*/}
            </div>
        );
    }

}

const App = () => (
    <Wrapper json={""}/>
);

const wrapper = document.getElementById("app");
wrapper ? ReactDOM.render(<App />, wrapper) : null;