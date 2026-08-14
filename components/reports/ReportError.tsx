'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ReportError({ error, notDeployed, onRetry }: {
  error: string;
  notDeployed: boolean;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-orange-600" />
          {notDeployed ? 'Not available yet' : 'Could not load'}
        </CardTitle>
        <CardDescription>
          {notDeployed
            ? 'This report depends on a backend endpoint that is not deployed yet.'
            : 'The backend returned an error.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-line text-sm text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 size-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
