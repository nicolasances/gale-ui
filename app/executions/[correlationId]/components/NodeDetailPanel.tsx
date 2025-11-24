import { TaskStatusRecord } from "@/api/GaleBrokerAPI";
import { StatusBadge } from "./StatusBadge";
import { useState } from "react";
import ExpandedViewPopup from "./ExpandedViewPopup";


/**
 * Side panel displaying detailed information about a selected node
 */
export default function NodeDetailPanel({ node, onClose, isClosing }: { node: TaskStatusRecord; onClose: () => void; isClosing: boolean }) {
    const [expandedView, setExpandedView] = useState<{ title: string; data: any } | null>(null);

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
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Node Input</label>
                            <button
                                onClick={() => setExpandedView({ title: 'Node Input', data: node.taskInput })}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Expand view"
                            >
                                <svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 16q0.064 0.128 0.16 0.352t0.48 0.928 0.832 1.344 1.248 1.536 1.664 1.696 2.144 1.568 2.624 1.344 3.136 0.896 3.712 0.352 3.712-0.352 3.168-0.928 2.592-1.312 2.144-1.6 1.664-1.632 1.248-1.6 0.832-1.312 0.48-0.928l0.16-0.352q-0.032-0.128-0.16-0.352t-0.48-0.896-0.832-1.344-1.248-1.568-1.664-1.664-2.144-1.568-2.624-1.344-3.136-0.896-3.712-0.352-3.712 0.352-3.168 0.896-2.592 1.344-2.144 1.568-1.664 1.664-1.248 1.568-0.832 1.344-0.48 0.928zM10.016 16q0-2.464 1.728-4.224t4.256-1.76 4.256 1.76 1.76 4.224-1.76 4.256-4.256 1.76-4.256-1.76-1.728-4.256zM12 16q0 1.664 1.184 2.848t2.816 1.152 2.816-1.152 1.184-2.848-1.184-2.816-2.816-1.184-2.816 1.184l2.816 2.816h-4z"></path>
                                </svg>
                            </button>
                        </div>
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
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Node Output</label>
                            <button
                                onClick={() => setExpandedView({ title: 'Node Output', data: node.taskOutput })}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Expand view"
                            >
                                <svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 16q0.064 0.128 0.16 0.352t0.48 0.928 0.832 1.344 1.248 1.536 1.664 1.696 2.144 1.568 2.624 1.344 3.136 0.896 3.712 0.352 3.712-0.352 3.168-0.928 2.592-1.312 2.144-1.6 1.664-1.632 1.248-1.6 0.832-1.312 0.48-0.928l0.16-0.352q-0.032-0.128-0.16-0.352t-0.48-0.896-0.832-1.344-1.248-1.568-1.664-1.664-2.144-1.568-2.624-1.344-3.136-0.896-3.712-0.352-3.712 0.352-3.168 0.896-2.592 1.344-2.144 1.568-1.664 1.664-1.248 1.568-0.832 1.344-0.48 0.928zM10.016 16q0-2.464 1.728-4.224t4.256-1.76 4.256 1.76 1.76 4.224-1.76 4.256-4.256 1.76-4.256-1.76-1.728-4.256zM12 16q0 1.664 1.184 2.848t2.816 1.152 2.816-1.152 1.184-2.848-1.184-2.816-2.816-1.184-2.816 1.184l2.816 2.816h-4z"></path>
                                </svg>
                            </button>
                        </div>
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

            {/* Expanded View Popup */}
            {expandedView && (
                <ExpandedViewPopup
                    title={expandedView.title}
                    data={expandedView.data}
                    onClose={() => setExpandedView(null)}
                />
            )}
        </aside>
    );
}