import React from "react"

const styles = require("../styles/notfound.css");

export class NotFound extends React.Component {
    render () {
        return (
            <div className={styles.container}>
                <h2>FlowCraft Webapp</h2>
                <p>Sorry, this resource was not found or does not exist</p>
                <h3>¯\_(ツ)_/¯</h3>
            </div>
        )
    }
}