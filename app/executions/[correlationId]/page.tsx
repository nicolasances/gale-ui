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
import Button from "@/components/Button";
import { AGENTS_PER_ROW, GROUP_WIDTH, SubgroupData, SubgroupTasksNodeComponent } from "./components/SubgroupTasksNode";
import { AbstractNode, AgentNode, BranchNode, GroupNode } from "@/api/model/AgenticFlow";
import { FlowGraphUtil, GraphLevels } from "./util/FlowGraphUtil";

const UI_SIZES = {
    nodeXGap: 30,
    estimatedGroupRowHeight: 60,
    agentNodeHeight: 120,
    agentNodeWidth: NODE_WIDTH,
    groupNodeWidth: GROUP_WIDTH,
    agentsPerRowInGroup: AGENTS_PER_ROW,
}

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
    const [rootStatus, setRootStatus] = useState<TaskStatusRecord | null>(null);

    /**
     * Builds a single node
     * @param node the node data
     */
    const buildNode = (node: AgentNode, indexInLevel: number, levelInTree: number, parentX: number, parentY: number, levels: GraphLevels, parentCenterX: number, siblingsInfo?: { totalWidth: number, nodeTypes: string[] }): { node: Node, x: number, y: number } => {

        // Determine the X position of this node
        let x: number;
        if (levelInTree === 0) {
            // Root level: center on the graph
            const levelWidth = levels.levels[levelInTree].width;
            const startX = levels.centerX - (levelWidth / 2);
            x = startX + levels.levels[levelInTree].orderedNodeTypes.slice(0, indexInLevel).reduce((acc, currType) => {
                if (currType === 'agent') return acc + UI_SIZES.agentNodeWidth + UI_SIZES.nodeXGap;
                else if (currType === 'group') return acc + UI_SIZES.groupNodeWidth + UI_SIZES.nodeXGap;
                return acc;
            }, 0);
        } else if (siblingsInfo) {
            // Part of a branch: center siblings around parent
            const startX = parentCenterX - (siblingsInfo.totalWidth / 2);
            x = startX + siblingsInfo.nodeTypes.slice(0, indexInLevel).reduce((acc, currType) => {
                if (currType === 'agent') return acc + UI_SIZES.agentNodeWidth + UI_SIZES.nodeXGap;
                else if (currType === 'group') return acc + UI_SIZES.groupNodeWidth + UI_SIZES.nodeXGap;
                return acc;
            }, 0);
        } else {
            // Single child: center on parent
            const childWidth = UI_SIZES.agentNodeWidth;
            x = parentCenterX - (childWidth / 2);
        }

        // Check if the parent is a group and count how many agents that group has
        let agentsInParentGroup = 0;
        if (node.prev && node.prev.type === 'branch' && node.prev.prev && node.prev.prev.type === 'group') {
            agentsInParentGroup = (node.prev.prev as GroupNode).agents.length;
        }
        else if (node.prev && node.prev.type === 'group') {
            agentsInParentGroup = (node.prev as GroupNode).agents.length;
        }

        let prevElementHeight = 0;
        if (levelInTree > 0) prevElementHeight = agentsInParentGroup > 1 ? (Math.floor(agentsInParentGroup / UI_SIZES.agentsPerRowInGroup) + 1) * UI_SIZES.estimatedGroupRowHeight + UI_SIZES.agentNodeHeight : UI_SIZES.agentNodeHeight;

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
     * @param levels the graph levels data
     */
    const buildGroupNode = (groupNode: GroupNode, parentX: number, parentY: number, indexInLevel: number, levelInTree: number, levels: GraphLevels, parentCenterX: number, siblingsInfo?: { totalWidth: number, nodeTypes: string[] }): { node: Node, x: number, y: number } => {

        // Determine the position
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

        let prevElementHeight = UI_SIZES.agentNodeHeight;
        if (followsFromGroup) prevElementHeight = GROUP2GROUP_PADDING + (agentsInParentGroup > 1 ? (Math.floor(agentsInParentGroup / UI_SIZES.agentsPerRowInGroup) + 1) * UI_SIZES.estimatedGroupRowHeight + UI_SIZES.agentNodeHeight : UI_SIZES.agentNodeHeight);

        // Determine x position
        let x: number;
        if (levelInTree === 0) {
            // Root level: center on the graph
            const levelWidth = levels.levels[levelInTree].width;
            const startX = levels.centerX - (levelWidth / 2);
            x = startX + levels.levels[levelInTree].orderedNodeTypes.slice(0, indexInLevel).reduce((acc, currType) => {
                if (currType === 'agent') return acc + UI_SIZES.agentNodeWidth + UI_SIZES.nodeXGap;
                else if (currType === 'group') return acc + UI_SIZES.groupNodeWidth + UI_SIZES.nodeXGap;
                return acc;
            }, 0);
        } else if (siblingsInfo) {
            // Part of a branch: center siblings around parent
            const startX = parentCenterX - (siblingsInfo.totalWidth / 2);
            x = startX + siblingsInfo.nodeTypes.slice(0, indexInLevel).reduce((acc, currType) => {
                if (currType === 'agent') return acc + UI_SIZES.agentNodeWidth + UI_SIZES.nodeXGap;
                else if (currType === 'group') return acc + UI_SIZES.groupNodeWidth + UI_SIZES.nodeXGap;
                return acc;
            }, 0);
        } else {
            // Single child: center on parent
            const childWidth = UI_SIZES.groupNodeWidth;
            x = parentCenterX - (childWidth / 2);
        }
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

    const build = (currentNode: AbstractNode | null, currentLevel: number, parentX: number, parentY: number, parentWidth: number, levels: GraphLevels): { nodes: Node[], edges: Edge[] } => {

        if (currentNode == null) return { nodes: [], edges: [] };

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        if (currentNode.type === 'agent') {

            // If the parent is a branch, we need to find the correct group index and calculate siblings info
            let indexInLevel = 0;
            let siblingsInfo: { totalWidth: number, nodeTypes: string[] } | undefined = undefined;
            if (currentNode.prev && currentNode.prev.type === 'branch') {
                const branchNode = currentNode.prev as BranchNode;
                for (let bIndex = 0; bIndex < branchNode.branches.length; bIndex++) {
                    const branch = branchNode.branches[bIndex];
                    if (branch.branch === currentNode) {
                        indexInLevel = bIndex;
                        break;
                    }
                }
                // Calculate siblingsInfo
                const nodeTypes = branchNode.branches.map(b => b.branch.type);
                const totalWidth = nodeTypes.reduce((acc, type, idx) => {
                    const width = type === 'agent' ? UI_SIZES.agentNodeWidth : UI_SIZES.groupNodeWidth;
                    const gap = idx > 0 ? UI_SIZES.nodeXGap : 0;
                    return acc + width + gap;
                }, 0);
                siblingsInfo = { totalWidth, nodeTypes };
            }

            const parentCenterX = parentX + parentWidth / 2;
            const builtNode = buildNode(currentNode as AgentNode, indexInLevel, currentLevel, parentX, parentY, levels, parentCenterX, siblingsInfo);

            nodes.push(builtNode.node);
            edges.push(...buildIncomingEdges(currentNode));

            const builtSubtree = build(currentNode.next, currentLevel + 1, builtNode.x, builtNode.y, UI_SIZES.agentNodeWidth, levels)

            nodes.push(...builtSubtree.nodes);
            edges.push(...builtSubtree.edges);
        }
        // Otherwise it's a list of groups
        else if (currentNode.type === 'group') {

            // If the parent is a branch, we need to find the correct group index and calculate siblings info
            let indexInLevel = 0;
            let siblingsInfo: { totalWidth: number, nodeTypes: string[] } | undefined = undefined;
            if (currentNode.prev && currentNode.prev.type === 'branch') {
                const branchNode = currentNode.prev as BranchNode;
                for (let bIndex = 0; bIndex < branchNode.branches.length; bIndex++) {
                    const branch = branchNode.branches[bIndex];
                    if (branch.branch === currentNode) {
                        indexInLevel = bIndex;
                        break;
                    }
                }
                // Calculate siblingsInfo
                const nodeTypes = branchNode.branches.map(b => b.branch.type);
                const totalWidth = nodeTypes.reduce((acc, type, idx) => {
                    const width = type === 'agent' ? UI_SIZES.agentNodeWidth : UI_SIZES.groupNodeWidth;
                    const gap = idx > 0 ? UI_SIZES.nodeXGap : 0;
                    return acc + width + gap;
                }, 0);
                siblingsInfo = { totalWidth, nodeTypes };
            }
            const group = currentNode as GroupNode;

            const parentCenterX = parentX + parentWidth / 2;
            const groupNode = buildGroupNode(group, parentX, parentY, indexInLevel, currentLevel, levels, parentCenterX, siblingsInfo);

            nodes.push(groupNode.node);
            edges.push(...buildIncomingEdges(group));

            const builtSubtree = build(group.next, currentLevel + 1, groupNode.x, groupNode.y, UI_SIZES.groupNodeWidth, levels)

            nodes.push(...builtSubtree.nodes);
            edges.push(...builtSubtree.edges);

        }
        else if (currentNode.type === 'branch') {

            for (const branch of (currentNode as BranchNode).branches) {

                const branchNode = branch.branch as AbstractNode;

                const builtSubtree = build(branchNode, currentLevel, parentX, parentY, parentWidth, levels)

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
    const buildFlow = useCallback((root: AbstractNode, levels: GraphLevels) => {

        // Recursively build the flow
        return build(root, 0, 0, 0, 0, levels);

    }, []);

    const loadTaskStatus = async (taskInstanceId: string) => {
        const result = await new GaleBrokerAPI().getTaskExecutionRecord(taskInstanceId);
        return result.task;
    }


    /**
     * Loads the execution graph for the given correlation ID.
     */
    const loadGraph = useCallback(async () => {

        setLoading(true);

        try {

            const response = await new GaleBrokerAPI().getExecutionGraph(correlationId);

            setRootNode(response.flow.root);

            // Load the root status
            if (response.flow.root.getType() === 'agent') {
                await loadTaskStatus((response.flow.root as AgentNode).taskInstanceId).then(rootStatus => { setRootStatus(rootStatus); });
            }

            // Preprocess the layers
            const levels = new FlowGraphUtil(response.flow, UI_SIZES).buildLevels();

            // Build the flow
            const { nodes: flowNodes, edges: flowEdges } = buildFlow(response.flow.root, levels);

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
            <div className="flex items-center justify-between mb-6 pb-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Back">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <div className="text-xl font-bold"><span className="text-cyan-400">Flow |</span> {rootNode?.name}</div>
                        <p className="text-xs text-gray-500">Started: {rootStatus?.startedAt ? new Date(rootStatus.startedAt).toLocaleString() : '-'}</p>
                    </div>
                </div>
                <Button
                    onClick={loadGraph}
                    variant="ghost"
                    title="Refresh"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    }
                />
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
