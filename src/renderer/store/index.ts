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

// Provider configuration type
interface ProviderState {
  name: string;
  apiKey: string;
  baseUrl?: string;
  models: string[];
  isConfigured: boolean;
}

// Settings state
interface SettingsState {
  settings: {
    llmProviders: Record<string, ProviderState>;
    defaultProvider: string;
    defaultModel: string;
    appTheme: 'dark' | 'light';
    fontSize: 'small' | 'medium' | 'large';
    requireToolApproval: boolean;
  };
  updateSettings: (partial: Partial<SettingsState['settings']>) => void;
  updateProvider: (provider: string, config: Partial<ProviderState>) => void;
}

export const useStore = create<SettingsState>((set, get) => ({
  settings: {
    llmProviders: {
      openai: {
        name: 'openai',
        apiKey: '',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        isConfigured: false,
      },
      anthropic: {
        name: 'anthropic',
        apiKey: '',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        isConfigured: false,
      },
      google: {
        name: 'google',
        apiKey: '',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        isConfigured: false,
      },
      ollama: {
        name: 'ollama',
        apiKey: '',
        baseUrl: 'http://localhost:11434',
        models: ['llama3', 'mistral', 'codellama'],
        isConfigured: false,
      },
    },
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    appTheme: 'dark',
    fontSize: 'medium',
    requireToolApproval: true,
  },
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
  updateProvider: (provider, config) =>
    set((state) => {
      const current = state.settings.llmProviders[provider];
      if (!current) return state;
      const updated = { ...current, ...config };
      // Mark as configured if API key is set (or always for ollama)
      updated.isConfigured = provider === 'ollama' || !!updated.apiKey;
      return {
        settings: {
          ...state.settings,
          llmProviders: {
            ...state.settings.llmProviders,
            [provider]: updated,
          },
        },
      };
    }),
}));
