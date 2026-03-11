'use client';

import type { DeploymentLogEntry } from '@/types/deployment';
import {
  CheckCircle,
  Clock,
  Loader2,
  Terminal,
  XCircle,
} from 'lucide-react';
import React from 'react';
import { formatTimestamp, getLogStyle } from '@/components/bulk-career-lookup/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

function getLogIcon(type: DeploymentLogEntry['type']) {
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
}

export function PlayerProcessingLogs({ logs }: { logs: DeploymentLogEntry[] }) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="p-4">
      <Card className="border-2 border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <Terminal className="size-5 text-blue-600" />
            Processing Logs
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
            Detailed processing activity and search method used
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-64 w-full rounded-lg border">
            <div className="space-y-2 bg-gray-100 p-4 dark:bg-slate-700">
              {logs.map(log => (
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
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
