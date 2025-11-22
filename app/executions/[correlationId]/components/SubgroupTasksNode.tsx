import { Handle, Position } from "reactflow";
import AgentTypeIcon from "./AgentTypeIcon";
import { TaskStatusRecord } from "@/api/GaleBrokerAPI";
import { StatusBadge } from "./StatusBadge";

export const GROUP_WIDTH = 500;
export const AGENTS_PER_ROW = 8;
/**
 * Displays a subgroup nodein the React Flow graph.
 * @returns 
 */
export function SubgroupTasksNodeComponent({ data }: { data: SubgroupData }) {

    const handleClick = (record: TaskStatusRecord) => {
        if (data.onNodeClick) {
            data.onNodeClick(record);
        }
    };

    const status = data.records.every(r => r.status === 'completed') ? 'completed' : "waiting";
    const numAgents = data.records.length;

    return (
        <div
            style={{ width: `${GROUP_WIDTH}px`, maxWidth: `${GROUP_WIDTH}px` }}
            className={`${data.isSelected ? 'bg-blue-50' : 'bg-white'} border-gray-300 border-2 rounded-lg p-3 shadow-md cursor-pointer hover:shadow-lg hover:border-gray-400 transition-all`}
        >
            <Handle type="target" position={Position.Top} />
            <div className="space-y-3">
                <div className="flex gap-4 items-start">
                    <AgentTypeIcon agentType="group" />
                    <div>
                        <div className="mb-2">
                            <div className="text-lg font-semibold text-gray-900 pt-1 flex-1 min-w-0 truncate">{data.records[0].agentName || '-'} ({numAgents})</div>
                            <div className="text-xs text-gray-500">{data.groupId}</div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 mb-2">
                            {data.records.map((record, index) => <SubgroupNode key={index} record={record} onClick={handleClick} isSelected={data.selectedTaskInstanceId === record.taskInstanceId} />)}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <StatusBadge status={status} />
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

function SubgroupNode({ record, onClick, isSelected }: { record: TaskStatusRecord, onClick?: (record: TaskStatusRecord) => void, isSelected: boolean }) {

    return (
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${isSelected ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'}`} onClick={() => { if(onClick) onClick(record) }}>
            <AgentTypeIcon agentType='agent' />
        </div>
    )
}

export interface SubgroupData {
    groupId: string;         // Unique identifier of the subgroup.
    isSelected: boolean;     // Whether the node is currently selected.
    selectedTaskInstanceId?: string; // The task instance ID of the currently selected agent.
    onNodeClick?: (data: TaskStatusRecord) => void; // Callback when the node is clicked.
    records: TaskStatusRecord[]; // List of task status records within the subgroup.
}
