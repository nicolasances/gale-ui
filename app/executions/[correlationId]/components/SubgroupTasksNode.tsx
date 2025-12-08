import { Handle, Position } from "reactflow";
import AgentTypeIcon from "./AgentTypeIcon";
import { StatusBadge } from "./StatusBadge";
import { AgentNode } from "@/api/model/AgenticFlow";

export const GROUP_WIDTH = 500;
export const AGENTS_PER_ROW = 8;
/**
 * Displays a subgroup nodein the React Flow graph.
 * @returns 
 */
export function SubgroupTasksNodeComponent({ data }: { data: SubgroupData }) {

    const handleClick = (agent: AgentNode) => {
        if (data.onNodeClick) {
            data.onNodeClick(agent);
        }
    };

    let status: "completed" | "started" | "failed" = "started"; 
    if (data.agents.every(r => r.status === 'completed')) status = 'completed';
    else if (data.agents.some(r => r.status === 'failed')) status = 'failed';

    const numAgents = data.agents.length;

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
                            <div className="text-lg font-semibold text-gray-900 pt-1 flex-1 min-w-0 truncate">{data.agents[0].taskId || '-'} ({numAgents})</div>
                            <div className="text-xs text-gray-500">{data.groupId}</div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 mb-2">
                            {data.agents.map((agent, index) => <SubgroupNode key={index} agent={agent} onClick={handleClick} isSelected={data.selectedTaskInstanceId === agent.taskInstanceId} />)}
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

function SubgroupNode({ agent, onClick, isSelected }: { agent: AgentNode, onClick?: (agent: AgentNode) => void, isSelected: boolean }) {

    let backgroundColor = 'bg-gray-100';
    let borderColor = 'border-gray-300';
    if (isSelected) {
        backgroundColor = 'bg-blue-100';
        borderColor = 'border-blue-500';
    } else if (agent.status === 'completed') {
        backgroundColor = 'bg-green-200';
    } else if (agent.status === 'failed') {
        backgroundColor = 'bg-red-400';
        borderColor = 'border-red-400';
    }

    return (
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${backgroundColor} ${borderColor}`} onClick={() => { if(onClick) onClick(agent) }}>
            <AgentTypeIcon agentType='agent' status={agent.status} />
        </div>
    )
}

export interface SubgroupData {
    groupId: string;         // Unique identifier of the subgroup.
    isSelected: boolean;     // Whether the node is currently selected.
    selectedTaskInstanceId?: string; // The task instance ID of the currently selected agent.
    onNodeClick?: (data: AgentNode) => void; // Callback when the node is clicked.
    agents: AgentNode[]; // List of task status records within the subgroup.
}
