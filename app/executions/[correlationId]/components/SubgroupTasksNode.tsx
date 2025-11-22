import { Handle, Position } from "reactflow";
import AgentTypeIcon from "./AgentTypeIcon";

export const GROUP_WIDTH = 640;
/**
 * Displays a subgroup nodein the React Flow graph.
 * @returns 
 */
export function SubgroupTasksNodeComponent({ data }: { data: SubgroupData }) {

    const handleClick = () => {
        if (data.onNodeClick) {
            data.onNodeClick(data);
        }
    };

    return (
        <div onClick={handleClick}
            style={{ width: `${GROUP_WIDTH}px`, maxWidth: `${GROUP_WIDTH}px` }}
            className={`${data.isSelected ? 'bg-blue-50' : 'bg-white'} border-gray-300 border-2 rounded-lg p-3 shadow-md cursor-pointer hover:shadow-lg hover:border-gray-400 transition-all`}
        >
            <Handle type="target" position={Position.Top} />
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <AgentTypeIcon agentType="group" />
                    <div className="text-lg font-semibold text-gray-900 pt-1 flex-1 min-w-0 truncate">{data.groupId || '-'}</div>
                    {/* <div className="text-sm text-gray-500 font-mono">{formatDuration(data.executionTimeMs)}</div> */}
                    <div className="flex-shrink-0">
                        {/* <StatusBadge status={data.status} /> */}
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

export interface SubgroupData {
    groupId: string;         // Unique identifier of the subgroup.
    isSelected: boolean;     // Whether the node is currently selected.
    onNodeClick?: (data: SubgroupData) => void; // Callback when the node is clicked.
}