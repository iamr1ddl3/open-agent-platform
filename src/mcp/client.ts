import { MCPServer, Tool } from '../core/types';
import { v4 as uuidv4 } from 'uuid';

export class MCPClient {
  private servers: Map<string, MCPServer> = new Map();

  async connect(serverUrl: string): Promise<MCPServer> {
    const server: MCPServer = {
      id: uuidv4(),
      name: serverUrl,
      url: serverUrl,
      tools: [],
      connected: true,
    };
    this.servers.set(server.id, server);
    return server;
  }

  async disconnect(serverId: string): Promise<void> {
    this.servers.delete(serverId);
  }

  listServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  async listTools(serverId: string): Promise<Tool[]> {
    const server = this.servers.get(serverId);
    return server?.tools || [];
  }
}
