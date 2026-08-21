'use client';

import type { CareerPathFootballerDetail } from '@/types/reports';
import { HelperBreakdown } from '@/components/analytics/HelperBreakdown';
import { OutcomeBar, OutcomeLegend } from '@/components/analytics/OutcomeBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const pct = (value: number | null) => (value === null ? '—' : `${value}%`);

/**
 * One footballer's Career Path record.
 *
 * The analytics table answers "which footballers should I look at". This
 * answers "and what is wrong with this one", which needs different cuts rather
 * than a wider row — so it lives beside the edit form, where the answer is
 * acted on, instead of in the dashboard where the question is asked.
 */
export function CareerPathRecord({ detail }: { detail: CareerPathFootballerDetail }) {
  const { footballer, totals, by_mode: byMode, guess_distribution: distribution } = detail;
  const busiest = Math.max(...distribution.map(row => row.plays), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{footballer.name}</CardTitle>
        <CardDescription>
          {footballer.declared_difficulty
            ? `Graded ${footballer.declared_difficulty.toLowerCase()}, and what players actually did with it.`
            : 'What players actually did with this footballer.'}
          {!footballer.available_for_career_path && ' Not currently available for Career Path.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {totals.plays === 0
          ? (
              // Not an empty chart: zero plays and a flat chart look the same,
              // and only one of them means "there is nothing to judge yet".
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {`${footballer.name} has not been played in this window.`}
              </p>
            )
          : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Figure
                    label="Played"
                    value={totals.plays.toLocaleString()}
                    hint={totals.in_paths === totals.plays ? undefined : `in ${totals.in_paths.toLocaleString()} paths`}
                  />
                  <Figure label="Needed help" value={pct(totals.help_rate_pct)} />
                  <Figure label="Left unfinished" value={pct(totals.unfinished_pct)} />
                  <Figure
                    label="Guesses to solve"
                    value={totals.avg_guesses_to_solve === null ? '—' : String(totals.avg_guesses_to_solve)}
                    hint="solved plays only"
                  />
                </div>

                <div className="space-y-2">
                  <OutcomeBar outcome={totals.outcome} plays={totals.plays} className="h-3" />
                  <OutcomeLegend />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">By mode</h3>
                  <p className="text-xs text-muted-foreground">
                    Ladder gives five tries where Single gives one, so one blended rate would
                    describe neither.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-96 text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th scope="col" className="px-2 pb-1.5 text-left font-medium">Mode</th>
                          <th scope="col" className="px-2 pb-1.5 text-right font-medium">Played</th>
                          <th scope="col" className="px-2 pb-1.5 text-right font-medium">Solved</th>
                          <th scope="col" className="px-2 pb-1.5 text-right font-medium">Needed help</th>
                          <th scope="col" className="px-2 pb-1.5 text-right font-medium">Unfinished</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byMode.map(mode => (
                          <tr key={mode.mode} className="border-b border-border/50 last:border-0">
                            <td className="px-2 py-1.5 font-medium text-foreground">{mode.mode}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{mode.plays.toLocaleString()}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{pct(mode.solve_rate_pct)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{pct(mode.help_rate_pct)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{pct(mode.unfinished_pct)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {distribution.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-foreground">How many guesses it takes</h3>
                    <p className="text-xs text-muted-foreground">
                      Solved plays only. A play that ended without an answer is not a play that
                      would have taken forever — the player stopped, so the number is not known.
                    </p>
                    <ul className="space-y-1">
                      {distribution.map(row => (
                        <li key={row.guesses} className="flex items-center gap-2 text-xs">
                          <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                            {`${row.guesses} ${row.guesses === 1 ? 'guess' : 'guesses'}`}
                          </span>
                          <span
                            aria-label={`${row.guesses} guesses: ${row.plays} plays`}
                            className="h-3 min-w-px rounded-sm bg-primary/60"
                            style={{ width: `${(row.plays * 100) / busiest}%` }}
                          />
                          <span className="tabular-nums text-muted-foreground">{row.plays}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={cn('space-y-2')}>
                  <h3 className="text-sm font-medium text-foreground">Which helpers were reached for</h3>
                  <HelperBreakdown help={totals.help} />
                </div>
              </>
            )}
      </CardContent>
    </Card>
  );
}
