import { StatusBadge } from "./StatusBadge";


/**
 * Side panel displaying detailed information about a selected node
 */
export default function NodeDetailPanel({ node, onClose, isClosing }: { node: any; onClose: () => void; isClosing: boolean }) {

    const formatExecutionTime = (ms?: number) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <aside className={`fixed top-16 right-0 bottom-0 w-96 bg-white shadow-xl z-40 overflow-y-auto border-l border-gray-200 ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Agent Execution</h2>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="space-y-2">
                    {/* Agent Name */}
                    <div className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <label className="text-xs font-semibold text-gray-500 uppercase block">Agent Name</label>
                        <div className="mt-1 text-sm text-gray-900 font-medium">{node.agentName || '-'}</div>
                    </div>

                    {/* Task ID */}
                    <div className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <label className="text-xs font-semibold text-gray-500 uppercase block">Task ID</label>
                        <div className="mt-1 text-xs text-gray-900 font-mono break-all">
                            {node.taskId || '-'}
                        </div>
                    </div>

                    {/* Task Instance ID */}
                    <div className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <label className="text-xs font-semibold text-gray-500 uppercase block">Task Instance ID</label>
                        <div className="mt-1 text-xs text-gray-900 font-mono break-all">
                            {node.taskInstanceId || '-'}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <label className="text-xs font-semibold text-gray-500 uppercase block">Status</label>
                        <div className="mt-2 flex items-center">
                            <StatusBadge status={node.status} />
                            <span className="ml-2 text-sm text-gray-700">{node.status}</span>
                        </div>
                    </div>

                    {/* Execution Time */}
                    <div className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <label className="text-xs font-semibold text-gray-500 uppercase block">Execution Time</label>
                        <div className="mt-1 text-sm text-gray-900 font-medium">
                            {formatExecutionTime(node.executionTimeMs)}
                        </div>
                    </div>

                    {/* Node Input */}
                    <div className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <label className="text-xs font-semibold text-gray-500 uppercase block">Node Input</label>
                        <div className="mt-1 text-xs text-gray-900 font-mono break-all bg-gray-100 p-3 rounded max-h-48 overflow-y-auto">
                            {node.taskInput ? (
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(node.taskInput, null, 2)}
                                </pre>
                            ) : '-'}
                        </div>
                    </div>

                    {/* Node Output */}
                    <div className="px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <label className="text-xs font-semibold text-gray-500 uppercase block">Node Output</label>
                        <div className="mt-1 text-xs text-gray-900 font-mono break-all bg-gray-100 p-3 rounded max-h-48 overflow-y-auto">
                            {node.taskOutput ? (
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(node.taskOutput, null, 2)}
                                </pre>
                            ) : '-'}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}