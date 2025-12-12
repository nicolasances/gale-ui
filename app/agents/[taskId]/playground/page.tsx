'use client';

import { AgentDefinition, GaleBrokerAPI } from "@/api/GaleBrokerAPI";
import Button from "@/components/Button";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import InputParameters from "./components/InputParameters";
import SessionHistoryPanel from "./components/SessionHistoryPanel";
import AgentInfoBox from "./components/AgentInfoBox";
import { AgentPlaygroundAPI } from "@/api/AgentsAPI";
import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import { GalePlaygroundAPI, GalePlaygroundExperiment } from "@/api/GalePlaygroundAPI";

export default function PlaygroundPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = decodeURIComponent(params.taskId as string);

    const [agent, setAgent] = useState<AgentDefinition | null>(null);
    const [prompt, setPrompt] = useState('');
    const [inputParams, setInputParams] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isHistoryClosing, setIsHistoryClosing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [experiments, setExperiments] = useState<GalePlaygroundExperiment[]>([]);
    const [agentInfo, setAgentInfo] = useState<any>(null);

    /**
     * Load pre-filled input from sessionStorage if available
     * This is used when navigating from an execution node to test it in the playground
     * Returns the pre-filled input params or null if not available
     */
    const loadPrefilledInput = (): Record<string, any> | null => {

        const storedData = sessionStorage.getItem('playgroundPrefilledInput');
        
        if (storedData) {
            const { taskId: storedTaskId, inputParams: storedInputParams, timestamp } = JSON.parse(storedData);
            
            // Only load if it's for the current agent and was stored recently (within 5 minutes)
            const isRecent = Date.now() - timestamp < 5 * 60 * 1000;
            
            if (storedTaskId === taskId && isRecent) {
                // Clear the storage after loading to avoid confusion on subsequent visits
                sessionStorage.removeItem('playgroundPrefilledInput');
                
                return storedInputParams;
            }
        }

        return null;
    };

    /**
     * Load agent manifest
     */
    const loadAgent = async () => {

        try {
            const response = await new GaleBrokerAPI().getAgent(taskId);

            setAgent(response.agent);

            loadAgentExperiments(response.agent.id);
            loadAgentInfo(response.agent);

            // Check for pre-filled input first
            const prefilledInput = loadPrefilledInput();
            
            // If the input is prefilled from a session (e.g. from the execution node in Executions, when one clicks on "Load in Playground"), use it
            if (prefilledInput) {
                setInputParams(prefilledInput);
            } 
            else if (response.agent.inputSchema?.properties) {
                // Initialize input params with default values based on schema
                const defaultParams: Record<string, any> = {};
                Object.keys(response.agent.inputSchema.properties).forEach(key => {
                    defaultParams[key] = '';
                });
                setInputParams(defaultParams);
            }
        } catch (error) {
            console.error('Failed to load agent:', error);
        }
    };

    /**
     * Retrieves agent info such as prompt template
     * 
     * @param agent the agent definition
     */
    const loadAgentInfo = async (agent: AgentDefinition) => {

        const info = await new AgentPlaygroundAPI(agent).getAgentInfo(); 

        setPrompt(info.promptTemplate || '');
        setAgentInfo(info);
    }

    /**
     * Loads the experiments for the current agent
     */
    const loadAgentExperiments = async (agentId: string) => {

        const { experiments } = await new GalePlaygroundAPI().getAgentExperiments(agentId);

        setExperiments(experiments);
    }

    useEffect(() => {
        loadAgent();
    }, [taskId]);

    /**
     * Auto-resize textarea based on content
     */
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [prompt]);

    /**
     * Tests the agent with the provided custom prompt and agent input parameters.
     */
    const testPrompt = async () => {

        setIsLoading(true);
        setResult(null);

        try {

            // 1. Invoke the Agent
            const response = await new AgentPlaygroundAPI(agent!).sendPrompt(prompt, inputParams);

            // 2. Display the response
            setResult(response);


        } catch (error) {
            console.error('Failed to test prompt:', error);
            setResult('Error testing prompt');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Update an input parameter value
     */
    const updateInputParam = (key: string, value: any) => {
        setInputParams(prev => ({ ...prev, [key]: value }));
    };

    /**
     * Load a previous session
     */
    const loadSession = (session: GalePlaygroundExperiment) => {
        setPrompt(session.playground.promptOverride || '');
        setInputParams(session.taskInputData);
    };

    /**
     * Save the current session (experiment)
     */
    const saveSession = async () => {

        if (!agent) return;

        const experiment: GalePlaygroundExperiment = {
            date: new Date(),
            agentId: agent.id,
            taskInputData: inputParams,
            playground: { promptOverride: prompt }
        };

        console.log(experiment);


        await new GalePlaygroundAPI().saveExperiment(experiment)

        // For now, just add to local state
        setExperiments(prev => [experiment, ...prev]);

    };

    /**
     * Toggle history panel
     */
    const toggleHistory = () => {
        if (isHistoryOpen) {
            setIsHistoryClosing(true);
            setTimeout(() => {
                setIsHistoryClosing(false);
                setIsHistoryOpen(false);
            }, 300);
        } else {
            setIsHistoryOpen(true);
        }
    };

    return (
        <div className={`w-full transition-all duration-300 ${isHistoryOpen ? '2xl:pr-96' : ''}`}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1">
                    <div className="text-xl font-bold">
                        <span className="text-cyan-400">Playground |</span> {agent?.name}
                    </div>
                    <p className="text-xs text-gray-500">Playground to test this agent with different prompts and configurations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={saveSession}
                        disabled={!prompt.trim()}
                        variant="primary"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                        }
                    >
                        Save
                    </Button>
                    <button
                        onClick={toggleHistory}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        History
                    </button>
                </div>
            </div>

            {/* Agent Info Box */}
            <AgentInfoBox agent={agent} />

            {/* Playground Content */}
            <div className="flex flex-col lg:flex-row gap-6 mt-6">
                {/* Left Column - Prompt Input */}
                <div className="flex-1 space-y-6">
                    {/* Prompt Input Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Agent Prompt</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {agentInfo?.promptTemplate == prompt ? (<span>This is the <span className="font-bold text-gray-900">prompt that the agent is currently using</span>. Feel free to modify it and test different variations.</span>) : 'This is your custom prompt override. If you like it better than the original, ask the Agent Developer to use this one instead.'}
                        </p>

                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter your custom prompt here..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none font-mono text-sm min-h-[120px] max-h-[500px] overflow-y-auto"
                        />                        <div className="mt-4 flex justify-end">
                            <Button
                                onClick={testPrompt}
                                disabled={!prompt.trim() || isLoading}
                                variant="primary"
                            >
                                {isLoading ? 'Testing...' : 'Test Prompt'}
                            </Button>
                        </div>
                    </div>

                    {/* Result Section */}
                    {(result || isLoading) && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">Result</h3>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                                    {result && (
                                        <JsonView
                                            value={result}
                                            style={lightTheme}
                                            displayDataTypes={false}
                                            enableClipboard={true}
                                        />)
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column - Input Parameters */}
                <div className="w-full lg:w-80">
                    <InputParameters
                        agent={agent}
                        inputParams={inputParams}
                        onUpdateParam={updateInputParam}
                    />
                </div>
            </div>

            {/* Session History Panel */}
            <SessionHistoryPanel
                sessions={experiments}
                onSelectSession={loadSession}
                isOpen={isHistoryOpen}
                isClosing={isHistoryClosing}
                onClose={toggleHistory}
            />
        </div>
    );
}
