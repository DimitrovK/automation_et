'use client';

import type { AdoptionTrendsResponse, TrendGranularity } from '@/types/user-hub';
import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/ChartTooltip';
import { EmptyState } from '@/components/reports/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { chartTheme } from '@/lib/chart-theme';
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

const PILLS: TrendGranularity[] = ['day', 'week'];

export function AdoptionTrendsChart({ data, isLoading, error, notDeployed, granularity, onGranularityChange, onRetry }: Props) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
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
                  : 'text-muted-foreground hover:bg-muted',
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
          <EmptyState hint="Try a wider date range.">No favourites were added in this window.</EmptyState>
        )}

        {!isLoading && !error && points.length > 0 && (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ left: 4, right: 8, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
                  <XAxis dataKey="date" tick={theme.tick} tickFormatter={v => formatTrendDate(v, granularity)} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={theme.tick} width={36} />
                  {/* The same tooltip every report chart uses — this page had
                      its own near-identical copy, one of three that drifted
                      apart while favourites lived outside Reports. */}
                  <Tooltip content={<ChartTooltip labelFormatter={v => formatTrendDate(String(v), granularity)} />} />
                  <Legend wrapperStyle={theme.legend} />
                  <Area type="monotone" dataKey="cumulative_users" name="Cumulative users" stroke={theme.series[0]} fill={theme.series[0]} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="new_adopters" name="New adopters" stroke={theme.series[1]} fill={theme.series[1]} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {hasBackfill && (
              <p className="mt-2 text-xs text-muted-foreground">
                Includes pre-launch favourites (approximate dates).
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
