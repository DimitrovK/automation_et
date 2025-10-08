"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Terminal, Trash2, ChevronDown, ChevronUp } from "lucide-react"

interface LogEntry {
  id: number
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning' | 'api'
  message: string
  data?: any
}

export function ConsoleLogDisplay() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const logIdCounter = useRef(0)

  useEffect(() => {
    // Intercept console.log
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args: any[]) => {
      originalLog(...args)
      addLog('info', args)
    }

    console.error = (...args: any[]) => {
      originalError(...args)
      addLog('error', args)
    }

    console.warn = (...args: any[]) => {
      originalWarn(...args)
      addLog('warning', args)
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const addLog = (type: LogEntry['type'], args: any[]) => {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2)
      }
      return String(arg)
    }).join(' ')

    // Determine log type from message content
    let logType = type
    if (message.includes('🌐 HTTP') || message.includes('API Call')) {
      logType = 'api'
    } else if (message.includes('✅') || message.includes('Success')) {
      logType = 'success'
    } else if (message.includes('❌') || message.includes('Error')) {
      logType = 'error'
    } else if (message.includes('⚠️') || message.includes('Warning')) {
      logType = 'warning'
    }

    const newLog: LogEntry = {
      id: logIdCounter.current++,
      timestamp: new Date().toLocaleTimeString(),
      type: logType,
      message,
      data: args.length > 1 ? args.slice(1) : undefined
    }

    setLogs(prev => [...prev, newLog])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'api':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const getLogBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">SUCCESS</Badge>
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">ERROR</Badge>
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">WARNING</Badge>
      case 'api':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">API</Badge>
      default:
        return <Badge variant="outline">INFO</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-600" />
            Console Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No logs yet. Start uploading to see activity...
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-gray-700 pl-3 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500 text-xs">{log.timestamp}</span>
                      {getLogBadge(log.type)}
                    </div>
                    <div className={`whitespace-pre-wrap break-all ${getLogColor(log.type)}`}>
                      {log.message}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
