import { NextRequest, NextResponse } from "next/server"

// This will be your Discord bot token (store in environment variables for security)
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

interface DiscordSendMessageRequest {
  channelId: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if bot token is configured
    if (!DISCORD_BOT_TOKEN) {
      return NextResponse.json(
        { error: "Discord bot token not configured" },
        { status: 500 }
      )
    }

    const body: DiscordSendMessageRequest = await request.json()
    const { channelId, message } = body

    // Validate input
    if (!channelId || !message?.trim()) {
      return NextResponse.json(
        { error: "Channel ID and message are required" },
        { status: 400 }
      )
    }

    // Validate message length (Discord limit is 2000 characters)
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long. Discord messages must be 2000 characters or less." },
        { status: 400 }
      )
    }

    // Send message to Discord using their REST API
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message.trim(),
        }),
      }
    )

    if (!discordResponse.ok) {
      const errorData = await discordResponse.json().catch(() => ({}))
      
      // Handle specific Discord API errors
      if (discordResponse.status === 403) {
        return NextResponse.json(
          { error: "Bot doesn't have permission to send messages to this channel" },
          { status: 403 }
        )
      } else if (discordResponse.status === 404) {
        return NextResponse.json(
          { error: "Channel not found. Please check the channel ID." },
          { status: 404 }
        )
      } else if (discordResponse.status === 401) {
        return NextResponse.json(
          { error: "Invalid bot token" },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { 
          error: `Discord API error: ${errorData.message || discordResponse.statusText}` 
        },
        { status: discordResponse.status }
      )
    }

    const messageData = await discordResponse.json()

    return NextResponse.json({
      success: true,
      messageId: messageData.id,
      channelId: messageData.channel_id,
      timestamp: messageData.timestamp,
    })

  } catch (error) {
    console.error("Discord API error:", error)
    
    return NextResponse.json(
      { error: "Internal server error while sending Discord message" },
      { status: 500 }
    )
  }
}