import React, {Component} from "react";

import Select from 'react-select';

// D3 related imports
import {hierarchy, tree} from "d3-hierarchy";
import {select, selectAll} from "d3-selection";
const d3 = require("d3");
import {event, max, zoom, Transform} from "d3";

// import material UI buttons and icons
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Icon from "@material-ui/core/Icon";
import Grid from "@material-ui/core/Grid/Grid";

import {themes} from "./reports/themes";
import {theme} from "../../config.json";

class PipelineSelection extends React.Component{

    render(){

        const style = {
            container: {
                maxWidth: "300px",
                minWidth: "200px",
                marginBottom: "15px"
            },
            dropdownValue: {
                lineHeight: "33px",
                fontWeight: "bold"
            }
        };

        const options = this.props.nfMetadata.map((v) => {
            return {value: v.runName, label: <Typography style={style.dropdownValue}>{v.runName}</Typography>}
        });

        return(
            <div style={style.container}>
                <Typography>Select pipeline: </Typography>
                <Select value={{value: this.props.selectedPipelineVal, label: <Typography>{this.props.selectedPipelineVal}</Typography>}}
                        clearable={false}
                        onChange={this.props.handlePipelineChange}
                        options={options}/>
            </div>
        )
    }

}

/**
 * Legend for DAG
 */
export class DagLegendReport extends React.Component{

    constructor() {
        super();

        this.legendObj = {
            "Selected process": themes[theme].palette.error.main,
            "Other": themes[theme].palette.primary.main,
        }
    }

    render() {
        return(
            <div>
                <Grid container justify={"center"} spacing={24}>
                    {Object.keys(this.legendObj).map( (k) => {
                        return (
                            <Grid item key={k}>
                                <Grid container>
                                    <Grid item>
                                        <Icon size={30} style={{color: this.legendObj[k]}}>lens
                                        </Icon>
                                    </Grid>
                                    <Grid item>
                                        <Typography style={{lineHeight: "25px"}}>{k}</Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        )
                    })}
                </Grid>
            </div>
        )
    }
}

/**
 * This component is shown whenever the TreeDAG component cannot be rendered.
 * It is linked to the ``error`` state of that component.
 */
class TreeDagError extends React.Component {
    render(){
        return(
            <div style={{textAlign: "Center", marginBottom: "20px"}}>
                <Typography>
                    Sorry, there was a problem rendering the DAG  <span style={{fontWeight: "bold"}}>¯\_(ツ)_/¯</span>
                </Typography>
            </div>
        )
    }
}

export class TreeDag extends Component {

    constructor(props) {
        super(props);

        this.state = {
            update: false,
            error: false,
            // sets as default selected process the first element in
            // nfMetadata array
            selectedPipeline: props.nfMetadata[0],
            selectedPipelineVal: props.nfMetadata[0].runName,
        };

        // binds this function so that it can be used by other on component
        // rendering (in this case on a button click)
        this.reDraw = this.reDraw.bind(this);

    }

    // this is required for the initial DAG rendering. It will create the d3
    // instance as well as update the node colors
    componentDidMount() {
        try {
            this.createDagViz();
        } catch (e) {
            console.log(e);
            this.setState({"error": true})
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        // prevents component from updating if nexState selectedPipeline is the
        // same as the current state of the component
        if (this.state.selectedPipeline === nextState.selectedPipeline) {
            return false
        } else {
            // returns true so that the component should update
            return true
        }
    }

    componentDidUpdate() {
        try {
            // removes previous d3 instance and creates a new one
            select(this.node).selectAll("g").remove();
            this.createDagViz();
        } catch (e) {
            console.log(e);
            this.setState({"error": true})
        }
    }

    triggerPipelineSelection(id) {
        return this.props.nfMetadata.filter( pipeline =>
            pipeline.runName === id
        );
    }

    /**
     * Function that changes the state of changing the selected pipeline from
     * the default value of 0
     * @param value
     */
    handlePipelineChange = (value) => {
        if (value){
            this.setState({
                selectedPipeline: this.triggerPipelineSelection(value.value)[0],
                selectedPipelineVal: this.triggerPipelineSelection(value.value)[0].runName,
            })
        }
    };

    /**
     * Function that checks the pid of the process that is being queried with
     * each of the processes in the dag that is being iterated to add colors
     * @param {String} name - the name of the node being colored
     * @param {String} query - the name of the process being queried
     * red for the current selected query
     */
    mapProcessToComponent(name, query) {
        if (name.split("_").slice(-2).join("_") === query.split("_").slice(-2).join("_")) {
            // returns true if a red node is expected (the one being queried)
            return true
        } else {
            // returns false if the node isn't the one in the query of the
            // component
            return false
        }
    }

    /**
     * Function that will highlight the nodes that is currently being selected
     * and its respective children
     * @param {String} name - The name of the process
     * @returns {*} - the color to put in the nodes.
     */
    checkProcess(name) {
        // skips first node that is root
        if (name !== "root") {
            const mapResult = this.mapProcessToComponent(name,
                this.props.query);

            return (mapResult) ? themes[theme].palette.error.main :
                themes[theme].palette.primary.main
        }
    }

    /**
     * Function to force zoom and pan to default levels
     * Default levels are stored within d3.zoomIdentity
     */
    reDraw() {
        // force current visualization to reset to right zoom (default zoom)
        this.svg.attr("transform", d3.zoomIdentity);
        // force zoom property and pan to its default value as well, otherwise it will store the previous zoom level and
        // panning.
        select(this.node).property("__zoom", d3.zoomIdentity);
    }

    /**
     * Let d3 live! Function that enables d3 through react. It just has to make
     * sure that this.node is passed to svg element of d3, then everything else
     * is handled by d3 itself. This approach enables transitions from d3 while
     * integration it with react would lose some animations and transitions
     */
    createDagViz() {

        // Set the dimensions and margins of the diagram
        const margin = {top: 20, right: 20, bottom: 20, left: 20};
        const width = window.innerWidth;
        const height = window.innerHeight * 0.65;

        let i = 0;

        let root = hierarchy(this.state.selectedPipeline.dag, (d) => { return d.children });
        // Assigns parent, children, height, depth
        root.x0 = height / 2;
        root.y0 = 0;

        // declares a tree layout and assigns the size
        const treemap = tree().size([height, width]);

        // Assigns the x and y position for the nodes
        const treeData = treemap(root);

        // Compute the new tree layout.
        const nodes = treeData.descendants().filter( (d) => {
            return d.depth
        });
        const links = treeData.descendants().slice(1).filter( (d) => {
            return d.depth !== 1
        });

        /**
         * This variable sets the size of the nodes in the dag
         * @type {number}
         */
        const radius = 14;

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        this.svg = select(this.node)
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .call(zoom().on("zoom", () => {
                this.svg.attr("transform", event.transform)
            }))
            .on("dblclick.zoom", null)
            .append("g")
            .attr("transform", "translate("
                + margin.left + "," + margin.top + ")"
            );

        /**
         * Function that updates the graph on load and on node clicks
         *
         * @param {Object} source - Stores the full tree information, including
         * the root node, which will be deleted by filter on nodes and links.
         */
        const update = (source) => {

            /**
             * Creates a curved (diagonal) path from parent to the child nodes
             *
             * @param {Object} s
             * @param {Object} d
             * @returns {string}
             */
            const diagonal = (s, d) => {
                const path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
                return path
            };

            // ****************** Nodes section ***************************

            // Update the nodes...
            const nodeGraph = this.svg.selectAll('g.node')
                    .data(nodes, (d) => { return d.id || (d.id = ++i) });

            // Enter any new modes at the parent's previous position.
            const nodeEnter = nodeGraph.enter().append('g')
                .attr('class', 'node')
                .attr("transform", (d) => {
                    return "translate(" + source.y0 + "," + source.x0 + ")"
                });

            // Add Circle for the nodes
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6);

            // Add labels for the nodes
            nodeEnter.append('text')
                .attr("y", "-20")
                .attr("text-anchor", "middle")
                .text( (d) => { return d.data.name } );

            // gets labels variable
            const labels = selectAll("text");
            // returns the label with max width value
            const maxTextWidth = max(labels.nodes(),
                n => n.getComputedTextLength());

            // Normalize for fixed-depth, according to max_width
            nodes.forEach( (d) => { d.y = d.depth * maxTextWidth } );

            // UPDATE
            const nodeUpdate = nodeEnter.merge(nodeGraph);

            // Transition to the proper position for the node
            nodeUpdate.transition()
            // .duration(duration)
                .attr("transform", (d) => {
                    return "translate(" + d.y + "," + d.x + ")"
                });

            // Update the node attributes and style
            nodeUpdate.select("circle.node")
                .attr("r", radius)
                .style("fill", (d) => {
                    return this.checkProcess(d.data.name)
                })
                .attr("cursor", "pointer");

            // Remove any exiting nodes
            const nodeExit = nodeGraph.exit().transition()
            // .duration(duration)
                .attr("transform", (d) => {
                    return "translate(" + source.y + "," + source.x + ")"
                })
                .remove();

            // On exit reduce the node circles size to 0
            nodeExit.select('circle')
                .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

            // ****************** links section ***************************

            // Update the links...
            const link = this.svg.selectAll('path.link')
                .data(links, (d) => { return d.id });

            // Enter any new links at the parent's previous position.
            const linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr('d', (d) => {
                    const o = {x: source.x0, y: source.y0};
                    return diagonal(o, o)
                });

            // merge links
            const linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
            // .duration(duration)
                .attr('d', (d) => { return diagonal(d, d.parent) });

            // Remove any existing links
            link.exit().transition()
            // .duration(duration)
                .attr('d', (d) => {
                    const o = {x: source.x, y: source.y};
                    return diagonal(o, o)
                })
                .remove();

            // Store the old positions for transition.
            nodes.forEach( (d) => {
                d.x0 = d.x;
                d.y0 = d.y
            })

        };

        update(root)

    }

    render() {

        const style = {
            dropContainer: {
                float: "right",
            },
            buttonContainer: {
                float: "left",
            },
        };

        console.log("selected pipeline", this.state.selectedPipeline)
        return(
            <div>
                {
                    this.state.error ?
                        <TreeDagError/> :
                        <div>
                            <div style={style.dropContainer}>
                                <PipelineSelection
                                    selectedPipelineVal={this.state.selectedPipelineVal}
                                    handlePipelineChange={this.handlePipelineChange}
                                    nfMetadata={this.props.nfMetadata}/>
                            </div>
                            <div style={style.buttonContainer}>
                                <Button variant={"raised"}
                                        color={"primary"}
                                        size={"small"}
                                        onClick={this.reDraw}>
                                    <Icon size={30}>autorenew
                                    </Icon>
                                </Button>
                            </div>
                            <svg style={{maxWidth: "100%"}} ref={node => this.node = node}></svg>
                        </div>
                }
            </div>
        )
    }

}

