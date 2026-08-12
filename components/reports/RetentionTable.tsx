'use client';

import type { RetentionResponse } from '@/types/reports';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Heat shading so a retention triangle is readable at a glance. Deliberately
 * generous at the low end: healthy D30 for a casual game is single digits, so a
 * scale anchored at 50% would paint every real column the same shade of nothing.
 */
function heat(pct: number | null): string {
  if (pct === null) {
    return 'bg-gray-50 text-gray-400 dark:bg-slate-800 dark:text-gray-500';
  }
  if (pct >= 40) {
    return 'bg-emerald-600 text-white';
  }
  if (pct >= 25) {
    return 'bg-emerald-500/80 text-white';
  }
  if (pct >= 15) {
    return 'bg-emerald-400/70 text-emerald-950';
  }
  if (pct >= 5) {
    return 'bg-emerald-300/60 text-emerald-950';
  }
  if (pct > 0) {
    return 'bg-emerald-200/50 text-emerald-950';
  }
  return 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-300';
}

export function RetentionTable({ data }: { data: RetentionResponse }) {
  const keys = data.offsets.map(offset => `d${offset}`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {keys.map((key) => {
          const cell = data.summary[key];
          return (
            <Card key={key}>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm font-medium uppercase text-gray-600 dark:text-gray-300">{key}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {cell?.pct === null || cell === undefined ? '—' : `${cell.pct}%`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {cell
                    ? `${cell.returned.toLocaleString()} of ${cell.players.toLocaleString()} across ${cell.cohorts_measured} cohorts`
                    : 'not enough history'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohorts</CardTitle>
          <CardDescription>
            Each row is the players whose first session in this range fell on that day,
            and how many came back later.
            {' '}
            {data.basis}
            {' — so someone who has played for months but was picked up mid-range counts as new.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.first_cohort_inflated && (
            <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                The first row sweeps up every established player who happened to be active
                that day, so its retention is overstated. It's excluded from the averages
                above — widen the range to push it further from the period you care about.
              </span>
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
                  <th className="py-2 pr-4 font-medium">Cohort day</th>
                  <th className="py-2 pr-4 text-right font-medium">Players</th>
                  {keys.map(key => (
                    <th key={key} className="py-2 pr-2 text-center font-medium uppercase">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map(cohort => (
                  <tr
                    key={cohort.date}
                    className={cn(
                      'border-b last:border-0 dark:border-slate-700',
                      cohort.inflated && 'opacity-60',
                    )}
                  >
                    <td className="py-1.5 pr-4 font-medium text-gray-900 dark:text-white">
                      {cohort.date}
                      {cohort.inflated && (
                        <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">
                          inflated
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">
                      {cohort.cohort_size.toLocaleString()}
                    </td>
                    {keys.map((key) => {
                      const cell = cohort.retention[key];
                      return (
                        <td key={key} className="p-1 text-center">
                          <span
                            className={cn(
                              'inline-block w-full rounded px-2 py-1 text-xs tabular-nums',
                              heat(cell?.pct ?? null),
                            )}
                            title={cell ? `${cell.returned} of ${cohort.cohort_size} returned` : 'Not reached yet'}
                          >
                            {cell?.pct === undefined || cell === null ? '—' : `${cell.pct}%`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            "—" means the cohort hasn't reached that milestone yet, not 0%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
