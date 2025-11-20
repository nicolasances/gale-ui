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

const NODE_WIDTH = 360;


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
            const X_STEP = NODE_WIDTH;
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
                    status: node.record.status,
                    stopReason: node.record.stopReason,
                    executionTimeMs: node.record.executionTimeMs,
                    taskOutput: node.record.taskOutput,
                    resumedAfterSubtasksGroupId: node.record.resumedAfterSubtasksGroupId, 
                    agentType: node.record.resumedAfterSubtasksGroupId || !node.record.parentTaskId ? "orchestrator" : "agent"
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
        childrenCompleted: "bg-green-100 text-green-800"
    };

    return (
        <div className={`flex ${colors[status]} w-8 h-8 justify-center items-center rounded-full`}>
            {status === 'completed' || status == 'childrenCompleted' ? (
                <svg className="w-4 h-4 inline" viewBox="0 -3 32 32" fill="currentColor">
                    <path d="M548.783,1040.2 C547.188,1038.57 544.603,1038.57 543.008,1040.2 L528.569,1054.92 L524.96,1051.24 C523.365,1049.62 520.779,1049.62 519.185,1051.24 C517.59,1052.87 517.59,1055.51 519.185,1057.13 L525.682,1063.76 C527.277,1065.39 529.862,1065.39 531.457,1063.76 L548.783,1046.09 C550.378,1044.46 550.378,1041.82 548.783,1040.2" transform="translate(-518, -1039)" />
                </svg>
            ) : null}
        </div>
    );
}

function AgentTypeIcon({ agentType }: { agentType: string }) {

    if (agentType === 'agent') return (
        <svg className="w-8 h-8 fill-gray-700" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.7530511,13.999921 C18.9956918,13.999921 20.0030511,15.0072804 20.0030511,16.249921 L20.0030511,17.1550008 C20.0030511,18.2486786 19.5255957,19.2878579 18.6957793,20.0002733 C17.1303315,21.344244 14.8899962,22.0010712 12,22.0010712 C9.11050247,22.0010712 6.87168436,21.3444691 5.30881727,20.0007885 C4.48019625,19.2883988 4.00354153,18.2500002 4.00354153,17.1572408 L4.00354153,16.249921 C4.00354153,15.0072804 5.01090084,13.999921 6.25354153,13.999921 L17.7530511,13.999921 Z M11.8985607,2.00734093 L12.0003312,2.00049432 C12.380027,2.00049432 12.6938222,2.2826482 12.7434846,2.64872376 L12.7503312,2.75049432 L12.7495415,3.49949432 L16.25,3.5 C17.4926407,3.5 18.5,4.50735931 18.5,5.75 L18.5,10.254591 C18.5,11.4972317 17.4926407,12.504591 16.25,12.504591 L7.75,12.504591 C6.50735931,12.504591 5.5,11.4972317 5.5,10.254591 L5.5,5.75 C5.5,4.50735931 6.50735931,3.5 7.75,3.5 L11.2495415,3.49949432 L11.2503312,2.75049432 C11.2503312,2.37079855 11.5324851,2.05700336 11.8985607,2.00734093 L12.0003312,2.00049432 L11.8985607,2.00734093 Z M9.74928905,6.5 C9.05932576,6.5 8.5,7.05932576 8.5,7.74928905 C8.5,8.43925235 9.05932576,8.99857811 9.74928905,8.99857811 C10.4392523,8.99857811 10.9985781,8.43925235 10.9985781,7.74928905 C10.9985781,7.05932576 10.4392523,6.5 9.74928905,6.5 Z M14.2420255,6.5 C13.5520622,6.5 12.9927364,7.05932576 12.9927364,7.74928905 C12.9927364,8.43925235 13.5520622,8.99857811 14.2420255,8.99857811 C14.9319888,8.99857811 15.4913145,8.43925235 15.4913145,7.74928905 C15.4913145,7.05932576 14.9319888,6.5 14.2420255,6.5 Z" />
        </svg>
    )
    else return (
        <svg className="w-8 h-8 fill-gray-700" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
            <path d="M36.4,3.14a1.62,1.62,0,0,0-2.24-1,1.65,1.65,0,0,0-.59,2.38l7.28,18.18c.45.95,1.28,1.51,2.21,1.06a1.76,1.76,0,0,0,.63-2.47Z"/>
            <path d="M26.2,15.75c4.11,0,7.41,3.74,7.41,8.37s-3.3,8.37-7.41,8.37-7.41-3.74-7.41-8.37S22.09,15.75,26.2,15.75Z"/>
            <path d="M9.11,34.34l10.67,1.2L22.24,50h-3a1.87,1.87,0,0,1-1.79-1.39l-2.18-7.84-9.09-1a4.77,4.77,0,0,1-3.88-6.3L7,19.79A2.79,2.79,0,0,1,10.52,18a2.86,2.86,0,0,1,1.73,3.63L8.33,33.09A.94.94,0,0,0,9.11,34.34Z"/>
            <path d="M33.36,50h-3.2l2.43-14.29,10.09,1.91a.94.94,0,0,0,1.08-1.14l-1.42-6.4a2.85,2.85,0,0,1,2.07-3.44,2.8,2.8,0,0,1,3.38,2.1L49.87,38a4.73,4.73,0,0,1-5.38,5.8l-7.7-1.46-1.62,6.27A1.87,1.87,0,0,1,33.36,50Z"/>
            <path d="M23.31,37.29a1.1,1.1,0,0,1-1.68-.95V34.57a1.1,1.1,0,0,1,1.68-1l2.89,1.83Z"/>
            <path d="M26.2,35.45l2.88-1.83a1.1,1.1,0,0,1,1.69,1v1.77a1.11,1.11,0,0,1-1.69.95Z"/>
        </svg>
    )

}

/**
 * Displays a task node in the React Flow graph.
 * @returns 
 */
function TaskNodeComponent({ data }: { data: any }) {

    return (
        <div className={`bg-white border-2 border-gray-300 rounded-lg p-3 shadow-md min-w-[280px] w-[${NODE_WIDTH}px] max-w-[${NODE_WIDTH}px]`}>
            {!data.root && <Handle type="target" position={Position.Top} />}
            <div className="space-y-3">
                {/* Agent Name */}
                <div>
                    <div className="flex items-center gap-4">
                        <AgentTypeIcon agentType={data.agentType}/>
                        <div>
                            <div className="text-base font-semibold text-gray-900 pt-1">{data.agentName || '-'}</div>
                            {/* <div className="text-sm text-gray-500 font-mono">{formatDuration(data.executionTimeMs)}</div> */}
                        </div>
                        <div>
                            <StatusBadge status={data.status} />
                        </div>
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
                    <div onClick={handleLabelClick} className="min-h-2 cursor-pointer text-sm font-semibold text-gray-600 bg-cyan-400 rounded-md px-3 py-1 flex items-center hover:shadow-lg hover:scale-150 transition-all" >
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