'use client';

import type { FavouredVsPlayedResponse, GameEngagementRow } from '@/types/user-hub';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { sortEngagementRows } from '@/lib/user-hub-analytics';
import { prettySlug } from '@/lib/user-hub-format';

type Props = {
  data: FavouredVsPlayedResponse | null;
  isLoading: boolean;
  error: string | null;
  notDeployed: boolean;
  onRetry: () => void;
};

/** Theme-aware tooltip showing the three counts + play-through %. */
function EngagementTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: GameEngagementRow }[];
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) {
    return null;
  }
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{prettySlug(row.slug)}</p>
      <p className="text-muted-foreground">
        Favourited:
        <span className="font-mono text-foreground">{row.favourited_count}</span>
      </p>
      <p className="text-muted-foreground">
        Started:
        <span className="font-mono text-foreground">{row.started_count}</span>
      </p>
      <p className="text-muted-foreground">
        Finished:
        <span className="font-mono text-foreground">{row.finished_count}</span>
      </p>
      <p className="text-muted-foreground">
        Play-through:
        <span className="font-mono text-foreground">
          {row.play_through_pct}
          %
        </span>
      </p>
    </div>
  );
}

export function FavouredVsPlayedChart({ data, isLoading, error, notDeployed, onRetry }: Props) {
  const rows = useMemo(() => (data ? sortEngagementRows(data.games) : []), [data]);

  if (notDeployed) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Favourited vs played</CardTitle>
        <p className="text-xs text-muted-foreground">
          Of users who favourited a game, how many started it and how many finished.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-72 w-full" />}

        {error && !isLoading && (
          <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {error}
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
            </div>
          </div>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No engagement data yet.</p>
        )}

        {!isLoading && !error && rows.length > 0 && (
          <div style={{ height: Math.max(200, rows.length * 56) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="slug" width={140} tick={{ fontSize: 12 }} tickFormatter={prettySlug} />
                <Tooltip cursor={{ fill: 'rgba(16,185,129,0.08)' }} content={<EngagementTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="favourited_count" name="Favourited" fill="#10b981" radius={[0, 3, 3, 0]} />
                <Bar dataKey="started_count" name="Started" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                <Bar dataKey="finished_count" name="Finished" fill="#f59e0b" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
