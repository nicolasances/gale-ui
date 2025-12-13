'use client';

import Select from '@/components/Select';
import Image from 'next/image';

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
        <div className='flex items-center gap-2'>
            <Image
                src="/ai.svg"
                alt="AI Model"
                width={20}
                height={20}
                className="opacity-60"
            />
            <Select
                options={options}
                value={selectedModel}
                onChange={onModelChange}
                placeholder="Select a model"
                className='bg-cyan-200'
            />
        </div>
    );
}
