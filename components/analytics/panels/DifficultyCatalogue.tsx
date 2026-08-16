'use client';

import type { CoverageResponse, DifficultyTier } from '@/types/reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * The catalogue split by difficulty, and how much of each tier has a picture.
 *
 * Two questions that share an axis, so they sit side by side rather than in two
 * places: the left says how much of each tier exists, the right says how much of
 * it is usable in a game that shows a face. Read across a row and the pair is
 * the actual answer — a tier can be large and unusable, and neither column says
 * that alone.
 *
 * Not scoped to the date range. This is the state of the catalogue now, not what
 * changed in it, and a range filter here would answer neither question.
 */
const TIER_LABELS: Record<string, string> = {
  EASY: 'Easy',
  NORMAL: 'Normal',
  HARD: 'Hard',
  EXTREME: 'Extreme',
};

function tierLabel(difficulty: string) {
  return TIER_LABELS[difficulty] ?? difficulty;
}

export function DifficultyCatalogue({ data }: { data: CoverageResponse }) {
  const tiers = data.difficulty_tiers;

  // The BE may not carry this yet — the repositories deploy independently.
  if (!tiers || tiers.length === 0) {
    return null;
  }

  const largest = Math.max(...tiers.map(tier => tier.footballers), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Footballers by difficulty</CardTitle>
          <CardDescription>
            Approved footballers only — the pool a game can actually draw from.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {tiers.map(tier => (
              <div key={tier.difficulty} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-sm text-muted-foreground">{tierLabel(tier.difficulty)}</dt>
                  <dd className="text-sm font-medium tabular-nums text-foreground">
                    {tier.footballers.toLocaleString()}
                  </dd>
                </div>
                {/* Scaled against the largest tier, not against the total: the
                    question here is which tier is biggest, and a share-of-total
                    bar answers a question nobody asked of four bars that sum
                    to one. */}
                <Progress
                  value={(tier.footballers / largest) * 100}
                  aria-label={`${tierLabel(tier.difficulty)}: ${tier.footballers} footballers`}
                />
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pictures by difficulty</CardTitle>
          <CardDescription>
            How many of each tier have an active picture. Scout serves the dossier with
            no image rather than failing, so a gap here degrades quietly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {tiers.map(tier => (
              <PictureRow key={tier.difficulty} tier={tier} />
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function PictureRow({ tier }: { tier: DifficultyTier }) {
  const pct = tier.with_picture_pct;
  const empty = tier.footballers === 0;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-sm text-muted-foreground">{tierLabel(tier.difficulty)}</dt>
        <dd className="text-sm tabular-nums text-foreground">
          {empty
            ? <span className="text-muted-foreground">No footballers</span>
            : (
                <>
                  <span className="font-medium">{tier.with_picture.toLocaleString()}</span>
                  <span className="text-muted-foreground">
                    {` of ${tier.footballers.toLocaleString()}`}
                  </span>
                  {/* `pct` is null only when the tier is empty, which the branch
                      above already handled — but the type allows it, and a bare
                      interpolation would print "null%". */}
                  {pct !== null && (
                    <span className={cn('ml-1.5 tabular-nums', pct < 25 ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground')}>
                      {`${pct}%`}
                    </span>
                  )}
                </>
              )}
        </dd>
      </div>
      <Progress
        value={pct ?? 0}
        aria-label={
          empty
            ? `${tierLabel(tier.difficulty)}: no footballers`
            : `${tierLabel(tier.difficulty)}: ${tier.with_picture} of ${tier.footballers} have a picture`
        }
      />
    </div>
  );
}
