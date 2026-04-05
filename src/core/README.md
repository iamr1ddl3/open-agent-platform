# OpenAgentPlatform Core Engine

The core agent execution engine and tools system for autonomous agent operations.

## Architecture

### Core Components

1. **types.ts** - TypeScript interfaces for agent configuration, state, messages, and tool definitions
2. **agent.ts** - Agent class managing configuration, conversation state, and memory
3. **tool-registry.ts** - Registry for tool registration, validation, and execution
4. **memory.ts** - Memory management with short-term and long-term storage
5. **agent-runner.ts** - Main execution loop (agentic loop) that coordinates LLM calls and tool execution

### Tool Categories

- **file-tools.ts** - File operations (read, write, edit, list, copy, move, delete)
- **terminal-tools.ts** - Command execution (sync, async, background processes)
- **browser-tools.ts** - Browser automation (navigation, clicking, screenshots, evaluation)
- **web-tools.ts** - Web operations (fetch, search, scrape, parse HTML)
- **tools/index.ts** - Registry of all built-in tools

## Usage Example

```typescript
import { Agent } from './core/agent';
import { AgentRunner } from './core/agent-runner';
import { ToolRegistry } from './core/tool-registry';
import { MemoryManager } from './core/memory';
import { registerBuiltinTools } from './tools';

// Create agent config
const config = {
  id: 'agent-1',
  name: 'My Agent',
  description: 'An autonomous agent',
  systemPrompt: 'You are a helpful assistant. Use tools to complete tasks.',
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  tools: ['read_file', 'write_file', 'run_command', 'web_fetch'],
  skills: [],
  maxIterations: 10,
  temperature: 0.7,
  maxTokens: 4096,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Create instances
const agent = new Agent(config);
const toolRegistry = new ToolRegistry();
const memory = new MemoryManager();

// Register all tools
registerBuiltinTools(toolRegistry);

// Create LLM gateway (implement the interface)
const llmGateway = {
  async chat(params) {
    // Call your LLM API here
    return {
      content: 'Response from LLM',
      stopReason: 'end_turn',
    };
  },
};

// Create runner
const runner = new AgentRunner(agent, toolRegistry, llmGateway, memory);

// Run agent
const result = await runner.run('What is 2 + 2?');
console.log(result);

// Or use streaming for progressive updates
for await (const event of runner.stream('Fetch the latest news')) {
  console.log(event);
}
```

## Agent Lifecycle

1. **Initialization** - Create Agent with config
2. **Tool Registration** - Register tools with ToolRegistry
3. **Execution Loop** (via AgentRunner):
   - Add user message to agent
   - Call LLM with system prompt, history, and tools
   - If LLM returns tool calls:
     - Validate parameters
     - Execute tools
     - Add tool results to history
     - Loop back to LLM
   - If LLM returns final response:
     - Return response
     - Update memory
     - End loop
4. **State Persistence** - Serialize/deserialize agent state

## Memory Management

The MemoryManager provides two levels:

- **Short-term**: Recent conversation context (configurable size)
- **Long-term**: Persistent facts and observations (saved to disk)

Memory entries have:
- Type: fact, task, observation, or decision
- Content: Text description
- Relevance: 0-1 score for importance
- Timestamp: When stored

Methods:
- `addShortTerm()` / `addLongTerm()` - Add memories
- `search()` / `searchByType()` - Find memories
- `consolidate()` - Remove low-relevance entries
- `persist()` / `load()` - Save/load from disk

## Tool System

### Tool Schema

Each tool has a schema defining:
- name: Unique identifier
- description: What it does
- category: file, terminal, browser, web, mcp, custom
- parameters: JSON schema for inputs
- requiresApproval: For sensitive operations

### Tool Execution

1. User/LLM requests tool execution
2. ToolRegistry validates parameters against schema
3. Executor function runs (async)
4. Result captured with duration and success status
5. Result added to conversation history

### Tool Validation

```typescript
const validation = toolRegistry.validateParams('read_file', {
  path: '/tmp/test.txt'
});
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Tool Execution

```typescript
const result = await toolRegistry.execute('read_file', {
  path: '/tmp/test.txt',
  startLine: 1,
  endLine: 10
});

console.log(result.success);  // true/false
console.log(result.result);   // Tool output
console.log(result.duration); // Execution time in ms
```

## Error Handling

All tools wrap errors and return:
```typescript
{
  success: false,
  error: 'Error message',
  duration: 123
}
```

The agent runner catches errors and:
- Logs them at appropriate levels
- Updates agent status
- Emits error events
- Continues execution (with iteration limit)

## Configuration Options

### Agent Config
- `maxIterations`: Stop after N iterations (prevent infinite loops)
- `temperature`: LLM sampling temperature (0-2)
- `maxTokens`: Max tokens in LLM response

### Runner Config
- `timeout`: Max time for LLM call (ms)
- `logLevel`: debug, info, warn, error

### Memory Config
- `maxShortTermSize`: Size of conversation context (default 50)
- `persistPath`: Where to save long-term memories
- `autoConsolidate`: Auto-remove low-relevance entries

## Statistics and Monitoring

```typescript
// Tool execution stats
const stats = toolRegistry.getStatistics();
console.log(stats.totalExecutions);
console.log(stats.successfulExecutions);
console.log(stats.averageDuration);
console.log(stats.toolStats); // Per-tool stats

// Memory stats
const memStats = memory.getStatistics();
console.log(memStats.totalMemories);
console.log(memStats.avgRelevance);
console.log(memStats.memoryByType);

// Agent state
const state = agent.getState();
console.log(state.status);
console.log(state.iterationCount);
console.log(state.messages.length);
```

## Streaming Execution

The `stream()` method emits events:

- `start` - Execution began
- `message_added` - Message added to history
- `iteration_start` - New iteration
- `prompt_built` - Prompt ready for LLM
- `llm_response` - LLM returned response
- `tool_calls_detected` - LLM wants to use tools
- `tool_execution_start` - Starting tool
- `tool_execution_complete` - Tool finished
- `tool_results_added` - Results in history
- `final_response` - Got final response
- `max_iterations_reached` - Hit limit
- `complete` - Execution finished
- `error` - Error occurred

## Security Considerations

- **File access**: Restricted to workspace directory
- **Tool approval**: Sensitive operations require approval flag
- **Timeouts**: Prevent infinite execution
- **Parameter validation**: All inputs validated against schema
- **Process limits**: Background process management

## Extension Points

1. **Custom Tools**: Implement `ToolExecutor` function and register
2. **Custom LLM Gateway**: Implement `LLMGateway` interface
3. **Memory Consolidation**: Override consolidation logic
4. **Event Listeners**: Listen to runner events for custom behavior

## File Structure

```
src/core/
  ├── types.ts           # TypeScript interfaces
  ├── agent.ts           # Agent class
  ├── tool-registry.ts   # Tool registration and execution
  ├── memory.ts          # Memory management
  ├── agent-runner.ts    # Execution loop
  └── README.md

src/tools/
  ├── file-tools.ts      # File operations
  ├── terminal-tools.ts  # Command execution
  ├── browser-tools.ts   # Browser automation
  ├── web-tools.ts       # Web operations
  ├── index.ts           # Tool registry
  └── (custom tools...)
```

## Next Steps

1. Implement LLMGateway for your LLM provider
2. Extend with custom tools for domain-specific operations
3. Configure memory persistence for state durability
4. Set up monitoring and logging
5. Create agent instances and run autonomous tasks
