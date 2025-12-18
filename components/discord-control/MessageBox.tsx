'use client';

import {
  AlertCircle,
  Bold,
  CheckCircle,
  Code,
  Eye,
  EyeOff,
  Hash,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Send,
  Strikethrough,
} from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { sendDiscordMessageAction } from '@/lib/discord-actions';
import { useDiscord } from './DiscordContext';

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
  } = useDiscord();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newText = message.substring(0, start) + before + textToInsert + after + message.substring(end);
    setMessage(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      if (selectedText) {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + textToInsert.length);
      } else {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length);
      }
    }, 0);
  };

  const formatActions = [
    { icon: Bold, label: 'Bold', action: () => insertFormatting('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('*', '*', 'italic text') },
    { icon: Code, label: 'Code', action: () => insertFormatting('`', '`', 'code') },
    { icon: Strikethrough, label: 'Strikethrough', action: () => insertFormatting('~~', '~~', 'strikethrough') },
    { icon: Quote, label: 'Quote', action: () => insertFormatting('> ', '', 'quote text') },
    { icon: List, label: 'Bullet List', action: () => insertFormatting('- ', '', 'list item') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertFormatting('1. ', '', 'list item') },
    { icon: Link, label: 'Link', action: () => insertFormatting('[', '](https://example.com)', 'link text') },
  ];

  const handleSendMessage = async () => {
    if (!selectedChannelId || !message.trim()) {
      setSendResult({ type: 'error', message: 'Please select a channel and enter a message' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const result = await sendDiscordMessageAction(selectedChannelId, message.trim());

      if (result.success) {
        setSendResult({ type: 'success', message: 'Message sent successfully!' });
        setMessage(''); // Clear message after successful send
      } else {
        setSendResult({ type: 'error', message: result.error || 'Failed to send message' });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSendResult({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="size-5 text-indigo-600" />
            Channel Message Sender
          </CardTitle>
          <CardDescription>
            Select a Discord channel and compose your message in Markdown format
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-6 overflow-y-auto">
          {/* Channel Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Discord Channel</label>
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Discord channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels.map(channel => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className="flex items-center gap-2">
                      <Hash className="size-4" />
                      <span className="font-medium">{channel.name}</span>
                      <span className="text-xs text-gray-500">
                        (
                        {channel.description}
                        )
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChannel && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Badge variant="outline" className="text-xs">
                  ID:
                  {' '}
                  {selectedChannel.id}
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
                {showPreview ? <EyeOff className="mr-1 size-3" /> : <Eye className="mr-1 size-3" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex flex-wrap gap-1 rounded-md border bg-gray-50 p-2 dark:bg-gray-800">
              {formatActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={action.action}
                  disabled={isSending}
                  className="size-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title={action.label}
                >
                  <action.icon className="size-3" />
                </Button>
              ))}
            </div>

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (sendResult) {
                  clearResult();
                }
              }}
              placeholder="Enter your message here... Use the toolbar above for formatting or type markdown directly."
              className="min-h-32 resize-y"
              disabled={isSending}
            />

            {/* Message Preview */}
            {showPreview && message && (
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Preview:</label>
                <div className="prose prose-sm dark:prose-invert mt-1 max-w-none rounded-md border bg-gray-50 p-3 text-sm dark:bg-gray-800">
                  <ReactMarkdown
                    remarkPlugins={[remarkBreaks]}
                    components={{
                      // Custom components to match Discord-like styling
                      code: ({ children, ...props }) => (
                        <code className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs text-gray-900 dark:bg-gray-700 dark:text-white" {...props}>
                          {children}
                        </code>
                      ),
                      pre: ({ children, ...props }) => (
                        <pre className="overflow-x-auto rounded bg-gray-200 p-2 font-mono text-xs dark:bg-gray-700" {...props}>
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
                        <del className="text-gray-600 line-through dark:text-gray-400" {...props}>
                          {children}
                        </del>
                      ),
                      a: ({ children, ...props }) => (
                        <a className="text-indigo-600 hover:underline dark:text-indigo-400" {...props}>
                          {children}
                        </a>
                      ),
                      p: ({ children, ...props }) => (
                        <p className="mb-2 text-gray-800 dark:text-gray-200" {...props}>
                          {children}
                        </p>
                      ),
                      ul: ({ children, ...props }) => (
                        <ul className="mb-2 list-inside list-disc text-gray-800 dark:text-gray-200" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="mb-2 list-inside list-decimal text-gray-800 dark:text-gray-200" {...props}>
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
                <p className="mt-1 text-xs text-gray-500">
                  ✨ Live preview - This shows how your message will appear with formatting applied.
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Character count:
              {' '}
              {message.length}
              /2000
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
                {sendResult.type === 'success'
                  ? (
                      <CheckCircle className="size-4" />
                    )
                  : (
                      <AlertCircle className="size-4" />
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
  );
}
