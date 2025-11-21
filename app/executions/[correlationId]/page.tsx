'use client';

import { GaleBrokerAPI, TaskExecutionGraphNode } from "@/api/GaleBrokerAPI";
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


const nodeTypes = {
    taskNode: TaskNodeComponent,
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
     * Builds the React Flow nodes and edges from the task execution graph.
     * 
     * @param root the root node of the task execution graph
     * @returns the list of React Flow nodes and edges
     */
    const buildFlowGraph = useCallback((root: TaskExecutionGraphNode) => {

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // BFS to create hierarchical layout
        const queue: { node: TaskExecutionGraphNode; level: number; parentId?: string; parentIds?: string[]; indexInLevel: number; leaf: boolean }[] = [];

        const levelCounts: Record<number, number> = {};

        queue.push({ node: root, level: 0, indexInLevel: 0, leaf: root.next === null });

        levelCounts[0] = 1;

        while (queue.length > 0) {

            const { node, level, parentId, parentIds, indexInLevel, leaf } = queue.shift()!;

            console.log(`Node Id: ${node.record.taskInstanceId} - Level: ${level} - ParentId: ${parentId} - ParentIds: ${parentIds ? parentIds.join(',') : 'N/A'}`);


            // Calculate position
            const X_STEP = NODE_WIDTH + 30;
            const Y_STEP = 200;

            let x = indexInLevel * X_STEP;
            const y = level * Y_STEP;

            // If the node has multiple parents, center it between them
            if (parentIds && parentIds.length > 0) {
                x = (parentIds.length / 2) * X_STEP - (X_STEP / 2);
            }
            // If the node has children, center it above its children
            else if (node.next) {
                // If there are multiple children (as part of a subtask group), center above them
                if (typeof node.next == 'object' && 'nodes' in node.next && node.next.nodes.length > 0) x = (node.next.nodes.length / 2) * X_STEP - (X_STEP / 2);
                // If it's a single child, align with it
                else if (typeof node.next == 'object') x = 0;
            }

            nodes.push({
                id: node.record.taskInstanceId,
                type: 'taskNode',
                position: { x, y },
                data: {
                    root: level === 0,
                    leaf: leaf,
                    agentName: node.record.agentName,
                    taskId: node.record.taskId,
                    taskInstanceId: node.record.taskInstanceId,
                    status: node.record.status,
                    stopReason: node.record.stopReason,
                    executionTimeMs: node.record.executionTimeMs,
                    taskOutput: node.record.taskOutput,
                    taskInput: node.record.taskInput,
                    resumedAfterSubtasksGroupId: node.record.resumedAfterSubtasksGroupId,
                    agentType: node.record.resumedAfterSubtasksGroupId || !node.record.parentTaskId ? "orchestrator" : "agent",
                    onNodeClick: setSelectedNode,
                    isSelected: false
                },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
            });

            if (parentId) {
                edges.push({
                    id: `edge-${parentId}-${node.record.taskInstanceId}`,
                    source: parentId,
                    target: node.record.taskInstanceId,
                    type: 'customEdge',
                    animated: node.record.status === 'started' || node.record.status === 'waiting',
                    style: { stroke: '#bbc2ceff', strokeWidth: 3 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#213963ff',
                    },
                    data: {
                        input: node.record.taskInput,
                    }
                });
            }
            else if (parentIds) {

                // Create an edge from each parent to this node
                parentIds.forEach((pid) => {
                    edges.push({
                        id: `edge-${pid}-${node.record.taskInstanceId}`,
                        source: pid,
                        target: node.record.taskInstanceId,
                        type: 'customEdge',
                        animated: node.record.status === 'started' || node.record.status === 'waiting',
                        style: { stroke: '#bbc2ceff', strokeWidth: 5 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#213963ff',
                        },
                        data: {
                            input: node.record.taskInput,
                        }
                    });
                });
            }

            if (node.next) {

                const nextLevel = level + 1;

                if (!levelCounts[nextLevel]) levelCounts[nextLevel] = 0;

                // If it's a subtask group, enqueue all its children
                if (typeof node.next == 'object' && 'nodes' in node.next) {
                    node.next.nodes.forEach((child, idx) => {

                        queue.push({
                            node: child,
                            level: nextLevel,
                            parentId: node.record.taskInstanceId,
                            indexInLevel: levelCounts[nextLevel] + idx,
                            leaf: node.next!.next === null,
                        });

                    });

                    levelCounts[nextLevel] += node.next.nodes.length;

                    // If there is a next after the subtask group, enqueue it as well
                    if (node.next.next && "record" in node.next.next) {

                        if (!levelCounts[nextLevel + 1]) levelCounts[nextLevel + 1] = 0;

                        queue.push({
                            node: node.next.next,
                            level: nextLevel + 1,
                            parentId: undefined,
                            parentIds: node.next.nodes.map(n => `${n.record.taskInstanceId}`),
                            indexInLevel: levelCounts[nextLevel + 1],
                            leaf: node.next.next.next === null,
                        });

                        levelCounts[nextLevel] += 1;
                    }
                }
                // Otherwise, it's a single child
                else if (typeof node.next == 'object') {
                    queue.push({
                        node: node.next,
                        level: nextLevel,
                        parentId: node.record.taskInstanceId,
                        indexInLevel: levelCounts[nextLevel],
                        leaf: node.next.next === null,
                    });

                    levelCounts[nextLevel] += 1;
                }

            }
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

            const { nodes: flowNodes, edges: flowEdges } = buildFlowGraph(response.graph.rootNode);

            setNodes(flowNodes);
            setEdges(flowEdges);

        }
        catch (error) {
            console.error('Failed to load execution graph:', error);
        }
        finally {
            setLoading(false);
        }

    }, [correlationId, buildFlowGraph, setNodes, setEdges]);

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
