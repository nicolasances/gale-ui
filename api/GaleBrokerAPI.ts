import { TotoAPI } from "./TotoAPI";

export class GaleBrokerAPI {

    /**
     * Get the total points for a specific day.
     * @param day The day to get the total points for (format: YYYYMMDD).
     * @returns A promise that resolves to the total points for the day.
     */
    async getAgents(): Promise<GetAgentsResponse> {
        return (await new TotoAPI().fetch('gale-broker', `/catalog/agents`)).json()
    }

    /**
     * Gets the list of root tasks (tasks without a parent).
     * 
     * @returns the list of root tasks
     */
    async getRootTasks(): Promise<GetRootTasksResponse> {
        return (await new TotoAPI().fetch('gale-broker', `/tasks`)).json()
    }

}

interface GetAgentsResponse {
    agents: AgentDefinition[];
}

interface GetRootTasksResponse {
    tasks: TaskStatusRecord[];
}

export interface AgentDefinition {
    name: string; // The name of the Agent.
    description: string; // The description of the Agent.
    taskId: string; // The unique identifier of the type of task this Agent can execute.
    inputSchema: any; 
    outputSchema: any; 
    endpoint: string;
}

export interface TaskStatusRecord {
    correlationId: string; // Correlation ID for tracing. All task instances with the same correlation ID are related to the same original root task. 
    taskId: string; // The type of task being executed
    taskInstanceId: string; // The task execution ID assigned by the Agent
    agentName?: string; // The name of the Agent executing the task
    startedAt: Date; // Timestamp when the task execution started
    status: TaskStatus; // Current status of the task execution
    stopReason?: TaskStopReason; // The reason why the task execution stopped
    executionTimeMs?: number; // Execution time, in milliseconds
    parentTaskId?: string; // If this is a subtask, the parent task ID
    parentTaskInstanceId?: string; // If this is a subtask, the parent task instance ID
    subtaskGroupId?: string; // If this is a subtask, the group ID of the subtask batch
    taskOutput: any; // The output produced by the task execution
    taskInput: any; // The input data provided to the task execution
}

export type TaskStatus = "published" | "started" | "waiting" | "completed" | "failed" | "childrenCompleted"; 
export type TaskStopReason = "completed" | "failed" | "subtasks";