import { v4 as uuidv4 } from 'uuid';
import {
  AgentConfig,
  AgentState,
  ConversationMessage,
  MemoryEntry,
  ToolCallResult,
} from './types';

export interface AgentInternalState {
  id: string;
  status: AgentState;
  messages: ConversationMessage[];
  memory: MemoryEntry[];
  iterationCount: number;
  currentTask?: string;
}

export class Agent {
  private config: AgentConfig;
  private internalState: AgentInternalState;

  constructor(config: AgentConfig) {
    this.config = config;
    this.internalState = {
      id: config.id,
      status: 'idle',
      messages: [],
      memory: [],
      iterationCount: 0,
    };
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Get current agent state
   */
  getState(): AgentInternalState {
    return { ...this.internalState };
  }

  /**
   * Update agent configuration
   */
  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      updatedAt: Date.now(),
    };
  }

  /**
   * Set agent status
   */
  setStatus(status: 'idle' | 'running' | 'paused' | 'error'): void {
    this.internalState.status = status;
  }

  /**
   * Add a message to conversation history
   */
  addMessage(
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
    metadata?: Record<string, any>,
    toolCalls?: ToolCallResult[]
  ): ConversationMessage {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      toolCalls: toolCalls ? toolCalls.map(tc => ({ id: tc.toolName, name: tc.toolName, arguments: {} })) : undefined,
    };

    this.internalState.messages.push(message);
    return message;
  }

  /**
   * Get recent messages (optionally limited)
   */
  getRecentMessages(limit?: number): ConversationMessage[] {
    if (!limit) {
      return [...this.internalState.messages];
    }
    return this.internalState.messages.slice(-limit);
  }

  /**
   * Get all messages
   */
  getAllMessages(): ConversationMessage[] {
    return [...this.internalState.messages];
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.internalState.messages = [];
  }

  /**
   * Add a memory entry
   */
  addMemory(
    type: 'short_term' | 'long_term' | 'fact',
    content: string,
    importance: number = 0.5
  ): MemoryEntry {
    const entry: MemoryEntry = {
      id: uuidv4(),
      type,
      content,
      timestamp: Date.now(),
      importance: Math.min(1, Math.max(0, importance)),
      metadata: {},
    };

    this.internalState.memory.push(entry);
    return entry;
  }

  /**
   * Search memory by keyword
   */
  searchMemory(query: string): MemoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.internalState.memory
      .filter((entry) =>
        entry.content.toLowerCase().includes(lowerQuery)
      )
      .sort((a: MemoryEntry, b: MemoryEntry) => b.importance - a.importance);
  }

  /**
   * Get all memory entries
   */
  getMemory(): MemoryEntry[] {
    return [...this.internalState.memory];
  }

  /**
   * Clear memory
   */
  clearMemory(): void {
    this.internalState.memory = [];
  }

  /**
   * Update memory entry importance
   */
  updateMemoryImportance(entryId: string, importance: number): void {
    const entry = this.internalState.memory.find((e) => e.id === entryId);
    if (entry) {
      entry.importance = Math.min(1, Math.max(0, importance));
    }
  }

  /**
   * Consolidate old memories by removing low-importance entries
   */
  consolidateMemory(minImportance: number = 0.2): MemoryEntry[] {
    const removed = this.internalState.memory.filter(
      (entry) => entry.importance < minImportance
    );
    this.internalState.memory = this.internalState.memory.filter(
      (entry) => entry.importance >= minImportance
    );
    return removed;
  }

  /**
   * Set current task
   */
  setCurrentTask(task: string | undefined): void {
    this.internalState.currentTask = task;
  }

  /**
   * Get current task
   */
  getCurrentTask(): string | undefined {
    return this.internalState.currentTask;
  }

  /**
   * Increment iteration counter
   */
  incrementIteration(): void {
    this.internalState.iterationCount++;
  }

  /**
   * Get current iteration count
   */
  getIterationCount(): number {
    return this.internalState.iterationCount;
  }

  /**
   * Reset iteration counter
   */
  resetIteration(): void {
    this.internalState.iterationCount = 0;
  }

  /**
   * Reset agent to initial state (but keep config)
   */
  reset(): void {
    this.internalState = {
      id: this.config.id,
      status: 'idle',
      messages: [],
      memory: [],
      iterationCount: 0,
    };
  }

  /**
   * Serialize agent state to JSON
   */
  serialize(): string {
    return JSON.stringify({
      config: this.config,
      state: this.internalState,
    }, null, 2);
  }

  /**
   * Deserialize agent from JSON
   */
  static deserialize(json: string): Agent {
    try {
      const data = JSON.parse(json);

      // Validate structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data: expected object');
      }

      if (!data.config || typeof data.config !== 'object') {
        throw new Error('Invalid data: missing or invalid config object');
      }

      if (!data.state || typeof data.state !== 'object') {
        throw new Error('Invalid data: missing or invalid state object');
      }

      // Validate required config fields
      if (!data.config.id || typeof data.config.id !== 'string') {
        throw new Error('Invalid config: missing or invalid id');
      }

      if (!data.config.name || typeof data.config.name !== 'string') {
        throw new Error('Invalid config: missing or invalid name');
      }

      // Whitelist allowed config properties
      const allowedConfigKeys = [
        'id',
        'name',
        'description',
        'systemPrompt',
        'model',
        'provider',
        'temperature',
        'maxTokens',
        'maxIterations',
        'tools',
        'createdAt',
        'updatedAt',
      ];

      for (const key of Object.keys(data.config)) {
        if (!allowedConfigKeys.includes(key)) {
          throw new Error(`Invalid config: unexpected property "${key}"`);
        }
      }

      const agent = new Agent(data.config);
      agent.internalState = data.state;
      return agent;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to deserialize agent: ${error.message}`);
      }
      throw new Error('Failed to deserialize agent: unknown error');
    }
  }

  /**
   * Export agent state for persistence
   */
  exportState(): { config: AgentConfig; state: AgentInternalState } {
    return {
      config: this.getConfig(),
      state: this.internalState,
    };
  }

  /**
   * Get formatted context for LLM
   */
  getFormattedContext(maxMessages: number = 10, includeMemory: boolean = true): string {
    const recentMessages = this.getRecentMessages(maxMessages);
    let context = '';

    if (includeMemory && this.internalState.memory.length > 0) {
      context += '## Memory\n';
      const topMemories = this.internalState.memory
        .sort((a: MemoryEntry, b: MemoryEntry) => b.importance - a.importance)
        .slice(0, 5);

      for (const mem of topMemories) {
        context += `- [${mem.type}] ${mem.content}\n`;
      }
      context += '\n';
    }

    context += '## Recent Messages\n';
    for (const msg of recentMessages) {
      context += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        for (const call of msg.toolCalls) {
          context += `  -> Tool: ${call.name}\n`;
        }
      }
    }

    return context;
  }
}
