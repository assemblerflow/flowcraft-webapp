import React from "react";
import ReactDOM from "react-dom";


const App = () => (
    <h1> Hello World </h1>
);

const wrapper = document.getElementById("app");
wrapper ? ReactDOM.render(<App />, wrapper) : null;