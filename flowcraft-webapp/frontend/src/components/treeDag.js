import React, {Component} from "react";
import "../styles/treeDag.css"

// D3 related imports
import {hierarchy, tree} from "d3-hierarchy";
import {select, selectAll} from "d3-selection";
const d3 = require("d3");
import {event, max, zoom, Transform} from "d3";
import { legendColor } from 'd3-svg-legend';

// Color imports
import green from "@material-ui/core/colors/green";
import blue from "@material-ui/core/colors/blue";
import grey from "@material-ui/core/colors/grey";
import red from "@material-ui/core/colors/red";
import orange from "@material-ui/core/colors/orange";

// import material UI buttons and icons
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Icon from "@material-ui/core/Icon";

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
    .style("opacity", 0);

class TreeDag extends Component {

    constructor(props) {
        super(props);

        // Set the dimensions and margins of the diagram
        this.margin = {top: 20, right: 20, bottom: 20, left: 20};
        this.width = window.innerWidth;
        this.height = 500;

        this.i = 0;

        this.root = hierarchy(props.data, (d) => { return d.children });
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

        /**
         * a color map to be used by d3 fill attribute for the pie chart
         * @type {{failed: *, finished: *, retry: *, submitted: *, waiting: *}}
         */
        this.color = {
            failed: red[300],
            finished: green[300],
            retry: orange[300],
            submitted: blue[300],
            waiting: grey[300]
        };

        // binds this function so that it can be used by other on component rendering (in this case on a button click)
        this.reDraw = this.reDraw.bind(this);

        this.state = {
            // treeDag: props.treeDag,
            update: false,
            processData: props.processData,
            error: false
        }
    }

    // this is required for the initial DAG rendering. It will create the d3 instance as well as update the node colors
    componentDidMount() {
        try {
            this.createDagViz();
            this.updateDagViz()
        } catch (e) {
            console.log(e);
            this.setState({"error": true})
        }

    }

    static getDerivedStateFromProps(props, state) {
        if (JSON.stringify(props.processData) !== JSON.stringify(state.processData)) {
            return {
                processData: props.processData,
                update: true
            }
        } else {
            return {
                update: false
            }
        }
    }

    /**
     * This function checks if the main process is complete
     * @param {String} name - The name of the node which contains the processes called through the pipeline string and
     * their pid.
     * @returns {*} - returns a string with the status of the main process.
     */
    checkBarrierComplete(name) {

        // skips first node that is root
        if (name !== "root") {

            const laneString = name.split("_").slice(-2).join("_");

            // a variable that is used to check if all barriers from a lane return the same flag
            let checkAllBarriers = [];

            // variable to check if there are any failed process within the current node
            let anyFail = false;

            Object.keys(this.props.processData).forEach((key) => {

                if (key.endsWith(laneString)) {
                    checkAllBarriers.push(this.props.processData[key].barrier);
                    // if any failed process is found them retrieve anyFail as true
                    anyFail = (this.props.processData[key].failed.length > 0)
                }
            });

            const labelProcess = checkAllBarriers.reduce((a, b) => {
                return (a === b) ? a : false;
            });


            // check if all processes are complete
            if (labelProcess === "C" && anyFail === false) {
                return "C"
            }

        }
    }


    /**
     * Function that is used to check if node name matches any process status changes available in
     * this.props.processData
     * @param {String} name - The name of the node which contains the processes called through the pipeline string and
     * their pid.
     * @returns {*} - returns a string with the status of the main process. If the main process has two subprocesses
     * that that has the same letter then the return value will be the one letter. E.g. array
     * checkAllBarrier = ["W","W"], then the returning value will be "W". However, if any "R" is found within the
     * checkAllBarrier array then the returning value will always be "R". If some processes are complete but others
     * are waiting this will return false which will not update node color. It also returns "Q" when there are
     * sub processes Waiting and some are already completed
     */
    checkBarrier(name) {

        // skips first node that is root
        if (name !== "root") {

            const laneString = name.split("_").slice(-2).join("_");

            // a variable that is used to check if all barriers from a lane return the same flag
            let checkAllBarriers = [];

            // check if the sub-process pid is present in the queried node main process
            Object.keys(this.props.processData).forEach((key) => {

                if (key.endsWith(laneString)) {
                    checkAllBarriers.push(this.props.processData[key])
                }
            });

            /**
             * Variable that stores the counts for each one of the types of running elements and is used to make the pie
             * chart percentages
             * @type {{failed: number, finished: number, retry: number, submitted: number}}
             */
            const mapReturns = {
                failed: 0,
                finished: 0,
                retry: 0,
                submitted: 0,
            };

            // counts the number of entries in each array and maps it to mapReturns object
            checkAllBarriers.map( (subProc) => {
                Object.keys(subProc).map( (type) => {
                    if (Object.keys(mapReturns).includes(type)) {
                        mapReturns[type] += subProc[type].length
                    }
                })
            });

            // check if all arrays are empty and if so add 1 to the node that is wiating
            const waitingNode = (mapReturns.failed === 0 &&
                mapReturns.finished === 0 &&
                mapReturns.retry === 0 &&
                mapReturns.submitted === 0) ? 1 : 0;

            return [
                {group: "failed", value: mapReturns.failed},
                {group: "finished", value: mapReturns.finished},
                {group: "retry", value: mapReturns.retry},
                {group: "submitted", value: mapReturns.submitted},
                {group: "waiting", value: waitingNode}
            ]

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
    mouseover(procObj, name) {

        div.transition()
            .duration(200)
            .style("opacity", .95);

        div.html(`<h2>Process ${name} status</h2>
            <!--<b>${procObj[4].group}:</b> ${(procObj[4].value === 1) ? "true": "false"},<br>-->
            <div style="font-size: 18px">
            <b>Running: <span class="tooltipProcSpan" style="color: ${this.color[procObj[3].group]}">${procObj[3].value}
            </span><br>
            Completed: <span class="tooltipProcSpan" style="color: ${this.color[procObj[1].group]}">${procObj[1].value}
            </span><br>
            Retry: <span class="tooltipProcSpan" style="color: ${this.color[procObj[2].group]}">${procObj[2].value}
            </span><br>
            Aborted: <span class="tooltipProcSpan" style="color: ${this.color[procObj[0].group]}">${procObj[0].value}
            </span></b></div>`)
        //             .style("left", (d3.event.pageX) + "px")
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

        // /**
        //  * Variable that defines the scale to be used by d3 legend
        //   */
        // const ordinal = d3.scaleOrdinal()
        //     .domain(["Waiting", "Queued", "Running", "Completed", "Aborted"])
        //     .range([grey[300], blue[100], blue[300], green[500], red[300]]);
        //
        // // appends the legend element to the svg
        // svg.append("g")
        //     .attr("class", "legendOrdinal")
        //     // subtracts 120 to the height in order to place the full legend
        //     .attr("transform", `translate(10,${height-120})`);
        //
        // // sets the color symbols in legend
        // const legendOrdinal = legendColor()
        //     .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
        //     .shapePadding(10)
        //     .cellFilter(function(d){ return d.label !== "e" })
        //     .scale(ordinal);
        //
        // // adds the legendOrdinal to the element with that will be used to place the legend itself
        // svg.select(".legendOrdinal")
        //     .call(legendOrdinal);

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

            /**
             * Function that toggles childrens on click
             *
             * @param {Object} d - stores information of the node data (containing
             * name, input, output, etc) and parent info for this node
             */
            // const click = (d) => {
            //     if (d.children) {
            //         d._children = d.children;
            //         d.children = null
            //     } else {
            //         d.children = d._children;
            //         d._children = null
            //     }
            //     update(d)
            // };

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
                // .on("click", (d) => {
                //     const processName = this.checkBarrier(d.data.name)
                //     this.mouseClickEvent(processName, d.data.name)
                // })
                .on("mouseover", (d) => {
                    const processName = this.checkBarrier(d.data.name);
                    this.mouseover(processName, d.data.name)
                })
                .on("mouseout", this.mouseout);

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

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
                .attr('r', this.radius)
                // .style("fill", (d) => {
                //     return grey[300]
                // })
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

    /**
     * Function that updates dag node colors without changing its shape or initial rendering
     */
    updateDagViz() {

        /**
         * The radius of the pie chart. This in fact is the radius of the of the actual node - 1, otherwise the border
         * would become to thin
         * @type {number}
         */
        const radius = this.radius - 1;

        /**
         * The d3 pie object
         */
        const pie = d3.pie()
            .sort(null)
            .value( (d) => { return d.value; });

        const arc = d3.arc()
            .outerRadius(radius)
            .innerRadius(0);

        // a variable to iterate through all nodes
        const nodeIter = this.svg.selectAll('g.node');

        /**
         * The actual code that fetches all the nodes and iterates through them to add the pie charts and the colors
         * of those pie charts
         */
        nodeIter
            .selectAll("path")
            // adds a class to remove previous nodes that will suffer update here
            .attr("class", "toRemove")
            // extremely important to update the graph, it exists previous node so that it can render the new one above
            .exit()
            .data( (d, i) => {
                // passes the main process name to be parsed and checked for its state in checkBarrier function
                return pie(this.checkBarrier(d.data.name));
            })
            .enter()
            .append("svg:path")
            .attr("d", arc)
            .attr("fill", (d, i) => {
                return this.color[d.data.group];
            });

        // removes previous path with pie chart
        this.svg.selectAll('path.toRemove').remove();

        // filters nodes that are fully completed and stores it in this variable
        const completedNodes = nodeIter.filter( (d) => {
            return this.checkBarrierComplete(d.data.name) === "C"
        });

        // remove pie charts from fully completed nodes
        completedNodes
            .selectAll("path")
            .remove();

        // adds a dark green circle
        completedNodes
            .selectAll("circle")
            .style("fill", green[800]);

    }

    render() {
        if (this.state.update) {this.updateDagViz()}
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

export default TreeDag