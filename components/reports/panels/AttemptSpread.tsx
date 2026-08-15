'use client';

import type { Band } from '@/components/reports/primitives/Distribution';
import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { AttemptBand, AttemptsResponse } from '@/types/reports';
import { Distribution } from '@/components/reports/primitives/Distribution';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameColor } from '@/hooks/use-game-meta';

/**
 * How often players got it wrong, against what the game says they may.
 *
 * Two games declare an allowance and nine do not, which is why this is a panel
 * of two rows rather than a column on the difficulty table with nine nulls in it.
 */

function bandLabel(band: AttemptBand): string {
  if (band.to_attempts === null) {
    return `${band.from_attempts}+`;
  }
  if (band.from_attempts === band.to_attempts) {
    return String(band.from_attempts);
  }
  return `${band.from_attempts}–${band.to_attempts}`;
}

function toBands(bands: AttemptBand[]): Band[] {
  return bands.map(band => ({ label: bandLabel(band), count: band.count, pct: band.pct }));
}

export function AttemptSpread({ data, meta }: { data: AttemptsResponse; meta: GameMetaMap }) {
  const colourFor = useGameColor();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          How often players get it wrong
          <MetricInfo metric="wrong_attempts" />
        </CardTitle>
        <CardDescription>
          Wrong attempts per session, for the games that declare an allowance. The
          allowance is what the game says, not what it enforces — on this data
          those differ.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {data.rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No sessions with a declared allowance in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Game</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right">Allowed</Th>
                  <Th align="right" title="Sessions recording more wrong attempts than the game allows">Over it</Th>
                  <Th>Wrong attempts per session</Th>
                </ReportHead>
                <tbody>
                  {data.rows.map(row => (
                    <ReportRow key={row.game_type}>
                      <Td strong>
                        <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                      </Td>
                      <Td align="right">{row.sessions.toLocaleString()}</Td>
                      <Td align="right">
                        {row.allowances.join(', ') || '—'}
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {row.allowance_scope === 'step' ? 'per step' : 'per session'}
                        </span>
                      </Td>
                      <Td align="right">
                        {/* A per-step allowance has nothing to compare a session
                            total with. Missing11 allows 7 per lineup slot, so
                            "38 against 7" would report every player as having
                            overrun fourfold. */}
                        {row.over_allowance_pct === null
                          ? (
                              <span
                                className="text-muted-foreground/70"
                                title="The allowance is per step here, so a session total is not the thing to measure against it"
                              >
                                n/a
                              </span>
                            )
                          : (
                              <>
                                {`${row.over_allowance_pct}%`}
                                {/* A missing count is shown as missing, not as
                                    zero: coercing it renders "0 sessions"
                                    beside a non-zero percentage, which reads as
                                    data rather than as the payload
                                    inconsistency it is (Copilot on #121). */}
                                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                                  {row.over_allowance === null
                                    ? '— sessions'
                                    : `${row.over_allowance.toLocaleString()} sessions`}
                                </span>
                              </>
                            )}
                      </Td>
                      <Td>
                        <Distribution bands={toBands(row.bands)} colour={colourFor(meta, row.game_type)} />
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}
      </CardContent>
    </Card>
  );
}
