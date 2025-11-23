'use client';

import { AgentDefinition } from "@/api/GaleBrokerAPI";
import { useRouter } from "next/navigation";

export function AgentCard({ agent }: { agent: AgentDefinition }) {

    const router = useRouter();

    return (
        <div 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => router.push(`/agents/${encodeURIComponent(agent.taskId)}`)}
        >

            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="text-base font-semibold text-gray-900">{agent.name}</div>
                    <div className="text-xs text-blue-600">Task Identifier: <span className="font-mono text-gray-700 font-bold">{agent.taskId}</span></div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                </span>
            </div>

            <p className="text-xs text-gray-700 mb-2">{agent.description}</p>

        </div>
    )
}