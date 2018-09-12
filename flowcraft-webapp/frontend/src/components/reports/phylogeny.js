import React from "react";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

import Phylocanvas from 'phylocanvas';

import contextMenu from 'phylocanvas-plugin-context-menu';
Phylocanvas.plugin(contextMenu);

export class Phylogeny extends React.Component{
    render(){
        return(
            <div>
                <ExpansionPanel defaultExpanded >
                    <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant={"headline"}>Phylogenetic tree</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <PhylogeneticTree />
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </div>
        )
    }
}


class PhylogeneticTree extends React.Component {

    componentDidMount = () => {

        const tree = Phylocanvas.createTree(this.node, {});
        tree.load('', () => console.log('tree loaded'))
        tree.setTreeType("rectangular")
        console.log(tree)

    };

    render(){

        return(
            <div style={{width: "100%"}}>
                <div ref={node => this.node = node}></div>
            </div>
        )
    }
}