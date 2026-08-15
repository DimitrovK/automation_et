'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { MultiplayerGameRow } from '@/types/reports';
import { useTheme } from 'next-themes';
import { EmptyState } from '@/components/reports/EmptyState';
import { GameBadge } from '@/components/reports/GameBadge';
import { MetricInfo } from '@/components/reports/MetricInfo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';

/**
 * Where multiplayer rooms are lost, per game.
 *
 * The table below this holds the same numbers, but a table makes you do the
 * subtraction. The question here — "which stage loses people" — is a shape
 * question, so it gets a shape.
 *
 * Stages are ORDINAL, not categorical: created → started → finished only means
 * anything in that order. So they take one hue in monotone lightness steps
 * rather than three separate identities, which would spend the identity channel
 * re-encoding an order the layout already shows. Both ramps are validated
 * against their own surface; the dark one re-anchors rather than flipping the
 * light one.
 */
/**
 * Stage colours: three distinct hues, not three steps of one.
 *
 * A single-hue ramp was the first answer, on the reasoning that funnel stages
 * are magnitudes of one thing. They are not — rooms created, started and
 * finished are three different measures, and the funnel's ORDER is already
 * carried by position, so hue is free to say which measure a bar is.
 *
 * It also could not be made legible. On a near-white surface the pale end of an
 * emerald ramp falls below 3:1 against the background, so the three steps had to
 * crowd into the dark half: the last two ended up 0.064 apart in luminance and
 * were reported as indistinguishable. These three are validated as a set —
 * lightness band, chroma floor, adjacent separation under deutan/protan/tritan,
 * and >= 3:1 against both surfaces.
 */
function stageRamp(isDark: boolean): string[] {
  return chartTheme(isDark).series.slice(0, 3);
}

/** Null, never 0, when there is nothing to divide by — no rooms means no rate. */
function share(value: number, total: number): number | null {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : null;
}

export function MultiplayerFunnel({ rows, meta }: { rows: MultiplayerGameRow[]; meta: GameMetaMap }) {
  const { resolvedTheme } = useTheme();
  const ramp = stageRamp(resolvedTheme === 'dark');

  const played = [...rows]
    .filter(row => row.rooms_created > 0)
    .sort((a, b) => b.rooms_created - a.rooms_created);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Where rooms are lost
          <MetricInfo metric="never_started_pct" />
        </CardTitle>
        <CardDescription>
          Each row is one game, scaled to its own rooms created — so the gaps are
          the drop-off: people who never found a game, then games that started
          and were abandoned. Games are not scaled against each other; use the
          counts on the right to compare sizes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {played.length === 0 && (
          <EmptyState>
            No multiplayer rooms in this window.
          </EmptyState>
        )}

        {played.map((row) => {
          const stages = [
            { label: 'Created', value: row.rooms_created },
            { label: 'Started', value: row.rooms_started },
            { label: 'Finished', value: row.rooms_finished },
          ];
          const startedPct = share(row.rooms_started, row.rooms_created);
          const finishedPct = share(row.rooms_finished, row.rooms_started);

          return (
            <div key={row.game_type} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                <span className="text-xs text-muted-foreground">
                  {startedPct === null ? '—' : `${startedPct}% started`}
                  {' · '}
                  {finishedPct === null
                    ? 'none started, so nothing to finish'
                    : `${finishedPct}% of those finished`}
                </span>
              </div>

              {stages.map((stage, index) => {
                const width = row.rooms_created > 0 ? (stage.value / row.rooms_created) * 100 : 0;
                return (
                  <div key={stage.label} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                      {stage.label}
                    </span>
                    <div className="h-4 flex-1 rounded-sm bg-muted">
                      <div
                        className="h-4 rounded-sm"
                        style={{ width: `${width}%`, backgroundColor: ramp[index] }}
                        // The count sits beside the bar, so the bar is only ever
                        // the shape — nothing here depends on reading a colour
                        // or estimating a width.
                        role="img"
                        aria-label={`${stage.label}: ${stage.value} rooms`}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-xs tabular-nums text-foreground/80">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
