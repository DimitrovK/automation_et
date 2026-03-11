'use client';

import React from 'react';
import { useBulkProcessingContext, usePlayerListContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';

import { getDisplayStats } from '@/components/bulk-career-lookup/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatisticsCard() {
  const { footballers, selectedFootballers } = usePlayerListContext();
  const { bulkResults, isProcessing, currentlyProcessing } = useBulkProcessingContext();

  const displayStats = getDisplayStats(bulkResults);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Total:</span>
          <Badge variant="outline">{displayStats.total}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Processed:</span>
          <Badge variant="outline">{displayStats.processed}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Without Issues:</span>
          <Badge className="border-green-300 bg-green-100 text-green-800">{displayStats.withoutIssues}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Discrepancies:</span>
          <Badge className="border-orange-300 bg-orange-100 text-orange-800">{displayStats.discrepancies}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Errors:</span>
          <Badge variant="destructive">{displayStats.errors}</Badge>
        </div>

        {isProcessing && currentlyProcessing && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
            <div className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
              Currently Processing:
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {(() => {
                const footballer = footballers.find(f => f.id === currentlyProcessing);
                const processIds = selectedFootballers.size > 0
                  ? Array.from(selectedFootballers)
                  : footballers.map(f => f.id);
                const currentIndex = processIds.indexOf(currentlyProcessing) + 1;
                const totalSelected = processIds.length;
                return footballer
                  ? `${footballer.first_name} ${footballer.last_name} (${currentIndex} of ${totalSelected})`
                  : `Player ${currentIndex} of ${totalSelected}`;
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
