import { create } from 'zustand';

interface AgentState {
  agents: any[];
  currentAgent: any | null;
  addAgent: (agent: any) => void;
  removeAgent: (agentId: string) => void;
  setCurrentAgent: (agent: any) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  currentAgent: null,
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  removeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== agentId),
    })),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
}));

interface ChatState {
  messages: any[];
  isLoading: boolean;
  addMessage: (message: any) => void;
  clearMessages: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
