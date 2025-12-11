import { AgenticFlow } from "./model/AgenticFlow";
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
     * Get a specific agent by task ID.
     * @param taskId The task ID of the agent to retrieve.
     * @returns A promise that resolves to the agent definition.
     */
    async getAgent(taskId: string): Promise<GetAgentResponse> {
        return (await new TotoAPI().fetch('gale-broker', `/catalog/agents/${taskId}`)).json()
    }

    /**
     * Gets the list of root tasks (tasks without a parent).
     * 
     * @returns the list of root tasks
     */
    async getRootTasks(): Promise<GetRootTasksResponse> {
        return (await new TotoAPI().fetch('gale-broker', `/tasks`)).json()
    }

    /**
     * Gets the execution record for a specific task instance Id.
     * 
     * @param taskInstanceId the task instance Id
     * @returns 
     */
    async getTaskExecutionRecord(taskInstanceId: string): Promise<GetTaskExecutionRecordResponse> {
        return (await new TotoAPI().fetch('gale-broker', `/tasks/${taskInstanceId}`)).json()
    }

    /**
     * Gets the execution graph for a specific correlation id (<=> root task).
     * 
     * @param correlationId the correlation id
     * @returns the execution graph
     */
    async getExecutionGraph(correlationId: string): Promise<GetExecutionGraphResponse> {

        const response = await (await new TotoAPI().fetch('gale-broker', `/flows/${correlationId}`)).json() as GetExecutionGraphResponse;

        response.flow = AgenticFlow.fromJSON(response.flow);

        return response;

    }

    /**
     * Gets all tasks for a specific correlation ID.
     * 
     * @param correlationId the correlation id
     * @returns all tasks associated with this correlation ID
     */
    async getTasksByCorrelationId(correlationId: string): Promise<GetTasksByCorrelationIdResponse> {
        return (await new TotoAPI().fetch('gale-broker', `/tasks?correlationId=${correlationId}`)).json()
    }

    /**
     * Posts a new task to be executed by an Gale Agent.
     * 
     * @param taskId the task id
     * @param taskInputData the input data needed by the task
     * @returns 
     */
    async postTask(taskId: string, taskInputData: any): Promise<any> {

        return (await new TotoAPI().fetch('gale-broker', `/tasks`, {
            method: 'POST',
            body: JSON.stringify({
                command: { command: "start" },
                taskId: taskId,
                taskInputData: taskInputData
            })
        })).json()
    }


}

interface GetAgentsResponse {
    agents: AgentDefinition[];
}

interface GetAgentResponse {
    agent: AgentDefinition;
}

interface GetRootTasksResponse {
    tasks: TaskStatusRecord[];
}

interface GetExecutionGraphResponse {
    flow: AgenticFlow;
}

interface GetTasksByCorrelationIdResponse {
    tasks: TaskStatusRecord[];
}

interface GetTaskExecutionRecordResponse {
    task: TaskStatusRecord;
}

export interface AgentDefinition {
    id: string; // The unique identifier of the Agent (i.e. DB ID)
    name: string; // The name of the Agent.
    description: string; // The description of the Agent.
    taskId: string; // The unique identifier of the type of task this Agent can execute.
    inputSchema: any;
    outputSchema: any;
    endpoint: AgentEndpoint;
}

export interface AgentEndpoint {
    baseURL: string;
    executionPath: string;
    infoPath: string;
}

export interface TaskStatusRecord {
    correlationId: string; // Correlation ID for tracing. All task instances with the same correlation ID are related to the same original root task. 
    taskId: string; // The type of task being executed
    taskInstanceId: string; // The task execution ID assigned by the Agent
    agentName?: string; // The name of the Agent executing the task
    startedAt: Date; // Timestamp when the task execution started
    stoppedAt?: Date; // Timestamp when the task execution stopped
    status: TaskStatus; // Current status of the task execution
    stopReason?: TaskStopReason; // The reason why the task execution stopped
    executionTimeMs?: number; // Execution time, in milliseconds
    parentTaskId?: string; // If this is a subtask, the parent task ID
    parentTaskInstanceId?: string; // If this is a subtask, the parent task instance ID
    resumedAfterSubtasksGroupId?: string; // If this is a task that is resumed after a subtasks group finished, track the group ID here
    subtaskGroupId?: string; // If this is a subtask, the group ID of the subtask batch
    taskOutput: any; // The output produced by the task execution
    taskInput: any; // The input data provided to the task execution
}

export type TaskStatus = "started" | "completed" | "failed";
export type TaskStopReason = "completed" | "failed" | "subtasks";