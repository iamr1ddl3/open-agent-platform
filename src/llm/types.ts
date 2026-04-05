export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface LLMProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
}

export interface LLMRequest {
  messages: LLMMessage[];
  tools?: ToolDefinition[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  stopReason: 'stop' | 'tool_calls' | 'tool_use' | 'end_turn' | 'max_tokens' | 'length' | 'error';
}

export interface LLMStreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: Partial<ToolCall>;
  error?: string;
}

export interface LLMProviderInterface {
  name: LLMProvider;
  configure(config: LLMProviderConfig): void;
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
  testConnection(): Promise<boolean>;
  listModels(): Promise<string[]>;
}
