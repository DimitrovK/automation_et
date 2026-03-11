'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkCareerLookupProvider, useBulkProcessingContext } from './BulkCareerLookupContext';
import { FilterControls } from './FilterControls';
import { PlayerList } from './PlayerList';
import { ProcessingControls } from './ProcessingControls';
import { ResultsSummary } from './ResultsSummary';
import { StatisticsCard } from './StatisticsCard';

function BulkCareerLookupHubContent() {
  const { activeTab, setActiveTab, stats } = useBulkProcessingContext();

  return (
    <>
      {/* Controls and Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FilterControls />
        <ProcessingControls />
        <StatisticsCard />
      </div>

      {/* Tabbed Content: Players / Results */}
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'players' | 'results')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players" className="flex items-center gap-2">
            Players
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={stats.processed === 0}>
            Results
            {stats.processed > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {stats.processed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="players">
          <PlayerList />
        </TabsContent>
        <TabsContent value="results">
          <ResultsSummary />
        </TabsContent>
      </Tabs>
    </>
  );
}

export function BulkCareerLookupHub({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <BulkCareerLookupProvider isAuthenticated={isAuthenticated}>
      <BulkCareerLookupHubContent />
    </BulkCareerLookupProvider>
  );
}
