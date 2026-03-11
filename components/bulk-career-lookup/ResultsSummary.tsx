'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Eye,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useBulkProcessingContext, useNationSyncContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';

import { NationComparisonTable } from '@/components/bulk-career-lookup/NationComparisonTable';
import { getCareerDiscrepancies, getCareerLookupHref } from '@/components/bulk-career-lookup/utils';
import { AmberButton } from '@/components/ui/amber-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getNationComparisons } from '@/lib/bulk-career-lookup';

export function ResultsSummary() {
  const { bulkResults, stats, checkMode, useWikipediaUrl } = useBulkProcessingContext();
  const { nationSyncStatus, syncingAllNations, handleSyncAllNations } = useNationSyncContext();

  if (stats.processed === 0) {
    return null;
  }

  const allResults = Array.from(bulkResults.values());
  const completedResults = allResults.filter(r => r.status === 'completed');
  const errorResults = allResults.filter(r => r.status === 'error');
  const discrepancyResults = allResults.filter(r => r.status === 'discrepancy');

  // Filter to players that have career-specific discrepancies (not just nation issues)
  const careerDiscrepancyResults = discrepancyResults.filter((r) => {
    const careerIssues = getCareerDiscrepancies(r.discrepancies || []);
    return careerIssues.length > 0;
  });

  // Nation sync summary — include not-found, not-in-db, and mismatch
  const resultsWithNationIssues = allResults.filter((result) => {
    if (result.hasNoInternationalCareer) {
      return false;
    }
    if (!result.wikiNationalTeams || result.wikiNationalTeams.length === 0) {
      return false;
    }
    const comparisons = getNationComparisons(result);
    return comparisons.some(c => c.status === 'not-in-db' || c.status === 'mismatch' || c.status === 'not-found');
  });

  const totalPending = resultsWithNationIssues.reduce((sum, result) => {
    const comparisons = getNationComparisons(result);
    return sum + comparisons.filter((c) => {
      const key = `${result.footballer.id}-${c.wikiTeam.nationID}`;
      if (nationSyncStatus[key] === 'success') {
        return false;
      }
      return c.status === 'not-in-db' || c.status === 'mismatch' || c.status === 'not-found';
    }).length;
  }, 0);

  return (
    <div id="results-summary">
      {/* Successful Results */}
      {completedResults.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CardHeader>
              <CollapsibleTrigger className="flex w-full items-center justify-between [&[data-state=closed]>svg.collapse-icon]:-rotate-90">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="size-5" />
                  Successful Validations (
                  {completedResults.length}
                  )
                </CardTitle>
                <ChevronDown className="collapse-icon size-5 text-gray-500 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CardDescription>
                Players with matching data between database and Wikipedia
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {completedResults.map(result => (
                    <div key={result.footballer.id} className="rounded-lg border border-green-200 bg-green-50 p-3 dark:bg-green-900/20">
                      <div className="text-sm font-medium">
                        {result.footballer.first_name}
                        {' '}
                        {result.footballer.last_name}
                      </div>
                      {result.wikipediaData && result.databaseData && (
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Teams:
                          {' '}
                          {result.databaseData.teams_played_for?.length || 0}
                          {' '}
                          |
                          Apps:
                          {' '}
                          {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.apps, 0) || 0}
                          {' '}
                          |
                          Goals:
                          {' '}
                          {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.goals, 0) || 0}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Error Results */}
      {errorResults.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CardHeader>
              <CollapsibleTrigger className="flex w-full items-center justify-between [&[data-state=closed]>svg.collapse-icon]:-rotate-90">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="size-5" />
                  Processing Errors (
                  {errorResults.length}
                  )
                </CardTitle>
                <ChevronDown className="collapse-icon size-5 text-gray-500 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CardDescription>
                Players that could not be processed due to API errors
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {errorResults.map(result => (
                    <div key={result.footballer.id} className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-900/20">
                      <div className="text-sm font-medium">
                        {result.footballer.first_name}
                        {' '}
                        {result.footballer.last_name}
                      </div>
                      <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                        {result.error}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Discrepancy Results — career discrepancies only (nation issues shown in sync summary) */}
      {careerDiscrepancyResults.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CardHeader>
              <CollapsibleTrigger className="flex w-full items-center justify-between [&[data-state=closed]>svg.collapse-icon]:-rotate-90">
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="size-5" />
                  Discrepancies Found (
                  {careerDiscrepancyResults.length}
                  )
                </CardTitle>
                <ChevronDown className="collapse-icon size-5 text-gray-500 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CardDescription>
                Comparison between database records and Wikipedia data
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {careerDiscrepancyResults.map((result) => {
                    const careerIssues = getCareerDiscrepancies(result.discrepancies || []);
                    return (
                      <div key={result.footballer.id} data-footballer-id={result.footballer.id} className="rounded-lg border border-orange-200 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-lg font-medium">
                            {result.footballer.first_name}
                            {' '}
                            {result.footballer.last_name}
                          </div>
                          <Link href={getCareerLookupHref(result.footballer, useWikipediaUrl)} target="_blank">
                            <AmberButton
                              onClick={() => {}}
                              size="sm"
                              className="transition-shadow duration-200 hover:shadow-lg"
                              icon={Eye}
                            >
                              Review Details
                            </AmberButton>
                          </Link>
                        </div>

                        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                          {result.footballer.nation.name}
                          {' \u2022 Born: '}
                          {result.footballer.date_of_birth}
                        </div>

                        {careerIssues.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-orange-700 dark:text-orange-400">
                              Issues Found:
                            </div>
                            <ul className="space-y-1">
                              {careerIssues.map(discrepancy => (
                                <li key={discrepancy} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-orange-500" />
                                  {discrepancy}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Quick stats comparison */}
                        {result.wikipediaData && result.databaseData && (
                          <div className="mt-3 border-t border-orange-100 pt-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-700 dark:text-gray-300">Database</div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  Teams:
                                  {' '}
                                  {result.databaseData.teams_played_for?.length || 0}
                                  {' '}
                                  |
                                  Apps:
                                  {' '}
                                  {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.apps, 0) || 0}
                                  {' '}
                                  |
                                  Goals:
                                  {' '}
                                  {result.databaseData.teams_played_for?.reduce((sum, team) => sum + team.goals, 0) || 0}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700 dark:text-gray-300">Wikipedia</div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  Teams:
                                  {' '}
                                  {result.wikipediaData.teams?.length || 0}
                                  {' '}
                                  |
                                  Apps:
                                  {' '}
                                  {result.wikipediaData.totalAppearances || 'N/A'}
                                  {' '}
                                  |
                                  Goals:
                                  {' '}
                                  {result.wikipediaData.totalGoals || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* National Team Sync Summary */}
      {resultsWithNationIssues.length > 0 && checkMode !== 'career' && (
        <Collapsible defaultOpen>
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 [&[data-state=closed]>svg.collapse-icon]:-rotate-90">
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Shield className="size-5" />
                      National Team Sync Summary (
                      {resultsWithNationIssues.length}
                      {' '}
                      player
                      {resultsWithNationIssues.length !== 1 ? 's' : ''}
                      )
                    </CardTitle>
                    <ChevronDown className="collapse-icon size-5 text-gray-500 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CardDescription>
                    National team data differences between Wikipedia and the database
                  </CardDescription>
                </div>
                {totalPending > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncAllNations}
                    disabled={syncingAllNations}
                    className="inline-flex items-center rounded-md bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-emerald-600 hover:to-green-700 disabled:opacity-50"
                  >
                    {syncingAllNations
                      ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Syncing All...
                          </>
                        )
                      : (
                          <>
                            <RefreshCw className="mr-2 size-4" />
                            Sync All Nations (
                            {totalPending}
                            )
                          </>
                        )}
                  </button>
                )}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-6">
                  {resultsWithNationIssues.map((result) => {
                    const comparisons = getNationComparisons(result);
                    const pendingComps = comparisons.filter((c) => {
                      const key = `${result.footballer.id}-${c.wikiTeam.nationID}`;
                      if (nationSyncStatus[key] === 'success') {
                        return false;
                      }
                      return c.status === 'not-in-db' || c.status === 'mismatch' || c.status === 'not-found';
                    });

                    return (
                      <div key={result.footballer.id} className="rounded-lg border border-blue-200 p-4 dark:border-blue-700">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-base font-medium text-gray-900 dark:text-white">
                              {result.footballer.first_name}
                              {' '}
                              {result.footballer.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {result.footballer.nation.name}
                              {' \u2022 '}
                              {pendingComps.length}
                              {' '}
                              issue
                              {pendingComps.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <Link href={getCareerLookupHref(result.footballer, useWikipediaUrl)} target="_blank">
                            <AmberButton onClick={() => {}} size="sm" icon={Eye}>Review</AmberButton>
                          </Link>
                        </div>
                        <NationComparisonTable
                          comparisons={comparisons}
                          footballerId={result.footballer.id}
                          variant="summary"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
