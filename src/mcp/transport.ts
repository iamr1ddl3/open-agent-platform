import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MCPMessage } from './types';

/**
 * Validate MCP message structure
 */
function validateMCPMessage(message: any): void {
  // Message must be an object
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    throw new Error('Invalid MCP message: must be an object, not array or null');
  }

  // Check jsonrpc field
  if (message.jsonrpc !== '2.0') {
    throw new Error('Invalid MCP message: jsonrpc must be "2.0"');
  }

  // Check for valid structure based on message type
  if (message.method) {
    // Request message - must have method and id
    if (typeof message.method !== 'string') {
      throw new Error('Invalid MCP message: method must be a string');
    }
    if (message.id !== undefined && typeof message.id !== 'string' && typeof message.id !== 'number') {
      throw new Error('Invalid MCP message: id must be a string or number');
    }
  } else if (message.result !== undefined || message.error) {
    // Response message - must have id
    if (message.id === undefined) {
      throw new Error('Invalid MCP message: response must have an id');
    }
    if (typeof message.id !== 'string' && typeof message.id !== 'number') {
      throw new Error('Invalid MCP message: id must be a string or number');
    }
    if (message.error && typeof message.error !== 'object') {
      throw new Error('Invalid MCP message: error must be an object');
    }
  } else {
    throw new Error('Invalid MCP message: must be a request or response (method, result, or error)');
  }
}

export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: MCPMessage): Promise<void>;
  onMessage(handler: (message: MCPMessage) => void): void;
  onError(handler: (error: Error) => void): void;
}

export class StdioTransport extends EventEmitter implements Transport {
  private process: ChildProcess | null = null;
  private buffer: string = '';
  private messageHandlers: Array<(message: MCPMessage) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private nextId: number = 1;

  constructor(
    private command: string,
    private args: string[] = [],
    private env: Record<string, string> = {}
  ) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const env = { ...process.env, ...this.env };
        this.process = spawn(this.command, this.args, { env });

        this.process.stdout?.on('data', (data: Buffer) => {
          this.buffer += data.toString('utf-8');
          this.processLines();
        });

        this.process.stderr?.on('data', (data: Buffer) => {
          const error = new Error(`[${this.command}] ${data.toString('utf-8')}`);
          this.errorHandlers.forEach(handler => handler(error));
        });

        this.process.on('error', (err) => {
          this.errorHandlers.forEach(handler => handler(err));
          reject(err);
        });

        this.process.on('close', (code) => {
          const error = new Error(`[${this.command}] Process exited with code ${code}`);
          this.errorHandlers.forEach(handler => handler(error));
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.process) {
        this.process.kill();
        this.process = null;
      }
      resolve();
    });
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this.process?.stdin) {
      throw new Error('Process not connected');
    }

    return new Promise((resolve, reject) => {
      const line = JSON.stringify(message) + '\n';
      this.process!.stdin!.write(line, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  private processLines(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message: MCPMessage = JSON.parse(line);
          validateMCPMessage(message);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          const err = new Error(`Failed to parse MCP message: ${error instanceof Error ? error.message : line}`);
          this.errorHandlers.forEach(handler => handler(err));
        }
      }
    }
  }
}

export class SSETransport extends EventEmitter implements Transport {
  private eventSource: any;
  private messageHandlers: Array<(message: MCPMessage) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];

  constructor(private url: string) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Dynamic import for EventSource
        const EventSourceModule = require('eventsource');
        const EventSource = EventSourceModule.default || EventSourceModule;

        this.eventSource = new EventSource(this.url);

        this.eventSource.addEventListener('message', (event: any) => {
          try {
            const message: MCPMessage = JSON.parse(event.data);
            validateMCPMessage(message);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            const err = new Error(`Failed to parse SSE message: ${error instanceof Error ? error.message : event.data}`);
            this.errorHandlers.forEach(handler => handler(err));
          }
        });

        this.eventSource.addEventListener('error', (event: any) => {
          const error = new Error(`SSE connection error: ${event.message}`);
          this.errorHandlers.forEach(handler => handler(error));
          reject(error);
        });

        this.eventSource.addEventListener('open', () => {
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  async send(message: MCPMessage): Promise<void> {
    // SSE is one-way (server to client), so sending requires HTTP POST
    return new Promise((resolve, reject) => {
      try {
        const fetch = require('node-fetch');
        const parts = this.url.split('/');
        parts[parts.length - 1] = 'messages';
        const postUrl = parts.join('/');

        fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        })
          .then((response: any) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            resolve();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }
}

export class HTTPTransport extends EventEmitter implements Transport {
  private messageHandlers: Array<(message: MCPMessage) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(private baseUrl: string) {
    super();
  }

  async connect(): Promise<void> {
    // Verify connection with a ping
    return new Promise((resolve, reject) => {
      try {
        const fetch = require('node-fetch');
        fetch(`${this.baseUrl}/ping`)
          .then((response: any) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            // Start polling for messages
            this.startPolling();
            resolve();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async send(message: MCPMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const fetch = require('node-fetch');
        fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        })
          .then((response: any) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            resolve();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        const fetch = require('node-fetch');
        const response = await fetch(`${this.baseUrl}/messages`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const messages: MCPMessage[] = await response.json();
        messages.forEach(msg => {
          this.messageHandlers.forEach(handler => handler(msg));
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.errorHandlers.forEach(handler => handler(err));
      }
    }, 1000);
  }
}
