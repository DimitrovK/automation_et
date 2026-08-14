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
      return <Terminal className="size-4 text-muted-foreground" />;
  }
}

export function PlayerProcessingLogs({ logs }: { logs: DeploymentLogEntry[] }) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="p-4">
      <Card className="border-2 border-border bg-card shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="size-5 text-blue-600" />
            Processing Logs
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Detailed processing activity and search method used
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-64 w-full rounded-lg border">
            <div className="space-y-2 bg-muted p-4">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 font-mono text-xs">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
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
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View data
                        </summary>
                        <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
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
