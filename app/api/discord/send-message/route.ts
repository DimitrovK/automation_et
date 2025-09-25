import { NextRequest, NextResponse } from "next/server"
import { sendDiscordMessage } from "../../../../lib/discord"
import { DiscordApiError } from "../../../../types/discord"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, message } = body

    if (!channelId || !message) {
      return NextResponse.json(
        { error: "Channel ID and message are required" },
        { status: 400 }
      )
    }

    const result = await sendDiscordMessage(channelId, message)
    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof DiscordApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}