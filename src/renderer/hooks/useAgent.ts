import { useCallback } from 'react';
import { useAgentStore } from '../store';

export function useAgent() {
  const agents = useAgentStore((state) => state.agents);
  const currentAgent = useAgentStore((state) => state.currentAgent);
  const addAgent = useAgentStore((state) => state.addAgent);
  const removeAgent = useAgentStore((state) => state.removeAgent);
  const setCurrentAgent = useAgentStore((state) => state.setCurrentAgent);

  const createAgent = useCallback(
    async (config: any) => {
      try {
        const agent = { id: Date.now().toString(), ...config };
        addAgent(agent);
        return agent;
      } catch (error) {
        console.error('Failed to create agent:', error);
        throw error;
      }
    },
    [addAgent]
  );

  const deleteAgent = useCallback(
    async (agentId: string) => {
      try {
        removeAgent(agentId);
      } catch (error) {
        console.error('Failed to delete agent:', error);
        throw error;
      }
    },
    [removeAgent]
  );

  return {
    agents,
    currentAgent,
    createAgent,
    deleteAgent,
    setCurrentAgent,
  };
}
