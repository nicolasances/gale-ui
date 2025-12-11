import { TotoAPI } from "./TotoAPI";

export class GalePlaygroundAPI {

    async getAgentExperiments(agentId: string): Promise<GetAgentExperimentsResponse> {
        return (await new TotoAPI().fetch('gale-playground', `/agents/${agentId}/experiments`)).json()
    }

    /**
     * Saves an experiment in the playground for the given agent. 
     * 
     * @param taskId the task id
     * @param taskInputData the input data needed by the task
     * @returns 
     */
    async saveExperiment(experiment: GalePlaygroundExperiment): Promise<SaveExperimentResponse> {

        return (await new TotoAPI().fetch('gale-playground', `/experiments`, {
            method: 'POST',
            body: JSON.stringify(experiment)
        })).json()
    }


}

export interface SaveExperimentResponse {
    experimentId: string;
}

export interface GetAgentExperimentsResponse {
    experiments: GalePlaygroundExperiment[];
}

export interface GalePlaygroundExperiment {

    date: Date;
    agentId: string; 
    taskInputData: any; 
    playground: PlaygroundSettings;

}

export interface PlaygroundSettings {
    promptOverride: string;
}