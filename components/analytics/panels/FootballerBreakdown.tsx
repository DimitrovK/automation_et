'use client';

import type { CoverageResponse } from '@/types/reports';
import { CareerSplit } from '@/components/analytics/charts/CareerSplit';
import { DataBar } from '@/components/reports/primitives/DataBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CAREER_STATE } from '@/lib/data-colours';

/**
 * How much of the catalogue has stopped playing, overall and per tier.
 *
 * The contributor list that used to sit beside this was dropped: only
 * `Footballer` records who added it, so it could never describe the catalogue,
 * and "one account added 86% of these" is a fact you act on once rather than
 * watch. Era and per-game pools took the space.
 */
export function FootballerBreakdown({ data }: { data: CoverageResponse }) {
  const { career_state: careerState } = data;

  // The BE may not carry this yet — the repositories deploy independently.
  if (!careerState) {
    return null;
  }

  const total = careerState ? careerState.retired + careerState.active : 0;

  return (
    <>
      {careerState && (
        <Card>
          <CardHeader>
            <CardTitle>Still playing, or retired</CardTitle>
            <CardDescription>
              Which games can use whom: a retired footballer cannot appear in anything
              scoped to a current squad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="space-y-3">
              {/* Playing first: the chart below stacks it at the bottom, and
                  a legend order that disagrees with the stack is a puzzle. */}
              <Row label={CAREER_STATE.active.label} value={careerState.active} total={total} colour={CAREER_STATE.active.bar} track={CAREER_STATE.active.track} />
              <Row label={CAREER_STATE.retired.label} value={careerState.retired} total={total} colour={CAREER_STATE.retired.bar} track={CAREER_STATE.retired.track} />
            </dl>
            {careerState.by_difficulty && careerState.by_difficulty.length > 0 && (
              <CareerSplit tiers={careerState.by_difficulty} />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Row({ label, value, total, colour, track }: { label: string; value: number; total: number; colour: string; track: string }) {
  // The count answers "how many", the share answers "how much of it" — and one
  // without the other sends the reader to a calculator. Null rather than 0% when
  // there is nothing to take a share of.
  const pct = total > 0 ? Math.round((value / total) * 1000) / 10 : null;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-sm text-foreground tabular-nums">
          <span className="font-medium">{value.toLocaleString()}</span>
          {pct !== null && <span className="ml-1.5 text-xs text-muted-foreground">{`${pct}%`}</span>}
        </dd>
      </div>
      <DataBar value={value} max={total} colour={colour} track={track} label={`${label}: ${value} of ${total}`} />
    </div>
  );
}
