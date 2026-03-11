'use client';

import type { NationComparison } from '@/components/bulk-career-lookup/types';
import {
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  Shield,
  Upload,
} from 'lucide-react';
import React from 'react';
import { useNationSyncContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type NationComparisonTableProps = {
  comparisons: NationComparison[];
  footballerId: number;
  /** 'inline' = inside player row (6 columns), 'summary' = bottom summary (7 columns with Status) */
  variant: 'inline' | 'summary';
};

function SyncActionCell({
  syncKey,
  comp,
  footballerId,
}: {
  syncKey: string;
  comp: NationComparison;
  footballerId: number;
}) {
  const { nationSyncStatus, nationSyncErrors, handleInlineAddNation, handleInlineUpdateNation } = useNationSyncContext();
  const opStatus = nationSyncStatus[syncKey];
  const opError = nationSyncErrors[syncKey];

  if (opStatus === 'loading') {
    return (
      <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-800">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Processing
      </Badge>
    );
  }

  if (opStatus === 'success') {
    return (
      <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
        <Check className="mr-1 size-3" />
        Done
      </Badge>
    );
  }

  if (opStatus === 'error') {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
          <AlertTriangle className="mr-1 size-3" />
          Failed
        </Badge>
        {opError && <span className="max-w-[160px] text-xs text-red-600 dark:text-red-400">{opError}</span>}
      </div>
    );
  }

  // No opStatus — show action buttons
  if (comp.status === 'synced') {
    return (
      <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
        <Check className="mr-1 size-3" />
        Synced
      </Badge>
    );
  }

  if (comp.status === 'mismatch' && comp.dbStat) {
    return (
      <button
        type="button"
        onClick={() => handleInlineUpdateNation(footballerId, comp.wikiTeam, comp.dbStat!.id, comp.dbStat!.nation_id)}
        className="inline-flex items-center rounded-md border border-amber-300 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
      >
        <Upload className="mr-1 size-3" />
        Update in DB
      </button>
    );
  }

  if (comp.status === 'not-in-db') {
    return (
      <button
        type="button"
        onClick={() => handleInlineAddNation(footballerId, comp.wikiTeam)}
        className="inline-flex items-center rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
      >
        <Plus className="mr-1 size-3" />
        Add to DB
      </button>
    );
  }

  if (comp.status === 'not-found') {
    return (
      <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
        <AlertTriangle className="mr-1 size-3" />
        Nation not in DB
      </Badge>
    );
  }

  return null;
}

function SummaryStatusCell({ comp }: { comp: NationComparison }) {
  if (comp.status === 'synced') {
    return (
      <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
        <Check className="mr-1 size-3" />
        Synced
      </Badge>
    );
  }
  if (comp.status === 'mismatch') {
    return (
      <Badge variant="secondary" className="border-amber-200 bg-amber-100 text-amber-800">
        <AlertTriangle className="mr-1 size-3" />
        Mismatch
      </Badge>
    );
  }
  if (comp.status === 'not-in-db') {
    return (
      <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-800">
        <Plus className="mr-1 size-3" />
        Not in DB
      </Badge>
    );
  }
  if (comp.status === 'not-found') {
    return (
      <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
        <AlertTriangle className="mr-1 size-3" />
        Nation missing
      </Badge>
    );
  }
  return null;
}

function SummaryActionCell({
  syncKey,
  comp,
  footballerId,
}: {
  syncKey: string;
  comp: NationComparison;
  footballerId: number;
}) {
  const { nationSyncStatus, nationSyncErrors, handleInlineAddNation, handleInlineUpdateNation } = useNationSyncContext();
  const opStatus = nationSyncStatus[syncKey];
  const opError = nationSyncErrors[syncKey];

  if (opStatus === 'loading') {
    return (
      <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-800">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Processing
      </Badge>
    );
  }
  if (opStatus === 'success') {
    return (
      <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
        <Check className="mr-1 size-3" />
        Done
      </Badge>
    );
  }
  if (opStatus === 'error') {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
          <AlertTriangle className="mr-1 size-3" />
          Failed
        </Badge>
        {opError && <span className="max-w-[160px] text-xs text-red-600">{opError}</span>}
      </div>
    );
  }
  if (!opStatus && comp.status === 'mismatch' && comp.dbStat) {
    return (
      <button
        type="button"
        onClick={() => handleInlineUpdateNation(footballerId, comp.wikiTeam, comp.dbStat!.id, comp.dbStat!.nation_id)}
        className="inline-flex items-center rounded-md border border-amber-300 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
      >
        <Upload className="mr-1 size-3" />
        Update
      </button>
    );
  }
  if (!opStatus && comp.status === 'not-in-db') {
    return (
      <button
        type="button"
        onClick={() => handleInlineAddNation(footballerId, comp.wikiTeam)}
        className="inline-flex items-center rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
      >
        <Plus className="mr-1 size-3" />
        Add
      </button>
    );
  }
  if (!opStatus && comp.status === 'synced') {
    return <span className="text-xs text-gray-400">&mdash;</span>;
  }
  if (!opStatus && comp.status === 'not-found') {
    return (
      <span className="text-xs text-red-600 dark:text-red-400">Nation entity missing</span>
    );
  }
  return null;
}

function getRowBgClass(status: NationComparison['status']) {
  switch (status) {
    case 'mismatch': return 'bg-amber-50 dark:bg-amber-900/20';
    case 'not-in-db': return 'bg-blue-50 dark:bg-blue-900/20';
    case 'not-found': return 'bg-red-50 dark:bg-red-900/20';
    default: return '';
  }
}

function getMismatchClass(comp: NationComparison, field: 'apps' | 'goals') {
  if (comp.status !== 'mismatch' || !comp.dbStat) {
    return '';
  }
  if (field === 'apps' && comp.dbStat.apps !== comp.wikiTeam.apps) {
    return 'font-semibold text-amber-700 dark:text-amber-400';
  }
  if (field === 'goals' && comp.dbStat.goals !== comp.wikiTeam.goals) {
    return 'font-semibold text-amber-700 dark:text-amber-400';
  }
  return '';
}

export function NationComparisonTable({ comparisons, footballerId, variant }: NationComparisonTableProps) {
  const isSummary = variant === 'summary';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${isSummary ? 'border-gray-200 dark:border-slate-600' : 'border-gray-100 dark:border-slate-700'}`}>
            <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Nation</th>
            <th className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Wiki Apps</th>
            <th className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Wiki Goals</th>
            <th className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">DB Apps</th>
            <th className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">DB Goals</th>
            {isSummary && (
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Status</th>
            )}
            <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Action</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((comp) => {
            const syncKey = `${footballerId}-${comp.wikiTeam.nationID}`;
            const keyPrefix = isSummary ? `bottom-nt-${footballerId}` : `inline-nt`;

            return (
              <tr
                key={`${keyPrefix}-${comp.wikiTeam.teamName}`}
                className={`border-b border-gray-100 text-sm dark:border-slate-600 ${getRowBgClass(comp.status)}`}
              >
                <td className="p-2 font-medium text-gray-900 dark:text-white">
                  {comp.wikiTeam.teamName}
                  {comp.wikiTeam.nationNameDB && comp.wikiTeam.nationNameDB !== comp.wikiTeam.teamName && (
                    <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                      (DB:
                      {' '}
                      {comp.wikiTeam.nationNameDB}
                      )
                    </span>
                  )}
                </td>
                <td className={`p-2 text-center ${getMismatchClass(comp, 'apps')}`}>
                  {comp.wikiTeam.apps}
                </td>
                <td className={`p-2 text-center ${getMismatchClass(comp, 'goals')}`}>
                  {comp.wikiTeam.goals}
                </td>
                <td className={`p-2 text-center ${getMismatchClass(comp, 'apps')}`}>
                  {comp.dbStat ? comp.dbStat.apps : '\u2014'}
                </td>
                <td className={`p-2 text-center ${getMismatchClass(comp, 'goals')}`}>
                  {comp.dbStat ? comp.dbStat.goals : '\u2014'}
                </td>
                {isSummary && (
                  <td className="p-2">
                    <SummaryStatusCell comp={comp} />
                  </td>
                )}
                <td className="p-2">
                  {isSummary
                    ? <SummaryActionCell syncKey={syncKey} comp={comp} footballerId={footballerId} />
                    : <SyncActionCell syncKey={syncKey} comp={comp} footballerId={footballerId} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Inline wrapper that renders the nation sync card inside a player row.
 * Shows a green "in sync" banner if all nations are synced, otherwise shows the table card.
 */
export function InlineNationSyncCard({
  comparisons,
  footballerId,
  hasNoInternationalCareer,
}: {
  comparisons: NationComparison[];
  footballerId: number;
  hasNoInternationalCareer: boolean;
}) {
  if (hasNoInternationalCareer) {
    return null;
  }

  if (comparisons.length === 0) {
    return null;
  }

  const pending = comparisons.filter(c => c.status === 'not-in-db' || c.status === 'mismatch');

  if (pending.length === 0 && comparisons.every(c => c.status === 'synced' || c.status === 'not-found')) {
    return (
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
          <Shield className="size-4" />
          National team stats are in sync
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="border-2 border-blue-200 bg-white shadow-lg dark:border-blue-700 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <Shield className="size-5 text-blue-600" />
                National Team Sync
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                {pending.length}
                {' '}
                nation
                {pending.length !== 1 ? 's' : ''}
                {' '}
                need
                {pending.length === 1 ? 's' : ''}
                {' '}
                updating
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <NationComparisonTable comparisons={comparisons} footballerId={footballerId} variant="inline" />
        </CardContent>
      </Card>
    </div>
  );
}
