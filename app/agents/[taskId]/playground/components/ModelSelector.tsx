'use client';

import Select from '@/components/Select';

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

    const options = models.map(model => ({
        value: model,
        label: model
    }));

    return (
        <Select
            options={options}
            value={selectedModel}
            onChange={onModelChange}
            placeholder="Select a model"
        />
    );
}
