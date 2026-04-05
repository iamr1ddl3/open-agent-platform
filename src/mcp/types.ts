export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  command?: string;  // For stdio transport
  args?: string[];
  env?: Record<string, string>;
  status: 'connected' | 'disconnected' | 'error';
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  serverId: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPMessage {
  jsonrpc: string;
  id?: string | number;
  method?: string;
  params?: Record<string, any>;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
