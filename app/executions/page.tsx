'use client';

import { GaleBrokerAPI, TaskStatus, TaskStatusRecord, TaskStopReason } from "@/api/GaleBrokerAPI";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ExecutionsPage() {

  const router = useRouter();
  const [tasks, setTasks] = useState<TaskStatusRecord[]>([]);
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());

  /**
   * Loads the root tasks from the Gale Broker API.
   * Root tasks are tasks that do not have a parent task, hence they are the starting points of task executions.
   */
  const loadTasks = async () => {

    const response = await new GaleBrokerAPI().getRootTasks();

    setTasks(response.tasks);

  }

  const toggleDetails = (taskInstanceId: string) => {
    setExpandedExecutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskInstanceId)) {
        newSet.delete(taskInstanceId);
      } else {
        newSet.add(taskInstanceId);
      }
      return newSet;
    });
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  useEffect(() => { loadTasks(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Task Executions</h1>
        <button
          onClick={loadTasks}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <p className="text-gray-600 mb-8">History of all task executions in Gale</p>

      <div className="space-y-3">
        {tasks.map((execution) => (
          <div
            key={execution.taskInstanceId}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/executions/${execution.correlationId}`)}
          >
            {/* Main execution info */}
            <div className="grid grid-cols-6 gap-4 items-start mb-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Agent</p>
                <p className="text-sm text-gray-900">{execution.agentName || '-'}</p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Task Type</p>
                <p className="font-mono text-sm font-semibold text-gray-900">{execution.taskId}</p>
                <p className="text-xs text-gray-400 font-mono">{execution.taskInstanceId}</p>
              </div>


              <div>
                <p className="text-xs text-gray-500 mb-1">Started At</p>
                <p className="text-sm text-gray-900">{new Date(execution.startedAt).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <StatusBadge status={execution.status} stopReason={execution.stopReason} />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-sm font-mono text-gray-900">{formatDuration(execution.executionTimeMs)}</p>
              </div>
            </div>

            {/* Details toggle button */}
            <button
              onClick={() => toggleDetails(execution.taskInstanceId)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {expandedExecutions.has(execution.taskInstanceId) ? '▼ Hide Details' : '▶ Show Details'}
            </button>

            {/* Details section */}
            {expandedExecutions.has(execution.taskInstanceId) && (

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-6">
                  {/* Metadata */}
                  <div className="col-span-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Metadata</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Correlation ID:</span>
                        <span className="ml-2 font-mono text-gray-900">{execution.correlationId}</span>
                      </div>
                      {execution.parentTaskId && (
                        <>
                          <div>
                            <span className="text-gray-500">Parent Task:</span>
                            <span className="ml-2 font-mono text-gray-900">{execution.parentTaskId}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Parent Instance:</span>
                            <span className="ml-2 font-mono text-gray-900">{execution.parentTaskInstanceId}</span>
                          </div>
                        </>
                      )}
                      {execution.subtaskGroupId && (
                        <div>
                          <span className="text-gray-500">Subtask Group:</span>
                          <span className="ml-2 font-mono text-gray-900">{execution.subtaskGroupId}</span>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Input */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Task Input</h4>
                    <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
                      {JSON.stringify(execution.taskInput, null, 2)}
                    </pre>
                  </div>

                  {/* Output */}
                  <div className="">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Task Output</h4>
                    <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
                      {JSON.stringify(execution.taskOutput, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

            )}
          </div>
        ))}
      </div>
    </div>
  );
}


/**
 * Badge component to display task status
 * @param param0 
 * @returns 
 */
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
    <span className={`px-2 py-1 ${colors[status]} text-xs font-medium rounded-full`}>
      {status} {stopReason == 'subtasks' ? ' (subtasks)' : ''}
    </span>
  );
}