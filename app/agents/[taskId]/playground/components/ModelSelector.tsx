'use client';

interface ModelSelectorProps {
    models: string[];
    selectedModel: string;
    onModelChange: (model: string) => void;
}

/**
 * Dropdown component for selecting an LLM model from available models
 */
export default function ModelSelector({ models, selectedModel, onModelChange }: ModelSelectorProps) {
    if (!models || models.length === 0) return null;

    return (
        <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-white"
        >
            {models.map((model) => (
                <option key={model} value={model}>
                    {model}
                </option>
            ))}
        </select>
    );
}
