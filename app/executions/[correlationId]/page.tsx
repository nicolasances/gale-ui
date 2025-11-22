'use client';

import { GaleBrokerAPI, SubtaskGroupNode, TaskExecutionGraphNode, TaskStatus, TaskStatusRecord } from "@/api/GaleBrokerAPI";
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
import { GROUP_WIDTH, SubgroupData, SubgroupTasksNodeComponent } from "./components/SubgroupTasksNode";

const NODE_X_GAP = 30;

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

    const [rootNode, setRootNode] = useState<TaskExecutionGraphNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    /**
     * Extracts levels from the task execution tree. 
     * Each level is a list of nodes at that depth.
     * 
     * @param root the root of the tree
     */
    const extractLevelsFromTree = (root: TaskExecutionGraphNode | SubtaskGroupNode | null): TaskStatusRecord[][] => {

        const levels: TaskStatusRecord[][] = [];

        let currentNode = root;

        if (!currentNode) return levels;

        while (currentNode != null) {

            let levelNodes: TaskStatusRecord[] = []

            // 1. Extract all nodes at this level
            if ("record" in currentNode) levelNodes.push(currentNode.record);
            else if ('nodes' in currentNode) {
                levelNodes = (currentNode as SubtaskGroupNode).nodes.map((n: TaskExecutionGraphNode) => n.record);
            }

            // 2. Add the level nodes to the levels array
            levels.push(levelNodes);

            // 3. Move to the next level
            currentNode = currentNode.next;
        }

        return levels
    }

    /**
     * Builds a single node
     * @param node the node data
     */
    const buildNode = (node: TaskStatusRecord, indexInLevel: number, levelInTree: number, parentsCount: number, childrenCount: number, siblingsCount: number, parentX: number): { node: Node, x: number } => {

        // Determine the position
        const X_STEP = NODE_WIDTH + NODE_X_GAP;
        const Y_STEP = 200;

        let x = indexInLevel * X_STEP;
        const y = levelInTree * Y_STEP;

        // // X Position
        // // If the node is at level 0, center it above its children
        // if (levelInTree === 0 && childrenCount > 0) x = (childrenCount / 2) * X_STEP - (X_STEP / 2);
        // // If the node is at the last level, center it below its parents
        // else if (childrenCount === 0 && parentsCount > 1) x = (parentsCount / 2) * X_STEP - (X_STEP / 2);
        // // If the node is a single child and has multiple parents, center it between its parents
        // else if (parentsCount > 1 && siblingsCount === 0) x = (parentsCount / 2) * X_STEP - (X_STEP / 2);
        // // If the node is a single child and has a single parent, align with the parent
        // else if (parentsCount === 1 && siblingsCount === 0) x = parentX;

        return {
            node: {
                id: node.taskInstanceId,
                type: 'taskNode',
                position: { x, y },
                data: {
                    root: levelInTree === 0,
                    leaf: false,
                    agentName: node.agentName,
                    taskId: node.taskId,
                    taskInstanceId: node.taskInstanceId,
                    status: node.status,
                    stopReason: node.stopReason,
                    executionTimeMs: node.executionTimeMs,
                    taskOutput: node.taskOutput,
                    taskInput: node.taskInput,
                    resumedAfterSubtasksGroupId: node.resumedAfterSubtasksGroupId,
                    agentType: node.resumedAfterSubtasksGroupId || !node.parentTaskId ? "orchestrator" : "agent",
                    onNodeClick: setSelectedNode,
                    isSelected: false
                },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top
            },
            x: x
        }

    }

    /**
     * Builds a group node
     * @param node the node data
     */
    const buildGroupNode = (nodes: TaskStatusRecord[], levelInTree: number, parentX: number): { node: Node, x: number } => {

        // Determine the position
        const Y_STEP = 200;

        const x = parentX - (GROUP_WIDTH - NODE_WIDTH) / 2;
        const y = levelInTree * Y_STEP;

        const nodeData: SubgroupData = {
            groupId: nodes[0].subtaskGroupId!,
            isSelected: false,
            onNodeClick: setSelectedNode
        }

        return {
            node: {
                id: nodes[0].subtaskGroupId!,
                type: 'groupNode',
                position: { x, y },
                data: nodeData,
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
            },
            x: x
        }

    }

    const buildIncomingEdges = (node: TaskStatusRecord, previousLayer: TaskStatusRecord[], isGroup: boolean): Edge[] => {

        if (!previousLayer || previousLayer.length === 0) return [];

        const edges: Edge[] = [];

        const parentId = previousLayer.length > 1 ? previousLayer[0].subtaskGroupId! : previousLayer[0].taskInstanceId;
        const nodeId = isGroup ? node.subtaskGroupId! : node.taskInstanceId;

        const edge = {
            id: `edge-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'customEdge',
            animated: node.status === 'started' || node.status === 'waiting',
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#213963ff',
            },
            data: {
                input: node.taskInput,
            }
        }

        edges.push(edge);

        return edges;
    }

    /**
     * Builds the React Flow nodes and edges from the execution graph.
     * This method builds the nodes level by level.
     * 
     * @param root the root of the execution graph
     */
    const buildFlow = useCallback((root: TaskExecutionGraphNode) => {

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // 1. Extract the levels
        const levels: TaskStatusRecord[][] = extractLevelsFromTree(root);

        // 2. Build each level
        let parentX = 0;
        for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {

            const level: TaskStatusRecord[] = levels[levelIndex];
            const levelChildrenCount = levelIndex + 1 < levels.length ? levels[levelIndex + 1].length : 0;
            const levelParentsCount = levelIndex - 1 >= 0 ? levels[levelIndex - 1].length : 0;

            const levelNodes: Node[] = [];

            if (level.length > 1) {

                const { node: groupNode, x } = buildGroupNode(level, levelIndex, parentX);

                levelNodes.push(groupNode);
                edges.push(...buildIncomingEdges(level[0], levelIndex - 1 >= 0 ? levels[levelIndex - 1] : [], true));

                parentX = x;
            }
            else {
                const { node: singleNode, x } = buildNode(level[0], 0, levelIndex, levelParentsCount, levelChildrenCount, level.length - 1, parentX);

                levelNodes.push(singleNode);
                edges.push(...buildIncomingEdges(level[0], levelIndex - 1 >= 0 ? levels[levelIndex - 1] : [], false));

                parentX = x;
            }

            // Store the X of the parent
            if (level.length == 1) parentX = levelNodes[0].position.x;
            else if (level.length > 1) parentX = (levelNodes.length / 2) * (NODE_WIDTH + NODE_X_GAP) - ((NODE_WIDTH + NODE_X_GAP) / 2);

            // Push all the nodes of this level
            nodes.push(...levelNodes);
        }

        return { nodes, edges };

    }, []);


    /**
     * Loads the execution graph for the given correlation ID.
     */
    const loadGraph = useCallback(async () => {

        setLoading(true);

        try {

            const response = await new GaleBrokerAPI().getExecutionGraph(correlationId);

            setRootNode(response.graph.rootNode);

            const { nodes: flowNodes, edges: flowEdges } = buildFlow(response.graph.rootNode);

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
                    isSelected: selectedNode?.taskInstanceId === node.id
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
                    <div className="text-xl font-bold"><span className="text-cyan-400">Flow |</span> {rootNode!.record.agentName}</div>
                    <p className="text-xs text-gray-500">Started: {new Date(rootNode!.record.startedAt).toLocaleString()}</p>
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
