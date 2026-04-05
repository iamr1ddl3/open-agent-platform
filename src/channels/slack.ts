import { ChannelInterface, ChannelConfig, IncomingMessage } from './types';

export class SlackChannel implements ChannelInterface {
  private slackClient: any;
  private socketClient: any;
  private config: ChannelConfig | null = null;
  private status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  private messageHandlers: Array<(msg: IncomingMessage) => Promise<void>> = [];

  async connect(config: ChannelConfig): Promise<void> {
    try {
      const { WebClient, SocketModeClient } = require('@slack/web-api');

      if (!config.credentials.botToken || !config.credentials.appToken) {
        throw new Error('Missing botToken or appToken in credentials');
      }

      this.config = config;
      this.slackClient = new WebClient(config.credentials.botToken);

      // Use Socket Mode for real-time messages
      this.socketClient = new SocketModeClient({
        appToken: config.credentials.appToken,
      });

      this.socketClient.on('ready', () => {
        console.log('Slack bot connected');
        this.status = 'connected';
      });

      this.socketClient.on('app_mention', async (body: any) => {
        await this.handleSlackMessage(body);
        await this.socketClient.sendSocketModeResponse({
          envelope_id: body.envelope_id,
          payload: {},
        });
      });

      this.socketClient.on('message', async (body: any) => {
        await this.handleSlackMessage(body);
        await this.socketClient.sendSocketModeResponse({
          envelope_id: body.envelope_id,
          payload: {},
        });
      });

      this.socketClient.on('error', (error: any) => {
        console.error('Slack Socket Mode error:', error);
        this.status = 'error';
      });

      this.socketClient.on('disconnect', () => {
        this.status = 'disconnected';
      });

      await this.socketClient.start();
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.socketClient) {
      await this.socketClient.close();
    }
    this.status = 'disconnected';
  }

  async sendMessage(channelId: string, message: string, replyTo?: string): Promise<void> {
    if (!this.slackClient) {
      throw new Error('Slack client not connected');
    }

    try {
      const options: any = {
        channel: channelId,
        text: message,
      };

      if (replyTo) {
        options.thread_ts = replyTo;
      }

      await this.slackClient.chat.postMessage(options);
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to send Slack message: ${err}`);
    }
  }

  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  getStatus(): 'connected' | 'disconnected' | 'error' {
    return this.status;
  }

  private async handleSlackMessage(body: any): Promise<void> {
    try {
      const event = body.payload?.event;

      if (!event || event.bot_id) {
        return; // Ignore bot messages
      }

      // Check allowed channels if configured
      if (this.config?.filters?.allowedChannels) {
        if (!this.config.filters.allowedChannels.includes(event.channel)) {
          return;
        }
      }

      // Get user info for username
      let username = event.user || 'Unknown';
      try {
        const userInfo = await this.slackClient.users.info({ user: event.user });
        username = userInfo.user.real_name || userInfo.user.name || username;
      } catch {
        // Use default username if lookup fails
      }

      const incomingMsg: IncomingMessage = {
        channelType: 'slack',
        channelId: event.channel,
        userId: event.user,
        username,
        content: event.text || '',
        timestamp: new Date(Number(event.ts) * 1000).toISOString(),
        replyTo: event.thread_ts,
        metadata: {
          messageTs: event.ts,
          threadTs: event.thread_ts,
          teamId: body.team_id,
        },
      };

      for (const handler of this.messageHandlers) {
        await handler(incomingMsg);
      }
    } catch (error) {
      console.error('Error handling Slack message:', error);
    }
  }
}
