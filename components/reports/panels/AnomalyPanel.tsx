'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { AnomaliesResponse } from '@/types/reports';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * "What needs attention" — the first thing on the page.
 *
 * Everything here is derivable from the panels below it; the point is that
 * nobody scans eleven games looking for the one that moved. Placing it anywhere
 * other than the top would defeat that.
 */
export function AnomalyPanel({ data, meta }: { data: AnomaliesResponse; meta: GameMetaMap }) {
  const { findings, coverage, thresholds } = data;

  // "Nothing moved" and "we couldn't tell" look identical as an empty list, so
  // they get different treatments.
  if (findings.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          {coverage.complete
            ? <Check className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            : <HelpCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />}
          <div>
            <p className="font-medium text-foreground">
              {coverage.complete ? 'Nothing unusual' : 'Not enough data to tell'}
            </p>
            <p className="text-sm text-muted-foreground">
              {coverage.complete
                ? `Nothing moved further than these metrics move on their own, against the previous ${data.window_days} days. The bar is ${thresholds.sigma} standard deviations and at least ${thresholds.min_change_pct}%, on at least ${thresholds.min_volume} sessions — so it rises as a game gets smaller, because a small game's numbers wander further by themselves.`
                : `${coverage.missing_days.length} day(s) in this comparison were never computed, so a quiet result here can't be trusted. Run the reporting backfill.`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-600" />
          Needs attention
          <span className="text-sm font-normal text-muted-foreground">
            {`(${findings.length})`}
          </span>
        </CardTitle>
        <CardDescription>
          Compared with
          {' '}
          {data.compared_with.start}
          {' → '}
          {data.compared_with.end}
          {`. A move is listed when it is at least ${thresholds.sigma} standard deviations outside ordinary variation AND over ${thresholds.min_change_pct}% — so the bar rises as a game gets smaller, because a small game's numbers wander further on their own.`}
          {!coverage.complete && ' Some days in this comparison were never computed, so this list may be incomplete.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {findings.map((finding) => {
          const up = (finding.change_pct ?? 0) > 0;
          const Icon = finding.change_pct === null ? AlertTriangle : up ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={`${finding.scope}-${finding.game_type}-${finding.metric}`}
              className={cn(
                'flex flex-wrap items-start gap-3 rounded-md border p-3',
                finding.severity === 'high'
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                  : 'border-border',
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  finding.change_pct === null
                    ? 'text-amber-600'
                    : up
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{finding.headline}</p>
                <p className="text-sm text-muted-foreground">{finding.detail}</p>
                {/* What the bar was, in the units the reader already has. The
                    percentage alone cannot say why a +28% neighbour is absent,
                    and a panel that cannot explain an omission gets read as
                    broken. */}
                {/* Both, not just the bar: `z_score` is null on rate findings,
                    and gating on `required_pct` alone rendered "nullσ"
                    (Copilot on #124). */}
                {finding.required_pct !== null && finding.z_score !== null && (
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    {`${finding.z_score}σ — a move of ${finding.required_pct}% would have been the bar at this volume`}
                  </p>
                )}
              </div>
              {finding.game_type && (
                <div className="flex items-center gap-2">
                  <GameBadge gameKey={finding.game_type} meta={meta} href={`/reports/games/${finding.game_type}`} />
                  <Link
                    href={`/reports/games/${finding.game_type}`}
                    className="text-sm font-medium whitespace-nowrap text-primary hover:underline"
                  >
                    Investigate →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
