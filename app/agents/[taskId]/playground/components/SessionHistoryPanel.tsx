'use client';

export interface PlaygroundSession {
    id: string;
    date: Date;
    prompt: string;
    inputParams: Record<string, any>;
}

interface SessionHistoryPanelProps {
    sessions: PlaygroundSession[];
    onSelectSession: (session: PlaygroundSession) => void;
    isOpen: boolean;
    isClosing: boolean;
    onClose: () => void;
}

/**
 * Side panel displaying the history of playground sessions
 */
export default function SessionHistoryPanel({ sessions, onSelectSession, isOpen, isClosing, onClose }: SessionHistoryPanelProps) {

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen && !isClosing) return null;

    return (
        <aside className={`fixed top-16 right-0 bottom-0 w-96 bg-white shadow-xl z-40 overflow-y-auto border-l border-gray-200 ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Session History</h2>
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
            <div className="p-4">
                <p className="text-xs text-gray-500 mb-4">Previous playground sessions for this agent</p>
                
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => {
                                onSelectSession(session);
                            }}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-cyan-400 transition-all text-left group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-cyan-600">
                                    {formatDate(session.date)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatTime(session.date)}
                                </span>
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-2 font-mono">
                                {session.prompt || 'No prompt'}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">
                                    {Object.keys(session.inputParams).length} params
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {sessions.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-500 italic">No previous sessions</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
