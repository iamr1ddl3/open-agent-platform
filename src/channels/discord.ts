import { ChannelInterface, ChannelConfig, IncomingMessage } from './types';

export class DiscordChannel implements ChannelInterface {
  private client: any;
  private config: ChannelConfig | null = null;
  private status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  private messageHandlers: Array<(msg: IncomingMessage) => Promise<void>> = [];

  async connect(config: ChannelConfig): Promise<void> {
    try {
      const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

      if (!config.credentials.botToken) {
        throw new Error('Missing botToken in credentials');
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      this.config = config;

      // Handle ready event
      this.client.once('ready', () => {
        console.log(`Discord bot ready as ${this.client.user.tag}`);
        this.status = 'connected';
      });

      // Handle messages
      this.client.on('messageCreate', async (msg: any) => {
        await this.handleDiscordMessage(msg);
      });

      await this.client.login(config.credentials.botToken);
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
    this.status = 'disconnected';
  }

  async sendMessage(channelId: string, message: string, replyTo?: string): Promise<void> {
    if (!this.client) {
      throw new Error('Discord client not connected');
    }

    try {
      const channel = await this.client.channels.fetch(channelId);

      if (!channel || !channel.isTextBased()) {
        throw new Error('Channel not found or is not text-based');
      }

      const options: any = {};
      if (replyTo) {
        options.reply = { messageReference: replyTo };
      }

      await channel.send({ content: message, ...options });
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to send Discord message: ${err}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  getStatus(): 'connected' | 'disconnected' | 'error' {
    return this.status;
  }

  private async handleDiscordMessage(msg: any): Promise<void> {
    try {
      // Ignore bot messages
      if (msg.author.bot) {
        return;
      }

      // Check allowed channels if configured
      if (this.config?.filters?.allowedChannels) {
        if (!this.config.filters.allowedChannels.includes(msg.channelId)) {
          return;
        }
      }

      const incomingMsg: IncomingMessage = {
        channelType: 'discord',
        channelId: msg.channelId,
        userId: msg.author.id,
        username: msg.author.username,
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
        replyTo: msg.reference?.messageId,
        metadata: {
          messageId: msg.id,
          guildId: msg.guildId,
          authorTag: msg.author.tag,
        },
      };

      for (const handler of this.messageHandlers) {
        await handler(incomingMsg);
      }
    } catch (error) {
      console.error('Error handling Discord message:', error);
    }
  }
}
