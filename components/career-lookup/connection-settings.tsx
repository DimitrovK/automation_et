'use client';

import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import config from '@/lib/config';

type ConnectionSettingsProps = {
  webhookUrl?: string;
  setWebhookUrl?: (value: string) => void;
  className?: string;
  onSettingsChange?: (settings: {
    webhookUrl: string;
  }) => void;
};

export function ConnectionSettings({
  webhookUrl: propWebhookUrl,
  setWebhookUrl: propSetWebhookUrl,
  onSettingsChange,
  className = '',
}: ConnectionSettingsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Internal state with defaults
  const [internalWebhookUrl, setInternalWebhookUrl] = useState(config.N8N_WEBHOOK_URL);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const webhookUrl = propWebhookUrl ?? internalWebhookUrl;

  const setWebhookUrl = propSetWebhookUrl ?? ((value: string) => {
    setInternalWebhookUrl(value);
    onSettingsChange?.({
      webhookUrl: value,
    });
  });

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, info]);
  };

  const testConnection = async () => {
    setDebugInfo([]); // Clear previous results
    addDebugInfo('Testing connection...');
    addDebugInfo(`Testing: ${webhookUrl}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'test' }),
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);
      addDebugInfo(`${webhookUrl} - Status: ${response.status}`);

      if (response.ok) {
        addDebugInfo(`✅ Connection successful!`);
      } else {
        addDebugInfo(`❌ Connection failed with status: ${response.status}`);
      }
    } catch (err) {
      addDebugInfo(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Notify parent of initial settings when using callback approach
  useEffect(() => {
    if (onSettingsChange && !propWebhookUrl) {
      onSettingsChange({
        webhookUrl,
      });
    }
  }, []); // Only run once on mount

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`size-8 bg-transparent p-0 ${className}`}
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-4" />
            Connection Settings
          </DialogTitle>
          <DialogDescription>Configure how to connect to your n8n webhook</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder={config.N8N_WEBHOOK_URL}
                  className="flex-1"
                />
                <Button onClick={testConnection} variant="outline" size="sm">
                  Test
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Enter your n8n webhook URL. Player search requests will be sent directly to this URL.
              </p>
            </div>
          </div>

          {debugInfo && debugInfo.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg bg-gray-100 p-3 dark:bg-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium dark:text-white">Connection Test Results:</p>
                <Badge variant="outline" className="text-xs">
                  Direct:
                  {' '}
                  {webhookUrl?.split('/').pop() || 'webhook'}
                </Badge>
              </div>
              {debugInfo.map((info, index) => (
                <p key={index} className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {info}
                </p>
              ))}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
