# LLM Gateway - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### 2. Set Environment Variables

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=...
```

### 3. Basic Usage

```typescript
import { getLLMGateway } from './src/llm';

const gateway = getLLMGateway();

// Configure
gateway.configureProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
});

// Use
const response = await gateway.complete({
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.content);
```

## Common Tasks

### Switch Between Providers

```typescript
// Use OpenAI
const gptResponse = await gateway.complete(request, 'openai');

// Use Claude
const claudeResponse = await gateway.complete(request, 'anthropic');

// Use Gemini
const geminiResponse = await gateway.complete(request, 'google');

// Use local Ollama
const ollamaResponse = await gateway.complete(request, 'ollama');
```

### Stream Responses

```typescript
for await (const chunk of gateway.stream(request)) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content || '');
  }
}
```

### Use Tool Calling

```typescript
const response = await gateway.complete({
  messages: [
    { role: 'user', content: 'What is the weather?' }
  ],
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        },
        required: ['location']
      }
    }
  ]
});

if (response.toolCalls) {
  for (const call of response.toolCalls) {
    console.log(`Call ${call.name}:`, call.arguments);
  }
}
```

### Configure All Providers At Once

```typescript
gateway.configureMultiple({
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo',
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.0-flash',
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
  }
});
```

### Test Connections

```typescript
// Test single provider
const connected = await gateway.testConnection('anthropic');
console.log(`Connected: ${connected}`);

// Test all
const status = await gateway.testAllConnections();
console.log(status);
// { openai: true, anthropic: true, google: false, ollama: true }
```

### List Available Models

```typescript
const models = await gateway.listModels('openai');
console.log('OpenAI models:', models);
```

## Provider-Specific Details

### OpenAI
- Requires API key
- Supports: gpt-4, gpt-4-turbo, gpt-3.5-turbo
- Tool calling: Full support

### Anthropic (Claude)
- Requires API key
- Supports: claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-3-5-sonnet
- Tool calling: Full support

### Google (Gemini)
- Requires API key
- Supports: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
- Tool calling: Supported via function declarations

### Ollama (Local)
- No API key required
- Must be running: `ollama serve`
- Default port: 11434
- Popular models: llama2, mistral, neural-chat

## Troubleshooting

### "Provider not configured"
```typescript
// Make sure to configure before using
gateway.configureProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
});
```

### "Connection failed"
```typescript
// Check the connection
const connected = await gateway.testConnection('anthropic');
if (!connected) {
  console.log('Check API key and credentials');
}
```

### Ollama not responding
```bash
# Make sure Ollama is running
ollama serve

# In another terminal, pull a model
ollama pull llama2

# Then it should work
const response = await gateway.complete(request, 'ollama');
```

## Type Hints

### LLMRequest
```typescript
interface LLMRequest {
  messages: LLMMessage[];      // Array of messages
  tools?: ToolDefinition[];    // Optional tools
  stream?: boolean;            // Enable streaming
  maxTokens?: number;          // Max response length
  temperature?: number;        // 0-1, higher = more creative
}
```

### LLMResponse
```typescript
interface LLMResponse {
  content: string;             // Response text
  toolCalls?: ToolCall[];      // If tools were called
  usage?: {                    // Token usage
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;        // How it ended (stop, tool_calls, length, error)
}
```

## Examples

See `examples.ts` for 12 complete, runnable examples covering:
1. Basic usage
2. Multi-provider setup
3. Streaming
4. Tool calling
5. Tool calling with streaming
6. System prompts
7. Provider switching
8. Error handling
9. Model listing
10. Ollama usage
11. Default provider management
12. Token monitoring

## API Reference

### Main Methods

| Method | Description |
|--------|-------------|
| `configureProvider(provider, config)` | Set up a provider |
| `complete(request, provider?)` | Get a response |
| `stream(request, provider?)` | Stream a response |
| `testConnection(provider?)` | Test if connected |
| `listModels(provider?)` | Get available models |
| `setDefaultProvider(provider)` | Change default |
| `getDefaultProvider()` | Get current default |
| `configureMultiple(configs)` | Set up multiple providers |
| `testAllConnections()` | Test all providers |

## Next Steps

1. Read `README.md` for comprehensive documentation
2. Check `examples.ts` for more usage patterns
3. Review type definitions in `types.ts` for TypeScript support
4. Run tests with `__tests__.ts` patterns

## Support

For issues:
1. Check environment variables are set
2. Verify API keys are valid
3. Test connection with `testConnection()`
4. Check provider-specific docs in `README.md`
