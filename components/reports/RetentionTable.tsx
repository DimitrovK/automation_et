'use client';

import type { RetentionResponse } from '@/types/reports';
import { AlertTriangle } from 'lucide-react';
import { ExportButton } from '@/components/reports/ExportButton';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/ReportTable';
import { StatTile } from '@/components/reports/StatTile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Heat shading so a retention triangle is readable at a glance. Deliberately
 * generous at the low end: healthy D30 for a casual game is single digits, so a
 * scale anchored at 50% would paint every real column the same shade of nothing.
 */
function heat(pct: number | null): string {
  if (pct === null) {
    return 'bg-muted/50 text-muted-foreground/70';
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
  return 'bg-muted text-muted-foreground';
}

export function RetentionTable({ data }: { data: RetentionResponse }) {
  const keys = data.offsets.map(offset => `d${offset}`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {keys.map((key) => {
          const cell = data.summary[key];
          return (
            <StatTile
              key={key}
              // Uppercased in the text, not by CSS: the label IS "D7", and
              // text-transform would leave a screen reader saying "d7" while
              // sighted readers see the milestone's actual name.
              label={key.toUpperCase()}
              value={cell?.pct === null || cell === undefined ? '—' : `${cell.pct}%`}
              hint={cell
                ? `${cell.returned.toLocaleString()} of ${cell.players.toLocaleString()} across ${cell.cohorts_measured} cohorts`
                : 'not enough history'}
            />
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Cohorts</CardTitle>
            <CardDescription>
              Each row is the players whose first session in this range fell on that day,
              and how many came back later.
              {' '}
              {data.basis}
              {' — so someone who has played for months but was picked up mid-range counts as new.'}
            </CardDescription>
          </div>
          <ExportButton
            view="retention"
            rows={data.cohorts}
            filters={{ start: data.start, end: data.end, game: data.game_type }}
            columns={[
              { header: 'Cohort day', value: row => row.date },
              { header: 'Players', value: row => row.cohort_size },
              { header: 'Inflated', value: row => (row.inflated ? 'yes' : 'no') },
              ...keys.map(key => ({
                header: `${key.toUpperCase()} %`,
                // Blank, not 0 — the cohort simply hasn't reached that milestone.
                value: (row: typeof data.cohorts[number]) => row.retention[key]?.pct ?? null,
              })),
              ...keys.map(key => ({
                header: `${key.toUpperCase()} returned`,
                value: (row: typeof data.cohorts[number]) => row.retention[key]?.returned ?? null,
              })),
            ]}
          />
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
            <ReportTable>
              <ReportHead>
                <Th>Cohort day</Th>
                <Th align="right">Players</Th>
                {keys.map(key => (
                  <Th key={key} align="center" className="pr-2 uppercase">{key}</Th>
                ))}
              </ReportHead>
              <tbody>
                {data.cohorts.map(cohort => (
                  <ReportRow
                    key={cohort.date}
                    // The borders live in ReportRow now; this only says what is
                    // specific to this table — a cohort too young to be complete
                    // is dimmed so it is not read as a real drop.
                    className={cohort.inflated ? 'opacity-60' : undefined}
                  >
                    <Td strong className="py-1.5">
                      {cohort.date}
                      {cohort.inflated && (
                        <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">
                          inflated
                        </span>
                      )}
                    </Td>
                    <Td align="right" className="py-1.5">
                      {cohort.cohort_size.toLocaleString()}
                    </Td>
                    {keys.map((key) => {
                      const cell = cohort.retention[key];
                      return (
                        <Td key={key} align="center" className="p-1">
                          <span
                            className={cn(
                              'inline-block w-full rounded px-2 py-1 text-xs tabular-nums',
                              heat(cell?.pct ?? null),
                            )}
                            title={cell ? `${cell.returned} of ${cohort.cohort_size} returned` : 'Not reached yet'}
                          >
                            {cell?.pct === undefined || cell === null ? '—' : `${cell.pct}%`}
                          </span>
                        </Td>
                      );
                    })}
                  </ReportRow>
                ))}
              </tbody>
            </ReportTable>
          </div>
          <p className="text-xs text-muted-foreground">
            "—" means the cohort hasn't reached that milestone yet, not 0%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
