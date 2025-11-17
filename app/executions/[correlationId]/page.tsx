'use client';

import { GaleBrokerAPI, TaskExecutionGraphNode, TaskStatus, TaskStopReason } from "@/api/GaleBrokerAPI";
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
} from 'reactflow';
import 'reactflow/dist/style.css';

function StatusBadge({ status, stopReason }: { status: TaskStatus, stopReason?: TaskStopReason }) {
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

    const formatDuration = (ms?: number) => {
        if (ms === undefined) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

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
                <div>
                    <p className="text-xs text-gray-500 mb-1">Task ID</p>
                    <p className="font-mono text-xs text-blue-600 break-all">{data.taskId}</p>
                </div>

                {/* Status and Stop Reason */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <StatusBadge status={data.status} stopReason={data.stopReason} />
                </div>

                {/* Execution Time */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">Execution Time</p>
                    <p className="text-sm font-mono text-gray-900">{formatDuration(data.executionTimeMs)}</p>
                </div>
            </div>
            {!data.leaf && <Handle type="source" position={Position.Bottom} />}
        </div>
    );
}

const nodeTypes = {
    taskNode: TaskNodeComponent,
};

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
        let nodeIndex = 0;

        // BFS to create hierarchical layout
        const queue: { node: TaskExecutionGraphNode; level: number; parentId?: string; indexInLevel: number }[] = [];

        const levelCounts: Record<number, number> = {};

        queue.push({ node: root, level: 0, indexInLevel: 0 });

        levelCounts[0] = 1;

        while (queue.length > 0) {

            const { node, level, parentId, indexInLevel } = queue.shift()!;

            const nodeId = `node-${nodeIndex++}`;

            // Calculate position
            const X_STEP = 320;
            const Y_STEP = 400;

            let x = indexInLevel * X_STEP;
            const y = level * Y_STEP;

            // If the node has children, center it above its children
            if (node.children && node.children.length > 0) {
                x = (node.children.length / 2) * X_STEP - (X_STEP / 2);
            }

            nodes.push({
                id: nodeId,
                type: 'taskNode',
                position: { x, y },
                data: {
                    root: level === 0,
                    leaf: !node.children || node.children.length === 0,
                    agentName: node.record.agentName,
                    taskId: node.record.taskId,
                    status: node.record.status,
                    stopReason: node.record.stopReason,
                    executionTimeMs: node.record.executionTimeMs,
                },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
            });

            if (parentId) {
                edges.push({
                    id: `edge-${parentId}-${nodeId}`,
                    source: parentId,
                    target: nodeId,
                    // type: 'smoothstep',
                    animated: node.record.status === 'started' || node.record.status === 'waiting',
                    style: { stroke: '#bbc2ceff', strokeWidth: 3 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#213963ff',
                    },
                });
            }

            if (node.children && node.children.length > 0) {

                const nextLevel = level + 1;

                if (!levelCounts[nextLevel]) levelCounts[nextLevel] = 0;

                node.children.forEach((child, idx) => {

                    queue.push({
                        node: child,
                        level: nextLevel,
                        parentId: nodeId,
                        indexInLevel: levelCounts[nextLevel] + idx,
                    });

                });

                levelCounts[nextLevel] += node.children.length;
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

            console.log('Generated nodes:', flowNodes.length, 'edges:', flowEdges.length);
            console.log('Nodes:', flowNodes);
            console.log('Edges:', flowEdges);

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
