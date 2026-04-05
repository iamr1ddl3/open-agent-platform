/**
 * OpenAgentPlatform - Core Engine & Tools System
 * 
 * Main export point for the agent platform core functionality
 */

// Core Engine Exports
export { Agent } from './core/agent';
export { AgentRunner } from './core/agent-runner';
export { ToolRegistry } from './core/tool-registry';
export { MemoryManager } from './core/memory';

// Type Exports
export type {
  AgentConfig,
  AgentState,
  ConversationMessage,
  ToolCallResult,
  MemoryEntry,
  ToolSchema,
  ToolExecutor,
  LLMResponse,
  ToolExecutionResult,
} from './core/types';

// Tool Exports
export {
  readFile,
  writeFile,
  editFile,
  listDirectory,
  copyFile,
  moveFile,
  deleteFile,
  fileInfo,
} from './tools/file-tools';

export {
  runCommand,
  runCommandBackground,
  killProcess,
  listProcesses,
  getProcessOutput,
  clearProcessOutput,
} from './tools/terminal-tools';

export {
  browserNavigate,
  browserClick,
  browserType,
  browserScreenshot,
  browserEvaluate,
  browserExtractText,
  browserWait,
  browserGetTitle,
  browserGetUrl,
  browserClose,
} from './tools/browser-tools';

export {
  webFetch,
  webSearch,
  webScrape,
  htmlParse,
  webGetMetadata,
  htmlToMarkdown,
  validateUrl,
} from './tools/web-tools';

export { registerBuiltinTools } from './tools/index';

/**
 * Quick start example
 * 
 * import {
 *   Agent,
 *   AgentRunner,
 *   ToolRegistry,
 *   MemoryManager,
 *   registerBuiltinTools,
 * } from '@open-agent-platform/core';
 * 
 * const agent = new Agent(config);
 * const registry = new ToolRegistry();
 * registerBuiltinTools(registry);
 * 
 * const runner = new AgentRunner(
 *   agent,
 *   registry,
 *   llmGateway,
 *   memory
 * );
 * 
 * const result = await runner.run('Your task');
 */
