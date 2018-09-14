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
        tree.load('(91-0104_NODE_1_length_10181_cov_326.328066_pilon:0.00029475898891859106,(((CC0031_k77_16_flag=0_multi=51073.1225_len=10085_pilon:0.00170958557080953832,91-0109_S4_L001_NODE_1_length_10219_cov_652.169197_pilon:0.00557430583452362457)98:0.00095486423779291669,((cc0007_S5_L001_NODE_1_length_10200_cov_119.548750_pilon:0.00075772273326911541,CC0150_NODE_1_length_10211_cov_3890.600750_pilon:0.00183728989850860083)99:0.00144146364117124070,(_R_Spike_NODE_3_length_10192_cov_76.475729_pilon:0.00356903514687932546,92-1094_NODE_1_length_10194_cov_816.402787_pilon:0.00358219455005535101)100:0.00398879348559155484)63:0.00044912699441025119)79:0.00279347721655816500,(_R_Poditivecontrol_S21_L001_k77_1_flag=1_multi=18520.4289_len=10237_pilon:0.04670407257072940743,(((_R_CC0009_NODE_1_length_10208_cov_2014.449018_pilon:0.00075880976715401592,(cc0010_S8_L001_NODE_1_length_10206_cov_450.733636_pilon:0.00346047860656655860,(_R_CC0011_NODE_1_length_10201_cov_607.818352_pilon:0.00772591549864747474,(_R_Spike_NODE_1_length_10319_cov_2021.782660_pilon:0.00410365277966747311,_R_91-0118_S8_L001_NODE_1_length_10178_cov_13.815371_pilon:0.00305659875508963730)79:0.00343242019390682879)45:0.00057953297086898818)48:0.00312524837879798968)100:0.39145381361534559161,(_R_91-0132_S6_L001_NODE_1_length_10218_cov_2041.289321_pilon:0.00000100000050002909,Spike_NODE_2_length_10199_cov_229.028848_pilon:0.00000100000050002909)100:0.45563636062332102394)100:0.23427023755058221099,(_R_CC0066_NODE_1_length_10174_cov_40.435419_pilon:0.00051478491518207412,(CC0061_k77_1_flag=1_multi=4641.2458_len=10267_pilon:0.00607271392667447108,(((91-0106_S12_L001_k77_18_flag=1_multi=13.3015_len=10127_pilon:0.00183590169778587078,_R_CC0116_NODE_1_length_10196_cov_675.724281_pilon:0.00217568748893862650)100:0.00281603516223942170,(_R_CC0067_NODE_1_length_10197_cov_734.754644_pilon:0.00038575807973464682,Spike_NODE_4_length_10182_cov_29.854132_pilon:0.00048566875724746360)79:0.00379486243895200926)71:0.00126808176018140557,(cc0030b_S21_NODE_1_length_10173_cov_54.897608_pilon:0.00000100000050002909,_R_cc0030a_S12_k77_1_flag=1_multi=2605.8572_len=10163_pilon:0.00038827628079737679)99:0.00531186452915028990)69:0.00206868502795854109)66:0.00542757983111424348)100:0.72212672597748650549)100:0.49290327802538463908)100:0.03008534893871310859)100:0.00911648034183995710,_R_91-0105_S2_L001_NODE_1_length_10206_cov_218.934841_pilon:0.00029389120506588773);', () => console.log('tree loaded'))
        tree.setTreeType("hierarchical")
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