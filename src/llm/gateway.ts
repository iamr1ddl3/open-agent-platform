import {
  LLMProvider,
  LLMProviderConfig,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProviderInterface,
} from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';
import { OllamaProvider } from './providers/ollama';

export class LLMGateway {
  private providers: Map<LLMProvider, LLMProviderInterface> = new Map();
  private defaultProvider: LLMProvider = 'anthropic';

  constructor() {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('google', new GoogleProvider());
    this.providers.set('ollama', new OllamaProvider());
  }

  /**
   * Configure a specific LLM provider
   */
  configureProvider(provider: LLMProvider, config: LLMProviderConfig): void {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Provider '${provider}' not found`);
    }
    providerInstance.configure(config);
  }

  /**
   * Alias for configureProvider for backward compatibility
   */
  configure(provider: LLMProvider, config: LLMProviderConfig): void {
    this.configureProvider(provider, config);
  }

  /**
   * Set the default provider to use
   */
  setDefaultProvider(provider: LLMProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider '${provider}' not found`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Get the current default provider
   */
  getDefaultProvider(): LLMProvider {
    return this.defaultProvider;
  }

  /**
   * Get a specific provider instance
   */
  getProvider(provider: LLMProvider): LLMProviderInterface {
    const instance = this.providers.get(provider);
    if (!instance) {
      throw new Error(`Provider '${provider}' not found`);
    }
    return instance;
  }

  /**
   * List all available providers
   */
  listProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Complete a request using the default or specified provider
   */
  async complete(
    request: LLMRequest,
    provider?: LLMProvider
  ): Promise<LLMResponse> {
    const targetProvider = provider || this.defaultProvider;
    const providerInstance = this.getProvider(targetProvider);
    return providerInstance.complete(request);
  }

  /**
   * Stream a request using the default or specified provider
   */
  async *stream(
    request: LLMRequest,
    provider?: LLMProvider
  ): AsyncGenerator<LLMStreamChunk> {
    const targetProvider = provider || this.defaultProvider;
    const providerInstance = this.getProvider(targetProvider);
    yield* providerInstance.stream(request);
  }


  /**
   * Chat method compatible with AgentRunner (adapter for complete)
   */
  async chat(params: {
    systemPrompt: string;
    messages: Array<{ role: string; content: string }>;
    tools?: any[];
    maxTokens: number;
    temperature: number;
    provider: string;
    model: string;
  }): Promise<LLMResponse> {
    // Build messages array, prepending system prompt if provided
    const messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }> = [];

    // Add system prompt as first message if it's non-empty
    if (params.systemPrompt && params.systemPrompt.trim()) {
      messages.push({
        role: 'system',
        content: params.systemPrompt,
      });
    }

    // Add user/assistant messages
    messages.push(
      ...params.messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant' | 'tool',
        content: m.content,
      }))
    );

    const request: LLMRequest = {
      messages,
      tools: params.tools,
      maxTokens: params.maxTokens,
      temperature: params.temperature,
    };
    return this.complete(request, params.provider as LLMProvider);
  }

  /**
   * Test connection to a specific provider
   */
  async testConnection(provider?: LLMProvider): Promise<boolean> {
    const targetProvider = provider || this.defaultProvider;
    const providerInstance = this.getProvider(targetProvider);
    return providerInstance.testConnection();
  }

  /**
   * List available models for a provider
   */
  async listModels(provider?: LLMProvider): Promise<string[]> {
    const targetProvider = provider || this.defaultProvider;
    const providerInstance = this.getProvider(targetProvider);
    return providerInstance.listModels();
  }

  /**
   * Test all configured providers
   */
  async testAllConnections(): Promise<Record<LLMProvider, boolean>> {
    const results: Record<LLMProvider, boolean> = {
      openai: false,
      anthropic: false,
      google: false,
      ollama: false,
    };

    for (const [provider, instance] of this.providers) {
      try {
        results[provider] = await instance.testConnection();
      } catch {
        results[provider] = false;
      }
    }

    return results;
  }

  /**
   * Configure multiple providers at once
   */
  configureMultiple(
    configs: Partial<Record<LLMProvider, LLMProviderConfig>>
  ): void {
    for (const [provider, config] of Object.entries(configs)) {
      if (config) {
        this.configureProvider(provider as LLMProvider, config);
      }
    }
  }
}

/**
 * Singleton instance of the gateway
 */
let gatewayInstance: LLMGateway | null = null;

/**
 * Get or create the global LLM Gateway instance
 */
export function getLLMGateway(): LLMGateway {
  if (!gatewayInstance) {
    gatewayInstance = new LLMGateway();
  }
  return gatewayInstance;
}

/**
 * Reset the global gateway instance (useful for testing)
 */
export function resetLLMGateway(): void {
  gatewayInstance = null;
}
