import type { DiscordSendMessageResponse } from '@/types/discord';
import config from '@/lib/config';
import { DiscordApiError } from '@/types/discord';

/**
 * Validates Discord message input
 */
export function validateDiscordMessage(channelId: string, message: string): string | null {
  if (!channelId || !message?.trim()) {
    return 'Channel ID and message are required';
  }

  if (message.length > 2000) {
    return 'Message too long. Discord messages must be 2000 characters or less.';
  }

  return null;
}

/**
 * Sends a message to a Discord channel using the bot token
 */
export async function sendDiscordMessage(
  channelId: string,
  message: string,
): Promise<DiscordSendMessageResponse> {
  // Check if bot token is configured
  const discordToken = config.getDiscordToken();
  if (!discordToken) {
    throw new DiscordApiError(500, 'Discord bot token not configured');
  }

  // Validate input
  const validationError = validateDiscordMessage(channelId, message);
  if (validationError) {
    throw new DiscordApiError(400, validationError);
  }

  try {
    // Send message to Discord using their REST API
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${discordToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.trim(),
        }),
      },
    );

    if (!discordResponse.ok) {
      const errorData = await discordResponse.json().catch(() => ({}));

      // Handle specific Discord API errors
      if (discordResponse.status === 403) {
        console.error('Discord 403 error details:', errorData);
        throw new DiscordApiError(
          403,
          `Bot doesn't have permission to send messages to this channel. Make sure the bot is added to your server and has 'Send Messages' permission. Error: ${errorData.message || 'Unknown error'}`,
          errorData,
        );
      } else if (discordResponse.status === 404) {
        throw new DiscordApiError(
          404,
          'Channel not found. Please check the channel ID.',
          errorData,
        );
      } else if (discordResponse.status === 401) {
        throw new DiscordApiError(401, 'Invalid bot token', errorData);
      }

      throw new DiscordApiError(
        discordResponse.status,
        `Discord API error: ${errorData.message || discordResponse.statusText}`,
        errorData,
      );
    }

    const messageData = await discordResponse.json();

    return {
      success: true,
      messageId: messageData.id,
      channelId: messageData.channel_id,
      timestamp: messageData.timestamp,
    };
  } catch (error) {
    if (error instanceof DiscordApiError) {
      throw error;
    }

    console.error('Discord API error:', error);
    throw new DiscordApiError(500, 'Internal server error while sending Discord message');
  }
}

/**
 * Utility function to check if Discord bot is configured
 */
export function isDiscordBotConfigured(): boolean {
  return config.isDiscordTokenConfigured();
}
