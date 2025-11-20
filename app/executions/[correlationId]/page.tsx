'use client';

import { GaleBrokerAPI, TaskExecutionGraphNode, TaskStatus } from "@/api/GaleBrokerAPI";
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
    Handle,
    getBezierPath,
    BaseEdge,
    EdgeLabelRenderer,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';


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
            const X_STEP = 320;
            const Y_STEP = 400;

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
                    status: node.record.status,
                    stopReason: node.record.stopReason,
                    executionTimeMs: node.record.executionTimeMs,
                    taskOutput: node.record.taskOutput,
                    resumedAfterSubtasksGroupId: node.record.resumedAfterSubtasksGroupId
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
                        style: { stroke: '#bbc2ceff', strokeWidth: 3 },
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

    return (
        <div className="h-screen flex flex-col">
            <div className="flex items-center gap-4 mb-6 p-6 pb-0">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-4xl font-bold">Execution Graph</h1>
                    <p className="text-sm text-gray-500 font-mono mt-1">Correlation ID: {correlationId}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center flex-1">
                    <p className="text-gray-500">Loading execution graph...</p>
                </div>
            ) : rootNode ? (
                <div className="flex-1" style={{ width: '100%', height: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>
            ) : (
                <div className="flex justify-center items-center flex-1">
                    <p className="text-gray-500">No execution graph found</p>
                </div>
            )}
        </div>
    );
}

/**
 * Label badge for task status
 * @returns 
 */
function StatusBadge({ status }: { status: TaskStatus }) {
    const colors = {
        published: "bg-gray-100 text-gray-800",
        started: "bg-blue-100 text-blue-800",
        waiting: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
        childrenCompleted: "bg-purple-100 text-purple-800"
    };

    return (
        <div className="flex flex-col gap-1">
            <span className={`px-2 py-1 ${colors[status]} text-xs font-medium rounded-full text-center`}>
                {status}
            </span>
        </div>
    );
}

/**
 * Displays a task node in the React Flow graph.
 * @returns 
 */
function TaskNodeComponent({ data }: { data: any }) {

    const [showOutputPopup, setShowOutputPopup] = useState(false);

    const formatDuration = (ms?: number) => {
        if (ms === undefined) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const handleOutputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowOutputPopup(!showOutputPopup);
    };

    const handlePopupClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Close popup when clicking outside
    useEffect(() => {
        if (!showOutputPopup) return;

        const handleClickOutside = () => {
            setShowOutputPopup(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showOutputPopup]);

    return (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-md min-w-[280px]">
            {!data.root && <Handle type="target" position={Position.Top} />}
            <div className="space-y-3">
                {/* Agent Name */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">Agent</p>
                    <p className="text-sm font-semibold text-gray-900">{data.agentName || '-'}</p>
                </div>

                {/* Task ID */}
                {!data.resumedAfterSubtasksGroupId && (
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Task ID</p>
                        <p className="font-mono text-xs text-blue-600 break-all">{data.taskId}</p>
                    </div>
                )}

                {/* Status and Stop Reason */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <StatusBadge status={data.status} />
                </div>

                {/* Execution Time */}
                <div className="flex flex-row items-center">
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Execution Time</p>
                        <p className="text-sm font-mono text-gray-900">{formatDuration(data.executionTimeMs)}</p>
                    </div>
                    <div className="relative z-[1000]">
                        <div onClick={handleOutputClick} className="cursor-pointer text-sm font-semibold text-gray-600 bg-cyan-400 rounded-md px-3 py-1 flex items-center hover:shadow-lg transition-shadow">
                            output
                        </div>

                        {showOutputPopup && data.taskOutput && <TaskDataPopup handlePopupClick={handlePopupClick} data={data.taskOutput} label="Task Output" />}
                    </div>
                </div>
            </div>
            {!data.leaf && <Handle type="source" position={Position.Bottom} />}
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
            <BaseEdge id={id} path={path} />
            <EdgeLabelRenderer>
                <div style={labelStyle} className="relative z-[2000]">
                    <div onClick={handleLabelClick} className="cursor-pointer text-sm font-semibold text-gray-600 bg-cyan-400 rounded-md px-3 py-1 flex items-center hover:shadow-lg transition-shadow" >
                        input
                    </div>
                    {showPopup && data?.input && <TaskDataPopup handlePopupClick={handlePopupClick} data={data.input} label="Task Input" />}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

function TaskDataPopup({ handlePopupClick, data, label }: { handlePopupClick: (e: React.MouseEvent) => void, data: any, label: string }) {

    return (
        <div onClick={handlePopupClick} style={{ transform: 'translate(-50%, 0)', zIndex: 99 }} className="bg-cyan-100 absolute top-8 left-0 rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px]">
            <h3 className="text-sm text-gray-400 mb-3 border-b pb-2 border-gray-300">{label}</h3>
            {typeof data === 'object' && (
                <div className="space-y-2">
                    {Object.entries(data).map(([key, value]) => (
                        <TaskData key={key} label={key} value={value} />
                    ))}
                </div>
            )}
        </div>
    )
}

function TaskData({ label, value }: { label: string, value: any }) {

    return (
        <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500">{label}</span>
            <span className="text-sm text-gray-900 font-mono font-bold break-all">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
        </div>
    )

}