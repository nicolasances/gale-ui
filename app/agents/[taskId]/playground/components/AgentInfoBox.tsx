'use client';

import { AgentInfo } from "@/api/AgentsAPI";
import { AgentDefinition } from "@/api/GaleBrokerAPI";

interface AgentInfoBoxProps {
    agent: AgentDefinition | null;
    agentInfo: AgentInfo | null;
}

/**
 * Displays key information about the agent
 */
export default function AgentInfoBox({ agent, agentInfo }: AgentInfoBoxProps) {
    if (!agent) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="space-y-4">
                {/* Description */}
                <div>
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-900">{agent.description}</p>
                </div>

                <div className="flex items-center gap-8">
                    {/* Model */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Model</p>
                        <p className="font-mono text-xs text-gray-900 bg-cyan-200 rounded-full px-4 py-1">{agentInfo?.model}</p>
                    </div>

                    {/* Endpoint */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Endpoint</p>
                        <p className="font-mono text-sm text-gray-900">{agent.endpoint.baseURL}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
