'use client';

import { AgentDefinition, GaleBrokerAPI } from "@/api/GaleBrokerAPI";
import Button from "@/components/Button";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SchemaViewer } from "../components/SchemaViewer";

export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = decodeURIComponent(params.taskId as string);

    const [agent, setAgent] = useState<AgentDefinition | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAgent = async () => {

        setLoading(true);
        
        try {
            const response = await new GaleBrokerAPI().getAgent(taskId);
            setAgent(response.agent);
        } catch (error) {
            console.error('Failed to load agent:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAgent(); }, [taskId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Loading agent details...</p>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Agent not found</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <div className="text-xl font-bold">
                        <span className="text-cyan-400">Agent |</span> {agent.name}
                    </div>
                    <p className="text-xs text-gray-500">{agent.description}</p>
                </div>
            </div>

            {/* Playground Button */}
            <div className="mb-6">
                <Button
                    onClick={() => router.push(`/agents/${encodeURIComponent(taskId)}/playground`)}
                    variant="secondary"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                >
                    Open Playground
                </Button>
            </div>

            <div className="space-y-6">
                {/* Agent Properties */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Properties</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Task ID</p>
                            <p className="font-mono text-sm font-semibold text-gray-900">{agent.taskId}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Endpoint</p>
                            <div className="space-y-1">
                                <p className="font-mono text-sm text-gray-900">
                                    <span className="text-gray-500">Base URL:</span> {agent.endpoint.baseURL}
                                </p>
                                <p className="font-mono text-sm text-gray-900">
                                    <span className="text-gray-500">Execution Path:</span> {agent.endpoint.executionPath}
                                </p>
                                <p className="font-mono text-sm text-gray-900">
                                    <span className="text-gray-500">Info Path:</span> {agent.endpoint.infoPath}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Name</p>
                            <p className="text-sm text-gray-900">{agent.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-900">{agent.description}</p>
                        </div>
                    </div>
                </div>

                {/* Input Schema */}
                <SchemaViewer schema={agent.inputSchema} title="Input Schema" />

                {/* Output Schema */}
                <SchemaViewer schema={agent.outputSchema} title="Output Schema" />
            </div>
        </div>
    );
}
