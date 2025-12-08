'use client';

import { GaleBrokerAPI, TaskStatusRecord } from "@/api/GaleBrokerAPI";
import { useEffect, useState } from "react";
import { TaskExecutionTable } from "./components/TaskExecutionTable";
import { LaunchTaskPopup } from "./components/LaunchTaskPopup";
import Button from "@/components/Button";

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
          <Button
            onClick={() => setShowLaunchPopup(true)}
            variant="primary"
            title="Launch new task"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            <span>New task</span>
          </Button>
          <Button
            onClick={loadTasks}
            variant="ghost"
            title="Refresh"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          />
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
