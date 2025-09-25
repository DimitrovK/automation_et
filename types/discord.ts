export interface DiscordSendMessageRequest {
  channelId: string
  message: string
}

export interface DiscordSendMessageResponse {
  success: true
  messageId: string
  channelId: string
  timestamp: string
}

export interface DiscordError {
  error: string
}

export class DiscordApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public discordError?: any
  ) {
    super(message)
    this.name = 'DiscordApiError'
  }
}
