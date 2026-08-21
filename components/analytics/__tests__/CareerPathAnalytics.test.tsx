import type { CareerPathAnalyticsResponse, CareerPathFootballerRow } from '@/types/reports';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DifficultyTiers } from '@/components/analytics/panels/DifficultyTiers';
import { FootballerContent } from '@/components/analytics/panels/FootballerContent';
import { ModeVolume } from '@/components/analytics/panels/ModeVolume';

function footballer(over: Partial<CareerPathFootballerRow> & Pick<CareerPathFootballerRow, 'name'>): CareerPathFootballerRow {
  return {
    footballer_id: 1,
    declared_difficulty: 'NORMAL',
    in_paths: 130,
    plays: 100,
    outcome: { solved_unaided: 40, solved_helped: 7, unsolved: 45, unfinished: 8 },
    unfinished_pct: 8,
    avg_guesses_to_solve: 2.4,
    hints: 4,
    reveals: 1,
    skips: 2,
    help: {
      hint: { used: 4, events: 4, eligible: 80 },
      reveal: { used: 1, events: 1, eligible: null },
      skip: { used: 2, events: 2, eligible: 0 },
      similar: { used: 30, events: null, eligible: 90, derived: true },
    },
    help_rate_pct: 7,
    solve_rate_pct: 44,
    below_threshold: false,
    ...over,
  };
}

const contentProps = {
  search: '',
  onSearchChange: vi.fn(),
  ordering: 'help' as const,
  onSort: vi.fn(),
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

function response(over: Partial<CareerPathAnalyticsResponse> = {}): CareerPathAnalyticsResponse {
  return {
    start: '2026-05-01',
    end: '2026-07-30',
    days: 90,
    window: 90,
    game_type: null,
    include_bots: false,
    content: {
      rows: [footballer({ name: 'Rui Pedro' })],
      min_appearances: 20,
      total: 1,
      limit: 50,
      page: 1,
      pages: 1,
      ordering: 'help',
      search: null,
      footballers_measured: 1046,
      footballers_seen: 6364,
    },
    shape: {
      modes: [
        { mode: 'SINGLE', paths: 25131, appearances: 25131, solve_rate_pct: 70.8, help_rate_pct: 2.6 },
        { mode: 'HEAD_TO_HEAD', paths: 580, appearances: 2794, solve_rate_pct: 83.8, help_rate_pct: 2.1 },
        { mode: 'RACE', paths: 12, appearances: 12, solve_rate_pct: 58.7, help_rate_pct: 5.1 },
      ],
      total_paths: 25723,
      difficulty: [
        { difficulty: 'EXTREME', appearances: 6748, solve_rate_pct: 56.5, help_rate_pct: 2.3 },
        { difficulty: 'EASY', appearances: 23557, solve_rate_pct: 84.4, help_rate_pct: 4.6 },
        { difficulty: 'NORMAL', appearances: 21359, solve_rate_pct: 67.1, help_rate_pct: 3.9 },
      ],
      total_appearances: 60545,
      footballers_per_path: 3.3,
      hint_effect: {
        hinted_guesses: 3653,
        hinted_solve_pct: 35.3,
        unhinted_guesses: 102412,
        unhinted_solve_pct: 43.3,
      },
      similar_footballers: {
        recorded: false,
        reached: 15973,
        ineligible: 4612,
        reached_pct: 28.6,
        solved_after_pct: 66.9,
        solved_without_pct: 74.7,
      },
    },
    ...over,
  } satisfies CareerPathAnalyticsResponse;
}

describe('footballerContent', () => {
  it('leads with the rate, not the raw help count', () => {
    // The dashboard this replaces ranked by count, which puts the most COMMON
    // footballers on top and never surfaces a broken one shown twelve times.
    render(<FootballerContent {...contentProps} data={response()} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    // Footballer, Played, What happened, Needed help, Unfinished, Guesses.
    expect(cells[1]).toHaveTextContent('100');
    expect(cells[3]).toHaveTextContent('7%');
  });

  it('counts plays, and says so when the footballer sits in more paths than that', () => {
    // A path is built before it is played, so a ladder nobody finished leaves
    // its later footballers in paths they were never played from. Counting
    // those made every rate on this table too small.
    render(<FootballerContent {...contentProps} data={response()} />);

    expect(screen.getByText('in 130 paths')).toBeInTheDocument();
  });

  it('draws what happened, so the help rate is interpretable', () => {
    // "Needed help 25%" means nothing alone: solved 95% of the time with a
    // quarter taking hints is fine, solved 20% of the time is not.
    render(<FootballerContent {...contentProps} data={response()} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      '100 plays: 40 solved unaided, 7 solved after help, 45 unsolved, 8 left unfinished',
    );
  });

  it('sends a name to that footballer own record', () => {
    render(<FootballerContent {...contentProps} data={response()} />);

    expect(screen.getByRole('link', { name: 'Rui Pedro' })).toHaveAttribute(
      'href',
      '/footballer-management?footballer=1&tab=career-path',
    );
  });

  it('sorts through the server, on the column that was pressed', () => {
    // Sorting the fetched page would order fifty rows out of five thousand.
    const onSort = vi.fn();
    render(<FootballerContent {...contentProps} data={response()} onSort={onSort} />);

    fireEvent.click(within(screen.getByRole('columnheader', { name: /Unfinished/ })).getByRole('button'));

    expect(onSort).toHaveBeenCalledWith('unfinished');
  });

  it('shows the editor their own grading beside what players did', () => {
    render(<FootballerContent {...contentProps} data={response()} />);

    expect(screen.getByText('graded normal')).toBeInTheDocument();
    // The solve rate moved into the bar — it is one of four outcomes, and
    // reading it as a lone percentage was the thing that made the help rate
    // uninterpretable.
    expect(screen.getByText('2.4')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('withholds a rate below the threshold and keeps the counts', () => {
    render(
      <FootballerContent
        {...contentProps}
        data={response({
          content: {
            rows: [footballer({
              name: 'Rare',
              plays: 3,
              in_paths: 3,
              hints: 2,
              help: {
                hint: { used: 2, events: 2, eligible: 3 },
                reveal: { used: 0, events: 0, eligible: null },
                skip: { used: 0, events: 0, eligible: 3 },
                similar: { used: 0, events: null, eligible: 3, derived: true },
              },
              help_rate_pct: null,
              solve_rate_pct: null,
              below_threshold: true,
            })],
            min_appearances: 20,
            footballers_measured: 0,
            footballers_seen: 1,
          },
        })}
      />,
    );

    expect(screen.getByText('— 3 plays, needs 20')).toBeInTheDocument();

    // The counts survive the withheld rate: "shown 3 times, hinted twice" is a
    // fact, and it is how you tell a footballer nobody sees from a fine one.
    // They moved into the expansion when the raw-count columns did, so the
    // guard follows them rather than being dropped.
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('3');

    fireEvent.click(screen.getByRole('button', { name: /Show how Rare was helped/ }));

    expect(screen.getByText('2 of 3 hinted')).toBeInTheDocument();
  });

  it('opens onto how the footballer was helped, and not before', () => {
    // Four tiles across fifty rows is the heaviest DOM the page could build,
    // and almost none of it would ever be looked at.
    render(<FootballerContent {...contentProps} data={response()} />);

    expect(screen.queryByText(/of 80 hinted/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show how Rui Pedro was helped/ }));

    expect(screen.getByText('4 of 80 hinted')).toBeInTheDocument();
  });

  it('tells a helper nobody needed apart from one never offered', () => {
    // The reason the breakdown exists. Both read "0" in the old flat columns.
    render(<FootballerContent {...contentProps} data={response()} />);
    fireEvent.click(screen.getByRole('button', { name: /Show how Rui Pedro was helped/ }));

    expect(screen.getByText('never offered on these appearances')).toBeInTheDocument();
  });

  it('admits when a helper\'s availability is not knowable', () => {
    // `reveals_allowed = 0` means UNLIMITED on the backend, so the obvious
    // predicate reports the reverse of the truth. Better to say so than to
    // print a denominator that is confidently backwards.
    render(<FootballerContent {...contentProps} data={response()} />);
    fireEvent.click(screen.getByRole('button', { name: /Show how Rui Pedro was helped/ }));

    expect(screen.getByText(/how often it was on offer is not recorded/)).toBeInTheDocument();
  });

  it('marks the similar-footballers figure as inferred', () => {
    // Nothing logs that the grid was shown. An inference must never be read as
    // a measurement.
    render(<FootballerContent {...contentProps} data={response()} />);
    fireEvent.click(screen.getByRole('button', { name: /Show how Rui Pedro was helped/ }));

    expect(screen.getByText('derived')).toBeInTheDocument();
    expect(screen.getByText('30 of 90 reached')).toBeInTheDocument();
  });

  it('leaves the row shut when the backend has no breakdown yet', () => {
    // The repositories deploy independently, so a row without `help` must not
    // offer a control that opens onto nothing.
    render(
      <FootballerContent
        {...contentProps}
        data={response({
          content: {
            rows: [footballer({ name: 'Old Payload', help: undefined })],
            min_appearances: 20,
            footballers_measured: 1,
            footballers_seen: 1,
          },
        })}
      />,
    );

    expect(screen.queryByRole('button', { name: /was helped/ })).not.toBeInTheDocument();
  });

  it('says how many footballers were rated against how many were seen', () => {
    // The gap between them is the answer to "why is the one I want missing".
    render(<FootballerContent {...contentProps} data={response()} />);

    expect(screen.getByText('1,046')).toBeInTheDocument();
    expect(screen.getByText('6,364')).toBeInTheDocument();
  });
});

describe('difficultyTiers', () => {
  it('orders the tiers by the scale, not the alphabet', () => {
    // A–Z puts EXTREME first and NORMAL last, which reads as a ranking by
    // outcome rather than by difficulty.
    render(<DifficultyTiers data={response()} />);
    const rows = screen.getAllByRole('row').slice(1, 4);
    const tiers = rows.map(row => within(row).getAllByRole('cell')[0].textContent?.trim());

    expect(tiers).toEqual(['EASY', 'NORMAL', 'EXTREME']);
  });

  it('states the hint comparison is not a fair one', () => {
    // Without this the panel reads "hints make players worse", which is the
    // opposite of what the data supports.
    render(<DifficultyTiers data={response()} />);

    expect(screen.getByText(/Not a fair comparison/)).toBeInTheDocument();
    expect(screen.getByText(/35.3% of the time, against 43.3%/)).toBeInTheDocument();
  });

  it('says nothing about hints when none were taken', () => {
    render(
      <DifficultyTiers
        data={response({
          shape: {
            ...response().shape,
            hint_effect: { hinted_guesses: 0, hinted_solve_pct: null, unhinted_guesses: 10, unhinted_solve_pct: 50 },
          },
        })}
      />,
    );

    expect(screen.queryByText(/Not a fair comparison/)).not.toBeInTheDocument();
  });

  it('keeps the footballers-per-path figure, which is why the old numbers were wrong', () => {
    // Moved with the figure. It used to close the difficulty card under "What
    // was built"; that block is now `ModeVolume`, which draws the same counts
    // with lengths and shares. The GUARD stays either way — this number is the
    // one that explains why the dashboard this replaced was inflated, so it
    // must not quietly disappear in a re-layout.
    render(<ModeVolume data={response()} />);

    expect(screen.getByText(/3.3 footballers per game/)).toBeInTheDocument();
  });

  it('no longer prints the per-mode counts twice', () => {
    // Two presentations of one set of numbers is how they drift.
    render(<DifficultyTiers data={response()} />);

    expect(screen.queryByText('What was built')).not.toBeInTheDocument();
  });
});

describe('similar footballers', () => {
  it('reports reach and recovery, so it can be read against the hint figure', () => {
    // The comparison is the finding: the grid recovers about two thirds of the
    // attempts that reach it, a hint about a third. Both are triggered by the
    // same struggle, so comparing them is fair even though neither is a trial.
    render(<DifficultyTiers data={response()} />);

    expect(screen.getByText(/28.6% of eligible appearances, and 66.9% of those/)).toBeInTheDocument();
  });

  it('says it is derived rather than recorded', () => {
    // Nothing logs that the grid was served. Without this line an inference
    // reads as a measurement, and instrumenting it later would look like a
    // change in the data rather than a change in what is being counted.
    render(<DifficultyTiers data={response()} />);

    expect(screen.getByText(/Derived, not recorded/)).toBeInTheDocument();
    expect(screen.getByText(/4,612 appearances could never show it/)).toBeInTheDocument();
  });

  it('says nothing rather than "null%" when a rate is missing', () => {
    // `reached_pct` and `solved_after_pct` are nullable independently of
    // `reached`, so gating on the count alone leaked "null%" into the sentence
    // (Copilot on #127).
    render(
      <DifficultyTiers
        data={response({
          shape: {
            ...response().shape,
            similar_footballers: {
              recorded: false,
              reached: 42,
              ineligible: 0,
              reached_pct: null,
              solved_after_pct: null,
              solved_without_pct: null,
            },
          },
        })}
      />,
    );

    expect(screen.queryByText(/null%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Derived, not recorded/)).not.toBeInTheDocument();
  });

  it('says nothing when the grid was never reached', () => {
    render(
      <DifficultyTiers
        data={response({
          shape: {
            ...response().shape,
            similar_footballers: {
              recorded: false,
              reached: 0,
              ineligible: 10,
              reached_pct: 0,
              solved_after_pct: null,
              solved_without_pct: 80,
            },
          },
        })}
      />,
    );

    expect(screen.queryByText(/Derived, not recorded/)).not.toBeInTheDocument();
  });
});
