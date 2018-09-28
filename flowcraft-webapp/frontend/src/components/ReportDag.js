import React, {Component} from "react";

// D3 related imports
import {hierarchy, tree} from "d3-hierarchy";
import {select, selectAll} from "d3-selection";
const d3 = require("d3");
import {event, max, zoom, Transform} from "d3";

// import material UI buttons and icons
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Icon from "@material-ui/core/Icon";

import {themes} from "./reports/themes";
import {theme} from "../../config.json";

import {getParentLanes} from "./reports/utils";

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

/**
 * This div must be defined before the component, otherwise tooltips will not appear
 * @type {Selection<BaseType, Datum, PElement extends BaseType, PDatum>}
 */
const div = select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    // set z-index to 2000 because of dialog z-index being much higher than body
    .style("z-index", 2000);

export class TreeDag extends Component {

    constructor(props) {
        super(props);

        // Set the dimensions and margins of the diagram
        this.margin = {top: 20, right: 20, bottom: 20, left: 20};
        this.width = window.innerWidth;
        this.height = window.innerHeight * 0.7;

        this.i = 0;

        this.root = hierarchy(props.nfMetadata[0].dag, (d) => { return d.children });
        // Assigns parent, children, height, depth
        this.root.x0 = this.height / 2;
        this.root.y0 = 0;

        // declares a tree layout and assigns the size
        const treemap = tree().size([this.height, this.width]);

        // Assigns the x and y position for the nodes
        const treeData = treemap(this.root);


        // Compute the new tree layout.
        this.nodes = treeData.descendants().filter( (d) => {
            return d.depth
        });
        this.links = treeData.descendants().slice(1).filter( (d) => {
            return d.depth !== 1
        });

        /**
         * This variable sets the size of the nodes in the dag
         * @type {number}
         */
        this.radius = 14;

        // binds this function so that it can be used by other on component rendering (in this case on a button click)
        this.reDraw = this.reDraw.bind(this);

        this.state = {
            // treeDag: props.treeDag,
            update: false,
            // processData: props.processData,
            error: false
        }
    }

    // this is required for the initial DAG rendering. It will create the d3 instance as well as update the node colors
    componentDidMount() {
        try {
            this.createDagViz();
            // this.updateDagViz()
        } catch (e) {
            console.log(e);
            this.setState({"error": true})
        }
    }

    /**
     * This function creates a tooltip with the node/process information
     * on mouse over in the respective node
     *
     * @param {String} name - stores the name of the process being hovered
     * @param {Object} procObj - stores the current instance of failed, running, completed and retried samples for that
     * process.
     */
    mouseover() {

        div.transition()
            .duration(200)
            .style("opacity", .95);

        div.html("test") // TODO
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px")
            .style("text-align", "left")
    }

    /**
     * Function that hides the tooltip
     * @param {Object} d - stores information of the node data (containing
     * name, input, output, etc) and parent info for this node
     */
    mouseout(d) {
        div.transition()
            .duration(500)
            .style("opacity", 0)
    }

    checkProcess(name, parentLanes, queryId) {
        // skips first node that is root
        if (name !== "root") {

            // fetch lane number
            const laneNumber = name.split("_").slice(
                name.split("_").length -2,
                -1
            ).join();

            const procId = name.split("_").slice(
                -1
            ).join();

            return (this.props.query === name) ?
                themes[theme].palette.error.main :
                (parentLanes.includes(parseInt(laneNumber))
                    && parseInt(procId) < parseInt(queryId)) ?
                    themes[theme].palette.warning.main:
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

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        this.svg = select(this.node)
            .attr("width", this.width + this.margin.right + this.margin.left)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .call(zoom().on("zoom", () => {
                this.svg.attr("transform", event.transform)
            }))
            .on("dblclick.zoom", null)
            .append("g")
            .attr("transform", "translate("
                + this.margin.left + "," + this.margin.top + ")"
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
                    .data(this.nodes, (d) => { return d.id || (d.id = ++this.i) });

            // Enter any new modes at the parent's previous position.
            const nodeEnter = nodeGraph.enter().append('g')
                .attr('class', 'node')
                .attr("transform", (d) => {
                    return "translate(" + source.y0 + "," + source.x0 + ")"
                })
                // .on("mouseover", (d) => {
                //     this.mouseover()
                // })
                // .on("mouseout", this.mouseout);

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
            this.nodes.forEach( (d) => { d.y = d.depth * maxTextWidth } );

            // UPDATE
            const nodeUpdate = nodeEnter.merge(nodeGraph);

            // Transition to the proper position for the node
            nodeUpdate.transition()
            // .duration(duration)
                .attr("transform", (d) => {
                    return "translate(" + d.y + "," + d.x + ")"
                });

            // get lane number to get all parent lanes
            const laneNumber = this.props.query.split("_").slice(
                this.props.query.split("_").length -2,
                -1
            ).join();

            const parentLanes = getParentLanes(laneNumber,
                this.props.nfMetadata[0].forks);

            const queryId = this.props.query.split("_").slice(
                -1
            ).join();

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
                .attr('r', this.radius)
                .style("fill", (d) => {
                    return this.checkProcess(d.data.name, parentLanes, queryId)
                })
                .attr('cursor', 'pointer');

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
                .data(this.links, (d) => { return d.id });

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
            this.nodes.forEach( (d) => {
                d.x0 = d.x;
                d.y0 = d.y
            })

        };

        update(this.root)

    }

    render() {
        // if (this.state.update) {this.updateDagViz()}
        return(
            <div>
                {
                    this.state.error ?
                        <TreeDagError/> :
                        <div>
                            <div>
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

