"use server"

import { sendDiscordMessage } from "./discord"
import { DiscordApiError } from "@/types/discord"

/**
 * Server action for sending Discord messages
 * This runs on the server-side and can be called from client components
 */
export async function sendDiscordMessageAction(channelId: string, message: string) {
  try {
    const result = await sendDiscordMessage(channelId, message)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof DiscordApiError) {
      return { success: false, error: error.message }
    }
    console.error("Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
