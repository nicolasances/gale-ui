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

}

interface GetAgentsResponse {
    agents: AgentDefinition[];
}

export interface AgentDefinition {
    name: string; // The name of the Agent.
    description: string; // The description of the Agent.
    taskId: string; // The unique identifier of the type of task this Agent can execute.
    inputSchema: any; 
    outputSchema: any; 
    endpoint: string;
}