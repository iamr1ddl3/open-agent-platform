/**
 * Test suite for LLM Gateway System
 * These are example test patterns for the gateway
 */

import { getLLMGateway, resetLLMGateway } from './gateway';
import { LLMMessage, ToolDefinition } from './types';
import { LLMProvider } from './types';

// ============================================================================
// Test Helpers
// ============================================================================

function describe(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
    } catch (error) {
      console.error(`  ✗ ${name}`);
      if (error instanceof Error) {
        console.error(`    ${error.message}`);
      }
    }
  };
}

async function runTests() {
  const tests: Array<() => Promise<void>> = [];

  // ========================================================================
  // Test Suite 1: Gateway Initialization
  // ========================================================================

  describe('LLM Gateway - Initialization', () => {
    tests.push(
      test('should create gateway instance', () => {
        resetLLMGateway();
        const gateway = getLLMGateway();
        if (!gateway) throw new Error('Gateway not created');
      })
    );

    tests.push(
      test('should return singleton instance', () => {
        resetLLMGateway();
        const gateway1 = getLLMGateway();
        const gateway2 = getLLMGateway();
        if (gateway1 !== gateway2) throw new Error('Not a singleton');
      })
    );

    tests.push(
      test('should list all available providers', () => {
        const gateway = getLLMGateway();
        const providers = gateway.listProviders();
        const expected = ['openai', 'anthropic', 'google', 'ollama'];
        for (const p of expected as LLMProvider[]) {
          if (!providers.includes(p)) {
            throw new Error(`Missing provider: ${p}`);
          }
        }
      })
    );

    tests.push(
      test('should have anthropic as default provider', () => {
        resetLLMGateway();
        const gateway = getLLMGateway();
        if (gateway.getDefaultProvider() !== 'anthropic') {
          throw new Error('Default provider is not anthropic');
        }
      })
    );
  });

  // ========================================================================
  // Test Suite 2: Provider Configuration
  // ========================================================================

  describe('LLM Gateway - Configuration', () => {
    tests.push(
      test('should configure a provider', () => {
        const gateway = getLLMGateway();
        gateway.configureProvider('anthropic', {
          apiKey: 'test-key',
          model: 'claude-3-5-sonnet-20241022',
        });
        const provider = gateway.getProvider('anthropic');
        if (!provider) throw new Error('Provider not configured');
      })
    );

    tests.push(
      test('should set default provider', () => {
        const gateway = getLLMGateway();
        gateway.setDefaultProvider('openai');
        if (gateway.getDefaultProvider() !== 'openai') {
          throw new Error('Default provider not set');
        }
      })
    );

    tests.push(
      test('should configure multiple providers', () => {
        const gateway = getLLMGateway();
        gateway.configureMultiple({
          anthropic: {
            apiKey: 'test-key',
            model: 'claude-3-5-sonnet-20241022',
          },
          openai: {
            apiKey: 'test-key',
            model: 'gpt-4-turbo',
          },
        });
        const anthropic = gateway.getProvider('anthropic');
        const openai = gateway.getProvider('openai');
        if (!anthropic || !openai) {
          throw new Error('Providers not configured');
        }
      })
    );

    tests.push(
      test('should throw error for invalid provider', () => {
        const gateway = getLLMGateway();
        try {
          gateway.setDefaultProvider('invalid' as any);
          throw new Error('Should have thrown error');
        } catch (error) {
          if (error instanceof Error && !error.message.includes('not found')) {
            throw error;
          }
        }
      })
    );
  });

  // ========================================================================
  // Test Suite 3: Type Definitions
  // ========================================================================

  describe('LLM Gateway - Type Definitions', () => {
    tests.push(
      test('should accept valid LLMMessage', () => {
        const message: LLMMessage = {
          role: 'user',
          content: 'Hello',
        };
        if (!message) throw new Error('Invalid message type');
      })
    );

    tests.push(
      test('should accept system message', () => {
        const message: LLMMessage = {
          role: 'system',
          content: 'You are a helpful assistant',
        };
        if (message.role !== 'system') throw new Error('Invalid role');
      })
    );

    tests.push(
      test('should accept assistant message', () => {
        const message: LLMMessage = {
          role: 'assistant',
          content: 'Hello!',
        };
        if (message.role !== 'assistant') throw new Error('Invalid role');
      })
    );

    tests.push(
      test('should accept tool message with tool call id', () => {
        const message: LLMMessage = {
          role: 'tool',
          content: 'Result from tool',
          toolCallId: 'call-123',
        };
        if (!message.toolCallId) throw new Error('Missing toolCallId');
      })
    );

    tests.push(
      test('should accept assistant message with tool calls', () => {
        const message: LLMMessage = {
          role: 'assistant',
          content: 'Calling tools',
          toolCalls: [
            {
              id: 'call-123',
              name: 'get_weather',
              arguments: { location: 'SF' },
            },
          ],
        };
        if (!message.toolCalls || message.toolCalls.length === 0) {
          throw new Error('Missing toolCalls');
        }
      })
    );
  });

  // ========================================================================
  // Test Suite 4: Tool Definitions
  // ========================================================================

  describe('LLM Gateway - Tool Definitions', () => {
    tests.push(
      test('should accept valid tool definition', () => {
        const tool: ToolDefinition = {
          name: 'get_weather',
          description: 'Get weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
            },
            required: ['location'],
          },
        };
        if (tool.name !== 'get_weather') throw new Error('Invalid tool');
      })
    );

    tests.push(
      test('should accept tool with complex parameters', () => {
        const tool: ToolDefinition = {
          name: 'search',
          description: 'Search with filters',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              filters: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  minPrice: { type: 'number' },
                  maxPrice: { type: 'number' },
                },
              },
              limit: { type: 'number' },
            },
            required: ['query'],
          },
        };
        if (!tool.parameters.properties) throw new Error('Invalid parameters');
      })
    );

    tests.push(
      test('should accept tool with enum parameters', () => {
        const tool: ToolDefinition = {
          name: 'convert_temperature',
          description: 'Convert temperature between units',
          parameters: {
            type: 'object',
            properties: {
              value: { type: 'number' },
              from_unit: { enum: ['celsius', 'fahrenheit', 'kelvin'] },
              to_unit: { enum: ['celsius', 'fahrenheit', 'kelvin'] },
            },
            required: ['value', 'from_unit', 'to_unit'],
          },
        };
        if (tool.parameters.properties['from_unit'].enum.length !== 3) {
          throw new Error('Invalid enum');
        }
      })
    );
  });

  // ========================================================================
  // Test Suite 5: Provider Availability
  // ========================================================================

  describe('LLM Gateway - Provider Availability', () => {
    tests.push(
      test('should have OpenAI provider', () => {
        const gateway = getLLMGateway();
        const provider = gateway.getProvider('openai');
        if (provider.name !== 'openai') throw new Error('Wrong provider');
      })
    );

    tests.push(
      test('should have Anthropic provider', () => {
        const gateway = getLLMGateway();
        const provider = gateway.getProvider('anthropic');
        if (provider.name !== 'anthropic') throw new Error('Wrong provider');
      })
    );

    tests.push(
      test('should have Google provider', () => {
        const gateway = getLLMGateway();
        const provider = gateway.getProvider('google');
        if (provider.name !== 'google') throw new Error('Wrong provider');
      })
    );

    tests.push(
      test('should have Ollama provider', () => {
        const gateway = getLLMGateway();
        const provider = gateway.getProvider('ollama');
        if (provider.name !== 'ollama') throw new Error('Wrong provider');
      })
    );
  });

  // ========================================================================
  // Test Suite 6: Gateway Methods Exist
  // ========================================================================

  describe('LLM Gateway - Method Existence', () => {
    const gateway = getLLMGateway();

    tests.push(
      test('should have complete method', () => {
        if (typeof gateway.complete !== 'function') {
          throw new Error('Missing complete method');
        }
      })
    );

    tests.push(
      test('should have stream method', () => {
        if (typeof gateway.stream !== 'function') {
          throw new Error('Missing stream method');
        }
      })
    );

    tests.push(
      test('should have testConnection method', () => {
        if (typeof gateway.testConnection !== 'function') {
          throw new Error('Missing testConnection method');
        }
      })
    );

    tests.push(
      test('should have listModels method', () => {
        if (typeof gateway.listModels !== 'function') {
          throw new Error('Missing listModels method');
        }
      })
    );

    tests.push(
      test('should have testAllConnections method', () => {
        if (typeof gateway.testAllConnections !== 'function') {
          throw new Error('Missing testAllConnections method');
        }
      })
    );

    tests.push(
      test('should have configureProvider method', () => {
        if (typeof gateway.configureProvider !== 'function') {
          throw new Error('Missing configureProvider method');
        }
      })
    );

    tests.push(
      test('should have configureMultiple method', () => {
        if (typeof gateway.configureMultiple !== 'function') {
          throw new Error('Missing configureMultiple method');
        }
      })
    );

    tests.push(
      test('should have setDefaultProvider method', () => {
        if (typeof gateway.setDefaultProvider !== 'function') {
          throw new Error('Missing setDefaultProvider method');
        }
      })
    );

    tests.push(
      test('should have getDefaultProvider method', () => {
        if (typeof gateway.getDefaultProvider !== 'function') {
          throw new Error('Missing getDefaultProvider method');
        }
      })
    );

    tests.push(
      test('should have listProviders method', () => {
        if (typeof gateway.listProviders !== 'function') {
          throw new Error('Missing listProviders method');
        }
      })
    );

    tests.push(
      test('should have getProvider method', () => {
        if (typeof gateway.getProvider !== 'function') {
          throw new Error('Missing getProvider method');
        }
      })
    );
  });

  // ========================================================================
  // Run All Tests
  // ========================================================================

  console.log('\n========================================');
  console.log('LLM Gateway System - Test Suite');
  console.log('========================================');

  for (const testFn of tests) {
    await testFn();
  }

  console.log('\n========================================');
  console.log('Test suite completed');
  console.log('========================================\n');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
