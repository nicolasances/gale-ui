import { AbstractNode, AgenticFlow, BranchNode } from "@/api/model/AgenticFlow";
import { AGENTS_PER_ROW } from "../components/SubgroupTasksNode";


export class FlowGraphUtil {

    constructor(private flow: AgenticFlow, private sizes: Sizes) { }


    /**
     * Buidls the levels of the graph, calculating the number of groups and agents at each level, and estimating the Y position of each level, as well as the total width of the graph.
     * 
     * This method traverses the flow, only considering agents and graphs and ignoring branches (for the purpose of level calculation).
     */
    public buildLevels(): GraphLevels {

        const levels = this.buildLevelsFromNode([this.flow.root], 0);

        // Total width is the max width among levels
        let totalWidth = 0;
        for (const level of levels) {
            if (level.width > totalWidth) totalWidth = level.width;
        }

        return {
            levels: levels,
            totalWidth: totalWidth,
            centerX: totalWidth / 2,
        };

    }

    private buildLevelsFromNode(levelNodes: AbstractNode[], level: number): GraphLevel[] {

        const levelsFromNode: GraphLevel[] = [];

        let numGroups = 0;
        let numAgents = 0;
        let highestNode = 0;
        let totalWidth = 0;

        for (const node of levelNodes) {

            if (node.type === "agent") {
                numAgents += 1;
                totalWidth += this.sizes.agentNodeWidth;
                if (highestNode < this.sizes.agentNodeHeight) highestNode = this.sizes.agentNodeHeight;
            }
            else if (node.type === "group") {
                numGroups += 1;
                totalWidth += this.sizes.groupNodeWidth;

                let estimatedGroupHeight = (Math.floor(numAgents / this.sizes.agentsPerRowInGroup) + 1) * this.sizes.estimatedGroupRowHeight + this.sizes.agentNodeHeight

                if (highestNode < estimatedGroupHeight) highestNode = estimatedGroupHeight;
            }
        }

        // Add gaps between nodes to total width
        if (numAgents + numGroups > 1) totalWidth += (numAgents + numGroups - 1) * this.sizes.nodeXGap;

        levelsFromNode.push({
            level: level,
            width: totalWidth,
            height: highestNode,
            numGroups: numGroups,
            numAgents: numAgents,
        });

        // Determine the next level nodes
        const nextLevelNodes: AbstractNode[] = [];
        for (const node of levelNodes) {

            if (node.type === "agent" || node.type === "group") {
                if (node.next) {
                    nextLevelNodes.push(node.next);
                }
            }
            else if (node.type === "branch") {
                // Push each branch's node to the next level
                for (const branch of (node as BranchNode).branches) {
                    nextLevelNodes.push(branch.branch);
                }

                // What if the branch has a NEXT ??? 
                // TODO: Handle branch next nodes
            }
        }

        // Build the next levels recursively
        if (nextLevelNodes.length > 0) {

            const furtherLevels = this.buildLevelsFromNode(nextLevelNodes, level + 1);

            levelsFromNode.push(...furtherLevels);
        }

        return levelsFromNode;
    }


}

export interface GraphLevels {
    levels: GraphLevel[];
    totalWidth: number;
    centerX: number;        // Center X position of the graph (totalWidth / 2
}

export interface GraphLevel {
    level: number;
    width: number;      // Estimated width of the level
    height: number;     // Estimated height of the level
    numGroups: number;  // Number of groups in this level
    numAgents: number;  // Total number of agents in this level, EXCLUDING those inside groups
}

export interface Sizes {
    agentsPerRowInGroup: number;
    estimatedGroupRowHeight: number;
    agentNodeHeight: number;
    agentNodeWidth: number;
    groupNodeWidth: number;
    nodeXGap: number;
}