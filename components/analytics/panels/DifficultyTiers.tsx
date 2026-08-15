'use client';

import type { CareerPathAnalyticsResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Whether the editorial grading means anything.
 *
 * The only way to ask it: put each declared tier next to what players actually
 * did on it. If EXTREME footballers solve at the same rate as EASY ones, the
 * grading is decoration.
 */

/**
 * The scale's own order, easiest first — which is NOT what sorting the names
 * gives you. Alphabetically the list runs EASY, EXTREME, HARD, NORMAL, so the
 * hardest tier lands second and the middle one last, and a reader scanning down
 * the column sees a ranking by nothing at all.
 */
const TIER_ORDER = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];

function tierRank(difficulty: string | null): number {
  const index = difficulty === null ? -1 : TIER_ORDER.indexOf(difficulty);
  return index === -1 ? TIER_ORDER.length : index;
}

export function DifficultyTiers({ data }: { data: CareerPathAnalyticsResponse }) {
  const tiers = [...data.shape.difficulty].sort((a, b) => tierRank(a.difficulty) - tierRank(b.difficulty));
  const modes = data.shape.modes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Does the grading hold up
          <MetricInfo metric="declared_difficulty" />
        </CardTitle>
        <CardDescription>
          Each tier an editor assigned, beside what players did on it. Ordered by
          the scale rather than alphabetically — sorted A–Z, EXTREME leads and
          NORMAL ends, which reads as a ranking by outcome.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-auto">
        {tiers.length === 0
          ? <EmptyState hint="Try a wider date range.">No footballers were served in this window.</EmptyState>
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Graded</Th>
                  <Th align="right">Times shown</Th>
                  <Th align="right" title="Should fall as the tier gets harder">Solved</Th>
                  <Th align="right" title="Does not rise with difficulty — players take LESS help on harder footballers">Needed help</Th>
                </ReportHead>
                <tbody>
                  {tiers.map(tier => (
                    <ReportRow key={String(tier.difficulty)}>
                      <Td strong>
                        {tier.difficulty ?? <span className="text-muted-foreground">Not graded</span>}
                      </Td>
                      <Td align="right">{tier.appearances.toLocaleString()}</Td>
                      <Td align="right" strong>
                        {tier.solve_rate_pct === null ? '—' : `${tier.solve_rate_pct}%`}
                      </Td>
                      <Td align="right" className="text-muted-foreground">
                        {tier.help_rate_pct === null ? '—' : `${tier.help_rate_pct}%`}
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}

        {/* Reported with its confound stated, because the naive reading is
            actively wrong: players take hints on the footballers they are
            ALREADY stuck on, so a lower hinted rate does not mean hints make
            people worse. What survives is the absolute number — a hinted guess
            is still wrong about two thirds of the time, so the hints are not
            rescuing hard content. */}
        {data.shape.hint_effect.hinted_guesses > 0 && (
          <div className="space-y-1.5 border-t pt-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              Does a hint help
              <MetricInfo metric="hint_effect" />
            </p>
            <p className="text-sm">
              {`Guesses made after a hint are right ${data.shape.hint_effect.hinted_solve_pct}% of the time, against ${data.shape.hint_effect.unhinted_solve_pct}% without one.`}
            </p>
            <p className="text-xs text-muted-foreground">
              Not a fair comparison — a hint is taken on the footballers someone is
              already stuck on, so the hinted set is harder to begin with. Read the
              first number on its own: a hinted guess is still wrong most of the time.
            </p>
          </div>
        )}

        {/* Beside the hint figure on purpose: both aids are triggered by the
            same struggle, so comparing them IS fair even though neither is a
            controlled trial — and the comparison is the finding. The grid
            recovers about two thirds of the attempts that reach it; the hint
            text recovers about a third. */}
        {data.shape.similar_footballers.reached > 0
          && data.shape.similar_footballers.reached_pct !== null
          && data.shape.similar_footballers.solved_after_pct !== null && (
          <div className="space-y-1.5 border-t pt-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              Does the similar-footballers grid help
              <MetricInfo metric="similar_footballers" />
            </p>
            <p className="text-sm">
              {`Shown on ${data.shape.similar_footballers.reached_pct}% of eligible appearances, and ${data.shape.similar_footballers.solved_after_pct}% of those are then solved.`}
            </p>
            <p className="text-xs text-muted-foreground">
              {/* An inference, and it says so. Nothing records that the grid was
                  served, so this counts what each game's own configuration says
                  happens — enabled, and past its own wrong-guess threshold. */}
              {`Derived, not recorded: nothing logs that the grid was shown, so this counts appearances past each game's own wrong-guess threshold. ${data.shape.similar_footballers.ineligible.toLocaleString()} appearances could never show it and are left out of both figures.`}
            </p>
          </div>
        )}

        {modes.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">What was built</p>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              {modes.map(mode => (
                <div key={mode.mode} className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">{mode.mode.replaceAll('_', ' ').toLowerCase()}</dt>
                  <dd className="font-medium tabular-nums">{mode.paths.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
            {data.shape.footballers_per_path !== null && (
              // Kept visible on purpose: this number is why the dashboard this
              // replaces was wrong. It counted one hint once per footballer in
              // the path, so everything it reported was inflated by roughly
              // this factor.
              <p className="text-xs text-muted-foreground">
                {`${data.shape.footballers_per_path} footballers per path on average, across ${data.shape.total_paths.toLocaleString()} paths.`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
