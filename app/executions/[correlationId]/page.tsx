'use client';

import { GaleBrokerAPI, TaskStatusRecord } from "@/api/GaleBrokerAPI";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Position,
    getBezierPath,
    BaseEdge,
    EdgeLabelRenderer,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TaskNodeComponent, NODE_WIDTH } from "./components/TaskNode";
import { TaskDataPopup } from "./components/TaskData";
import NodeDetailPanel from "./components/NodeDetailPanel";
import { AGENTS_PER_ROW, GROUP_WIDTH, SubgroupData, SubgroupTasksNodeComponent } from "./components/SubgroupTasksNode";
import { AbstractNode, AgenticFlow, AgentNode, BranchNode, GroupNode } from "@/api/model/AgenticFlow";

const NODE_X_GAP = 30;
const ESTIMATED_GROUP_ROW_HEIGHT = 60;

const nodeTypes = {
    taskNode: TaskNodeComponent,
    groupNode: SubgroupTasksNodeComponent,
};

const edgeTypes = {
    customEdge: CustomEdge,
}

export default function ExecutionDetailPage() {

    const params = useParams();
    const router = useRouter();

    const correlationId = params.correlationId as string;

    const [rootNode, setRootNode] = useState<AbstractNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    /**
     * Builds a single node
     * @param node the node data
     */
    const buildNode = (node: AgentNode, indexInLevel: number, levelInTree: number, parentX: number, parentY: number): { node: Node, x: number, y: number } => {

        // Determine the position
        const EL_HEIGHT = 120;

        // Check if the parent is a group and count how many agents that group has
        let followsFromGroup = false;
        let agentsInParentGroup = 0;
        if (node.prev && node.prev.type === 'branch' && node.prev.prev && node.prev.prev.type === 'group') {
            followsFromGroup = true;
            agentsInParentGroup = (node.prev.prev as GroupNode).agents.length;
        }
        else if (node.prev && node.prev.type === 'group') {
            followsFromGroup = true;
            agentsInParentGroup = (node.prev as GroupNode).agents.length;
        }

        let prevElementHeight = 0;
        if (levelInTree > 0) prevElementHeight = agentsInParentGroup > 1 ? (Math.floor(agentsInParentGroup / AGENTS_PER_ROW) + 1) * ESTIMATED_GROUP_ROW_HEIGHT + EL_HEIGHT : EL_HEIGHT;

        const x = parentX + (followsFromGroup ? (GROUP_WIDTH - NODE_WIDTH) / 2 : 0) + indexInLevel * (GROUP_WIDTH + NODE_X_GAP);
        const y = parentY + prevElementHeight;

        return {
            node: {
                id: node.taskInstanceId,
                type: 'taskNode',
                position: { x, y },
                data: {
                    root: levelInTree === 0,
                    leaf: false,
                    record: node,
                    agentType: "agent",
                    onNodeClick: setSelectedNode,
                    isSelected: false
                },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top
            },
            x: x, y: y
        }

    }

    /**
     * Builds a group node
     * @param node the node data
     * @param parentX the parent's X position
     * @param parentY the parent's Y position
     * @param indexInLevel the index in the current level. It allows to space out sibling groups.
     */
    const buildGroupNode = (groupNode: GroupNode, parentX: number, parentY: number, indexInLevel: number): { node: Node, x: number, y: number } => {

        // Determine the position
        const EL_HEIGHT = 100;
        const GROUP2GROUP_PADDING = 40;

        // Check if the parent is a group and count how many agents that group has
        let followsFromGroup = false;
        let agentsInParentGroup = 0;
        if (groupNode.prev && groupNode.prev.type === 'branch' && groupNode.prev.prev && groupNode.prev.prev.type === 'group') {
            followsFromGroup = true;
            agentsInParentGroup = (groupNode.prev.prev as GroupNode).agents.length;
        }
        else if (groupNode.prev && groupNode.prev.type === 'group') {
            followsFromGroup = true;
            agentsInParentGroup = (groupNode.prev as GroupNode).agents.length;
        }

        let prevElementHeight = EL_HEIGHT;
        if (followsFromGroup) prevElementHeight = GROUP2GROUP_PADDING + (agentsInParentGroup > 1 ? (Math.floor(agentsInParentGroup / AGENTS_PER_ROW) + 1) * ESTIMATED_GROUP_ROW_HEIGHT + EL_HEIGHT : EL_HEIGHT);

        const x = parentX - (GROUP_WIDTH - NODE_WIDTH) / 2 + indexInLevel * (GROUP_WIDTH + NODE_X_GAP);
        const y = parentY + prevElementHeight;

        const nodeData: SubgroupData = {
            groupId: groupNode.groupId,
            isSelected: false,
            onNodeClick: setSelectedNode,
            agents: groupNode.agents,
        }

        return {
            node: {
                id: groupNode.groupId,
                type: 'groupNode',
                position: { x, y },
                data: nodeData,
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
            },
            x: x, y: y
        }

    }

    const buildIncomingEdges = (node: AbstractNode): Edge[] => {

        if (!node.prev) return [];

        const edges: Edge[] = [];

        let parentId;
        if (node.prev?.type == 'group') parentId = (node.prev as GroupNode).groupId;
        else if (node.prev?.type == 'branch') {
            // Navigate one more back to find the parent
            if (node.prev.prev?.type == 'group') parentId = (node.prev.prev as GroupNode).groupId;
            else parentId = (node.prev.prev as AgentNode).taskInstanceId;
        }
        else parentId = (node.prev as AgentNode).taskInstanceId;

        const nodeId = node.type === 'group' ? (node as GroupNode).groupId : (node as AgentNode).taskInstanceId;

        const edge = {
            id: `edge-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'customEdge',
            animated: false,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#213963ff',
            },
            data: {
                input: {},
            }
        }

        edges.push(edge);

        return edges;
    }

    const build = (currentNode: AbstractNode | null, currentLevel: number, parentX: number, parentY: number): { nodes: Node[], edges: Edge[] } => {

        if (currentNode == null) return { nodes: [], edges: [] };

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        if (currentNode.type === 'agent') {

            // If the parent is a branch, we need to find the correct group index
            let indexInLevel = 0;
            if (currentNode.prev && currentNode.prev.type === 'branch') {
                const branchNode = currentNode.prev as BranchNode;
                for (let bIndex = 0; bIndex < branchNode.branches.length; bIndex++) {
                    const branch = branchNode.branches[bIndex];
                    if (branch.branch === currentNode) {
                        indexInLevel = bIndex;
                        break;
                    }
                }
            }

            const builtNode = buildNode(currentNode as AgentNode, indexInLevel, currentLevel, parentX, parentY);

            nodes.push(builtNode.node);
            edges.push(...buildIncomingEdges(currentNode));

            const builtSubtree = build(currentNode.next, currentLevel + 1, builtNode.x, builtNode.y)

            nodes.push(...builtSubtree.nodes);
            edges.push(...builtSubtree.edges);
        }
        // Otherwise it's a list of groups
        else if (currentNode.type === 'group') {

            // If the parent is a branch, we need to find the correct group index
            let indexInLevel = 0;
            if (currentNode.prev && currentNode.prev.type === 'branch') {
                const branchNode = currentNode.prev as BranchNode;
                for (let bIndex = 0; bIndex < branchNode.branches.length; bIndex++) {
                    const branch = branchNode.branches[bIndex];
                    if (branch.branch === currentNode) {
                        indexInLevel = bIndex;
                        break;
                    }
                }
            }
            const group = currentNode as GroupNode;
            const agents = group.agents;

            const groupNode = buildGroupNode(group, parentX, parentY, indexInLevel);

            nodes.push(groupNode.node);
            edges.push(...buildIncomingEdges(group));

            const builtSubtree = build(group.next, currentLevel + 1, groupNode.x, groupNode.y)

            nodes.push(...builtSubtree.nodes);
            edges.push(...builtSubtree.edges);

        }
        else if (currentNode.type === 'branch') {

            for (const branch of (currentNode as BranchNode).branches) {

                const branchNode = branch.branch as AbstractNode;

                const builtSubtree = build(branchNode, currentLevel, parentX, parentY)

                nodes.push(...builtSubtree.nodes);
                edges.push(...builtSubtree.edges);
            }
        }

        return { nodes, edges };

    }

    /**
     * Builds the React Flow nodes and edges from the execution graph.
     * This method builds the nodes level by level.
     * 
     * @param root the root of the execution graph
     */
    const buildFlow = useCallback((root: AbstractNode) => {

        return build(root, 0, 0, 0);

    }, []);


    /**
     * Loads the execution graph for the given correlation ID.
     */
    const loadGraph = useCallback(async () => {

        setLoading(true);

        try {

            const response = await new GaleBrokerAPI().getExecutionGraph(correlationId);

            setRootNode(response.flow.root);

            const { nodes: flowNodes, edges: flowEdges } = buildFlow(response.flow.root);

            setNodes(flowNodes);
            setEdges(flowEdges);

        }
        catch (error) {
            console.error('Failed to load execution graph:', error);
        }
        finally {
            setLoading(false);
        }

    }, [correlationId, buildFlow, setNodes, setEdges]);

    useEffect(() => { loadGraph(); }, [loadGraph]);

    // Update nodes when selection changes
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    isSelected: selectedNode?.taskInstanceId === node.id,
                    selectedTaskInstanceId: selectedNode?.taskInstanceId
                }
            }))
        );
    }, [selectedNode, setNodes]);

    if (!rootNode && loading) return <></>

    return (
        <div className="h-screen flex flex-col">
            <div className="flex items-center gap-4 mb-6 pb-0">
                <button onClick={() => router.back()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <div className="text-xl font-bold"><span className="text-cyan-400">Flow |</span> {rootNode?.name}</div>
                    <p className="text-xs text-gray-500">Started: {new Date().toLocaleString()}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center flex-1">
                    <p className="text-gray-500">Loading execution graph...</p>
                </div>
            ) : rootNode ? (
                <div style={{ width: '100%', height: '80%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        // fitViewOptions={{ padding: 0.2 }}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                    {(selectedNode || isClosing) && (
                        <>
                            <NodeDetailPanel
                                node={selectedNode}
                                isClosing={isClosing}
                                onClose={() => {
                                    setIsClosing(true);
                                    setTimeout(() => {
                                        setSelectedNode(null);
                                        setIsClosing(false);
                                    }, 300);
                                }}
                            />
                        </>
                    )}
                </div>
            ) : (
                <div className="flex justify-center items-center flex-1">
                    <p className="text-gray-500">No execution graph found</p>
                </div>
            )}
        </div>
    );
}

function CustomEdge({ id, source, target, data }: any) {

    const reactFlow = useReactFlow();
    const [showPopup, setShowPopup] = useState(false);

    const sourceNode = reactFlow.getNode(source)!;
    const targetNode = reactFlow.getNode(target)!;

    const [path] = getBezierPath({
        sourceX: sourceNode.position.x + sourceNode.width! / 2,
        sourceY: sourceNode.position.y + sourceNode.height!,
        sourcePosition: Position.Bottom,
        targetX: targetNode.position.x + targetNode.width! / 2,
        targetY: targetNode.position.y,
        targetPosition: Position.Top,
    });

    // Position label at the top center of the target node
    const labelX = targetNode.position.x + (targetNode.width! / 2);
    const labelY = targetNode.position.y;

    const labelStyle = {
        position: 'absolute' as 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all' as 'all'
    }

    const handleLabelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowPopup(!showPopup);
    };

    const handlePopupClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Close popup when clicking outside
    useEffect(() => {
        if (!showPopup) return;

        const handleClickOutside = () => {
            setShowPopup(false);
        };

        document.addEventListener('click', handleClickOutside);

        return () => document.removeEventListener('click', handleClickOutside);

    }, [showPopup]);

    return (
        <>
            <BaseEdge id={id} path={path} style={{ strokeWidth: 3, strokeColor: '#e3e3e8ff' }} />
            <EdgeLabelRenderer>
                <div style={labelStyle} className="relative z-[2000]">
                    <div onClick={handleLabelClick} className="min-h-2 cursor-pointer text-sm font-semibold text-gray-600 bg-cyan-400 rounded-md px-3 py-1 flex items-center hover:shadow-lg hover:scale-150 transition-all" >
                    </div>
                    {showPopup && data?.input && <TaskDataPopup handlePopupClick={handlePopupClick} data={data.input} label="Task Input" />}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
