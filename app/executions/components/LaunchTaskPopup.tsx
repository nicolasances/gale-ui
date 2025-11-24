'use client';

import { AgentDefinition, GaleBrokerAPI } from "@/api/GaleBrokerAPI";
import { useEffect, useState } from "react";

interface LaunchTaskPopupProps {
    onClose: () => void;
    onTaskLaunched?: () => void;
}

export function LaunchTaskPopup({ onClose, onTaskLaunched }: LaunchTaskPopupProps) {
    const [agents, setAgents] = useState<AgentDefinition[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);
    const [taskInputData, setTaskInputData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Loads all available agents from the Gale Broker API.
     */
    const loadAgents = async () => {
        try {
            const response = await new GaleBrokerAPI().getAgents();

            setAgents(response.agents);

        } catch (err) {
            setError("Failed to load agents");
        }
    };

    // Load all agents on mount
    useEffect(() => { loadAgents(); }, []);

    // Filter agents based on search query
    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.taskId.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3);

    // Handle agent selection
    const handleSelectAgent = (agent: AgentDefinition) => {
        setSelectedAgent(agent);
        setSearchQuery("");
        setTaskInputData({});
        setError(null);
    };

    // Handle input change for dynamic form fields
    const handleInputChange = (key: string, value: any, type: string) => {
        setTaskInputData(prev => ({
            ...prev,
            [key]: type === 'number' ? Number(value) :
                type === 'boolean' ? value === 'true' :
                    value
        }));
    };

    /**
     * Handles the submission of the task launch form using the Gale Broker API.
     */
    const handleSubmit = async () => {
        if (!selectedAgent) return;

        setIsSubmitting(true);
        setError(null);

        try {
            
            await new GaleBrokerAPI().postTask(selectedAgent.taskId, taskInputData);

            onTaskLaunched?.();

            onClose();

        } catch (err) {

            setError(`Failed to launch task: ${err instanceof Error ? err.message : 'Unknown error'}`);

        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }

    // Render input field based on schema type
    const renderInputField = (key: string, schema: any) => {
        const type = schema.type || 'string';
        const description = schema.description || '';

        if (type === 'boolean') {
            return (
                <select
                    value={taskInputData[key] !== undefined ? String(taskInputData[key]) : ''}
                    onChange={(e) => handleInputChange(key, e.target.value, type)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select...</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );
        }

        if (type === 'number' || type === 'integer') {
            return (
                <input
                    type="number"
                    value={taskInputData[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value, type)}
                    placeholder={description || `Enter ${key}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            );
        }

        if (type === 'object' || type === 'array') {
            return (
                <textarea
                    value={taskInputData[key] ? JSON.stringify(taskInputData[key], null, 2) : ''}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            handleInputChange(key, parsed, type);
                        } catch {
                            // Keep the raw value if it's not valid JSON yet
                            setTaskInputData(prev => ({ ...prev, [key]: e.target.value }));
                        }
                    }}
                    placeholder={description || `Enter ${key} as JSON`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={4}
                />
            );
        }

        // Default to text input
        return (
            <input
                type="text"
                value={taskInputData[key] || ''}
                onChange={(e) => handleInputChange(key, e.target.value, type)}
                placeholder={description || `Enter ${key}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        );
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Launch New Task</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Agent Selection */}
                    {!selectedAgent ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search for Agent
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by agent name or task ID..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />

                            {/* Search Results */}
                            {searchQuery && filteredAgents.length > 0 && (
                                <div className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                                    {filteredAgents.map((agent) => (
                                        <div
                                            key={agent.taskId}
                                            onClick={() => handleSelectAgent(agent)}
                                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="font-semibold text-gray-900">{agent.name}</div>
                                            <div className="text-sm text-gray-500 font-mono">{agent.taskId}</div>
                                            <div className="text-xs text-gray-400 mt-1">{agent.description}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchQuery && filteredAgents.length === 0 && (
                                <div className="mt-2 p-4 text-sm text-gray-500 text-center">
                                    No agents found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Selected Agent Display */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900">{selectedAgent.name}</div>
                                        <div className="text-sm text-gray-600 font-mono">{selectedAgent.taskId}</div>
                                        <div className="text-xs text-gray-500 mt-1">{selectedAgent.description}</div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedAgent(null)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Input Form */}
                            {selectedAgent.inputSchema && selectedAgent.inputSchema.properties ? (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Task Input Data</h3>
                                    {Object.entries(selectedAgent.inputSchema.properties).map(([key, schema]: [string, any]) => (
                                        <div key={key}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {key}
                                                {selectedAgent.inputSchema.required?.includes(key) && (
                                                    <span className="text-red-500 ml-1">*</span>
                                                )}
                                            </label>
                                            {schema.description && (
                                                <p className="text-xs text-gray-500 mb-1">{schema.description}</p>
                                            )}
                                            {renderInputField(key, schema)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-600">
                                    This agent does not require any input parameters.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedAgent || isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}
