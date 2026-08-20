'use client';

import type { BarRow } from '@/components/reports/primitives/BarRows';
import type { CareerPathAnalyticsResponse } from '@/types/reports';
import { BarRows } from '@/components/reports/primitives/BarRows';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { StatFigure } from '@/components/reports/primitives/StatTile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MAGNITUDE_BAR, MAGNITUDE_TRACK } from '@/lib/data-colours';
import { modeLabel } from '@/lib/mode-label';

/**
 * How each mode plays, not how much of it was played.
 *
 * `ModeVolume` is the other half and sits beside it. Sorted by solve rate
 * rather than volume, because the question here is which mode is hardest — and
 * the count rides on every row so a rate is never read without the sample
 * behind it.
 *
 * ONE measure. Solve rate and help rate live on different scales (70-ish%
 * against 2-ish%) and putting both on one axis would flatten the second into
 * the baseline — which is the argument against a second axis, not for one.
 *
 * In `panels/` rather than `charts/`, and no longer a recharts bar chart. The
 * rule this repo already writes down is that a chart needing axes belongs in
 * `charts/` — seven named rows with their figures printed do not need one, and
 * the axis was carrying nothing but a dashed grid. It was also the only recharts
 * import on this route, so dropping it takes the library off the page.
 */

/** Below this many appearances a rate swings on a handful of guesses. */
const MIN_APPEARANCES = 30;

export function ModeRates({ data }: { data: CareerPathAnalyticsResponse }) {
  const rows: BarRow[] = data.shape.modes
    .filter(mode => mode.appearances >= MIN_APPEARANCES && mode.solve_rate_pct !== null)
    .sort((a, b) => (b.solve_rate_pct ?? 0) - (a.solve_rate_pct ?? 0))
    .map(mode => ({
      label: modeLabel(mode.mode),
      value: mode.solve_rate_pct ?? 0,
      // One decimal, always. The endpoint rounds to 1dp, so a rate that lands
      // exactly on 66 arrives as the number 66 and prints as "66%" in a column
      // of "74.6%" and "63.9%" — the odd one out looks like a different
      // precision rather than the same one.
      display: `${(mode.solve_rate_pct ?? 0).toFixed(1)}%`,
      // The denominator, on every row. This page withholds a rate under a
      // threshold precisely because the pairing matters; showing the rate and
      // hiding the count would undo that one card later.
      hint: `of ${mode.appearances.toLocaleString()}`,
    }));

  // Tracked explicitly rather than derived as "total minus plotted" (Copilot on
  // #127). Two different reasons drop a mode — too few appearances, or no rate
  // at all — and a single subtracted count would attribute both to the first.
  // Naming them matters more than counting them: a row that is simply absent is
  // ambiguous, and the reader cannot tell which mode they are missing.
  const thin = data.shape.modes
    .filter(mode => mode.solve_rate_pct !== null && mode.appearances < MIN_APPEARANCES)
    .map(mode => modeLabel(mode.mode));
  const unrated = data.shape.modes
    .filter(mode => mode.solve_rate_pct === null)
    .map(mode => modeLabel(mode.mode));

  // The headline this card was missing: how much the mode matters at all.
  //
  // Taken from the rows themselves — the best rate minus the worst — rather
  // than recomputed. A weighted overall rate would have to be rebuilt from
  // per-tier figures the endpoint has ALREADY rounded, and a headline derived
  // from rounded parts is a number that disagrees with its own table.
  //
  // Needs two rows to mean anything: the spread of one mode is zero, which
  // would read as "the mode makes no difference" when it means "there is only
  // one mode to compare".
  const spread = rows.length >= 2
    ? { top: rows[0], bottom: rows[rows.length - 1] }
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          How each mode plays
          <MetricInfo metric="mode_solve_rate" />
        </CardTitle>
        <CardDescription>
          {/* One sentence, and it defines the measure. The paragraph that used
              to sit here — read it beside the grading, the two are tuned by
              different people — is the glossary caveat behind the ⓘ above, so
              the card was paraphrasing its own tooltip at the reader. */}
          Of the footballers shown in each mode, the share players guessed right.
          Higher means easier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {spread && (
          <StatFigure
            label="Spread across modes"
            value={`${(spread.top.value - spread.bottom.value).toFixed(1)} points`}
            hint={(
              <span className="text-xs text-muted-foreground">
                {`${spread.bottom.display} in ${spread.bottom.label} to ${spread.top.display} in ${spread.top.label}`}
              </span>
            )}
          />
        )}

        <BarRows
          rows={rows}
          // A fixed 100, not the top row: these are rates, and scaling them to
          // the leader turns a 13-point spread into a full track against an
          // empty one.
          max={100}
          colour={MAGNITUDE_BAR}
          track={MAGNITUDE_TRACK}
          emptyLabel="No mode has enough appearances to rate."
        />

        <div className="space-y-1">
          {rows.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {`Bars run to 100%. A mode needs ${MIN_APPEARANCES} appearances before its rate is stated.`}
            </p>
          )}

          {thin.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {`Left out under ${MIN_APPEARANCES} appearances, where a rate swings on a handful of guesses: ${thin.join(', ')}.`}
            </p>
          )}

          {unrated.length > 0 && (
            // A separate line, because "too few to rate" and "nothing to rate at
            // all" are different answers and one message for both would pick the
            // wrong one for somebody.
            <p className="text-xs text-muted-foreground">
              {`No appearances to rate at all: ${unrated.join(', ')}.`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
