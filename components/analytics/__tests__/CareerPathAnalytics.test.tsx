import type { CareerPathAnalyticsResponse, CareerPathFootballerRow } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DifficultyTiers } from '@/components/analytics/panels/DifficultyTiers';
import { FootballerContent } from '@/components/analytics/panels/FootballerContent';

function footballer(over: Partial<CareerPathFootballerRow> & Pick<CareerPathFootballerRow, 'name'>): CareerPathFootballerRow {
  return {
    footballer_id: 1,
    declared_difficulty: 'NORMAL',
    appearances: 100,
    hints: 4,
    reveals: 1,
    skips: 2,
    help_rate_pct: 7,
    solve_rate_pct: 44,
    below_threshold: false,
    ...over,
  };
}

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
    render(<FootballerContent data={response()} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[2]).toHaveTextContent('7%');
  });

  it('shows the editor their own grading beside what players did', () => {
    render(<FootballerContent data={response()} />);

    expect(screen.getByText('graded normal')).toBeInTheDocument();
    expect(screen.getByText('44%')).toBeInTheDocument();
  });

  it('withholds a rate below the threshold and keeps the counts', () => {
    render(
      <FootballerContent
        data={response({
          content: {
            rows: [footballer({ name: 'Rare', appearances: 3, hints: 2, help_rate_pct: null, solve_rate_pct: null, below_threshold: true })],
            min_appearances: 20,
            footballers_measured: 0,
            footballers_seen: 1,
          },
        })}
      />,
    );

    expect(screen.getByText('— 3 appearances, needs 20')).toBeInTheDocument();

    // The counts survive the withheld rate: "shown 3 times, hinted twice" is a
    // fact, and it is how you tell a footballer nobody sees from a fine one.
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('3');
    expect(cells[4]).toHaveTextContent('2');
  });

  it('says how many footballers were rated against how many were seen', () => {
    // The gap between them is the answer to "why is the one I want missing".
    render(<FootballerContent data={response()} />);

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
    render(<DifficultyTiers data={response()} />);

    expect(screen.getByText(/3.3 footballers per path/)).toBeInTheDocument();
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
