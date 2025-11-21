
export function TaskDataPopup({ handlePopupClick, data, label }: { handlePopupClick: (e: React.MouseEvent) => void, data: any, label: string }) {

    return (
        <div onClick={handlePopupClick} style={{ transform: 'translate(-50%, 0)', zIndex: 99 }} className="bg-cyan-100 absolute top-8 left-0 rounded-lg shadow-xl p-4 min-w-[300px] max-w-[500px]">
            <h3 className="text-sm text-gray-400 mb-3 border-b pb-2 border-gray-300">{label}</h3>
            {typeof data === 'object' && (
                <div className="space-y-2">
                    {Object.entries(data).map(([key, value]) => (
                        <TaskData key={key} label={key} value={value} />
                    ))}
                </div>
            )}
        </div>
    )
}

export function TaskData({ label, value }: { label: string, value: any }) {

    return (
        <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500">{label}</span>
            <span className="text-sm text-gray-900 font-mono font-bold break-all">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
        </div>
    )

}