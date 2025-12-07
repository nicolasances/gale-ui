
export class AgenticFlow {

    // Root node of the flow
    root: AbstractNode;
    correlationId: string;

    constructor(correlationId: string, root: AbstractNode) {
        this.root = root;
        this.correlationId = correlationId;
    }

    /**
     * Parses an Agentic Flow from its BSON representation.
     * 
     * @param json 
     * @returns 
     */
    static fromJSON(json: any): AgenticFlow {

        const cid = json.correlationId;
        const root = AgenticFlow.parseNodeFromJSON(json.root);

        return new AgenticFlow(cid, root);
    }

    /**
     * Parses a node from its BSON representation.
     * 
     * @param bson 
     * @returns 
     */
    static parseNodeFromJSON(json: any): AbstractNode {

        if (json.type === "agent") {

            const node = new AgentNode({
                taskId: json.taskId,
                taskInstanceId: json.taskInstanceId,
                status: json.status,
                name: json.name || undefined,
            });

            node.setNext(json.next ? AgenticFlow.parseNodeFromJSON(json.next) : null);

            return node;

        } else if (json.type === "group") {
            const node = new GroupNode({
                agents: json.agents.map((agentJson: any) => AgenticFlow.parseNodeFromJSON(agentJson) as AgentNode),
                groupId: json.groupId,
                name: json.name || undefined,
            });

            node.agents.forEach(agent => agent.setPrev(node));
            node.setNext(json.next ? AgenticFlow.parseNodeFromJSON(json.next) : null);
            return node;

        } else if (json.type === "branch") {

            const node = new BranchNode({
                branches: json.branches.map((branchJson: any) => ({
                    branchId: branchJson.branchId,
                    branch: AgenticFlow.parseNodeFromJSON(branchJson.branch)
                })),
                name: json.name || undefined,
            });

            node.branches.forEach(branch => branch.branch.setPrev(node));
            node.setNext(json.next ? AgenticFlow.parseNodeFromJSON(json.next) : null);
            return node;

        } else {
            throw new Error(`[Agentic Flow]: Unknown node type ${json.type} in BSON.`);
        }
    }

    /**
     * Serializes the Agentic Flow to BSON for storage in MongoDB.
     * 
     * IMPORTANT: 
     * Makes sure that the prev of the nodes are not included to avoid circular references.
     */
    toBSON(): any {

        return {
            correlationId: this.correlationId,
            root: this.root.toBSON()
        }
    }

}

/**
 * There are three types of nodes: 
 * - Agent Node: represents a single agent 
 * - Group Node: represents a group of agents to be executed in parallel. The flow is interrupted until all agents in the group have completed.
 * - Branch Node: represents a set of parallel paths in the flow. All branches are executed in parallel, and the flow continues until all branches have completed.
 */
export abstract class AbstractNode {
    public type: "agent" | "group" | "branch" = "agent";
    public name: string | null = null;
    public next: AbstractNode | null = null;
    public prev: AbstractNode | null = null;

    /**
     * Finds an Agent Node with the given taskInstanceId in the flow structure.
     * @param taskInstanceId the task instance id of the agent to be found
     */
    abstract findAgentNode(taskInstanceId: string): AgentNode | null;

    abstract findBranchNode(branchId: string): BranchNode | null;

    abstract findGroupNode(groupId: string | null): GroupNode | null;

    /**
     * Serializes the node to BSON for storage in MongoDB.
     * 
     * IMPORTANT: 
     * Makes sure that the prev of the nodes are not included to avoid circular references.
     */
    abstract toBSON(): any;

    setNext(node: AbstractNode | null): void {
        this.next = node;
        if (node) node.prev = this;
    }

    setPrev(node: AbstractNode | null): void {
        this.prev = node;
    }
    getPrev(): AbstractNode | null {
        return this.prev;
    }
    getNext(): AbstractNode | null {
        return this.next;
    }
    getType(): "agent" | "group" | "branch" {
        return this.type;
    }
}

export class AgentNode extends AbstractNode {

    taskId: string;
    taskInstanceId: string;
    status: "started" | "completed" | "failed";

    constructor({ taskId, taskInstanceId, status, name, next }: { taskId: string, taskInstanceId: string, status: "started" | "completed" | "failed", name?: string, next?: AbstractNode }) {
        super();

        this.taskId = taskId;
        this.taskInstanceId = taskInstanceId;
        this.type = "agent";
        this.status = status || "started";
        if (name) this.name = name;
        if (next) this.next = next;
    }

    findAgentNode(taskInstanceId: string): AgentNode | null {
        if (this.taskInstanceId === taskInstanceId) return this;
        if (this.next) return this.next.findAgentNode(taskInstanceId);
        return null;
    }

    findBranchNode(branchId: string): BranchNode | null {
        if (this.next) return this.next.findBranchNode(branchId);
        return null;
    }

    findGroupNode(groupId: string | null): GroupNode | null {
        if (groupId === null) return null;
        if (this.next) return this.next.findGroupNode(groupId);
        return null;
    }

    toBSON() {
        return {
            taskId: this.taskId,
            taskInstanceId: this.taskInstanceId,
            type: this.type,
            name: this.name,
            next: this.next ? this.next.toBSON() : null
        }
    }
}

export class GroupNode extends AbstractNode {
    agents: AgentNode[];
    groupId: string;

    constructor({ agents, groupId, name, next }: { agents: AgentNode[], groupId: string, name?: string, next?: AbstractNode }) {
        super();

        this.type = "group";
        this.agents = agents;
        this.groupId = groupId;
        if (name) this.name = name;
        if (next) this.next = next;

        // Set up prev links for all agents in the group
        for (const agent of this.agents) {
            agent.setPrev(this);
        }
    }

    findAgentNode(taskInstanceId: string): AgentNode | null {
        for (const agent of this.agents) {
            const found = agent.findAgentNode(taskInstanceId);
            if (found) return found;
        }
        if (this.next) return this.next.findAgentNode(taskInstanceId);
        return null;
    }

    findBranchNode(branchId: string): BranchNode | null {
        // Search within each agent's next property (for nested branches)
        for (const agent of this.agents) {
            const agentNext = agent.getNext();
            if (agentNext) {
                const found = agentNext.findBranchNode(branchId);
                if (found) return found;
            }
        }
        // Then search in the group's next property
        if (this.next) return this.next.findBranchNode(branchId);
        return null;
    }

    findGroupNode(groupId: string | null): GroupNode | null {
        if (groupId === null) return null;
        if (this.groupId === groupId) return this;
        if (this.next) return this.next.findGroupNode(groupId);
        return null;
    }

    toBSON() {
        return {
            agents: this.agents.map(agent => agent.toBSON()),
            type: this.type,
            groupId: this.groupId,
            name: this.name,
            next: this.next ? this.next.toBSON() : null
        }
    }

}

export class BranchNode extends AbstractNode {
    branches: {
        branchId: string,
        branch: AbstractNode
    }[];

    constructor({ branches, name, next }: { branches: { branchId: string, branch: AbstractNode }[], name?: string, next?: AbstractNode }) {
        super();

        this.type = "branch";
        this.branches = branches;
        if (name) this.name = name;
        if (next) this.next = next;

        // Set up prev links for all branches
        for (const branch of this.branches) {
            branch.branch.setPrev(this);
        }
    }

    findAgentNode(taskInstanceId: string): AgentNode | null {
        for (const branch of this.branches) {
            const found = branch.branch.findAgentNode(taskInstanceId);
            if (found) return found;
        }
        if (this.next) return this.next.findAgentNode(taskInstanceId);
        return null;
    }

    findBranchNode(branchId: string): BranchNode | null {
        for (const branch of this.branches) {
            if (branch.branchId === branchId) return this;
            const found = branch.branch.findBranchNode(branchId);
            if (found) return found;
        }
        if (this.next) return this.next.findBranchNode(branchId);
        return null;
    }

    findGroupNode(groupId: string | null): GroupNode | null {
        if (groupId === null) return null;
        for (const branch of this.branches) {
            const found = branch.branch.findGroupNode(groupId);
            if (found) return found;
        }
        if (this.next) return this.next.findGroupNode(groupId);
        return null;
    }

    toBSON() {
        return {
            branches: this.branches.map(branch => ({
                branchId: branch.branchId,
                branch: branch.branch.toBSON()
            })),
            type: this.type,
            name: this.name,
            next: this.next ? this.next.toBSON() : null
        }
    }
}
