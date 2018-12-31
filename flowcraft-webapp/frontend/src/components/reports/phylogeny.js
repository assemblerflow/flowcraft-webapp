import React from "react";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import Switch from "@material-ui/core/Switch";
import Grid from "@material-ui/core/Grid";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

import randomColor from "randomcolor";
import Select from "react-select";
import Phylocanvas from 'phylocanvas';

import contextMenu from "phylocanvas-plugin-context-menu";
import metadata from "phylocanvas-plugin-metadata";
import scalebar from 'phylocanvas-plugin-scalebar';

Phylocanvas.plugin(contextMenu);
Phylocanvas.plugin(metadata);
Phylocanvas.plugin(scalebar);

export class Phylogeny extends React.Component{

    state = {
        process: 0,
        tree: 0,
        treeType: 0,
        zoom: false,
    };

    handleSelectChange = (selectType, val) => {

        const newState = {};
        newState[selectType] = val.value;

        this.setState(newState)

    };

    prepareMetadata = (rawMetadata) => {

        const metadata = new Map();

        for (const sampleMetadata of rawMetadata) {
            for (const currentMeta of sampleMetadata.reportJson.metadata) {

                const sample = currentMeta.sample;

                if (!metadata.has(sample)) {
                    metadata.set(sample, {});

                }

                metadata.get(sample)[currentMeta.column] = {label: currentMeta.treeData};
            }
        }


        return metadata

    };

    render(){

        const treeData = this.props.treeData[this.state.process];
        const newick = treeData.reportJson.treeData[0].trees[this.state.tree];
        const metadata = this.prepareMetadata(this.props.treeMetadata);
        const treeLabels = treeData.reportJson.treeData[0].labels ?
            treeData.reportJson.treeData[0].labels[0] : null;

        // Select options
        // Options to change process name
        const processOptions = this.props.treeData.map((v, i) => {
            return {label: v.processName, value: i}
        });
        // Options to change tree index
        const treeOptions = treeData.reportJson.treeData[0].trees.map((v, i) => {
            return {label: `Tree ${i}`, value: i}
        });
        // Options to change
        const treeTypeOption = ["circular", "rectangular", "diagonal", "hierarchical", "radial"].map((v, i) => {
            return {label: v, value: i}
        });

        const style = {
            root: {
                width: "100%",
            },
            toolbar: {
                display: "flex"
            },
            select: {
                width: "170px",
                marginRight: "10px",
                zIndex: 100
            },
            zoom: {
                marginLeft: "auto",
            }
        };

        return(
            <div>
                <ExpansionPanel defaultExpanded >
                    <ExpansionPanelSummary  expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant={"headline"}>Phylogenetic tree</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <div style={style.root}>
                            <Grid container style={style.toolbar}>
                                <div style={style.select}>
                                    <Typography>Process:</Typography>
                                    <Select
                                        value={processOptions[this.state.process]}
                                        // menuPlacement={"top"}
                                        options={processOptions}
                                        onChange={(val) => {this.handleSelectChange("process", val)}}
                                        id={"processName"} />
                                </div>
                                <div style={style.select}>
                                    <Typography>Tree number:</Typography>
                                    <Select
                                        id={"trees"}
                                        // menuPlacement={"top"}
                                        closeMenuOnSelect={false}
                                        options={treeOptions}
                                        onChange={(val) => {this.handleSelectChange("tree", val)}}
                                        value={treeOptions[this.state.tree]}/>
                                </div>
                                <div style={style.select}>
                                    <Typography>Tree type:</Typography>
                                    <Select
                                        // menuPlacement={"top"}
                                        closeMenuOnSelect={false}
                                        options={treeTypeOption}
                                        onChange={(val) => {this.handleSelectChange("treeType", val)}}
                                        value={treeTypeOption[this.state.treeType]}/>
                                </div>
                                <FormControlLabel control={
                                    <Switch
                                        color={"primary"}
                                        onChange={() => {this.setState({zoom: !this.state.zoom})}}
                                        checked={this.state.zoom} />
                                } label={
                                    `Zoom is ${this.state.zoom ? "enabled" : "disabled"}`
                                } style={style.zoom}/>
                            </Grid>
                            <PhylogeneticTree
                                zoom={this.state.zoom}
                                treeType={treeTypeOption[this.state.treeType].label}
                                metadata={metadata}
                                labelsMap={treeLabels}
                                newickString={newick} />
                        </div>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </div>
        )
    }
}


class PhylogeneticTree extends React.Component {

    constructor(props){
        super(props);

        this.tree = null;
    }

    setTreeAttributes = () => {
        // Align tree labels to the right
        this.tree.alignLabels = true;
        // Set the tree type to rectangular
        this.tree.setTreeType(this.props.treeType);
        this.tree.disableZoom = !this.props.zoom;
        this.tree.setTextSize(15);
        this.tree.resizeToContainer();
        this.tree.draw()
    };

    componentDidMount = () => {

        const colors = randomColor({count: this.props.metadata.size});
        this.tree = Phylocanvas.createTree(this.node, {});

        let _ids = [];

        // Add metadata to tree
        this.tree.on("beforeFirstDraw", () => {
            for (const i in this.tree.leaves){

                // If the labelsMap prop is provided, then check if the current
                // leaf name is in that object. If yes, replace the old label
                // with the one in this object
                const leafLabel = this.tree.leaves[i].label;
                if (this.props.labelsMap && this.props.labelsMap.hasOwnProperty(leafLabel)) {
                    this.tree.leaves[i].label = this.props.labelsMap[leafLabel]
                }

                const taxon = this.tree.leaves[i].id.replace(/^_R_/, "");
                const metadata = this.props.metadata.get(taxon);

                // If there is no metadata, skip the rest
                if (!metadata) continue;

                for (const col of Object.keys(metadata)){

                    const label = metadata[col].label;
                    let colorIndex;

                    if (!_ids.includes(label)){
                        colorIndex = _ids.length;
                        _ids.push(label);
                    } else {
                        colorIndex = _ids.indexOf(label);
                    }

                    const c = colors[colorIndex];

                    this.tree.leaves[i].data[col] = {
                        label: label,
                        colour: c
                    }
                }
            }
        });

        // Load the newick tree from props
        this.tree.load(this.props.newickString);
        this.setTreeAttributes();
        // tree.load("((_R_CC0067_NODE_1_length_10197_cov_734.723715_pilon:0.0006430160208146113,(CC0061_k77_1_flag_1_multi_4641.2458_len_10267_pilon:0.00953411150529446,_R_CC0116_NODE_1_length_10196_cov_675.686135_pilon:0.004676216709352007)56:0.003523710625083518)100:0.5306604729360941,Spike_NODE_2_length_10199_cov_229.021834_pilon:0.29987078286758695,_R_Spike_NODE_1_length_10319_cov_2021.808436_pilon:0.2754770121464598);");

    };

    render(){

        if (this.node){
            this.setTreeAttributes();
        }

        return(
            <div style={{width: "100%", zIndex: "1"}}>
                <div style={{height: "700px"}} ref={node => this.node = node}></div>
            </div>
        )
    }
}