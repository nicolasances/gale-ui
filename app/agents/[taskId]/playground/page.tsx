'use client';

import { AgentDefinition, GaleBrokerAPI } from "@/api/GaleBrokerAPI";
import Button from "@/components/Button";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import InputParameters from "./components/InputParameters";

export default function PlaygroundPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = decodeURIComponent(params.taskId as string);

    const [agent, setAgent] = useState<AgentDefinition | null>(null);
    const [prompt, setPrompt] = useState('');
    const [inputParams, setInputParams] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Load agent manifest
     */
    const loadAgent = async () => {
        try {
            const response = await new GaleBrokerAPI().getAgent(taskId);
            setAgent(response.agent);
            
            // Initialize input params with default values based on schema
            if (response.agent.inputSchema?.properties) {
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
     * Tests the agent with the provided custom prompt
     */
    const testPrompt = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            // TODO: Integrate with API
            // const response = await new GaleBrokerAPI().testAgentPrompt(taskId, prompt, inputParams);
            // setResult(response.result);

            // Placeholder for now
            await new Promise(resolve => setTimeout(resolve, 1000));
            setResult('Test result will appear here');

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

    return (
        <div className="max-w-5xl">
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
                <div>
                    <div className="text-xl font-bold">
                        <span className="text-cyan-400">Playground |</span> {taskId}
                    </div>
                    <p className="text-xs text-gray-500">Test custom prompts with this agent</p>
                </div>
            </div>

            {/* Playground Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Prompt Input */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Prompt Input Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Custom Prompt</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Enter a prompt that will override the agent's default prompt for this test
                        </p>
                        
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter your custom prompt here..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none font-mono text-sm min-h-[120px] max-h-[500px] overflow-y-auto"
                        />

                        <div className="mt-4 flex justify-end">
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
                                    {result}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column - Input Parameters */}
                <div className="lg:col-span-1">
                    <InputParameters
                        agent={agent}
                        inputParams={inputParams}
                        onUpdateParam={updateInputParam}
                    />
                </div>
            </div>
        </div>
    );
}
