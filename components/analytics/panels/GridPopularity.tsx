'use client';

import type { GridAnalyticsResponse, GridModeRow } from '@/types/reports';
import { PopularityBars } from '@/components/analytics/charts/PopularityBars';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameColor, useGameMeta } from '@/hooks/use-game-meta';
import { difficultyTier } from '@/lib/data-colours';

/**
 * What Grid players actually pick — modes and variations as lengths on one
 * baseline, side by side.
 *
 * Two charts rather than one: a variation session is ALSO in some mode
 * bucket, so a single combined chart would count the same play twice and
 * invite exactly the wrong comparison. Side by side, each chart's bars sum
 * to the window's play and the eye can still hop between them.
 *
 * Mode bars borrow the difficulty palette (Standard green, Hard orange) so
 * the chart reads with the same colour vocabulary as every difficulty
 * surface here; variation bars use the game's registry colour — ranking is
 * the message there, not identity.
 */

function modeLabel(row: GridModeRow): string {
  const difficulty = row.difficulty === 'EASY'
    ? 'Standard'
    : row.difficulty === 'HARD'
      ? 'Hard'
      : row.difficulty ?? 'Unclassified';
  const roster = row.footballer_status === 'ACTIVE'
    ? ' · Active'
    : row.footballer_status === 'NOT_ACTIVE'
      ? ' · Retired'
      : '';
  return `${difficulty}${roster} · ${row.grid_size}`;
}

export function GridPopularity({ data }: { data: GridAnalyticsResponse }) {
  const { meta } = useGameMeta(true);
  const colorFor = useGameColor();

  if (data.modes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>What people pick</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState hint="Try a wider date range.">
            No Grid session in this window.
          </EmptyState>
        </CardContent>
      </Card>
    );
  }

  const modeRows = [...data.modes]
    .sort((a, b) => b.sessions - a.sessions)
    .map(row => ({
      key: `${row.difficulty}-${row.footballer_status}-${row.grid_size}`,
      label: modeLabel(row),
      value: row.sessions,
      colour: difficultyTier(row.difficulty ?? '').hex,
    }));

  const variationRows = [...data.variations]
    .sort((a, b) => b.sessions - a.sessions)
    .map(row => ({
      key: String(row.variation_id ?? 'default'),
      label: row.variation,
      value: row.sessions,
      colour: colorFor(meta, 'grid'),
    }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Modes people pick</CardTitle>
          <CardDescription>
            Sessions per difficulty × roster × size bucket. Hover for the
            share of all Grid play.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PopularityBars ariaLabel="Grid sessions by mode" rows={modeRows} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Variations people pick</CardTitle>
          <CardDescription>
            Sessions per variation — Default is the un-themed game. The same
            sessions as the modes chart, cut the other way.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PopularityBars ariaLabel="Grid sessions by variation" rows={variationRows} />
        </CardContent>
      </Card>
    </div>
  );
}
