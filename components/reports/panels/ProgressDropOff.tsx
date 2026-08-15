'use client';

import type { Band } from '@/components/reports/primitives/Distribution';
import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { ProgressBand, ProgressResponse, ProgressRow } from '@/types/reports';
import { Distribution } from '@/components/reports/primitives/Distribution';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameColor } from '@/hooks/use-game-meta';

/**
 * Where inside a session people stop.
 *
 * The table above this one says a session ended incomplete. It cannot say
 * whether the player quit on the first screen or the last, and those are
 * different problems: one is about getting in, the other about keeping going.
 */

/** Band labels, in the payload's order. `complete` is unreachable when abandoned. */
const BAND_LABELS: Record<string, string> = {
  none: 'Nowhere',
  under_25: 'Under a quarter',
  under_50: 'Under half',
  under_75: 'Under three quarters',
  under_100: 'Nearly done',
  complete: 'All the way',
};

function toBands(bands: ProgressBand[]): Band[] {
  return bands.map(band => ({
    label: BAND_LABELS[band.key] ?? band.key,
    count: band.count,
    pct: band.pct,
  }));
}

function ProgressCell({ row, colour }: { row: ProgressRow; colour: string }) {
  if (row.abandoned === 0) {
    return <span className="text-xs text-muted-foreground/70">Nothing abandoned</span>;
  }
  return <Distribution bands={toBands(row.abandoned_bands)} colour={colour} />;
}

export function ProgressDropOff({ data, meta }: { data: ProgressResponse; meta: GameMetaMap }) {
  const colourFor = useGameColor();
  const supported = data.rows.filter(row => row.supported);
  const unsupported = data.rows.filter(row => !row.supported);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Where sessions stop
          <MetricInfo metric="progress_reached" />
        </CardTitle>
        <CardDescription>
          Abandoned sessions, by how far they got through their own length. A share
          rather than a step number, because a 3×3 Grid is 23 footballers and a 6×4
          is 56 — and the games count different things on the way.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-auto">
        {supported.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No sessions were abandoned in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Game</Th>
                  <Th align="right">Abandoned</Th>
                  <Th align="right" title="Of those, the share that made no progress at all">
                    Got nowhere
                  </Th>
                  <Th align="right" title="The same figure for sessions that DID finish — the comparison, not a footnote">
                    vs finished
                  </Th>
                  <Th>How far the abandoned ones got</Th>
                </ReportHead>
                <tbody>
                  {supported.map(row => (
                    <ReportRow key={row.game_type}>
                      <Td strong>
                        <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {`measured in ${row.unit}`}
                        </span>
                      </Td>
                      <Td align="right">
                        {row.abandoned.toLocaleString()}
                        {row.never_started > 0 && (
                          // Split out, because "opened and never started" and
                          // "started and stalled" are different failures. Grid
                          // keeps 959 of the first against 164 of the second,
                          // and one number would read as the second.
                          <span
                            className="mt-0.5 block text-xs font-normal text-muted-foreground"
                            title="Opened and never started — a different failure from stalling partway"
                          >
                            {`${row.never_started.toLocaleString()} never started`}
                          </span>
                        )}
                      </Td>
                      <Td align="right" strong>
                        {row.abandoned_no_progress_pct === null ? '—' : `${row.abandoned_no_progress_pct}%`}
                      </Td>
                      {/* Beside it, not below: 44% is an indictment of the game
                          until you see that 3.6% of finished sessions did the
                          same, and it becomes something players do. */}
                      <Td align="right" className="text-muted-foreground">
                        {row.finished_no_progress_pct === null ? '—' : `${row.finished_no_progress_pct}%`}
                      </Td>
                      <Td>
                        <ProgressCell row={row} colour={colourFor(meta, row.game_type)} />
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}

        {unsupported.length > 0 && (
          // Named with their reasons rather than omitted. Eight missing games on
          // a per-game table reads as a broken request; eight stated reasons
          // reads as the measurement it is.
          <div className="space-y-1.5 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              {unsupported.length === 1
                ? 'One game reports no progress'
                : `${unsupported.length} games report no progress`}
            </p>
            <dl className="space-y-1">
              {unsupported.map(row => (
                <div key={row.game_type} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <dt>
                    <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                  </dt>
                  <dd className="text-muted-foreground">{row.reason}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
