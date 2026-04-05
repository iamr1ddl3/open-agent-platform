// ===== Core Agent Types =====

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tools: string[];
  maxIterations: number;
  updatedAt?: number;
}

export type AgentState = 'idle' | 'running' | 'error' | 'paused';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolCallResult {
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolExecutor {
  (params: Record<string, any>): Promise<any>;
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export interface MemoryEntry {
  id: string;
  type: 'short_term' | 'long_term' | 'fact';
  content: string;
  metadata: Record<string, any>;
  timestamp: number;
  importance: number;
  relatedEntries?: string[];
}

// ===== Legacy/Compatibility Types =====

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  llmProvider: string;
  tools: string[];
  memory: AgentMemory;
  config: Record<string, any>;
}

export interface AgentMemory {
  conversationHistory: Message[];
  maxMessages: number;
  contextWindow: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolUse?: ToolUseBlock[];
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  schema: Record<string, any>;
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  toolUse?: ToolUseBlock[];
  stopReason: 'stop' | 'tool_calls' | 'tool_use' | 'end_turn' | 'max_tokens' | 'length' | 'error';

  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error';
  data: any;
}

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  tools: Tool[];
  commands: SkillCommand[];
  config?: Record<string, any>;
}

export interface SkillCommand {
  name: string;
  description: string;
  execute: (args: Record<string, any>) => Promise<any>;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  lead: Agent;
  config: TeamConfig;
}

export interface TeamConfig {
  maxIterations?: number;
  communicationMethod?: 'sequential' | 'parallel';
  decisionMaker?: 'lead' | 'consensus' | 'voting';
}

export interface Schedule {
  id: string;
  name: string;
  cronExpression: string;
  agentId: string;
  task: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
}

export interface Channel {
  id: string;
  type: 'telegram' | 'discord' | 'slack';
  name: string;
  connected: boolean;
  config: Record<string, any>;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  tools: Tool[];
  connected: boolean;
}
