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
      modes: [{ mode: 'SINGLE', paths: 46279 }, { mode: 'LADDER', paths: 12722 }],
      total_paths: 65765,
      difficulty: [
        { difficulty: 'EXTREME', appearances: 52479, solve_rate_pct: 15.9, help_rate_pct: 0.3 },
        { difficulty: 'EASY', appearances: 158706, solve_rate_pct: 37.5, help_rate_pct: 0.8 },
        { difficulty: 'NORMAL', appearances: 153443, solve_rate_pct: 25.5, help_rate_pct: 0.6 },
      ],
      total_appearances: 364628,
      footballers_per_path: 3.3,
      hint_effect: {
        hinted_guesses: 3653,
        hinted_solve_pct: 35.3,
        unhinted_guesses: 102412,
        unhinted_solve_pct: 43.3,
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
