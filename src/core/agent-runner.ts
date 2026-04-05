import { Agent } from './agent';
import { MemoryManager } from './memory';
import { ToolRegistry } from './tool-registry';
import { AgentConfig, LLMResponse, ToolExecutionResult, ConversationMessage } from './types';
import { EventEmitter } from 'events';

/**
 * Simple rate limiter for LLM calls
 */
class RateLimiter {
  private callTimestamps: number[] = [];
  private maxCallsPerMinute: number;

  constructor(maxCallsPerMinute: number = 20) {
    this.maxCallsPerMinute = maxCallsPerMinute;
  }

  /**
   * Check if a call is allowed and throw if rate limit exceeded
   */
  checkRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old timestamps outside the 1-minute window
    this.callTimestamps = this.callTimestamps.filter(ts => ts > oneMinuteAgo);

    if (this.callTimestamps.length >= this.maxCallsPerMinute) {
      throw new Error(
        `Rate limit exceeded: maximum ${this.maxCallsPerMinute} LLM calls per minute`
      );
    }

    this.callTimestamps.push(now);
  }

  /**
   * Get current call count in the last minute
   */
  getCurrentCallCount(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    return this.callTimestamps.filter(ts => ts > oneMinuteAgo).length;
  }
}

export interface LLMGateway {
  chat(params: {
    systemPrompt: string;
    messages: Array<{ role: string; content: string }>;
    tools?: any[];
    maxTokens: number;
    temperature: number;
    provider: string;
    model: string;
  }): Promise<LLMResponse>;
}

export interface RunnerConfig {
  timeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class AgentRunner extends EventEmitter {
  private agent: Agent;
  private memory: MemoryManager;
  private toolRegistry: ToolRegistry;
  private llmGateway: LLMGateway;
  private config: RunnerConfig;
  private rateLimiter: RateLimiter;
  private startTime: number = 0;
  private executionTimeout: number = 5 * 60 * 1000; // 5 minutes default
  private iterationDelay: number = 100; // 100ms delay between iterations

  constructor(
    agent: Agent,
    toolRegistry: ToolRegistry,
    llmGateway: LLMGateway,
    memoryManager?: MemoryManager,
    config: RunnerConfig = {}
  ) {
    super();
    this.agent = agent;
    this.toolRegistry = toolRegistry;
    this.llmGateway = llmGateway;
    this.memory = memoryManager || new MemoryManager();
    this.config = {
      timeout: config.timeout ?? 300000, // 5 minutes default
      logLevel: config.logLevel ?? 'info',
    };
    this.rateLimiter = new RateLimiter(20); // 20 calls per minute default
  }

  /**
   * Log message based on log level
   */
  private log(level: string, message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.config.logLevel as keyof typeof levels] ?? 1;
    const messageLevel = levels[level as keyof typeof levels] ?? 1;

    if (messageLevel >= currentLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  /**
   * Run agent with a user message (complete flow)
   */
  async run(userMessage: string): Promise<string> {
    this.log('debug', `Starting agent run with message: ${userMessage}`);
    this.emit('start', { message: userMessage });
    this.agent.setStatus('running');
    this.agent.setCurrentTask(userMessage);
    this.startTime = Date.now();

    try {
      const result = await this.executeLoop(userMessage);
      this.log('debug', `Agent run completed with result: ${result}`);
      this.agent.setStatus('idle');
      this.emit('complete', { result });
      // Ensure we always return a string
      return result || 'No response generated';
    } catch (error) {
      this.agent.setStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Agent run failed: ${errorMessage}`, error);
      this.emit('error', { error });
      // Return error message as string instead of throwing
      return `Error: ${errorMessage}`;
    }
  }

  /**
   * Stream agent execution (emit events for progressive updates)
   */
  async *stream(userMessage: string): AsyncGenerator<any, void, unknown> {
    this.log('debug', `Starting agent stream with message: ${userMessage}`);
    this.agent.setStatus('running');
    this.agent.setCurrentTask(userMessage);

    try {
      yield { type: 'start', data: { message: userMessage } };

      const agentConfig = this.agent.getConfig();
      this.agent.addMessage('user', userMessage);
      yield { type: 'message_added', data: { role: 'user', content: userMessage } };

      let iteration = 0;
      let finalResponse = '';

      while (iteration < agentConfig.maxIterations) {
        iteration++;
        this.agent.incrementIteration();
        this.log('debug', `Iteration ${iteration} of ${agentConfig.maxIterations}`);

        yield {
          type: 'iteration_start',
          data: { iteration, maxIterations: agentConfig.maxIterations },
        };

        // Build prompt
        const prompt = this.buildPrompt(agentConfig);
        yield { type: 'prompt_built', data: { promptLength: prompt.length } };

        // Call LLM
        const llmResponse = await this.callLLM(agentConfig, prompt);
        yield { type: 'llm_response', data: { stopReason: llmResponse.stopReason } };

        this.agent.addMessage('assistant', llmResponse.content);
        finalResponse = llmResponse.content;

        // Handle tool calls
        if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
          yield {
            type: 'tool_calls_detected',
            data: { count: llmResponse.toolCalls.length },
          };

          const toolResults: ToolExecutionResult[] = [];

          for (const toolCall of llmResponse.toolCalls) {
            this.log('debug', `Executing tool: ${toolCall.name}`);
            yield {
              type: 'tool_execution_start',
              data: { toolName: toolCall.name },
            };

            const result = await this.toolRegistry.execute(
              toolCall.name,
              toolCall.arguments
            );

            yield {
              type: 'tool_execution_complete',
              data: {
                toolName: toolCall.name,
                success: result.success,
                duration: result.duration,
              },
            };

            toolResults.push(result);
          }

          // Add tool results back to agent
          const toolMessage = toolResults
            .map(
              (r) =>
                `${r.toolName}: ${r.success ? r.result : `Error: ${r.error}`}`
            )
            .join('\n');

          this.agent.addMessage('tool', toolMessage, undefined, toolResults);
          yield {
            type: 'tool_results_added',
            data: { count: toolResults.length },
          };
        } else {
          // No tool calls, we have final response
          this.log('debug', 'LLM returned final response, ending loop');
          yield { type: 'final_response', data: { content: finalResponse } };
          break;
        }

        if (llmResponse.stopReason === 'max_tokens') {
          this.log('warn', 'Hit max tokens, ending loop');
          break;
        }
      }

      if (iteration >= agentConfig.maxIterations) {
        this.log('warn', `Hit max iterations (${iteration})`);
        yield {
          type: 'max_iterations_reached',
          data: { iterations: iteration },
        };
      }

      this.agent.setStatus('idle');
      yield { type: 'complete', data: { result: finalResponse } };
    } catch (error) {
      this.agent.setStatus('error');
      this.log('error', 'Stream execution error', error);
      yield {
        type: 'error',
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
      throw error;
    }
  }

  /**
   * Execute the main agent loop
   */
  private async executeLoop(userMessage: string): Promise<string> {
    try {
      const agentConfig = this.agent.getConfig();
      this.agent.addMessage('user', userMessage);

      let iteration = 0;
      let finalResponse = '';

      while (iteration < agentConfig.maxIterations) {
        // Check execution timeout
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.executionTimeout) {
          this.log('warn', `Execution timeout exceeded (${elapsedTime}ms)`);
          throw new Error(`Agent execution timeout exceeded (${this.executionTimeout}ms)`);
        }

        // Add delay between iterations
        if (iteration > 0) {
          await new Promise(resolve => setTimeout(resolve, this.iterationDelay));
        }

        iteration++;
        this.agent.incrementIteration();
        this.log('debug', `Iteration ${iteration}/${agentConfig.maxIterations}`);

        try {
          const prompt = this.buildPrompt(agentConfig);
          const llmResponse = await this.callLLM(agentConfig, prompt);

          this.agent.addMessage('assistant', llmResponse.content);
          finalResponse = llmResponse.content;

          // Handle tool calls
          if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
            const toolResults: ToolExecutionResult[] = [];

            for (const toolCall of llmResponse.toolCalls) {
              this.log('info', `Executing tool: ${toolCall.name}`);
              const result = await this.toolRegistry.execute(
                toolCall.name,
                toolCall.arguments
              );
              toolResults.push(result);

              if (!result.success) {
                this.log('warn', `Tool failed: ${toolCall.name}`, result.error);
              }
            }

            const toolMessage = toolResults
              .map(
                (r) =>
                  `${r.toolName}: ${r.success ? r.result : `Error: ${r.error}`}`
              )
              .join('\n');

            this.agent.addMessage('tool', toolMessage, undefined, toolResults);
          } else {
            // Final response received
            this.log('debug', 'Final response received');
            break;
          }

          if (llmResponse.stopReason === 'max_tokens') {
            break;
          }
        } catch (iterationError) {
          this.log('error', `Iteration ${iteration} failed`, iterationError);
          throw iterationError;
        }
      }

      if (iteration >= agentConfig.maxIterations) {
        this.log('warn', `Max iterations reached (${iteration})`);
      }

      return finalResponse || 'No response generated';
    } catch (error) {
      this.log('error', 'Execute loop error', error);
      throw error;
    }
  }

  /**
   * Build the prompt for the LLM
   */
  private buildPrompt(agentConfig: AgentConfig): string {
    let prompt = agentConfig.systemPrompt + '\n\n';

    // Add memory context
    const memoryText = this.memory.exportAsText();
    if (memoryText.trim()) {
      prompt += '## Current Memory\n' + memoryText + '\n';
    }

    // Add recent conversation history
    const recentMessages = this.agent.getRecentMessages(10);
    prompt += '## Conversation History\n';
    for (const msg of recentMessages) {
      prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    }

    return prompt;
  }

  /**
   * Call the LLM
   */
  private async callLLM(
    agentConfig: AgentConfig,
    systemPrompt: string
  ): Promise<LLMResponse> {
    // Check rate limit before calling LLM
    this.rateLimiter.checkRateLimit();

    const messages = this.agent.getAllMessages().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const tools = agentConfig.tools.length > 0
      ? this.toolRegistry
          .listTools()
          .filter((t) => agentConfig.tools.includes(t.name))
          .map((schema) => ({
            name: schema.name,
            description: schema.description,
            input_schema: {
              type: 'object',
              properties: schema.parameters.properties,
              required: schema.parameters.required,
            },
          }))
      : undefined;

    this.log('debug', `Calling LLM: ${agentConfig.provider}/${agentConfig.model} (${this.rateLimiter.getCurrentCallCount()}/20 calls per minute)`);

    try {
      const response = await Promise.race([
        this.llmGateway.chat({
          systemPrompt,
          messages,
          tools,
          maxTokens: agentConfig.maxTokens || 2048,
          temperature: agentConfig.temperature || 0.7,
          provider: agentConfig.provider,
          model: agentConfig.model,
        }),
        new Promise<LLMResponse>((_, reject) =>
          setTimeout(
            () => reject(new Error('LLM call timeout')),
            this.config.timeout
          )
        ),
      ]);

      return response;
    } catch (error) {
      this.log('error', 'LLM call failed', error);
      throw error;
    }
  }

  /**
   * Get agent instance
   */
  getAgent(): Agent {
    return this.agent;
  }

  /**
   * Get memory manager
   */
  getMemory(): MemoryManager {
    return this.memory;
  }

  /**
   * Get tool registry
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }
}
