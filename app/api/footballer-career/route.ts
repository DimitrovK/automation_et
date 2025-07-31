import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("API Route: Received request body:", body)

    // Get the webhook URL from environment variable or use default
    const baseWebhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678"
    const webhookUrl = `${baseWebhookUrl}/webhook/footballer-career`

    console.log(`API Route: Attempting to call: ${webhookUrl}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`API Route: Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`API Route: Error response: ${errorText}`)
        throw new Error(`Webhook responded with status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("API Route: Successfully received data from webhook")

      return NextResponse.json(data)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("API Route: Fetch error:", fetchError)
      throw fetchError
    }
  } catch (error) {
    console.error("API Route: General error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch player data",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check server logs for more details. Ensure n8n webhook is running and accessible.",
      },
      { status: 500 },
    )
  }
}
