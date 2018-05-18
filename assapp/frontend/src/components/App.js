import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Header from "./Header";
import Main from "./Main";

// /**
//  * Function that handles the conditional rendering of the Wrapper component
//  * @param {Object} props - Object with the props provided to WelcomeDag in the
//  * Wrapper component render function.
//  * @returns {*} - html element that will be rendered by Wrapper component
//  * @constructor
//  */
// const WelcomeDag = (props) => {
//     if (props.json) {
//         return <TreeDag data={props.json}
//                         size={[window.innerWidth, window.innerHeight / 2]}/>
//     } else {
//         return <h1>Please wait while we prepare your DAG tree...</h1>
//     }
// };
//
//
// class Wrapper extends React.Component {
//
//     constructor(props) {
//         super(props);
//         this.state = {
//             json: props.json
//         }
//     }
//
//     /**
//      * Function that makes a get to the database to retrieve json_entry that
//      * stores DAG related information. This information will after the request
//      * be stored in this.state.json
//      */
//     updateJson(){
//
//         const status_id = window.location.pathname.replace("/status_id", "");
//         axios.get(`inspect/api/status?status_id=${status_id}`)
//             .then((response) => {
//                 this.setState({json: response.data})
//             })
//
//     }
//
//     componentDidMount() {
//         // forces getting this.state.json from db asap
//         this.updateJson();
//         // then every x seconds a get request will be made
//         this.hook = setInterval(
//             () => this.updateJson(),
//             5000
//         );
//     }
//
//     componentWillUnmount() {
//         clearInterval(this.hook)
//     }
//
//     render () {
//         return (
//             <div>
//                 <WelcomeDag json={this.state.json}/>
//             </div>
//         );
//     }
//
// }
//
// const App = () => (
//     <Wrapper json={""}/>
// );
//
// const wrapper = document.getElementById("app");
// wrapper ? ReactDOM.render(<App />, wrapper) : null;

class App extends React.Component {
    render () {
        return(
            <div>
                <Header />
                <Main />
            </div>
        )
    };
}

ReactDOM.render((
    <BrowserRouter>
        <App />
    </BrowserRouter>
), document.getElementById("app"));
