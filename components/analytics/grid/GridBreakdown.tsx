'use client';

import type { GridGroupBy } from '@/hooks/use-report-filters';
import type { GridAnalyticsResponse, GridBreakdownRow, GridModeRow } from '@/types/reports';
import { GROUP_OPTIONS } from '@/components/analytics/grid/GridSessionsChart';
import { modeKey, modeLabel } from '@/components/analytics/panels/grid-mode';
import { DataBar } from '@/components/reports/primitives/DataBar';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { PanelCard, Segmented } from '@/components/reports/primitives/PanelCard';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { MAGNITUDE_BAR, MAGNITUDE_TRACK } from '@/lib/data-colours';
import { cn } from '@/lib/utils';

/** Below this, completion is worth a look whatever the mode promises. */
const LOW_COMPLETION_PCT = 60;
/** Fewer sessions than this and a low rate is noise, not a finding. */
const MIN_SESSIONS_FOR_FLAG = 30;

type Row = (GridModeRow | GridBreakdownRow) & { rowKey: string; name: string; mode?: GridModeRow };

function rowsFor(data: GridAnalyticsResponse, groupBy: GridGroupBy): Row[] {
  if (groupBy === 'mode') {
    return data.modes.map(row => ({ ...row, rowKey: modeKey(row), name: modeLabel(row), mode: row }));
  }
  return data.breakdown.rows.map(row => ({ ...row, rowKey: row.key, name: row.label }));
}

/** The headline while folded: the weakest well-played row, or the volume. */
function breakdownSummary(rows: Row[]): string | undefined {
  if (rows.length === 0) {
    return undefined;
  }
  const weak = rows
    .filter(row => row.sessions >= MIN_SESSIONS_FOR_FLAG && row.completion_pct < LOW_COMPLETION_PCT)
    .sort((a, b) => a.completion_pct - b.completion_pct)[0];
  if (weak) {
    return `${weak.name} completes at ${weak.completion_pct}%`;
  }
  const biggest = rows[0]!;
  return `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} · most played: ${biggest.name}`;
}

/**
 * How each way of playing Grid actually plays: one table, grouped the way you ask.
 *
 * Mode is difficulty × roster × size, the thing an admin composes; the other
 * groupings answer the questions the mode bucket can't (does a country board
 * finish as often as the global one, does Final Whistle). The bar is each row's
 * share of sessions, which is what the old popularity chart showed on its own.
 */
export function GridBreakdown({ data, groupBy, onGroupByChange, selectedKey = null, onSelectMode, groupLoading = false }: {
  data: GridAnalyticsResponse;
  groupBy: GridGroupBy;
  onGroupByChange: (groupBy: GridGroupBy) => void;
  /** modeKey() of the drilled-into bucket, or null. */
  selectedKey?: string | null;
  onSelectMode?: (row: GridModeRow | null) => void;
  /** The response is for another grouping while a new one loads. */
  groupLoading?: boolean;
}) {
  const rows = groupBy !== 'mode' && data.breakdown.group_by !== groupBy ? [] : rowsFor(data, groupBy);
  const total = rows.reduce((sum, row) => sum + row.sessions, 0);
  const pick = groupBy === 'mode' ? onSelectMode : undefined;

  return (
    <PanelCard
      id="grid-breakdown"
      defaultOpen
      title="Modes & boards"
      info={<MetricInfo metric="grid_perfect_pct" />}
      summary={breakdownSummary(rows)}
      description={(
        <>
          Plays and outcomes, grouped the way you choose.
          {pick && ' Click a mode to narrow the content cards below to it.'}
        </>
      )}
      actions={<Segmented label="Group by" value={groupBy} options={GROUP_OPTIONS} onChange={onGroupByChange} />}
      contentClassName="overflow-x-auto"
    >
      {rows.length === 0
        ? (
            <EmptyState hint={groupLoading ? undefined : 'Try a wider date range or fewer filters.'}>
              {groupLoading ? 'Loading…' : 'No Grid session in this window.'}
            </EmptyState>
          )
        : (
            <ReportTable>
              <ReportHead>
                <Th>{GROUP_OPTIONS.find(option => option.value === groupBy)?.label ?? 'Group'}</Th>
                <Th align="right">Sessions</Th>
                <Th align="right" title="Share of these sessions that were the Daily Grid">Daily</Th>
                <Th align="right" title="Finished as a share of started">Completion</Th>
                <Th align="right" title="Every cell correct, as a share of finished">Perfect</Th>
                <Th align="right" title="Average score of finished sessions (room games once their results are out)">Avg score</Th>
                <Th align="right" title="Player-made wrong placements (Extra-Time excluded)">Wrong guesses</Th>
              </ReportHead>
              <tbody>
                {rows.map((row) => {
                  const isSelected = !!row.mode && selectedKey === row.rowKey;
                  return (
                    <ReportRow key={row.rowKey} className={cn(isSelected && 'bg-primary/10 hover:bg-primary/15')}>
                      <Td strong>
                        {pick && row.mode
                          ? (
                              <button
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => pick(isSelected ? null : row.mode!)}
                                className={cn('text-left hover:text-primary hover:underline', isSelected && 'text-primary')}
                              >
                                {row.name}
                              </button>
                            )
                          : row.name}
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-2">
                          <DataBar
                            value={row.sessions}
                            max={total}
                            colour={MAGNITUDE_BAR}
                            track={MAGNITUDE_TRACK}
                            label={`${row.name}: ${row.sessions.toLocaleString()} of ${total.toLocaleString()} sessions`}
                            className="hidden w-16 sm:block"
                          />
                          <span>{row.sessions.toLocaleString()}</span>
                        </div>
                      </Td>
                      <Td align="right" className="text-muted-foreground">{`${row.daily_pct}%`}</Td>
                      <Td
                        align="right"
                        strong
                        className={cn(
                          row.completion_pct < LOW_COMPLETION_PCT && row.sessions >= MIN_SESSIONS_FOR_FLAG
                          && 'text-amber-600 dark:text-amber-500',
                        )}
                      >
                        {`${row.completion_pct}%`}
                      </Td>
                      <Td align="right">
                        {`${row.perfect_pct}%`}
                        <span className="ml-1 text-xs text-muted-foreground">{`(${row.perfect.toLocaleString()})`}</span>
                      </Td>
                      <Td align="right">{row.avg_score ?? '—'}</Td>
                      <Td align="right" className="text-muted-foreground">{row.wrong_guesses.toLocaleString()}</Td>
                    </ReportRow>
                  );
                })}
              </tbody>
            </ReportTable>
          )}
    </PanelCard>
  );
}
