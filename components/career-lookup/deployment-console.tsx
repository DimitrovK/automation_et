"use client"

import React, { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Terminal, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"

export interface DeploymentLogEntry {
  id: string
  timestamp: Date
  type: 'info' | 'request' | 'response' | 'success' | 'error' | 'loading'
  message: string
  data?: any
}

interface DeploymentConsoleProps {
  logs: DeploymentLogEntry[]
  isActive: boolean
  onClear?: () => void
}

export function DeploymentConsole({ logs, isActive, onClear }: DeploymentConsoleProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [logs])

  if (!isActive && logs.length === 0) {
    return null
  }

  const getLogIcon = (type: DeploymentLogEntry['type']) => {
    switch (type) {
      case 'info':
        return <Terminal className="h-4 w-4 text-blue-500" />
      case 'request':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'response':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />
    }
  }

  const getLogStyle = (type: DeploymentLogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-700 dark:text-blue-300'
      case 'request':
        return 'text-orange-700 dark:text-orange-300'
      case 'response':
        return 'text-green-700 dark:text-green-300'
      case 'success':
        return 'text-green-800 dark:text-green-200 font-medium'
      case 'error':
        return 'text-red-700 dark:text-red-300 font-medium'
      case 'loading':
        return 'text-blue-700 dark:text-blue-300'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>Deployment Console</CardTitle>
            {isActive && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Active
              </Badge>
            )}
          </div>
          {onClear && logs.length > 0 && !isActive && (
            <button
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>
        <CardDescription>
          Real-time deployment progress and API request/response logging
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea ref={scrollAreaRef} className="h-64 w-full border rounded-lg">
          <div className="bg-gray-100 dark:bg-slate-700 p-4 space-y-2">
            {logs.length === 0 && !isActive ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No deployment activity yet</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={log.id} className="flex items-start gap-3 text-xs font-mono">
                  <span className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <div className="flex-shrink-0 mt-0.5">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`${getLogStyle(log.type)} break-words`}>
                      {log.message}
                    </div>
                    {log.data && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                          View data
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-200 dark:bg-slate-600 rounded text-xs overflow-x-auto">
                          <code>{JSON.stringify(log.data, null, 2)}</code>
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Helper function to create log entries
export const createLogEntry = (
  type: DeploymentLogEntry['type'],
  message: string,
  data?: any
): DeploymentLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date(),
  type,
  message,
  data
})
