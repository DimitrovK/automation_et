export type DiscordSendMessageRequest = {
  channelId: string;
  message: string;
};

export type DiscordSendMessageResponse = {
  success: true;
  messageId: string;
  channelId: string;
  timestamp: string;
};

export type DiscordError = {
  error: string;
};

export class DiscordApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public discordError?: any,
  ) {
    super(message);
    this.name = 'DiscordApiError';
  }
}
