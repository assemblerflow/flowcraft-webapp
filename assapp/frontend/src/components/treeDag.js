import React, {Component} from "react";
import "../styles/treeDag.css"

// D3 related imports
import {hierarchy, tree} from "d3-hierarchy";
import {select, selectAll} from "d3-selection";
const d3 = require("d3");
import {event, max, zoom} from "d3";
import { legendColor } from 'd3-svg-legend';

// Color imports
import green from "@material-ui/core/colors/green";
import blue from "@material-ui/core/colors/blue";
import grey from "@material-ui/core/colors/grey";
import red from "@material-ui/core/colors/red";


// Set the dimensions and margins of the diagram
const margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = window.innerWidth,
    height = 500;

const div = select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

/**
 * This function creates a tooltip with the node/process information
 * on mouse over in the respective node
 *
 * @param {Object} d - stores information of the node data (containing
 * name, input, output, etc) and parent info for this node
 */
const mouseover = (d) => {
    //console.log(d)
    div.transition()
        .duration(200)
        .style("opacity", .9);
    div.html(`<b>pid:</b> ${d.data.process.pid},<br>
            <b>lane:</b> ${d.data.process.lane},<br>
            <b>input:</b> ${d.data.process.input},<br>
            <b>output:</b> ${d.data.process.output},<br>
            <b>directives:</b><br>
            ${d.data.process.directives}
            `)
    //             .style("left", (d3.event.pageX) + "px")
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px")
        .style("text-align", "left")
};

/**
 * Function that hides the tooltip
 * @param {Object} d - stores information of the node data (containing
 * name, input, output, etc) and parent info for this node
 */
const mouseout = (d) => {
    div.transition()
        .duration(500)
        .style("opacity", 0)
};


class TreeDag extends Component {

    constructor(props) {
        super(props);

        this.i = 0;

        this.root = hierarchy(props.data, (d) => { return d.children });
        // Assigns parent, children, height, depth
        this.root.x0 = height / 2;
        this.root.y0 = 0;

        // declares a tree layout and assigns the size
        const treemap = tree().size([height, width]);

        // Assigns the x and y position for the nodes
        const treeData = treemap(this.root);


        // Compute the new tree layout.
        this.nodes = treeData.descendants().filter( (d) => {
            return d.depth
        });
        this.links = treeData.descendants().slice(1).filter( (d) => {
            return d.depth !== 1
        });


    }

    // this is required for the initial DAG rendering. It will create the d3 instance as well as update the node colors
    componentDidMount() {
        this.createDagViz();
        this.updateDagViz()
    }

    // this will be triggered every time the props of this component are updated. It will update node colors
    componentDidUpdate() {
        this.updateDagViz()
    }

    componentWillUnmount() {
        // TODO Add unmount function
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
        const svg = select(this.node)
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .call(zoom().on("zoom", function () {
                svg.attr("transform", event.transform)
            }))
            .on("dblclick.zoom", null)
            .append("g")
            .attr("transform", "translate("
                + margin.left + "," + margin.top + ")"
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
            const nodeGraph = svg.selectAll('g.node')
                .data(this.nodes, (d) => { return d.id || (d.id = ++this.i) });

            // Enter any new modes at the parent's previous position.
            const nodeEnter = nodeGraph.enter().append('g')
                .attr('class', 'node')
                .attr("transform", (d) => {
                    return "translate(" + source.y0 + "," + source.x0 + ")"
                })
                // .on('click', click)
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);

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
                .attr('r', 14)
                .style("fill", (d) => {
                    return grey[300]
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
            const link = svg.selectAll('path.link')
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
            let checkAllBarriers = []

            Object.keys(this.props.processData).forEach((key) => {

                if (key.includes(laneString)) {
                    checkAllBarriers.push(this.props.processData[key].barrier)
                }
            });

            // if some process within the main process is running them set status to running, otherwise set the
            // status if all processes are waiting or complete
            return (checkAllBarriers.includes("R")) ? "R" :
                (checkAllBarriers.includes("W") && checkAllBarriers.includes("C")) ? "Q" :
                    checkAllBarriers.reduce( (a, b) => {
                    return (a === b) ? a : false;
                });

        }

    }

    updateDagViz() {

        // first fetches d3 svg associated variables that are needed to update nodes
        const svg = select(this.node);

        const nodeGraph = svg.selectAll('g.node').data(this.nodes, (d) => { return d.id || (d.id = ++this.i) })

        const nodeEnter = nodeGraph.enter().append('g');

        const nodeUpdate = nodeEnter.merge(nodeGraph);

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
            .style("fill", (d) => {
                const nodeStatus = this.checkBarrier(d.data.name);
                return (nodeStatus === "C") ? green[500] :
                    (nodeStatus === "R") ? blue[300] :
                        (nodeStatus === "Q") ? blue[100] : grey[300]
            })

    }

    render() {
        return <svg ref={node => this.node = node}></svg>
    }

}

export default TreeDag