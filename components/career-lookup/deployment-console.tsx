'use client';

import { CheckCircle, Clock, Loader2, Terminal, XCircle } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export type DeploymentLogEntry = {
  id: string;
  timestamp: Date;
  type: 'info' | 'request' | 'response' | 'success' | 'error' | 'loading';
  message: string;
  data?: any;
};

type DeploymentConsoleProps = {
  logs: DeploymentLogEntry[];
  isActive: boolean;
  onClear?: () => void;
};

export function DeploymentConsole({ logs, isActive, onClear }: DeploymentConsoleProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs]);

  if (!isActive && logs.length === 0) {
    return null;
  }

  const getLogIcon = (type: DeploymentLogEntry['type']) => {
    switch (type) {
      case 'info':
        return <Terminal className="size-4 text-blue-500" />;
      case 'request':
        return <Clock className="size-4 text-orange-500" />;
      case 'response':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'success':
        return <CheckCircle className="size-4 text-green-600" />;
      case 'error':
        return <XCircle className="size-4 text-red-500" />;
      case 'loading':
        return <Loader2 className="size-4 animate-spin text-blue-500" />;
      default:
        return <Terminal className="size-4 text-gray-500" />;
    }
  };

  const getLogStyle = (type: DeploymentLogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-700 dark:text-blue-300';
      case 'request':
        return 'text-orange-700 dark:text-orange-300';
      case 'response':
        return 'text-green-700 dark:text-green-300';
      case 'success':
        return 'text-green-800 dark:text-green-200 font-medium';
      case 'error':
        return 'text-red-700 dark:text-red-300 font-medium';
      case 'loading':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="size-5" />
            <CardTitle>Deployment Console</CardTitle>
            {isActive && (
              <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-800">
                <Loader2 className="mr-1 size-3 animate-spin" />
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
        <ScrollArea ref={scrollAreaRef} className="h-80 w-full rounded-lg border">
          <div className="space-y-2 bg-gray-100 p-4 dark:bg-slate-700">
            {logs.length === 0 && !isActive
              ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <Terminal className="mx-auto mb-2 size-8 opacity-50" />
                    <p className="text-sm">No deployment activity yet</p>
                  </div>
                )
              : (
                  logs.map((log, index) => (
                    <div key={log.id} className="flex items-start gap-3 font-mono text-xs">
                      <span className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <div className="mt-0.5 shrink-0">
                        {getLogIcon(log.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`${getLogStyle(log.type)} break-words`}>
                          {log.message}
                        </div>
                        {log.data && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                              View data
                            </summary>
                            <pre className="mt-1 overflow-x-auto rounded bg-gray-200 p-2 text-xs dark:bg-slate-600">
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
  );
}

// Helper function to create log entries
export const createLogEntry = (
  type: DeploymentLogEntry['type'],
  message: string,
  data?: any,
): DeploymentLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date(),
  type,
  message,
  data,
});
