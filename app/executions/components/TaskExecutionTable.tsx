'use client';

import { TaskStatus, TaskStatusRecord, TaskStopReason } from "@/api/GaleBrokerAPI";
import CopyButton from "@/components/CopyButton";
import { useRouter } from "next/navigation";

export function TaskExecutionTable({ executions }: { executions: TaskStatusRecord[] }) {
    const router = useRouter();

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Agent
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Task Type
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Flow ID
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Started At
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {executions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).map((execution) => (
                            <tr
                                key={execution.taskInstanceId}
                                onClick={() => router.push(`/executions/${execution.correlationId}`)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {execution.agentName || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                                    {execution.taskId}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-400 flex items-center gap-2">
                                    <span>{execution.correlationId}</span>
                                    <CopyButton textToCopy={execution.correlationId} size={12} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(execution.startedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <StatusBadge status={execution.status} stopReason={execution.stopReason} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {executions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No task executions found
                </div>
            )}
        </div>
    );
}

/**
 * Badge component to display task status
 */
function StatusBadge({ status, stopReason }: { status: TaskStatus, stopReason?: TaskStopReason }) {
    
    const colors = {
        published: "bg-gray-100 text-gray-800",
        started: "bg-blue-100 text-blue-800",
        waiting: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
        childrenCompleted: "bg-purple-100 text-purple-800",
        childrenTriggered: "bg-purple-100 text-purple-800"
    };

    return (
        <span className={`px-2 py-1 ${colors[status]} text-xs font-medium rounded-full`}>
            {status} {stopReason === 'subtasks' ? ' (subtasks)' : ''}
        </span>
    );
}