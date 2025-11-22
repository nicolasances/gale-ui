import { Handle, Position } from "reactflow";
import AgentTypeIcon from "./AgentTypeIcon";
import { StatusBadge } from "./StatusBadge";

export const NODE_WIDTH = 320;
/**
 * Displays a task node in the React Flow graph.
 * @returns 
 */
export function TaskNodeComponent({ data }: { data: any }) {

    const handleClick = () => {
        if (data.onNodeClick) {
            data.onNodeClick(data);
        }
    };

    return (
        <div onClick={handleClick}
            style={{ width: `${NODE_WIDTH}px`, maxWidth: `${NODE_WIDTH}px` }}
            className={`${data.isSelected ? 'bg-blue-50' : 'bg-white'} border-gray-300 border-2 rounded-lg p-3 shadow-md cursor-pointer hover:shadow-lg hover:border-gray-400 transition-all`}
        >
            {!data.root && <Handle type="target" position={Position.Top} />}
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <AgentTypeIcon agentType={data.agentType} />
                    <div className="text-lg font-semibold text-gray-900 pt-1 flex-1 min-w-0 truncate">{data.record.agentName || '-'}</div>
                    <div className="flex-shrink-0">
                        <StatusBadge status={data.record.status} />
                    </div>
                </div>
            </div>
            {!data.leaf && <Handle type="source" position={Position.Bottom} />}
        </div>
    );
}