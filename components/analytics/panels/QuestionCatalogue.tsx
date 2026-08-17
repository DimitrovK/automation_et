'use client';

import type { QuestionBankResponse } from '@/types/reports';
import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { Distribution } from '@/components/reports/primitives/Distribution';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { StatTile } from '@/components/reports/primitives/StatTile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';
import { difficultyTier } from '@/lib/data-colours';

/**
 * How big the question bank is, and what arrived in the window.
 *
 * The same shape as the footballer overview on purpose: added / approved /
 * categories over a daily series. Two surfaces answering "is anyone still
 * filling this in" should not need to be read two different ways.
 */
export function QuestionCatalogue({ data }: { data: QuestionBankResponse }) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  const totals = data.question_totals;
  const bank = data.question_difficulty.reduce((sum, tier) => sum + tier.questions, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label="Questions added"
          value={totals.added.toLocaleString()}
          delta={
            totals.added_today > 0
              ? (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                    {`${totals.added_today.toLocaleString()} question${totals.added_today === 1 ? '' : 's'} added today`}
                  </p>
                )
              : undefined
          }
          hint="Every question written in the window, approved or not."
        />
        <StatTile label="Approved questions" value={totals.approved.toLocaleString()} />
        <StatTile
          label="Categories in use"
          value={totals.categories.toLocaleString()}
          hint={data.search ? `Matching "${data.search}"` : 'Carrying at least one approved question'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions added, by day</CardTitle>
          <CardDescription>
            Whether the bank is still growing, or has been the same size since April.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 sm:h-72">
          {data.question_series.length === 0
            ? <EmptyState hint="Try a wider date range.">No questions were added in this window.</EmptyState>
            : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.question_series} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
                    <XAxis dataKey="date" tick={theme.tick} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={theme.tick} allowDecimals={false} width={44} />
                    <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                    {/* One series, so no legend — the card title names it. */}
                    <Area
                      type="monotone"
                      dataKey="questions"
                      name="Questions"
                      stroke={theme.series[0]}
                      fill={theme.series[0]}
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How hard the bank is</CardTitle>
          <CardDescription>
            Across every approved question. Unlike the matrix below, each question is
            counted once here — difficulty is a single field, categories are not.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Distribution
            bands={data.question_difficulty.map(tier => ({
              label: difficultyTier(tier.difficulty).label,
              count: tier.questions,
              pct: bank ? Math.round((tier.questions / bank) * 1000) / 10 : 0,
            }))}
            bandColours={data.question_difficulty.map(tier => difficultyTier(tier.difficulty).bar)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
