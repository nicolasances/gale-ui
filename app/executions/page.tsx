'use client';

import { GaleBrokerAPI, TaskStatusRecord } from "@/api/GaleBrokerAPI";
import { useEffect, useState } from "react";
import { TaskExecutionTable } from "./components/TaskExecutionTable";
import { LaunchTaskPopup } from "./components/LaunchTaskPopup";

export default function ExecutionsPage() {

  const [tasks, setTasks] = useState<TaskStatusRecord[]>([]);
  const [showLaunchPopup, setShowLaunchPopup] = useState(false);

  /**
   * Loads the root tasks from the Gale Broker API.
   * Root tasks are tasks that do not have a parent task, hence they are the starting points of task executions.
   */
  const loadTasks = async () => {

    const response = await new GaleBrokerAPI().getRootTasks();

    setTasks(response.tasks);

  }

  useEffect(() => { loadTasks(); }, []);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Task Executions</h1>
          <p className="text-sm text-gray-600">History of all task executions in Gale</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowLaunchPopup(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm" 
            title="Launch new task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Launch Task
          </button>
          <button onClick={loadTasks} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh" >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <TaskExecutionTable executions={tasks} />

      {/* Launch Task Popup */}
      {showLaunchPopup && (
        <LaunchTaskPopup 
          onClose={() => setShowLaunchPopup(false)}
          onTaskLaunched={loadTasks}
        />
      )}
    </div>
  );
}
