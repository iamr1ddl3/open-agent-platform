# Quick Reference - File Locations & Usage

## Core Files

### Agent Management
- `/src/core/types.ts` - Type definitions (AgentConfig, AgentState, etc.)
- `/src/core/agent.ts` - Agent class (state, memory, messages)
- Usage: Create agents, manage configuration, store conversation history

### Execution Engine
- `/src/core/agent-runner.ts` - Main execution loop
- `/src/core/memory.ts` - Memory management system
- `/src/core/tool-registry.ts` - Tool registration and execution
- Usage: Execute agent tasks, manage tools, handle LLM calls

### Tools
- `/src/tools/file-tools.ts` - File operations (read, write, edit, delete)
- `/src/tools/terminal-tools.ts` - Command execution (run, background)
- `/src/tools/browser-tools.ts` - Browser automation (navigate, click, screenshot)
- `/src/tools/web-tools.ts` - Web operations (fetch, search, scrape)
- `/src/tools/index.ts` - Tool registration function
- Usage: Register tools, validate parameters, execute operations

## Configuration

- `/package.json` - Dependencies and npm scripts
- `/tsconfig.json` - TypeScript compiler options
- `/src/index.ts` - Main export point

## Documentation

- `/src/core/README.md` - Architecture overview and detailed guide
- `/src/core/example.ts` - 6 working examples
- `/CORE_ENGINE_SUMMARY.md` - High-level project summary
- `/IMPLEMENTATION.md` - Detailed implementation notes
- `/FILES_CREATED.txt` - Complete file listing
- `/QUICK_REFERENCE.md` - This file

## Common Usage Patterns

### Basic Agent Creation
```typescript
import { Agent } from './src';

const agent = new Agent({
  id: 'agent-1',
  name: 'My Agent',
  systemPrompt: 'You are helpful.',
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  tools: ['read_file', 'write_file'],
  maxIterations: 10,
  temperature: 0.7,
  maxTokens: 4096,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  skills: [],
});
```

### Register Tools
```typescript
import { ToolRegistry } from './src';
import { registerBuiltinTools } from './src/tools';

const registry = new ToolRegistry();
registerBuiltinTools(registry);
```

### Run Agent
```typescript
import { AgentRunner } from './src';

const runner = new AgentRunner(agent, registry, llmGateway, memory);
const result = await runner.run('Your task');
```

### Stream Execution
```typescript
for await (const event of runner.stream('Long task')) {
  console.log(event.type, event.data);
}
```

## File Tools Available

- `read_file(path, startLine?, endLine?)` - Read file contents
- `write_file(path, content, createDirectories?)` - Write file
- `edit_file(path, searchText, replaceText, occurrences?)` - Search and replace
- `list_directory(path, pattern?, recursive?)` - List files
- `copy_file(source, destination)` - Copy file
- `move_file(source, destination)` - Move/rename file
- `delete_file(path)` - Delete file
- `file_info(path)` - Get file metadata

## Terminal Tools Available

- `run_command(command, timeout?, cwd?, shell?)` - Execute command
- `run_command_background(command, cwd?, shell?)` - Async execution
- `kill_process(pid, signal?)` - Terminate process
- `list_processes()` - Show running processes
- `get_process_output(pid, includeError?)` - Get output
- `clear_process_output(pid)` - Clear buffers

## Browser Tools Available

- `browser_navigate(url, waitUntil?, timeout?)` - Go to URL
- `browser_click(selector, timeout?)` - Click element
- `browser_type(selector, text, delay?)` - Type text
- `browser_screenshot(path?, fullPage?, selector?)` - Capture screen
- `browser_evaluate(script, args?)` - Run JavaScript
- `browser_extract_text(selector?, includeHidden?)` - Get text
- `browser_wait(selector?, waitForNavigation?, timeout?)` - Wait
- `browser_get_title()` - Get page title
- `browser_get_url()` - Get current URL
- `browser_close(contextId?)` - Close browser

## Web Tools Available

- `web_fetch(url, method?, headers?, body?, timeout?, followRedirects?)` - HTTP request
- `web_search(query, limit?, safeSearch?)` - Search web
- `web_scrape(url, selectors, timeout?)` - Extract data
- `html_parse(html, selectors)` - Parse HTML
- `web_get_metadata(url, timeout?)` - Get page metadata
- `html_to_markdown(html, includeLinks?)` - Convert HTML
- `validate_url(url)` - Check URL validity

## Memory Operations

### Add Memory
```typescript
memory.addShortTerm('fact', 'User is from NYC');
memory.addLongTerm('decision', 'Always provide summaries');
```

### Search Memory
```typescript
const results = memory.search('user', 10);
const facts = memory.searchByType('fact', 5);
```

### Manage Memory
```typescript
memory.consolidateAll(0.2); // Remove low-relevance entries
await memory.persist(); // Save to disk
await memory.load(); // Load from disk
```

## Statistics & Monitoring

### Tool Statistics
```typescript
const stats = registry.getStatistics();
console.log(stats.totalExecutions);
console.log(stats.successfulExecutions);
console.log(stats.averageDuration);
```

### Memory Statistics
```typescript
const memStats = memory.getStatistics();
console.log(memStats.totalMemories);
console.log(memStats.avgRelevance);
```

### Agent Statistics
```typescript
const state = agent.getState();
console.log(state.status); // 'idle', 'running', 'paused', 'error'
console.log(state.iterationCount);
console.log(state.messages.length);
```

## Event Types

Available events from AgentRunner.stream():
- `start` - Execution started
- `message_added` - Message added to history
- `iteration_start` - New iteration began
- `prompt_built` - Prompt ready
- `llm_response` - LLM returned
- `tool_calls_detected` - Tools requested
- `tool_execution_start` - Tool started
- `tool_execution_complete` - Tool finished
- `tool_results_added` - Results in history
- `final_response` - Got final response
- `max_iterations_reached` - Hit limit
- `complete` - Execution done
- `error` - Error occurred

## Environment Configuration

### Workspace
Set AGENT_WORKSPACE environment variable to restrict file access:
```bash
export AGENT_WORKSPACE=/path/to/workspace
```

### Memory Persistence
Configure in MemoryManager:
```typescript
const memory = new MemoryManager({
  maxShortTermSize: 50,
  persistPath: './agent-memory.json',
  autoConsolidate: true,
});
```

## Type Definitions

Key types located in `src/core/types.ts`:
- `AgentConfig` - Agent configuration
- `AgentState` - Runtime state
- `ConversationMessage` - Message format
- `ToolSchema` - Tool definition
- `MemoryEntry` - Memory item
- `LLMResponse` - LLM output
- `ToolExecutor` - Tool function type

## Integration Checklist

- [ ] Review `src/core/README.md`
- [ ] Run examples: `npm run example`
- [ ] Implement `LLMGateway` interface
- [ ] Configure agent with your LLM provider
- [ ] Test with sample task
- [ ] Add custom tools as needed
- [ ] Set up memory persistence
- [ ] Configure monitoring/logging
- [ ] Deploy to production

## Troubleshooting

### Tool not found
Check that tool is registered in `registerBuiltinTools()` and in agent config's tools array.

### LLM not responding
Implement the `LLMGateway` interface and pass valid provider/model.

### Memory not persisting
Set `persistPath` in MemoryManager config and call `await memory.persist()`.

### Infinite loop
Check `maxIterations` setting in AgentConfig - tool calls should eventually return final response.

## Performance Tips

1. Use short-term memory window (default 50 messages)
2. Set appropriate iteration limits (10-20 typically)
3. Configure tool timeouts
4. Consolidate memory regularly
5. Monitor execution statistics

## Security Notes

- File access restricted to workspace directory
- Parameters validated before tool execution
- Sensitive operations require approval flag
- Timeouts prevent hanging processes
- Path traversal prevented

## Next Steps

1. Read `/src/core/README.md` for architecture
2. Run examples in `/src/core/example.ts`
3. Implement LLMGateway for your provider
4. Create first agent instance
5. Execute a simple task
6. Extend with custom tools

---

For detailed documentation, see the README files in each directory.
