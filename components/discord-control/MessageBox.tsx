"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import { Button } from "@/components/ui/button"
import { ApiButton } from "@/components/ui/emerald-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Send, 
  Hash, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Bold,
  Italic,
  Code,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  Link
} from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { sendDiscordMessageAction } from "@/lib/discord-actions"
import { useDiscord } from "./DiscordContext"

export function MessageBox() {
  const {
    selectedChannelId,
    setSelectedChannelId,
    selectedChannel,
    channels,
    message,
    setMessage,
    isSending,
    setIsSending,
    sendResult,
    setSendResult,
    showPreview,
    setShowPreview,
    clearResult,
  } = useDiscord()

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const insertFormatting = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newText = message.substring(0, start) + before + textToInsert + after + message.substring(end)
    setMessage(newText)

    // Set cursor position after formatting
    setTimeout(() => {
      if (selectedText) {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, start + before.length + textToInsert.length)
      } else {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length)
      }
    }, 0)
  }

  const formatActions = [
    { icon: Bold, label: 'Bold', action: () => insertFormatting('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('*', '*', 'italic text') },
    { icon: Code, label: 'Code', action: () => insertFormatting('`', '`', 'code') },
    { icon: Strikethrough, label: 'Strikethrough', action: () => insertFormatting('~~', '~~', 'strikethrough') },
    { icon: Quote, label: 'Quote', action: () => insertFormatting('> ', '', 'quote text') },
    { icon: List, label: 'Bullet List', action: () => insertFormatting('- ', '', 'list item') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertFormatting('1. ', '', 'list item') },
    { icon: Link, label: 'Link', action: () => insertFormatting('[', '](https://example.com)', 'link text') },
  ]

  const handleSendMessage = async () => {
    if (!selectedChannelId || !message.trim()) {
      setSendResult({ type: 'error', message: 'Please select a channel and enter a message' })
      return
    }

    setIsSending(true)
    setSendResult(null)

    try {
      const result = await sendDiscordMessageAction(selectedChannelId, message.trim())
      
      if (result.success) {
        setSendResult({ type: 'success', message: 'Message sent successfully!' })
        setMessage("") // Clear message after successful send
      } else {
        setSendResult({ type: 'error', message: result.error || 'Failed to send message' })
      }
      
    } catch (error) {
      console.error("Unexpected error:", error)
      setSendResult({ type: 'error', message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-indigo-600" />
            Channel Message Sender
          </CardTitle>
          <CardDescription>
            Select a Discord channel and compose your message in Markdown format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 overflow-y-auto">
          {/* Channel Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Discord Channel</label>
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Discord channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
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

            {/* Formatting Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border">
              {formatActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={action.action}
                  disabled={isSending}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title={action.label}
                >
                  <action.icon className="h-3 w-3" />
                </Button>
              ))}
            </div>
            
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (sendResult) clearResult()
              }}
              placeholder="Enter your message here... Use the toolbar above for formatting or type markdown directly."
              className="min-h-32 resize-y"
              disabled={isSending}
            />

            {/* Message Preview */}
            {showPreview && message && (
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Preview:</label>
                <div className="mt-1 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkBreaks]}
                    components={{
                      // Custom components to match Discord-like styling
                      code: ({ children, ...props }) => (
                        <code className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-1 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      ),
                      pre: ({ children, ...props }) => (
                        <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto" {...props}>
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children, ...props }) => (
                        <blockquote className="border-l-4 border-indigo-500 pl-3 italic text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children, ...props }) => (
                        <strong className="font-bold text-gray-900 dark:text-white" {...props}>
                          {children}
                        </strong>
                      ),
                      em: ({ children, ...props }) => (
                        <em className="italic text-gray-800 dark:text-gray-300" {...props}>
                          {children}
                        </em>
                      ),
                      del: ({ children, ...props }) => (
                        <del className="line-through text-gray-600 dark:text-gray-400" {...props}>
                          {children}
                        </del>
                      ),
                      a: ({ children, ...props }) => (
                        <a className="text-indigo-600 dark:text-indigo-400 hover:underline" {...props}>
                          {children}
                        </a>
                      ),
                      p: ({ children, ...props }) => (
                        <p className="text-gray-800 dark:text-gray-200 mb-2" {...props}>
                          {children}
                        </p>
                      ),
                      ul: ({ children, ...props }) => (
                        <ul className="list-disc list-inside text-gray-800 dark:text-gray-200 mb-2" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="list-decimal list-inside text-gray-800 dark:text-gray-200 mb-2" {...props}>
                          {children}
                        </ol>
                      ),
                      li: ({ children, ...props }) => (
                        <li className="text-gray-800 dark:text-gray-200" {...props}>
                          {children}
                        </li>
                      ),
                    }}
                  >
                    {message}
                  </ReactMarkdown>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ✨ Live preview - This shows how your message will appear with formatting applied.
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
            <ApiButton
              onClick={handleSendMessage}
              disabled={!selectedChannelId || !message.trim() || message.length > 2000}
              loading={isSending}
              loadingText="Sending..."
              icon={Send}
            >
              Send Message
            </ApiButton>

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

      {/* Loading Overlay */}
      {isSending && (
        <LoadingSpinner 
          message="Sending Discord Message" 
          subtitle="Connecting to Discord servers..." 
          size="md"
          overlay={true}
        />
      )}
    </>
  )
}
