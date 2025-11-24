import { useEffect, useRef } from 'react';
import JsonView from '@uiw/react-json-view';
import { lightTheme } from '@uiw/react-json-view/light';

interface ExpandedViewPopupProps {
    title: string;
    data: any;
    onClose: () => void;
}

/**
 * A large centered popup for viewing node input/output in expanded view
 */
export default function ExpandedViewPopup({ title, data, onClose }: ExpandedViewPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-8">
            <div
                ref={popupRef}
                className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-fade-in"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {data ? (
                        <JsonView 
                            value={data}
                            style={lightTheme}
                            displayDataTypes={false}
                            enableClipboard={true}
                        />
                    ) : (
                        <div className="text-sm text-gray-400 bg-gray-50 p-4 rounded border border-gray-200">
                            No data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
