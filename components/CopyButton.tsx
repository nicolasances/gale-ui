'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CopyButtonProps {
    textToCopy: string;
    size?: number;
}

/**
 * A button component that copies text to clipboard with visual feedback
 */
export default function CopyButton({ textToCopy, size = 14 }: CopyButtonProps) {
    const [isPressed, setIsPressed] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setIsPressed(true);
            setTimeout(() => setIsPressed(false), 200);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`inline-flex items-center justify-center p-1 rounded transition-all duration-200 hover:bg-gray-200 ${
                isPressed ? 'scale-90 bg-green-200' : ''
            }`}
            title="Copy to clipboard"
            type="button"
        >
            <Image
                src="/copy.svg"
                alt="Copy"
                width={size}
                height={size}
                className={`transition-colors duration-200 ${
                    isPressed ? 'opacity-70' : 'opacity-50 hover:opacity-100'
                }`}
            />
        </button>
    );
}
