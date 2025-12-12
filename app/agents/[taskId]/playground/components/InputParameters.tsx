'use client';

import { AgentDefinition } from "@/api/GaleBrokerAPI";

interface InputParametersProps {
    agent: AgentDefinition | null;
    inputParams: Record<string, any>;
    onUpdateParam: (key: string, value: any) => void;
}

/**
 * Component for rendering and managing agent input parameters
 */
export default function InputParameters({ agent, inputParams, onUpdateParam }: InputParametersProps) {

    /**
     * Render input field based on schema property type
     */
    const renderInputField = (key: string, propertySchema: any) => {
        const type = propertySchema.type || 'string';

        if (type === 'boolean') {
            return (
                <input
                    type="checkbox"
                    checked={inputParams[key] || false}
                    onChange={(e) => onUpdateParam(key, e.target.checked)}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
            );
        } else if (type === 'number' || type === 'integer') {
            return (
                <input
                    type="number"
                    value={inputParams[key] || ''}
                    onChange={(e) => onUpdateParam(key, e.target.valueAsNumber)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                />
            );
        } 
        // If the property is a JSON object or array, render a textarea for JSON input
        else if (type === 'object' || type === 'array') {
            let jsonValue = '';
            
            // Handle different types of values
            if (inputParams[key] === undefined || inputParams[key] === null) {
                jsonValue = '';
            } else if (typeof inputParams[key] === 'string') {
                // If already a string, try to parse and re-stringify for formatting
                try {
                    const parsed = JSON.parse(inputParams[key]);
                    jsonValue = JSON.stringify(parsed, null, 2);
                } catch {
                    // If not valid JSON, use as-is
                    jsonValue = inputParams[key];
                }
            } else if (typeof inputParams[key] === 'object') {
                // If it's an object or array, stringify it
                jsonValue = JSON.stringify(inputParams[key], null, 2);
            } else {
                jsonValue = String(inputParams[key]);
            }
            
            return (
                <textarea
                    value={jsonValue}
                    onChange={(e) => {
                        const value = e.target.value.trim();
                        if (!value) {
                            onUpdateParam(key, null);
                            return;
                        }
                        
                        try {
                            // Try to parse the JSON
                            const parsed = JSON.parse(value);
                            onUpdateParam(key, parsed);
                        } catch (error) {
                            // If invalid JSON, store as string temporarily
                            onUpdateParam(key, value);
                        }
                    }}
                    placeholder={type === 'array' ? '[{"key": "value"}]' : '{"key": "value"}'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm font-mono min-h-[100px] resize-y"
                />
            );
        }
        else {
            return (
                <input
                    type="text"
                    value={inputParams[key] || ''}
                    onChange={(e) => onUpdateParam(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                />
            );
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm sticky top-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Input Parameters</h3>
            <p className="text-xs text-gray-500 mb-4">
                Set the input parameters for this agent
            </p>

            {agent?.inputSchema?.properties ? (
                <div className="space-y-4">
                    {Object.entries(agent.inputSchema.properties).map(([key, propertySchema]: [string, any]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {key}
                                {agent.inputSchema.required?.includes(key) && (
                                    <span className="text-red-500 ml-1">*</span>
                                )}
                            </label>
                            {propertySchema.description && (
                                <p className="text-xs text-gray-500 mb-2">{propertySchema.description}</p>
                            )}
                            {renderInputField(key, propertySchema)}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No input parameters defined</p>
            )}
        </div>
    );
}
