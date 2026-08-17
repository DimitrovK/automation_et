'use client';

import type { CoverageResponse } from '@/types/reports';
import { DifficultyBars } from '@/components/analytics/charts/DifficultyBars';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Column order, matching the backend's `DIFFICULTY_ORDER`. */
const ORDER = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];

/**
 * When the catalogue's footballers were born, and what each game may use.
 *
 * Two panels that share a chart — four bars per bucket, one per difficulty —
 * and answer questions the tier counts alone cannot.
 *
 * Grouped bars, not the segmented rail this started as. That version showed
 * composition but never said which segment was which: no legend, no hover, and
 * a 3px sliver with nothing to read it against.
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
            <DifficultyBars
              rows={eras.map(era => ({ label: era.era, by_difficulty: era.by_difficulty }))}
              order={ORDER}
              bucketLabel="Decade of birth"
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
            <DifficultyBars
              rows={pools.map(pool => ({ label: pool.label, by_difficulty: pool.by_difficulty }))}
              order={ORDER}
              bucketLabel="Game"
              height="h-64"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
