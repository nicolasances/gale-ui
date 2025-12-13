import { AgentDefinition } from "./GaleBrokerAPI";
import { cid, TotoAPI } from "./TotoAPI";
import { v4 as uuidv4 } from 'uuid';

import Cookies from 'universal-cookie';

const cookies = new Cookies();

export class AgentPlaygroundAPI {

    constructor(private agentDefinition: AgentDefinition) { }

    /**
     * Tests a prompt override with the given agent and input parameters.
     * This leverages Gale's capability to run playground sessions by posting a new task with a prompt override, to test different prompts and models (or model parameters) without redeploying the agent.
     * 
     * @param prompt the prompt override to be tested with the Agent
     * @param agentInput the input that the agent expects (as defined in the Agent's input schema)
     * @returns the result of the execution
     */
    async sendPrompt(prompt: string, agentInput: any, model: string) {

        let idToken = cookies.get('user') ? cookies.get('user').idToken : null

        let correlationId = cid();

        const options = {
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "x-correlation-id": correlationId,
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
                command: { command: "start" },
                taskId: this.agentDefinition.taskId,
                taskInstanceId: uuidv4(),
                correlationId: correlationId,
                taskInputData: agentInput,
                playground: {
                    promptOverride: prompt, 
                    modelOverride: model
                }
            })
        };

        return fetch(`${this.agentDefinition.endpoint.baseURL}${this.agentDefinition.endpoint.executionPath}`, options).then(response => response.json());
    }

    /**
     * Retrieves detailed information about the agent from the agent /info endpoint
     */
    async getAgentInfo(): Promise<GetAgentInfoResponse> {

        let idToken = cookies.get('user') ? cookies.get('user').idToken : null

        let correlationId = cid();

        const options = {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "x-correlation-id": correlationId,
                "Authorization": `Bearer ${idToken}`
            },
        };

        return fetch(`${this.agentDefinition.endpoint.baseURL}${this.agentDefinition.endpoint.infoPath}`, options).then(response => response.json()) as Promise<GetAgentInfoResponse>;
    }
}

export interface GetAgentInfoResponse {
    agentName: string;
    description: string;
    taskId: string;
    inputSchema: any;
    outputSchema: any;
    promptTemplate?: string;
    allowedModels: string[];
}