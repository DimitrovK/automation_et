'use client';

import type { FootballerNation } from '@/types/player';
import type { NationHeaderInfo } from '@/types/team';
import { X } from 'lucide-react';
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
export function NationHeader({ nation, nationality, matchCount, onClearNationality }: {
  nation: NationHeaderInfo;
  /** The nationality now narrowing the list, if any. */
  nationality?: FootballerNation | null;
  /** How many footballers survived that filter. */
  matchCount?: number | null;
  onClearNationality?: () => void;
}) {
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
            {/* The card is the first thing read, so it is the thing that has
                to keep up. It said "everyone who played here" while the list
                below it showed 122 Brazilians. */}
            <p className="text-sm text-muted-foreground">
              {nationality
                ? `${nationality.nationality} footballers who played for a club in ${nation.name}`
                : 'Everyone who played for a club in this country'}
            </p>
            {nationality && (
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs ring-1 ring-inset ring-border">
                <span className="font-medium text-foreground">
                  {matchCount === null || matchCount === undefined
                    ? nationality.nationality
                    : `${matchCount.toLocaleString()} ${nationality.nationality}`}
                </span>
                <span className="text-muted-foreground">
                  {`of ${nation.total_footballers.toLocaleString()}`}
                </span>
                {onClearNationality && (
                  <button
                    type="button"
                    onClick={onClearNationality}
                    aria-label={`Clear the ${nationality.nationality} filter`}
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            )}
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
