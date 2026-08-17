'use client';

import type { CoverageResponse } from '@/types/reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { difficultyTier } from '@/lib/data-colours';
import { cn } from '@/lib/utils';

/**
 * When the catalogue's footballers were born, and what each game may use.
 *
 * Two panels that share a shape — a row per bucket, split by difficulty — and
 * answer questions the tier counts alone cannot.
 *
 * The era chart is the more interesting of the two: it shows whether "hard" has
 * quietly become a synonym for "old". Locally it partly has, and that is a
 * content decision nobody made on purpose.
 */
export function EraAndPools({ data }: { data: CoverageResponse }) {
  const { eras, game_pools: pools, catalogue } = data;

  // The BE may not carry these yet — the repositories deploy independently.
  if (!eras && !pools) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {eras && eras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>When they were born</CardTitle>
            <CardDescription>
              Whether the catalogue skews modern — and whether "hard" is really standing in
              for "old". Everything before 1950 is one bucket; those decades hold a handful each.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StackedRows
              rows={eras.map(era => ({ label: era.era, parts: era.by_difficulty, total: era.total }))}
            />
          </CardContent>
        </Card>
      )}

      {pools && pools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What each game can draw on</CardTitle>
            <CardDescription>
              {catalogue
                ? `Of ${catalogue.toLocaleString()} approved footballers, how many each game is allowed to use — a full catalogue with an empty Extreme tier still cannot serve a hard round.`
                : 'How many approved footballers each game is allowed to use.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StackedRows
              rows={pools.map(pool => ({ label: pool.label, parts: pool.by_difficulty, total: pool.total }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * One row per bucket: the label, the total, and the difficulty split as a
 * single segmented bar.
 *
 * Segmented rather than four bars per row because the question is composition —
 * how this decade divides — and four separate bars make the reader add up to
 * see the whole. Each segment is scaled against the LARGEST row so rows stay
 * comparable; scaling each to its own width would make every row full and say
 * nothing about size.
 */
function StackedRows({ rows }: { rows: { label: string; parts: number[]; total: number }[] }) {
  const order = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];
  const largest = Math.max(...rows.map(row => row.total), 1);

  return (
    <dl className="space-y-2.5">
      {rows.map(row => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium tabular-nums text-foreground">{row.total.toLocaleString()}</dd>
          </div>
          <div
            className="flex h-3 w-full gap-px overflow-hidden rounded-full"
            role="img"
            aria-label={`${row.label}: ${order.map((tier, index) => `${row.parts[index]} ${difficultyTier(tier).label.toLowerCase()}`).join(', ')}`}
          >
            {row.parts.map((count, index) => (
              <span
                key={order[index]}
                className={cn('h-full first:rounded-l-full last:rounded-r-full', difficultyTier(order[index]).bar)}
                // Widths are shares of the LARGEST row, so a short row stays
                // short. The row's own total would make every bar full-width.
                style={{ width: `${(count / largest) * 100}%` }}
              />
            ))}
            {/* The remainder, so the track shows how far short of the biggest
                row this one falls. */}
            <span className="h-full flex-1 bg-foreground/[0.06]" />
          </div>
        </div>
      ))}
    </dl>
  );
}
