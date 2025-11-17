'use client';

import { AgentDefinition, GaleBrokerAPI } from "@/api/GaleBrokerAPI";
import { useEffect, useState } from "react";

interface SchemaProperty {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

function SchemaProperties({ schema }: { schema: any }) {
  if (!schema || !schema.properties) {
    return <p className="text-xs text-gray-400">No properties defined</p>;
  }

  const requiredFields = schema.required || [];
  const properties: SchemaProperty[] = Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
    name,
    type: prop.type || 'unknown',
    description: prop.description,
    required: requiredFields.includes(name)
  }));

  return (
    <div className="space-y-3">
      {properties.map((prop) => (

        <div key={prop.name} className="border-l-4 border-blue-300 pl-3">
        
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-sm font-medium text-gray-900">{prop.name}</span>
            {prop.required && <span className="text-red-500 text-sm">*</span>}
            <span className="text-xs text-gray-500">({prop.type})</span>
          </div>
        
          {prop.description && (
            <p className="text-xs text-gray-600 mt-1">{prop.description}</p>
          )}
        </div>

      ))}
    </div>
  );
}

export default function AgentsPage() {

  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  /**
   * Loads the agents from the Gale Broker API
   */
  const load = async () => {

    const response = await new GaleBrokerAPI().getAgents();

    setAgents(response.agents);

  }

  const toggleSchemas = (taskId: string) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  useEffect(() => {load();}, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Agents</h1>
      <p className="text-gray-600 mb-8">Available agents registered in Gale</p>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.taskId}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
                <p className="text-sm text-blue-600 font-mono">{agent.taskId}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Active
              </span>
            </div>

            <p className="text-gray-700 mb-4">{agent.description}</p>

            <button
              onClick={() => toggleSchemas(agent.taskId)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-4"
            >
              {expandedAgents.has(agent.taskId) ? '▼ Hide Schemas' : '▶ Show Schemas'}
            </button>

            {expandedAgents.has(agent.taskId) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Input Schema</h3>
                  <div className="bg-gray-50 rounded p-3 pl-2">
                    <SchemaProperties schema={agent.inputSchema} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Output Schema</h3>
                  <div className="bg-gray-50 rounded p-3">
                    <SchemaProperties schema={agent.outputSchema} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
