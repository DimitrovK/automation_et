'use client';

import type { FavouritesUsageResponse } from '@/types/user-hub';
import { Crown, Download } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  favouriteDepthDistribution,
  favouritesToCsv,
  firstChoiceCounts,
} from '@/lib/user-hub-analytics';

type Props = {
  data: FavouritesUsageResponse;
};

type Row = { key: string; label: string; count: number };

/** A labelled proportional bar (emerald fill) — used for both panels. */
function BarRow({ row, max }: { row: Row; max: number }) {
  const pct = max > 0 ? Math.round((row.count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-gray-600 dark:text-gray-300">{row.label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-gray-500">{row.count}</span>
    </div>
  );
}

/**
 * Deeper favourites analytics derived from the per-user payload: which game is
 *  most often the #1 pick, how many games people favourite, and a CSV export.
 */
export function FavouriteInsights({ data }: Props) {
  const firstChoice = useMemo(() => firstChoiceCounts(data.users).slice(0, 8), [data.users]);
  const depth = useMemo(() => favouriteDepthDistribution(data.users), [data.users]);

  const firstChoiceMax = firstChoice[0]?.count ?? 0;
  const depthMax = Math.max(0, ...depth.map(d => d.count));

  function exportCsv() {
    if (typeof window === 'undefined') {
      return;
    }
    const blob = new Blob([favouritesToCsv(data.users)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favourites-usage.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Insights</CardTitle>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={data.users.length === 0}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Crown className="size-4 text-amber-500" />
            Top #1 picks
          </p>
          <p className="text-xs text-gray-500">Which game users favourite first.</p>
          {firstChoice.length === 0
            ? (
                <p className="py-4 text-center text-sm text-gray-500">No data yet.</p>
              )
            : (
                <div className="space-y-1.5 pt-1">
                  {firstChoice.map(r => (
                    <BarRow key={r.slug} row={{ key: r.slug, label: r.label, count: r.count }} max={firstChoiceMax} />
                  ))}
                </div>
              )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Favourites per user</p>
          <p className="text-xs text-gray-500">How many games each user favourites.</p>
          <div className="space-y-1.5 pt-1">
            {depth.map(d => (
              <BarRow key={d.bucket} row={{ key: d.bucket, label: `${d.bucket} game${d.bucket === '1' ? '' : 's'}`, count: d.count }} max={depthMax} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
