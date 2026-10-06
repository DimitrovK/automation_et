'use client';

import type { GridAnalyticsResponse } from '@/types/reports';
import { PopularityBars } from '@/components/analytics/charts/PopularityBars';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { difficultyTier } from '@/lib/data-colours';
import { modeLabel } from './grid-mode';

/**
 * What Grid players actually pick — modes as lengths on one baseline.
 *
 * Mode bars borrow the difficulty palette (Standard green, Hard orange) so
 * the chart reads with the same colour vocabulary as every difficulty
 * surface here.
 */

export function GridPopularity({ data }: { data: GridAnalyticsResponse }) {
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

  return (
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
  );
}
