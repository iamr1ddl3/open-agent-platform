/**
 * Example: Using the Core Agent Engine
 * 
 * This demonstrates how to:
 * 1. Create an agent
 * 2. Register tools
 * 3. Execute tasks
 * 4. Monitor execution
 * 5. Persist state
 */

import { Agent } from './agent';
import { AgentRunner } from './agent-runner';
import { ToolRegistry } from './tool-registry';
import { MemoryManager } from './memory';
import { AgentConfig, LLMResponse } from './types';
import { registerBuiltinTools } from '../tools';
import * as fs from 'fs';
import * as path from 'path';

// Mock LLM Gateway (replace with real implementation)
class MockLLMGateway {
  async chat(params: any): Promise<LLMResponse> {
    // Simulate different responses
    if (params.messages.some((m: any) => m.content.includes('hello'))) {
      return {
        content: 'Hello! I am an AI assistant. How can I help you?',
        stopReason: 'end_turn',
      };
    }

    if (params.messages.some((m: any) => m.content.includes('read'))) {
      return {
        content: 'I will read the file for you.',
        toolCalls: [
          {
            id: 'tool_1',
            name: 'read_file',
            arguments: {
              path: '/tmp/test.txt',
            },
          },
        ],
        stopReason: 'tool_use',
      };
    }

    return {
      content: 'Task completed successfully!',
      stopReason: 'end_turn',
    };
  }
}

async function example1_BasicUsage() {
  console.log('\n=== Example 1: Basic Agent Usage ===\n');

  // Create agent configuration
  const agentConfig: AgentConfig = {
    id: 'example-agent-1',
    name: 'Example Agent',
    description: 'An example autonomous agent',
    systemPrompt: 'You are a helpful assistant that can read files and execute commands.',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    tools: ['read_file', 'write_file', 'execute_command'],
    maxIterations: 5,
    temperature: 0.7,
    maxTokens: 1024,
  };

  // Create instances
  const agent = new Agent(agentConfig);
  const toolRegistry = new ToolRegistry();
  const memory = new MemoryManager({
    maxShortTermSize: 20,
    autoConsolidate: true,
  });

  // Register all built-in tools
  registerBuiltinTools(toolRegistry);

  // Create LLM gateway
  const llmGateway = new MockLLMGateway();

  // Create runner
  const runner = new AgentRunner(agent, toolRegistry, llmGateway, memory);

  // Listen to events
  runner.on('start', (data) => {
    console.log('Agent started:', data.message);
  });

  runner.on('complete', (data) => {
    console.log('Agent completed');
  });

  // Run the agent
  try {
    const result = await runner.run('Hello! Can you help me?');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function example2_Memory() {
  console.log('\n=== Example 2: Memory Management ===\n');

  const memory = new MemoryManager({
    maxShortTermSize: 10,
  });

  // Add memories
  memory.addShortTerm('The user is from New York', 0.8);
  memory.addShortTerm('User prefers detailed responses', 0.7);
  memory.addLongTerm('Always provide summaries at the end', 0.9);

  // Search memories
  const results = memory.search('user');
  console.log('Search results:', results);

  // Get statistics
  const stats = memory.getStatistics();
  console.log('Memory stats:', stats);

  // Export as text
  console.log('Memory export:');
  console.log(memory.exportAsText());
}

async function example3_ToolRegistry() {
  console.log('\n=== Example 3: Tool Registry and Execution ===\n');

  const registry = new ToolRegistry();
  registerBuiltinTools(registry);

  // List all tools
  const tools = registry.listTools();
  console.log(`Registered ${tools.length} tools:`);
  tools.slice(0, 5).forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });

  // List tools by category
  const fileTools = registry.listToolsByCategory('file');
  console.log(`\nFile tools (${fileTools.length}):`);
  fileTools.forEach((tool) => {
    console.log(`  - ${tool.name}`);
  });

  // Validate parameters
  const validation = registry.validateParams('read_file', {
    path: '/tmp/test.txt',
  });
  console.log('\nValidation result:', validation);

  // Get statistics
  const stats = registry.getStatistics();
  console.log('Registry stats:', {
    totalExecutions: stats.totalExecutions,
    successfulExecutions: stats.successfulExecutions,
    failedExecutions: stats.failedExecutions,
  });
}

async function example4_StreamingExecution() {
  console.log('\n=== Example 4: Streaming Execution ===\n');

  const agentConfig: AgentConfig = {
    id: 'example-agent-4',
    name: 'Streaming Agent',
    description: 'Agent with streaming output',
    systemPrompt: 'You are a helpful assistant.',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    tools: [],
    maxIterations: 3,
    temperature: 0.7,
    maxTokens: 512,
  };

  const agent = new Agent(agentConfig);
  const toolRegistry = new ToolRegistry();
  const llmGateway = new MockLLMGateway();
  const runner = new AgentRunner(agent, toolRegistry, llmGateway);

  // Stream execution
  for await (const event of runner.stream('Say hello')) {
    console.log(`[${event.type}]`, event.data);
  }
}

async function example5_StatePersistence() {
  console.log('\n=== Example 5: State Persistence ===\n');

  const agentConfig: AgentConfig = {
    id: 'persistent-agent',
    name: 'Persistent Agent',
    description: 'Agent with persisted state',
    systemPrompt: 'You are a helpful assistant.',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    tools: [],
    maxIterations: 3,
    temperature: 0.7,
    maxTokens: 512,
  };

  // Create and save agent state
  const agent1 = new Agent(agentConfig);
  agent1.addMessage('user', 'Hello, agent!');
  agent1.addMemory('fact', 'This is important information');

  const serialized = agent1.serialize();
  console.log('Serialized agent (first 100 chars):', serialized.substring(0, 100));

  // Save to file
  const stateFile = '/tmp/agent-state.json';
  fs.writeFileSync(stateFile, serialized);
  console.log('State saved to:', stateFile);

  // Restore from file
  const loaded = fs.readFileSync(stateFile, 'utf-8');
  const agent2 = Agent.deserialize(loaded);

  console.log('Restored agent messages:', agent2.getAllMessages().length);
  console.log('Restored agent memory:', agent2.getMemory().length);
}

async function example6_AgentConfig() {
  console.log('\n=== Example 6: Agent Configuration ===\n');

  const config: AgentConfig = {
    id: 'config-example',
    name: 'Configuration Example',
    description: 'Demonstrating agent configuration',
    systemPrompt: `You are a helpful assistant. Follow these rules:
1. Always be polite
2. Provide detailed answers
3. Use available tools when needed`,
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    tools: ['read_file', 'write_file', 'execute_command', 'web_fetch'],
    maxIterations: 10,
    temperature: 0.5,
    maxTokens: 2048,
  };

  const agent = new Agent(config);

  console.log('Agent Config:');
  console.log('  ID:', config.id);
  console.log('  Name:', config.name);
  console.log('  Model:', `${config.provider}/${config.model}`);
  console.log('  Tools:', config.tools.join(', '));
  console.log('  Max Iterations:', config.maxIterations);
  console.log('  Temperature:', config.temperature);

  // Update configuration
  agent.updateConfig({
    temperature: 0.8,
    maxIterations: 15,
  });

  const updated = agent.getConfig();
  console.log('\nAfter update:');
  console.log('  Temperature:', updated.temperature);
  console.log('  Max Iterations:', updated.maxIterations);
  console.log('  Updated At:', updated.updatedAt);
}

// Run examples
async function runAll() {
  try {
    await example1_BasicUsage();
    await example2_Memory();
    await example3_ToolRegistry();
    await example4_StreamingExecution();
    await example5_StatePersistence();
    await example6_AgentConfig();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other modules
export {
  example1_BasicUsage,
  example2_Memory,
  example3_ToolRegistry,
  example4_StreamingExecution,
  example5_StatePersistence,
  example6_AgentConfig,
  MockLLMGateway,
};

// Run if executed directly
if (require.main === module) {
  runAll();
}
