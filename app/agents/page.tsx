'use client';

import { AgentDefinition, GaleBrokerAPI } from "@/api/GaleBrokerAPI";
import { useEffect, useState } from "react";
import { AgentCard } from "./components/AgentCard";


export default function AgentsPage() {

  const [agents, setAgents] = useState<AgentDefinition[]>([]);

  /**
   * Loads the agents from the Gale Broker API
   */
  const load = async () => {

    const response = await new GaleBrokerAPI().getAgents();

    setAgents(response.agents);

  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Agents</h1>
      <p className="text-sm text-gray-600 mb-8">Available agents registered in Gale</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (<AgentCard key={agent.taskId} agent={agent} />))}
      </div>
    </div>
  );
}
