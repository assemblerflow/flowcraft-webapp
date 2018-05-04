import React, { Component } from "react";
import "./treeDag.css"
import {tree, hierarchy} from "d3-hierarchy";
import {select, selectAll} from "d3-selection";
import {max, event, zoom} from "d3";

class TreeDag extends Component {

    constructor(props) {
        super(props)
    }

    // this is required for the initial DAG rendering
    componentDidMount() {
        this.createDagViz()
    }

    // tjis will make updates to the DAG
    componentWillReceiveProps() {
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

        const mountNode = this.node;

        /**
         * This function creates a tooltip with the node/process information
         * on mouse over in the respective node
         *
         * @param {Object} d - stores information of the node data (containing
         * name, input, output, etc) and parent info for this node
         */
        const mouseover = (d) => {
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

        // Set the dimensions and margins of the diagram
        const margin = {top: 20, right: 20, bottom: 20, left: 20},
            width = this.props.size[0],
            height = this.props.size[1];

        const div = select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        let i = 0;
            // duration = 750;

        let root;
        // Assigns parent, children, height, depth
        root = hierarchy(this.props.data, (d) => { return d.children });
        root.x0 = height / 2;
        root.y0 = 0;

        // declares a tree layout and assigns the size
        const treemap = tree().size([height, width]);

        // Assigns the x and y position for the nodes
        const treeData = treemap(root);

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        const svg = select(mountNode)
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
            const click = (d) => {
                if (d.children) {
                    d._children = d.children;
                    d.children = null
                } else {
                    d.children = d._children;
                    d._children = null
                }
                update(d)
            };

            // Compute the new tree layout.
            let nodes = treeData.descendants(),
                links = treeData.descendants().slice(1);

            // hide root node
            nodes = nodes.filter( (d) => {
                return d.depth
            });

            // hide links to root
            links = links.filter( (d) => {
                return d.depth !== 1
            });

            // ****************** Nodes section ***************************

            // Update the nodes...
            const node = svg.selectAll('g.node')
                .data(nodes, (d) => { return d.id || (d.id = ++i) });

            // Enter any new modes at the parent's previous position.
            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", (d) => {
                    return "translate(" + source.y0 + "," + source.x0 + ")"
                })
                .on('click', click)
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)

            // Add Circle for the nodes
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6);
            // .style("fill", (d) => {
            //   return d._children ? "lightsteelblue" : "#fff"
            // })

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
            nodes.forEach( (d) => { d.y = d.depth * maxTextWidth} );

            // UPDATE
            const nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
            nodeUpdate.transition()
            // .duration(duration)
                .attr("transform", (d) => {
                    return "translate(" + d.y + "," + d.x + ")"
                });

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
                .attr('r', 10)
                .style("fill", (d) => {
                    return d._children ? "#ffad6b" : "lightsteelblue"
                })
                .attr('cursor', 'pointer');


            // Remove any exiting nodes
            const nodeExit = node.exit().transition()
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

    updateDagViz() {
        console.log("yey update")
    }

    render() {
        return <svg ref={node => this.node = node}></svg>
    }

}

export default TreeDag