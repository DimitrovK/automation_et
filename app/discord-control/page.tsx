"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  MessageCircle, 
  Send, 
  Hash, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"

// Discord channels configuration
const DISCORD_CHANNELS = [
  {
    id: "1260947625818193993",
    name: "important-rules",
    description: "Important server rules and guidelines"
  },
  {
    id: "1357777634565820516",
    name: "announcements",
    description: "Server announcements and updates"
  },
  {
    id: "1365720870361763960",
    name: "status",
    description: "Server status updates"
  },
  {
    id: "1364890244704632842",
    name: "quizes-rules",
    description: "Rules and guidelines for quizzes"
  },
  {
    id: "1364890395028357172",
    name: "quizes-general",
    description: "General quiz discussions and activities"
  },
  {
    id: "1364255266081603687",
    name: "guess-the-luneup-rules",
    description: "Rules for guess the lineup game"
  },
  {
    id: "1364254085703925780",
    name: "guess-the-luneup-scoring",
    description: "Scoring and results for guess the lineup"
  },
  {
    id: "1364255174436327444",
    name: "guess-the-luneup-general",
    description: "General discussions for guess the lineup"
  },
  {
    id: "1260853015435280464",
    name: "community-introductions",
    description: "Community member introductions"
  },
  {
    id: "1301569872815460373",
    name: "community-general",
    description: "General community discussions"
  },
  {
    id: "1364888309351972884",
    name: "contact-us-bug-reports",
    description: "Bug reports and technical issues"
  },
  {
    id: "1364888981799567430",
    name: "contact-us-suggestions",
    description: "Suggestions and feedback"
  },
]

export default function DiscordControlPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [selectedChannelId, setSelectedChannelId] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Authentication check
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  const selectedChannel = DISCORD_CHANNELS.find(ch => ch.id === selectedChannelId)

  const handleSendMessage = async () => {
    if (!selectedChannelId || !message.trim()) {
      setSendResult({ type: 'error', message: 'Please select a channel and enter a message' })
      return
    }

    setIsSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/discord/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          message: message.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSendResult({ type: 'success', message: 'Message sent successfully!' })
        setMessage("") // Clear message after successful send
      } else {
        setSendResult({ type: 'error', message: result.error || 'Failed to send message' })
      }
    } catch (error) {
      setSendResult({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setIsSending(false)
    }
  }

  const clearResult = () => setSendResult(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-900/30 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <MessageCircle className="h-8 w-8 text-indigo-600" />
            Discord Control
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Send messages to Discord channels using the ExtraTime bot
          </p>
        </div>

        {/* Main Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-indigo-600" />
              Channel Message Sender
            </CardTitle>
            <CardDescription>
              Select a Discord channel and compose your message in Markdown format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Channel Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Discord Channel</label>
              <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Discord channel..." />
                </SelectTrigger>
                <SelectContent>
                  {DISCORD_CHANNELS.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span className="font-medium">{channel.name}</span>
                        <span className="text-xs text-gray-500">({channel.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedChannel && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Badge variant="outline" className="text-xs">
                    ID: {selectedChannel.id}
                  </Badge>
                  <span>{selectedChannel.description}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Message Composition */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Message (Markdown supported)</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs"
                >
                  {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
              
              <Textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  if (sendResult) clearResult()
                }}
                placeholder="Enter your message here... Markdown formatting is supported:
• **bold text**
• *italic text* 
• `code`
• [links](https://example.com)
• > quotes
• Lists and more..."
                className="min-h-32 resize-y"
                disabled={isSending}
              />

              {/* Message Preview */}
              {showPreview && message && (
                <div className="mt-3">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Preview:</label>
                  <div className="mt-1 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm whitespace-pre-wrap">
                    {message}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: This is a plain text preview. Discord will render the markdown formatting.
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Character count: {message.length}/2000
              </div>
            </div>

            <Separator />

            {/* Send Controls */}
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleSendMessage}
                disabled={!selectedChannelId || !message.trim() || isSending || message.length > 2000}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>

              {/* Result Display */}
              {sendResult && (
                <Alert variant={sendResult.type === 'success' ? 'default' : 'destructive'}>
                  {sendResult.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {sendResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Markdown Formatting Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Text Formatting:</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li><code>**bold text**</code> → <strong>bold text</strong></li>
                  <li><code>*italic text*</code> → <em>italic text</em></li>
                  <li><code>`code`</code> → <code>code</code></li>
                  <li><code>~~strikethrough~~</code> → <span style={{textDecoration: 'line-through'}}>strikethrough</span></li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Other Elements:</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li><code>[link text](URL)</code> → links</li>
                  <li><code>&gt; quote text</code> → quoted text</li>
                  <li><code>- list item</code> → bullet lists</li>
                  <li><code>1. numbered item</code> → numbered lists</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {isSending && (
        <LoadingSpinner 
          message="Sending Discord Message" 
          subtitle="Connecting to Discord servers..." 
          size="md"
          overlay={true}
        />
      )}
    </div>
  )
}