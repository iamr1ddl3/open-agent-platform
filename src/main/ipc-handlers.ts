import { IpcMain } from 'electron';
import { LLMGateway } from '../llm/gateway';
import { ToolRegistry } from '../core/tool-registry';
import { AgentRunner } from '../core/agent-runner';
import { Scheduler } from '../scheduler/scheduler';
import { SkillRegistry } from '../skills/skill-registry';
import { MCPClient } from '../mcp/client';
import { TeamManager } from '../teams/team-manager';
import { ChannelManager } from '../channels/channel-manager';
import { Agent } from '../core/agent';

export function setupIpcHandlers(ipcMain: IpcMain) {
  const llmGateway = new LLMGateway();
  const toolRegistry = new ToolRegistry();
  const skillRegistry = new SkillRegistry();
  const mcpClient = new MCPClient();
  const scheduler = new Scheduler();
  const teamManager = new TeamManager(llmGateway, toolRegistry);
  const channelManager = new ChannelManager();

  // Agent execution
  ipcMain.handle('agent:run', async (_event: any, { agentId, message, config }: any) => {
    // Create or get agent instance
    const agent = new Agent({ id: agentId, name: agentId, systemPrompt: '', provider: 'anthropic', model: 'claude-3-5-sonnet', tools: [], maxIterations: 5, maxTokens: 2048, temperature: 0.7 });
    const runner = new AgentRunner(agent, toolRegistry, llmGateway);
    return await runner.run(message);
  });

  ipcMain.handle('agent:stream', async (_event: any, { agentId, message, config }: any) => {
    // Create or get agent instance
    const agent = new Agent({ id: agentId, name: agentId, systemPrompt: '', provider: 'anthropic', model: 'claude-3-5-sonnet', tools: [], maxIterations: 5, maxTokens: 2048, temperature: 0.7 });
    const runner = new AgentRunner(agent, toolRegistry, llmGateway);
    return await runner.stream(message);
  });

  // LLM Gateway
  ipcMain.handle('llm:list-providers', () => llmGateway.listProviders());
  ipcMain.handle('llm:configure', (_event: any, { provider, config }: any) => {
    llmGateway.configure(provider, config);
  });
  ipcMain.handle('llm:test-connection', (_event: any, { provider }: any) => {
    return llmGateway.testConnection(provider);
  });

  // Tools
  ipcMain.handle('tools:list', () => toolRegistry.listTools());
  ipcMain.handle('tools:execute', (_event: any, { toolName, params }) => {
    return toolRegistry.execute(toolName, params);
  });

  // MCP
  ipcMain.handle('mcp:connect', (_event: any, { serverUrl }) => mcpClient.connect(serverUrl));
  ipcMain.handle('mcp:disconnect', (_event: any, { serverId }) => mcpClient.disconnect(serverId));
  ipcMain.handle('mcp:list-servers', () => mcpClient.listServers());
  ipcMain.handle('mcp:list-tools', (_event: any, { serverId }) => mcpClient.listTools(serverId));

  // Skills
  ipcMain.handle('skills:list', () => skillRegistry.listSkills());
  ipcMain.handle('skills:install', (_event: any, { skillPath }) => skillRegistry.install(skillPath));
  ipcMain.handle('skills:uninstall', (_event: any, { skillId }) => skillRegistry.uninstall(skillId));

  // Teams
  ipcMain.handle('teams:create', (_event: any, { config }) => teamManager.createTeam(config));
  ipcMain.handle('teams:run', (_event: any, { teamId, task }) => teamManager.runTeam(teamId, task));
  ipcMain.handle('teams:list', () => teamManager.listTeams());

  // Scheduler
  ipcMain.handle('scheduler:create', (_event: any, { config }) => scheduler.createJob(config));
  ipcMain.handle('scheduler:list', () => scheduler.listJobs());
  ipcMain.handle('scheduler:toggle', (_event: any, { jobId, enabled }) => {
    return scheduler.toggleJob(jobId, enabled);
  });
  ipcMain.handle('scheduler:delete', (_event: any, { jobId }) => scheduler.deleteJob(jobId));

  // Channels
  ipcMain.handle('channels:connect', (_event: any, { type, config }) => {
    return channelManager.connect(type, config);
  });
  ipcMain.handle('channels:disconnect', (_event: any, { channelId }) => {
    return channelManager.disconnect(channelId);
  });
  ipcMain.handle('channels:list', () => channelManager.listChannels());
}
