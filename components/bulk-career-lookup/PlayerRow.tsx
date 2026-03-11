'use client';

import type { Footballer } from '@/types/player';
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  ShieldOff,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useBulkProcessingContext, usePlayerListContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';

import { InlineNationSyncCard } from '@/components/bulk-career-lookup/NationComparisonTable';
import { PlayerProcessingLogs } from '@/components/bulk-career-lookup/PlayerProcessingLogs';
import {
  getCareerDiscrepancies,
  getCareerLookupHref,
  getPlayerRowClassName,
  getStatusBadgeClassName,
  getStatusBadgeVariant,
  getStatusText,
} from '@/components/bulk-career-lookup/utils';
import { AmberButton } from '@/components/ui/amber-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getNationComparisons } from '@/lib/bulk-career-lookup';

export function PlayerRow({ footballer }: { footballer: Footballer }) {
  const { selectedFootballers, handleSelectFootballer } = usePlayerListContext();
  const {
    bulkResults,
    isProcessing,
    currentlyProcessing,
    expandedPlayers,
    useWikipediaUrl,
    togglePlayerExpanded,
  } = useBulkProcessingContext();

  const result = bulkResults.get(footballer.id);
  const isSelected = selectedFootballers.has(footballer.id);
  const isCurrentlyProcessing = currentlyProcessing === footballer.id;
  const isExpanded = expandedPlayers.has(footballer.id);

  const hasExpandableContent = result
    && ((result.discrepancies && result.discrepancies.length > 0) || (result.logs && result.logs.length > 0));

  const comparisons = result && !result.hasNoInternationalCareer && result.wikiNationalTeams && result.wikiNationalTeams.length > 0
    ? getNationComparisons(result)
    : [];

  // Filter to career-only discrepancies (nation issues shown in InlineNationSyncCard)
  const careerDiscrepancies = result?.discrepancies ? getCareerDiscrepancies(result.discrepancies) : [];

  return (
    <div
      className={`relative rounded-lg transition-all duration-200 ${getPlayerRowClassName(isCurrentlyProcessing, result, isSelected)}`}
    >
      {/* Processing Indicator */}
      {isCurrentlyProcessing && (
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-lg bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="absolute inset-0 animate-pulse rounded-t-lg bg-gradient-to-r from-blue-400 to-blue-500"></div>
        </div>
      )}

      {/* Collapsed View - Always Visible */}
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-1 items-center space-x-3">
          {/* Expand/Collapse Button */}
          {hasExpandableContent
            ? (
                <button
                  type="button"
                  onClick={() => togglePlayerExpanded(footballer.id)}
                  className="shrink-0 rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {isExpanded
                    ? <ChevronDown className="size-4 text-gray-500" />
                    : <ChevronRight className="size-4 text-gray-500" />}
                </button>
              )
            : <div className="w-6 shrink-0" />}

          {/* Selection Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={checked => handleSelectFootballer(footballer.id, !!checked)}
            disabled={isProcessing}
            className={`rounded-md transition-colors ${
              isSelected ? 'data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600' : ''
            }`}
          />

          {/* Player Name and Basic Info */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-medium text-gray-900 dark:text-white">
              {footballer.first_name}
              {' '}
              {footballer.last_name}
            </div>
            <div className="truncate text-sm text-gray-500 dark:text-gray-400">
              {footballer.nation.name}
              {' \u2022 Born: '}
              {footballer.date_of_birth}
            </div>
          </div>

          {/* Status Badge */}
          {result && (
            <Badge
              variant={getStatusBadgeVariant(result.status)}
              className={`shadow-sm ${getStatusBadgeClassName(result.status)}`}
            >
              {getStatusText(result.status)}
            </Badge>
          )}
        </div>

        <div className="ml-4 flex items-center space-x-2">
          {/* Review Button */}
          {result && result.status === 'discrepancy' && (
            <Link href={getCareerLookupHref(footballer, useWikipediaUrl)} target="_blank">
              <AmberButton
                onClick={() => {}}
                size="sm"
                className="transition-shadow duration-200 hover:shadow-lg"
                icon={Eye}
              >
                Review
              </AmberButton>
            </Link>
          )}

          {/* Error Indicator */}
          {result && result.status === 'error' && (
            <div className="flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mr-1 size-4" />
              <span className="text-xs font-medium">Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded View - Only show when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Discrepancy Details — career issues only */}
          {careerDiscrepancies.length > 0 && (
            <DiscrepancyDetails discrepancies={careerDiscrepancies} footballerId={footballer.id} />
          )}

          {/* Inline National Team Sync */}
          <InlineNationSyncCard
            comparisons={comparisons}
            footballerId={footballer.id}
            hasNoInternationalCareer={!!result?.hasNoInternationalCareer}
          />

          {/* No International Career indicator */}
          {result && result.hasNoInternationalCareer && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700/40 dark:text-gray-400">
                <ShieldOff className="size-4" />
                No international career recorded on Wikipedia
              </div>
            </div>
          )}

          {/* Processing Logs */}
          {result && result.logs && result.logs.length > 0 && (
            <PlayerProcessingLogs logs={result.logs} />
          )}
        </div>
      )}
    </div>
  );
}

function DiscrepancyDetails({ discrepancies, footballerId }: { discrepancies: string[]; footballerId: number }) {
  return (
    <div className="p-4">
      <Card className="border-2 border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <AlertTriangle className="size-5 text-orange-600" />
            Data Discrepancies Detected
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
            {discrepancies.length}
            {' '}
            issue
            {discrepancies.length > 1 ? 's' : ''}
            {' '}
            found when comparing database and Wikipedia data
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {discrepancies.slice(0, 3).map(discrepancy => (
              <div
                key={discrepancy}
                className="flex items-start gap-3 rounded-lg border border-orange-300/60 bg-white/80 p-3 shadow-sm dark:border-orange-600/40 dark:bg-gray-900/40"
              >
                <div className="mt-2.5 size-2 shrink-0 rounded-full bg-orange-600"></div>
                <span className="text-sm font-medium leading-relaxed text-orange-900 dark:text-orange-100">
                  {discrepancy}
                </span>
              </div>
            ))}
            {discrepancies.length > 3 && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-orange-300 bg-orange-200/60 p-3 shadow-sm dark:border-orange-600 dark:bg-orange-700/30">
                  <div className="text-center text-sm font-semibold text-orange-900 dark:text-orange-200">
                    +
                    {discrepancies.length - 3}
                    {' '}
                    additional discrepanc
                    {discrepancies.length - 3 > 1 ? 'ies' : 'y'}
                    {' '}
                    found
                  </div>
                </div>
                <AmberButton
                  onClick={() => {
                    const footballerSection = document.querySelector(`[data-footballer-id="${footballerId}"]`);
                    if (footballerSection) {
                      footballerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full text-sm shadow-md transition-shadow duration-200 hover:shadow-lg"
                  size="sm"
                >
                  View All Issues (
                  {discrepancies.length}
                  )
                </AmberButton>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
