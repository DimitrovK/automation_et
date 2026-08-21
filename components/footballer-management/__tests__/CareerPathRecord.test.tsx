import type { CareerPathFootballerDetail } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CareerPathRecord } from '@/components/footballer-management/CareerPathRecord';

function detail(over: Partial<CareerPathFootballerDetail> = {}): CareerPathFootballerDetail {
  return {
    start: '2026-05-01',
    end: '2026-07-30',
    days: 90,
    window: 90,
    game_type: null,
    include_bots: false,
    footballer: {
      id: 7,
      name: 'Salvatore Sirigu',
      declared_difficulty: 'NORMAL',
      status: 'APPROVED',
      retired: true,
      available_for_career_path: true,
    },
    totals: {
      in_paths: 22,
      plays: 24,
      help_rate_pct: 37.5,
      solve_rate_pct: 79.2,
      unfinished_pct: 0,
      avg_guesses_to_solve: 2.5,
      outcome: { solved_unaided: 13, solved_helped: 6, unsolved: 5, unfinished: 0 },
      help: {
        hint: { used: 6, events: 8, eligible: 20 },
        reveal: { used: 2, events: 2, eligible: null },
        skip: { used: 1, events: 1, eligible: 12 },
        similar: { used: 9, events: null, eligible: 20, derived: true },
      },
    },
    by_mode: [
      { mode: 'LADDER', plays: 18, solve_rate_pct: 72.2, help_rate_pct: 44.4, unfinished_pct: 0 },
      { mode: 'SINGLE', plays: 6, solve_rate_pct: 100, help_rate_pct: 16.7, unfinished_pct: 0 },
    ],
    guess_distribution: [
      { guesses: 1, plays: 8 },
      { guesses: 2, plays: 6 },
      { guesses: 5, plays: 5 },
    ],
    ...over,
  };
}

describe('careerPathRecord', () => {
  it('names the footballer and their grading', () => {
    render(<CareerPathRecord detail={detail()} />);

    expect(screen.getByText('Salvatore Sirigu')).toBeInTheDocument();
    expect(screen.getByText(/graded normal/i)).toBeInTheDocument();
  });

  it('splits by mode, because Ladder and Single are not comparable', () => {
    // Ladder gives five tries where Single gives one, so a footballer brutal in
    // one can be ordinary in the other. One blended rate describes neither.
    render(<CareerPathRecord detail={detail()} />);

    const ladder = screen.getByRole('row', { name: /LADDER/ });

    expect(within(ladder).getByText('18')).toBeInTheDocument();
    expect(within(ladder).getByText('72.2%')).toBeInTheDocument();
  });

  it('shows the spread of guesses, not only the average', () => {
    // Two solving on guess one and two on guess nine average the same as four
    // on guess five, and only one of those is worth opening.
    render(<CareerPathRecord detail={detail()} />);

    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByLabelText('5 guesses: 5 plays')).toBeInTheDocument();
  });

  it('says plainly when nobody has played the footballer', () => {
    // Not an empty chart: zero plays and a flat chart look identical, and only
    // one of them means "there is nothing to judge yet".
    render(
      <CareerPathRecord
        detail={detail({
          totals: {
            ...detail().totals,
            plays: 0,
            outcome: { solved_unaided: 0, solved_helped: 0, unsolved: 0, unfinished: 0 },
          },
          by_mode: [],
          guess_distribution: [],
        })}
      />,
    );

    expect(screen.getByText(/has not been played in this window/i)).toBeInTheDocument();
  });
});
