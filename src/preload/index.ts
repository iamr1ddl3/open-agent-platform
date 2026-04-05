import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Agent
  agent: {
    run: (agentId: string, message: string, config?: any) =>
      ipcRenderer.invoke('agent:run', { agentId, message, config }),
    stream: (agentId: string, message: string, config?: any) =>
      ipcRenderer.invoke('agent:stream', { agentId, message, config }),
  },
  // LLM
  llm: {
    listProviders: () => ipcRenderer.invoke('llm:list-providers'),
    configure: (provider: string, config: any) =>
      ipcRenderer.invoke('llm:configure', { provider, config }),
    testConnection: (provider: string) =>
      ipcRenderer.invoke('llm:test-connection', { provider }),
  },
  // Tools
  tools: {
    list: () => ipcRenderer.invoke('tools:list'),
    execute: (toolName: string, params: any) =>
      ipcRenderer.invoke('tools:execute', { toolName, params }),
  },
  // MCP
  mcp: {
    connect: (serverUrl: string) => ipcRenderer.invoke('mcp:connect', { serverUrl }),
    disconnect: (serverId: string) => ipcRenderer.invoke('mcp:disconnect', { serverId }),
    listServers: () => ipcRenderer.invoke('mcp:list-servers'),
    listTools: (serverId: string) => ipcRenderer.invoke('mcp:list-tools', { serverId }),
  },
  // Skills
  skills: {
    list: () => ipcRenderer.invoke('skills:list'),
    install: (skillPath: string) => ipcRenderer.invoke('skills:install', { skillPath }),
    uninstall: (skillId: string) => ipcRenderer.invoke('skills:uninstall', { skillId }),
  },
  // Teams
  teams: {
    create: (config: any) => ipcRenderer.invoke('teams:create', { config }),
    run: (teamId: string, task: string) => ipcRenderer.invoke('teams:run', { teamId, task }),
    list: () => ipcRenderer.invoke('teams:list'),
  },
  // Scheduler
  scheduler: {
    create: (config: any) => ipcRenderer.invoke('scheduler:create', { config }),
    list: () => ipcRenderer.invoke('scheduler:list'),
    toggle: (jobId: string, enabled: boolean) =>
      ipcRenderer.invoke('scheduler:toggle', { jobId, enabled }),
    delete: (jobId: string) => ipcRenderer.invoke('scheduler:delete', { jobId }),
  },
  // Channels
  channels: {
    connect: (type: string, config: any) =>
      ipcRenderer.invoke('channels:connect', { type, config }),
    disconnect: (channelId: string) =>
      ipcRenderer.invoke('channels:disconnect', { channelId }),
    list: () => ipcRenderer.invoke('channels:list'),
  },
  // Events
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

contextBridge.exposeInMainWorld('oap', api);

declare global {
  interface Window {
    oap: typeof api;
  }
}
