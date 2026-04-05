export interface ChannelConfig {
  id: string;
  type: 'telegram' | 'discord' | 'slack';
  name: string;
  agentId: string;
  credentials: Record<string, string>;
  filters?: ChannelFilters;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt?: string;
  createdAt: string;
}

export interface ChannelFilters {
  allowedUsers?: string[];
  allowedChannels?: string[];
  triggerPrefix?: string;
  blockedUsers?: string[];
  blockedWords?: string[];
}

export interface IncomingMessage {
  channelType: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface OutgoingMessage {
  channelId: string;
  content: string;
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface ChannelInterface {
  connect(config: ChannelConfig): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(channelId: string, message: string, replyTo?: string): Promise<void>;
  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void;
  getStatus(): 'connected' | 'disconnected' | 'error';
}

export interface ChannelEvent {
  type: 'message' | 'status' | 'error';
  channelId: string;
  data: any;
}
