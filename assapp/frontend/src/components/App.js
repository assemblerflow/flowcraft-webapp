import React from "react";
import ReactDOM from "react-dom";
import axios from 'axios'

class Teste extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            json: props.json
        }
    }

    updateJson(){

        const status_id = window.location.pathname.replace("/status_id", "");
        axios.get(`inspect/api/status?status_id=${status_id}`)
            .then((response) => this.setState({json: response.data}))
    }

    componentDidMount() {
        this.hook = setInterval(
            () => this.updateJson(),
            5000
        );
    }

    componentWillUnmount() {
        clearInterval(this.hook)
    }

    render () {
        return(
            <div>
                {this.state.json}
            </div>
        )
    }

}

const App = () => (
    <Teste json={""}/>
);

const wrapper = document.getElementById("app");
wrapper ? ReactDOM.render(<App />, wrapper) : null;