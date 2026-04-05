/**
 * LLM Gateway Usage Examples
 * These examples demonstrate how to use the LLM Gateway with different providers
 */

import { getLLMGateway, LLMMessage, ToolDefinition } from './index';
import { LLMRequest } from './types';

// ============================================================================
// Example 1: Basic Usage with Default Provider (Anthropic)
// ============================================================================

export async function example1_basicUsage() {
  const gateway = getLLMGateway();

  // Configure the default provider
  gateway.configureProvider('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1024,
    temperature: 0.7,
  });

  // Simple completion request
  const response = await gateway.complete({
    messages: [{ role: 'user', content: 'What is 2+2?' }],
  });

  console.log('Response:', response.content);
  console.log('Tokens used:', response.usage);
}

// ============================================================================
// Example 2: Multi-Provider Configuration
// ============================================================================

export async function example2_multiProviderSetup() {
  const gateway = getLLMGateway();

  // Configure all providers
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
  console.log('Connection Status:', status);

  // Use specific providers
  const anthropicResponse = await gateway.complete(
    {
      messages: [{ role: 'user', content: 'Hello Claude!' }],
    },
    'anthropic'
  );

  const openaiResponse = await gateway.complete(
    {
      messages: [{ role: 'user', content: 'Hello GPT!' }],
    },
    'openai'
  );

  console.log('Anthropic:', anthropicResponse.content);
  console.log('OpenAI:', openaiResponse.content);
}

// ============================================================================
// Example 3: Streaming Responses
// ============================================================================

export async function example3_streaming() {
  const gateway = getLLMGateway();

  gateway.configureProvider('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  });

  console.log('Streaming response:');

  for await (const chunk of gateway.stream({
    messages: [{ role: 'user', content: 'Write a haiku about programming' }],
  })) {
    if (chunk.type === 'text' && chunk.content) {
      process.stdout.write(chunk.content);
    } else if (chunk.type === 'done') {
      console.log('\n[Stream completed]');
    } else if (chunk.type === 'error') {
      console.error('[Error]', chunk.error);
    }
  }
}

// ============================================================================
// Example 4: Tool Calling / Function Calling
// ============================================================================

export async function example4_toolCalling() {
  const gateway = getLLMGateway();

  gateway.configureProvider('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  });

  const tools: ToolDefinition[] = [
    {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name, e.g., San Francisco',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit',
          },
        },
        required: ['location'],
      },
    },
    {
      name: 'calculate',
      description: 'Perform a mathematical calculation',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression, e.g., "2 + 2 * 3"',
          },
        },
        required: ['expression'],
      },
    },
  ];

  const response = await gateway.complete({
    messages: [
      {
        role: 'user',
        content: 'What is the weather in San Francisco and what is 2 + 2?',
      },
    ],
    tools,
  });

  console.log('Response:', response.content);

  if (response.toolCalls) {
    console.log('Tool calls made:');
    for (const toolCall of response.toolCalls) {
      console.log(`- ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);
    }
  }
}

// ============================================================================
// Example 5: Tool Calling with Streaming
// ============================================================================

export async function example5_toolCallingStreaming() {
  const gateway = getLLMGateway();

  gateway.configureProvider('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  });

  const tools: ToolDefinition[] = [
    {
      name: 'search_database',
      description: 'Search the user database',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          limit: {
            type: 'number',
            description: 'Max results',
          },
        },
        required: ['query'],
      },
    },
  ];

  console.log('Streaming with tool calls:');

  for await (const chunk of gateway.stream(
    {
      messages: [{ role: 'user', content: 'Find users named John' }],
      tools,
    },
    'anthropic'
  )) {
    switch (chunk.type) {
      case 'text':
        if (chunk.content) {
          process.stdout.write(chunk.content);
        }
        break;
      case 'tool_call':
        console.log(
          `\n[Tool: ${chunk.toolCall?.name}]`,
          JSON.stringify(chunk.toolCall?.arguments, null, 2)
        );
        break;
      case 'done':
        console.log('\n[Complete]');
        break;
    }
  }
}

// ============================================================================
// Example 6: System Prompts and Complex Conversations
// ============================================================================

export async function example6_systemPrompt() {
  const gateway = getLLMGateway();

  gateway.configureProvider('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  });

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant specialized in mathematics.',
    },
    {
      role: 'user',
      content: 'What is the derivative of x^2?',
    },
  ];

  const response = await gateway.complete({ messages });
  console.log('Math Response:', response.content);

  // Continue conversation
  messages.push({
    role: 'assistant',
    content: response.content,
  });

  messages.push({
    role: 'user',
    content: 'What about x^3?',
  });

  const response2 = await gateway.complete({ messages });
  console.log('Follow-up Response:', response2.content);
}

// ============================================================================
// Example 7: Provider-Specific Switching
// ============================================================================

export async function example7_providerSwitching() {
  const gateway = getLLMGateway();

  gateway.configureMultiple({
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-5-sonnet-20241022',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo',
    },
  });

  const prompt: LLMRequest = {
    messages: [
      {
        role: 'user' as const,
        content:
          'Write a 3-line poem about the difference between morning and evening.',
      },
    ],
  };

  console.log('Using Anthropic Claude:');
  const anthropicRes = await gateway.complete(prompt, 'anthropic');
  console.log(anthropicRes.content);

  console.log('\nUsing OpenAI GPT-4:');
  const openaiRes = await gateway.complete(prompt, 'openai');
  console.log(openaiRes.content);
}

// ============================================================================
// Example 8: Error Handling
// ============================================================================

export async function example8_errorHandling() {
  const gateway = getLLMGateway();

  try {
    gateway.configureProvider('anthropic', {
      apiKey: 'invalid-key',
      model: 'claude-3-5-sonnet-20241022',
    });

    // Test connection
    const connected = await gateway.testConnection('anthropic');
    if (!connected) {
      console.log('Connection failed - API key may be invalid');
    }

    // Try to complete anyway
    const response = await gateway.complete({
      messages: [{ role: 'user', content: 'Hello' }],
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error occurred:', error.message);
    }
  }
}

// ============================================================================
// Example 9: List Available Models
// ============================================================================

export async function example9_listModels() {
  const gateway = getLLMGateway();

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
  });

  console.log('Available Models:');

  const anthropicModels = await gateway.listModels('anthropic');
  console.log('Anthropic:', anthropicModels);

  const openaiModels = await gateway.listModels('openai');
  console.log('OpenAI:', openaiModels.slice(0, 5), '...');

  const googleModels = await gateway.listModels('google');
  console.log('Google:', googleModels);
}

// ============================================================================
// Example 10: Ollama Local Model Usage
// ============================================================================

export async function example10_ollamaLocal() {
  const gateway = getLLMGateway();

  gateway.configureProvider('ollama', {
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    temperature: 0.8,
  });

  // Test connection
  const connected = await gateway.testConnection('ollama');
  console.log('Ollama connected:', connected);

  if (connected) {
    // List available models
    const models = await gateway.listModels('ollama');
    console.log('Available local models:', models);

    // Use local model
    const response = await gateway.complete({
      messages: [
        {
          role: 'user',
          content: 'What is the capital of France?',
        },
      ],
    });

    console.log('Ollama Response:', response.content);
  } else {
    console.log('Ollama not running. Start it with: ollama serve');
  }
}

// ============================================================================
// Example 11: Setting Default Provider
// ============================================================================

export async function example11_defaultProvider() {
  const gateway = getLLMGateway();

  gateway.configureMultiple({
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-5-sonnet-20241022',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo',
    },
  });

  console.log('Current default:', gateway.getDefaultProvider());

  // Set OpenAI as default
  gateway.setDefaultProvider('openai');
  console.log('Changed to:', gateway.getDefaultProvider());

  // This will use OpenAI
  const response = await gateway.complete({
    messages: [{ role: 'user', content: 'Hello!' }],
  });

  console.log('Response from default (OpenAI):', response.content);
}

// ============================================================================
// Example 12: Token Usage Monitoring
// ============================================================================

export async function example12_tokenMonitoring() {
  const gateway = getLLMGateway();

  gateway.configureProvider('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  });

  const response = await gateway.complete({
    messages: [
      {
        role: 'user',
        content: 'Explain quantum computing in 100 words',
      },
    ],
  });

  console.log('Content:', response.content);
  console.log('Token Usage:');
  console.log(`  Prompt tokens: ${response.usage?.promptTokens}`);
  console.log(`  Completion tokens: ${response.usage?.completionTokens}`);
  console.log(`  Total tokens: ${response.usage?.totalTokens}`);
  console.log(`  Stop reason: ${response.stopReason}`);
}
