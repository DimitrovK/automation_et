'use client';

import type { LogEvent } from '@/lib/upload-logger';
import { ChevronDown, ChevronUp, Terminal, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadLogger } from '@/lib/upload-logger';

type LogEntry = {
  id: number;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'api';
  message: string;
  data?: any;
};

export function ConsoleLogDisplay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to upload logger events
    const unsubscribe = uploadLogger.subscribe((event: LogEvent) => {
      const newLog: LogEntry = {
        id: event.id,
        timestamp: event.timestamp,
        type: event.level === 'debug' ? 'info' : event.level,
        message: event.message,
        data: event.data,
      };

      setLogs(prev => [...prev, newLog]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
    uploadLogger.clear();
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'api':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getLogBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">SUCCESS</Badge>;
      case 'error':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">ERROR</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">WARNING</Badge>;
      case 'api':
        return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">API</Badge>;
      default:
        return <Badge variant="outline">INFO</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="size-5 text-blue-600" />
            Console Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
            >
              <Trash2 className="mr-2 size-4" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded
                ? (
                    <>
                      <ChevronUp className="mr-2 size-4" />
                      Collapse
                    </>
                  )
                : (
                    <>
                      <ChevronDown className="mr-2 size-4" />
                      Expand
                    </>
                  )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="h-96 overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-sm">
            {logs.length === 0
              ? (
                  <div className="py-8 text-center text-gray-500">
                    No logs yet. Start uploading to see activity...
                  </div>
                )
              : (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id} className="border-l-2 border-gray-700 py-1 pl-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs text-gray-500">{log.timestamp}</span>
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
  );
}
