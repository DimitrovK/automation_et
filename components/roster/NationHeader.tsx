'use client';

import type { NationHeaderInfo } from '@/types/team';
import { NationCrest } from '@/components/analytics/NationCrest';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Who this roster is about, and both of its counts.
 *
 * Both, because they differ and the difference is not an error: the analytics
 * tile that links here counts distinct FOOTBALLERS, and the list below counts
 * SPELLS — someone with three English clubs is three rows. Printing one number
 * would make the two screens look like they disagree.
 */
export function NationHeader({ nation }: { nation: NationHeaderInfo }) {
  const figures = [
    { label: 'Footballers', value: nation.total_footballers, hint: 'distinct people' },
    { label: 'Spells', value: nation.total_spells, hint: 'rows below' },
    { label: 'Clubs', value: nation.total_clubs, hint: 'in this country' },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <NationCrest short={nation.short} flag={nation.flag} className="size-10" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">{nation.name}</h2>
            <p className="text-sm text-muted-foreground">
              Everyone who played for a club in this country
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3 sm:gap-5">
          {figures.map(figure => (
            <div key={figure.label} className="text-right">
              <dt className="text-xs text-muted-foreground">{figure.label}</dt>
              <dd className="text-lg font-semibold tabular-nums text-foreground">
                {figure.value.toLocaleString()}
              </dd>
              <dd className="text-[0.7rem] text-muted-foreground">{figure.hint}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
