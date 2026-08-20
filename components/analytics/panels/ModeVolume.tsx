'use client';

import type { BarRow } from '@/components/reports/primitives/BarRows';
import type { CareerPathAnalyticsResponse } from '@/types/reports';
import { BarRows } from '@/components/reports/primitives/BarRows';
import { StatFigure } from '@/components/reports/primitives/StatTile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MAGNITUDE_BAR, MAGNITUDE_TRACK } from '@/lib/data-colours';
import { modeLabel } from '@/lib/mode-label';

/**
 * How much of each mode was played.
 *
 * The other half of `ModeRates`, and deliberately a separate card: that one
 * says how a mode PLAYS, this says how much of it there is. Both are per-mode
 * and they answer opposite questions — Head to Head has the best solve rate on
 * this data and about 2% of the volume, and a reader who sees only the rate
 * will tune the mode almost nobody is in.
 *
 * Two panels rather than one chart with two measures. A count and a percentage
 * share one scale; a count and a solve rate do not, and putting 7,854 beside
 * 70.8% on one axis flattens the second into the baseline.
 *
 * The numbers were already in the payload. They were rendered as a run of
 * inline text at the bottom of the difficulty card, under "What was built",
 * where seven counts with no shares and no lengths could not be compared.
 */

/**
 * A share, kept honest at the bottom of the range.
 *
 * The tail here is genuinely tiny — 29 games against 7,854 — and rounding that
 * to "0.0%" states it played zero times, which is a different fact from the one
 * the row is reporting.
 */
function share(value: number, total: number): string {
  if (total <= 0 || value <= 0) {
    return '0%';
  }
  const pct = (value * 100) / total;
  return pct < 0.1 ? '<0.1%' : `${pct.toFixed(1)}%`;
}

export function ModeVolume({ data }: { data: CareerPathAnalyticsResponse }) {
  const { modes, total_paths: total, footballers_per_path: perPath } = data.shape;

  // Already ordered by the endpoint, but sorted here too rather than trusted:
  // this list is read as a ranking, and a ranking that depends on an ordering
  // the payload is not contracted to hold breaks quietly.
  const rows: BarRow[] = [...modes]
    .sort((a, b) => b.paths - a.paths)
    .map(mode => ({
      label: modeLabel(mode.mode),
      value: mode.paths,
      display: mode.paths.toLocaleString(),
      hint: share(mode.paths, total),
    }));

  // The top row, not the total: bars compare modes to the biggest mode. Against
  // the TOTAL the leader would fill 90% and everything else would vanish, which
  // is the share — and the share is already printed on every row.
  const max = rows[0]?.value ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>What gets played</CardTitle>
        <CardDescription>
          Games started in this window, by mode. A multiplayer game counts once,
          not once per player — so the modes compare as games rather than as seats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <StatFigure
          label="Games"
          value={total.toLocaleString()}
          hint={perPath === null
            ? undefined
            : (
                // Kept from the block this panel replaces. It is the number that
                // explains why the dashboard before it was wrong: hints were
                // counted once per footballer in the path, so everything it
                // reported was inflated by roughly this factor.
                <span className="text-xs text-muted-foreground">
                  {`${perPath} footballers per game on average`}
                </span>
              )}
        />

        <BarRows
          rows={rows}
          max={max}
          colour={MAGNITUDE_BAR}
          track={MAGNITUDE_TRACK}
          emptyLabel="No games were started in this window."
        />

        {rows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Bars are scaled to the busiest mode, so the shortest is the rarest rather than empty.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
