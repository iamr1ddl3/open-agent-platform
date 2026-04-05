# LLM Gateway System

A unified multi-provider LLM gateway for the OpenAgentPlatform, supporting OpenAI, Anthropic (Claude), Google (Gemini), and Ollama (local models).

## Architecture

```
LLMGateway (main coordinator)
├── OpenAI Provider
├── Anthropic Provider
├── Google Provider
└── Ollama Provider
```

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, Google Gemini, Ollama
- **Unified Interface**: Single API for all providers
- **Tool Calling**: Function calling support across all providers
- **Streaming**: Real-time streaming responses with proper chunk handling
- **Provider Management**: Configure and switch providers dynamically
- **Connection Testing**: Test provider connections before use
- **Model Listing**: Query available models per provider

## Installation

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

## Quick Start

### Basic Usage

```typescript
import { getLLMGateway } from './llm';

const gateway = getLLMGateway();

// Configure providers
gateway.configureProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
});

// Make a request
const response = await gateway.complete({
  messages: [
    { role: 'user', content: 'What is 2+2?' }
  ]
});

console.log(response.content);
```

### With Multiple Providers

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
  },
});

// Test all connections
const status = await gateway.testAllConnections();
console.log(status);
// { openai: true, anthropic: true, google: false, ollama: true }
```

### Tool Calling

```typescript
const response = await gateway.complete({
  messages: [
    {
      role: 'user',
      content: 'What is the weather in San Francisco?'
    }
  ],
  tools: [
    {
      name: 'get_weather',
      description: 'Get the weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name'
          }
        },
        required: ['location']
      }
    }
  ]
});

if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    console.log(`Call ${toolCall.name} with`, toolCall.arguments);
  }
}
```

### Streaming

```typescript
for await (const chunk of gateway.stream({
  messages: [
    { role: 'user', content: 'Write a haiku about code' }
  ]
}, 'anthropic')) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content || '');
  } else if (chunk.type === 'tool_call') {
    console.log('Tool call:', chunk.toolCall?.name);
  } else if (chunk.type === 'done') {
    console.log('\nDone');
  }
}
```

## Provider Configuration

### OpenAI

```typescript
gateway.configureProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo',
  maxTokens: 2000,
  temperature: 0.7,
});
```

**Available Models**: gpt-4-turbo, gpt-4, gpt-3.5-turbo, etc.

### Anthropic

```typescript
gateway.configureProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 2000,
  temperature: 0.7,
});
```

**Available Models**:
- claude-3-opus-20250219
- claude-3-5-sonnet-20241022
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

### Google Gemini

```typescript
gateway.configureProvider('google', {
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-2.0-flash',
  maxTokens: 2000,
  temperature: 0.7,
});
```

**Available Models**: Retrieved dynamically from Google's API

### Ollama (Local)

```typescript
gateway.configureProvider('ollama', {
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  temperature: 0.7,
});
```

**Default Base URL**: http://localhost:11434

**Note**: Ensure Ollama is running locally:
```bash
ollama serve
ollama pull llama2
```

## API Reference

### LLMGateway

#### `configureProvider(provider, config)`
Configure a specific LLM provider.

**Parameters:**
- `provider: LLMProvider` - Provider name ('openai', 'anthropic', 'google', 'ollama')
- `config: LLMProviderConfig` - Provider configuration

#### `setDefaultProvider(provider)`
Set the default provider for requests without explicit provider specification.

**Parameters:**
- `provider: LLMProvider` - Provider name

#### `getDefaultProvider()`
Get the current default provider.

**Returns**: `LLMProvider`

#### `async complete(request, provider?)`
Execute a completion request.

**Parameters:**
- `request: LLMRequest` - The completion request
- `provider?: LLMProvider` - Optional provider override

**Returns**: `Promise<LLMResponse>`

#### `async *stream(request, provider?)`
Stream a response in real-time.

**Parameters:**
- `request: LLMRequest` - The streaming request
- `provider?: LLMProvider` - Optional provider override

**Yields**: `AsyncGenerator<LLMStreamChunk>`

#### `async testConnection(provider?)`
Test connection to a provider.

**Parameters:**
- `provider?: LLMProvider` - Optional provider override (uses default if omitted)

**Returns**: `Promise<boolean>`

#### `async listModels(provider?)`
List available models for a provider.

**Parameters:**
- `provider?: LLMProvider` - Optional provider override

**Returns**: `Promise<string[]>`

#### `async testAllConnections()`
Test connections to all configured providers.

**Returns**: `Promise<Record<LLMProvider, boolean>>`

#### `configureMultiple(configs)`
Configure multiple providers at once.

**Parameters:**
- `configs: Partial<Record<LLMProvider, LLMProviderConfig>>` - Configuration for multiple providers

### Types

#### LLMRequest
```typescript
interface LLMRequest {
  messages: LLMMessage[];
  tools?: ToolDefinition[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}
```

#### LLMResponse
```typescript
interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}
```

#### LLMMessage
```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}
```

#### ToolCall
```typescript
interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}
```

#### ToolDefinition
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
}
```

## Error Handling

```typescript
try {
  const response = await gateway.complete({
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('LLM Error:', error.message);
  }
}
```

## Provider-Specific Notes

### OpenAI
- Requires valid OpenAI API key
- Function calling uses OpenAI's native format
- Supports streaming via server-sent events

### Anthropic
- Messages API is preferred over legacy chat format
- Tool use is fully integrated with unified interface
- Streaming uses SSE with complete content blocks

### Google Gemini
- Requires Google AI API key (not Cloud)
- Function declarations map to JSON Schema
- Safety settings configured to BLOCK_NONE for tool usage

### Ollama
- Must be running locally at http://localhost:11434 by default
- No API key required
- All models must be pulled before use
- Tool calling simulated through JSON responses

## Testing

```typescript
// Test individual provider
const isConnected = await gateway.testConnection('anthropic');
console.log(`Anthropic connected: ${isConnected}`);

// List available models
const models = await gateway.listModels('openai');
console.log('Available OpenAI models:', models);

// Get provider instance directly
const anthropic = gateway.getProvider('anthropic');
```

## Best Practices

1. **Provider Selection**: Choose providers based on latency, cost, and capability needs
2. **Error Handling**: Always wrap API calls in try-catch blocks
3. **Token Management**: Monitor token usage in responses for cost optimization
4. **Streaming**: Use streaming for better UX with long responses
5. **Tool Definition**: Use clear, descriptive tool names and parameters

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

## File Structure

```
src/llm/
├── types.ts              # Type definitions
├── gateway.ts            # Main gateway class
├── index.ts              # Public exports
└── providers/
    ├── openai.ts         # OpenAI implementation
    ├── anthropic.ts      # Anthropic implementation
    ├── google.ts         # Google Gemini implementation
    └── ollama.ts         # Ollama implementation
```

## Implementation Details

### Message Format Normalization
Each provider has different message formats. The gateway normalizes to a unified format and converts on provider-specific calls:
- **OpenAI**: Uses native messages format
- **Anthropic**: Maps to Messages API
- **Google**: Converts to GenerativeAI format
- **Ollama**: Uses Ollama's chat format

### Tool Calling Mapping
Unified ToolDefinition maps to each provider's format:
- **OpenAI**: ChatCompletionTool with function declarations
- **Anthropic**: Tool objects with input_schema
- **Google**: functionDeclarations with JSON Schema
- **Ollama**: JSON-based request/response format

### Streaming Handling
Each provider has different streaming formats:
- **OpenAI**: Server-sent events with delta content
- **Anthropic**: Content block events with streaming
- **Google**: generateContentStream with async iteration
- **Ollama**: NDJSON (newline-delimited JSON)

All normalize to `AsyncGenerator<LLMStreamChunk>` interface.
