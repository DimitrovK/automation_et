'use client';

import type { AdoptionTrendsResponse, TrendGranularity } from '@/types/user-hub';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTrendDate } from '@/lib/user-hub-analytics';
import { cn } from '@/lib/utils';

type Props = {
  data: AdoptionTrendsResponse | null;
  isLoading: boolean;
  error: string | null;
  notDeployed: boolean;
  granularity: TrendGranularity;
  onGranularityChange: (g: TrendGranularity) => void;
  onRetry: () => void;
};

/** Theme-aware tooltip (default recharts tooltip is unreadable in dark mode). */
function TrendTooltip({
  active,
  payload,
  label,
  granularity,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  granularity: TrendGranularity;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label ? formatTrendDate(label, granularity) : ''}</p>
      {payload.map(p => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}
          :
          {' '}
          <span className="font-mono text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

const PILLS: TrendGranularity[] = ['day', 'week'];

export function AdoptionTrendsChart({ data, isLoading, error, notDeployed, granularity, onGranularityChange, onRetry }: Props) {
  if (notDeployed) {
    return null;
  }

  const points = data?.points ?? [];
  const hasBackfill = data?.include_backfill;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Adoption over time</CardTitle>
        <div className="flex gap-1 rounded-md border p-0.5">
          {PILLS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => onGranularityChange(g)}
              className={cn(
                'rounded px-2 py-0.5 text-xs font-medium capitalize transition-colors',
                granularity === g
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-64 w-full" />}

        {error && !isLoading && (
          <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {error}
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
            </div>
          </div>
        )}

        {!isLoading && !error && points.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No adoption data yet.</p>
        )}

        {!isLoading && !error && points.length > 0 && (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ left: 4, right: 8, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={v => formatTrendDate(v, granularity)} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={36} />
                  <Tooltip content={<TrendTooltip granularity={granularity} />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="cumulative_users" name="Cumulative users" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="new_adopters" name="New adopters" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {hasBackfill && (
              <p className="mt-2 text-xs text-gray-500">
                Includes pre-launch favourites (approximate dates).
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
