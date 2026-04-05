import { ToolSchema, ToolExecutor, ToolExecutionResult } from './types';
import * as fs from 'fs';
import * as path from 'path';

export interface RegisteredTool {
  schema: ToolSchema;
  executor: ToolExecutor;
  executionHistory: ToolExecutionResult[];
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private executionLog: ToolExecutionResult[] = [];

  /**
   * Register a new tool
   */
  register(
    schema: ToolSchema,
    executor: ToolExecutor
  ): void {
    if (this.tools.has(schema.name)) {
      throw new Error(`Tool '${schema.name}' is already registered`);
    }

    this.tools.set(schema.name, {
      schema,
      executor,
      executionHistory: [],
    });
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): void {
    this.tools.delete(toolName);
  }

  /**
   * Check if tool exists
   */
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get tool schema
   */
  getSchema(toolName: string): ToolSchema | null {
    const tool = this.tools.get(toolName);
    return tool ? tool.schema : null;
  }

  /**
   * List all registered tools
   */
  listTools(): ToolSchema[] {
    return Array.from(this.tools.values()).map((t) => t.schema);
  }

  /**
   * List tools by category
   */
  listToolsByCategory(category: string): ToolSchema[] {
    return this.listTools().filter((schema) => (schema as any).category === category);
  }

  /**
   * Get all tools for LLM (including schemas)
   */
  getToolsForLLM(): Array<{ name: string; description: string; schema: any }> {
    return this.listTools().map((schema) => ({
      name: schema.name,
      description: schema.description,
      schema: {
        type: 'object',
        properties: schema.parameters.properties,
        required: schema.parameters.required,
      },
    }));
  }

  /**
   * Validate parameters against schema
   */
  validateParams(
    toolName: string,
    params: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const schema = this.getSchema(toolName);
    if (!schema) {
      return { valid: false, errors: [`Tool '${toolName}' not found`] };
    }

    const errors: string[] = [];

    // Check required parameters
    if (schema.parameters.required) {
      for (const required of schema.parameters.required) {
        if (!(required in params)) {
          errors.push(`Missing required parameter: '${required}'`);
        }
      }
    }

    // Validate parameter types and constraints
    for (const [paramName, paramValue] of Object.entries(params)) {
      const paramDef = schema.parameters.properties[paramName];
      if (!paramDef) {
        errors.push(`Unknown parameter: '${paramName}'`);
        continue;
      }

      // Type check
      const actualType = Array.isArray(paramValue)
        ? 'array'
        : typeof paramValue;
      if (paramDef.type && actualType !== paramDef.type) {
        // Allow some flexibility for type coercion
        if (!(paramDef.type === 'number' && actualType === 'string')) {
          errors.push(
            `Parameter '${paramName}' should be ${paramDef.type}, got ${actualType}`
          );
        }
      }

      // Enum check
      if (paramDef.enum && !paramDef.enum.includes(paramValue)) {
        errors.push(
          `Parameter '${paramName}' must be one of: ${paramDef.enum.join(', ')}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute a tool
   */
  async execute(
    toolName: string,
    params: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        toolName,
        result: null,
        success: false,
        error: `Tool '${toolName}' not found`,
        duration: 0,
      };
    }

    // Validate parameters
    const validation = this.validateParams(toolName, params);
    if (!validation.valid) {
      return {
        toolName,
        result: null,
        success: false,
        error: `Validation failed: ${validation.errors.join('; ')}`,
        duration: 0,
      };
    }

    const startTime = Date.now();
    let result: any;
    let error: string | undefined;
    let success = false;

    try {
      result = await tool.executor(params);
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      result = null;
    }

    const duration = Date.now() - startTime;

    const executionResult: ToolExecutionResult = {
      toolName,
      result,
      success,
      error,
      duration,
    };

    // Log execution
    tool.executionHistory.push(executionResult);
    this.executionLog.push(executionResult);

    return executionResult;
  }

  /**
   * Get execution history for a specific tool
   */
  getToolExecutionHistory(toolName: string): ToolExecutionResult[] {
    const tool = this.tools.get(toolName);
    return tool ? [...tool.executionHistory] : [];
  }

  /**
   * Get global execution log
   */
  getExecutionLog(): ToolExecutionResult[] {
    return [...this.executionLog];
  }

  /**
   * Clear execution logs
   */
  clearExecutionLog(): void {
    this.executionLog = [];
    for (const tool of this.tools.values()) {
      tool.executionHistory = [];
    }
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    toolStats: Map<string, { count: number; successes: number; avgDuration: number }>;
  } {
    const toolStats = new Map<
      string,
      { count: number; successes: number; totalDuration: number }
    >();

    for (const execution of this.executionLog) {
      if (!toolStats.has(execution.toolName)) {
        toolStats.set(execution.toolName, {
          count: 0,
          successes: 0,
          totalDuration: 0,
        });
      }

      const stats = toolStats.get(execution.toolName)!;
      stats.count++;
      if (execution.success) stats.successes++;
      stats.totalDuration += execution.duration;
    }

    const successful = this.executionLog.filter((e) => e.success).length;
    const failed = this.executionLog.length - successful;
    const avgDuration =
      this.executionLog.length > 0
        ? this.executionLog.reduce((sum, e) => sum + e.duration, 0) /
          this.executionLog.length
        : 0;

    const toolStatsResult = new Map<
      string,
      { count: number; successes: number; avgDuration: number }
    >();
    for (const [name, stats] of toolStats) {
      toolStatsResult.set(name, {
        count: stats.count,
        successes: stats.successes,
        avgDuration: stats.totalDuration / stats.count,
      });
    }

    return {
      totalExecutions: this.executionLog.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageDuration: avgDuration,
      toolStats: toolStatsResult,
    };
  }

  /**
   * Export registry state
   */
  exportState(): string {
    const toolDefinitions = this.listTools();
    return JSON.stringify({
      tools: toolDefinitions,
      executionLog: this.executionLog,
    }, null, 2);
  }
}
