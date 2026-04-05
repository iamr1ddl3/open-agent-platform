import { Channel } from '../core/types';
import { v4 as uuidv4 } from 'uuid';

export class ChannelManager {
  private channels: Map<string, Channel> = new Map();

  async connect(type: 'telegram' | 'discord' | 'slack', config: any): Promise<Channel> {
    const channel: Channel = {
      id: uuidv4(),
      type,
      name: config.name,
      connected: true,
      config,
    };
    this.channels.set(channel.id, channel);
    return channel;
  }

  async disconnect(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.connected = false;
    }
  }

  listChannels(): Channel[] {
    return Array.from(this.channels.values());
  }
}
