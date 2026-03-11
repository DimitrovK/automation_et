'use client';

import { AlertTriangle, Play, RotateCcw } from 'lucide-react';
import React from 'react';
import { useBulkProcessingContext, usePlayerListContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';

import { AmberButton } from '@/components/ui/amber-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import { GraphiteButton } from '@/components/ui/graphite-button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function ProcessingControls() {
  const { footballers, selectedFootballers } = usePlayerListContext();
  const {
    checkMode,
    setCheckMode,
    isProcessing,
    startBulkProcessing,
    clearAll,
    useWikipediaUrl,
    setUseWikipediaUrl,
    autoSyncNations,
    setAutoSyncNations,
    stats,
    setActiveTab,
  } = useBulkProcessingContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="size-5" />
          Bulk Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="check-mode-select" className="mb-2 block text-sm font-medium">Check Mode</label>
          <Select value={checkMode} onValueChange={(value: any) => setCheckMode(value)}>
            <SelectTrigger id="check-mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="career-and-nations">Career & Nations</SelectItem>
              <SelectItem value="career">Career Only</SelectItem>
              <SelectItem value="nations">Nations Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <ApiButton
            onClick={startBulkProcessing}
            disabled={isProcessing || footballers.length === 0}
            loading={isProcessing}
            loadingText="Processing..."
            className="flex-1"
            icon={Play}
          >
            {selectedFootballers.size > 0
              ? `Start (${selectedFootballers.size})`
              : `Check All (${footballers.length})`}
          </ApiButton>
          <GraphiteButton
            onClick={clearAll}
            disabled={isProcessing}
            size="sm"
          >
            <RotateCcw className="size-4" />
          </GraphiteButton>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedFootballers.size > 0
            ? (
                <>
                  Selected:
                  {' '}
                  {selectedFootballers.size}
                  {' '}
                  players
                </>
              )
            : (
                <>
                  No selection — will check all
                  {' '}
                  {footballers.length}
                  {' '}
                  on this page
                </>
              )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label htmlFor="use-wikipedia-url" className="text-sm font-medium">
              Use Wikipedia URLs
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              When available, use stored Wikipedia URLs of each player for career lookup
            </span>
          </div>
          <Switch
            id="use-wikipedia-url"
            checked={useWikipediaUrl}
            onCheckedChange={setUseWikipediaUrl}
            className="data-[state=unchecked]:bg-gray-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 dark:data-[state=unchecked]:bg-gray-700"
          />
        </div>

        {checkMode !== 'career' && (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label htmlFor="auto-sync-nations" className="text-sm font-medium">
                Auto-sync National Teams
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Automatically update national team stats in the DB during processing
              </span>
            </div>
            <Switch
              id="auto-sync-nations"
              checked={autoSyncNations}
              onCheckedChange={setAutoSyncNations}
              className="data-[state=unchecked]:bg-gray-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 dark:data-[state=unchecked]:bg-gray-700"
            />
          </div>
        )}

        {isProcessing && (
          <Progress value={(stats.processed / stats.total) * 100} className="w-full" />
        )}

        {!isProcessing && stats.processed > 0 && (stats.discrepancies > 0 || stats.errors > 0) && (
          <AmberButton
            onClick={() => setActiveTab('results')}
            className="mt-2 w-full duration-500 animate-in fade-in-50"
            icon={AlertTriangle}
          >
            Review Issues (
            {stats.discrepancies + stats.errors}
            )
          </AmberButton>
        )}
      </CardContent>
    </Card>
  );
}
