import type { LineupRow, LineupsAnalyticsResponse, LineupSlotRow } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LineupSlots } from '@/components/analytics/panels/LineupSlots';
import { LineupWorkload } from '@/components/analytics/panels/LineupWorkload';

function slot(over: Partial<LineupSlotRow> & Pick<LineupSlotRow, 'slot_id' | 'player'>): LineupSlotRow {
  return {
    shirt_number: 11,
    lineup_id: 1,
    lineup: 'Roma - Lazio',
    sessions: 70,
    guesses_per_session: 5.3,
    solve_rate_pct: 74.2,
    hint_rate_pct: 64.5,
    ...over,
  };
}

function lineup(over: Partial<LineupRow> & Pick<LineupRow, 'lineup_id' | 'title'>): LineupRow {
  return {
    sessions: 120,
    finished_pct: 77.8,
    guesses_per_session: 25.2,
    ...over,
  };
}

function response(slots: LineupSlotRow[], lineups: LineupRow[] = []): LineupsAnalyticsResponse {
  return {
    slots: { rows: slots, min_sessions: 30, slots_measured: slots.length },
    lineups: { rows: lineups, min_sessions: 20, lineups_measured: lineups.length },
  } as unknown as LineupsAnalyticsResponse;
}

describe('lineupSlots', () => {
  it('leads with effort, which is the only thing that separates a slot here', () => {
    // The solve rate is 99% on the median slot, so a ranking by it reads the
    // same all the way down.
    render(<LineupSlots data={response([slot({ slot_id: 1, player: 'Barmby' })])} />);

    expect(screen.getByText('Hardest')).toBeInTheDocument();
    expect(screen.getByText('5.3 guesses')).toBeInTheDocument();
  });

  it('names the lineup, because the same footballer elsewhere is a different slot', () => {
    // The shirt number and the positions around them are what make a player
    // guessable — "Barmby" on its own is not a thing an editor can fix.
    render(<LineupSlots data={response([slot({ slot_id: 1, player: 'Barmby' })])} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[0]).toHaveTextContent('#11');
    expect(cells[1]).toHaveTextContent('Roma - Lazio');
  });

  it('keeps the solve rate visible as a floor', () => {
    // Near-universal by design, so it is not the ranking — but a slot below 90%
    // is not being solved reliably and that is worth seeing.
    render(<LineupSlots data={response([slot({ slot_id: 1, player: 'Barmby' })])} />);

    expect(screen.getByText('74.2%')).toBeInTheDocument();
  });

  it('says nothing was rated rather than showing an empty table', () => {
    render(<LineupSlots data={response([])} />);

    expect(screen.getByText('No slot was played enough times to rate.')).toBeInTheDocument();
  });
});

describe('lineupWorkload', () => {
  it('puts effort and completion in the same row', () => {
    // A demanding lineup is only a problem when people stop finishing it, and
    // separating the two columns would make each look like a verdict.
    render(<LineupWorkload data={response([], [lineup({ lineup_id: 1, title: 'Roma - Lazio' })])} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[2]).toHaveTextContent('25.2');
    expect(cells[3]).toHaveTextContent('77.8%');
  });

  it('states the threshold it applied', () => {
    render(<LineupWorkload data={response([], [lineup({ lineup_id: 1, title: 'X' })])} />);

    expect(screen.getByText(/played at least 20 times/)).toBeInTheDocument();
  });
});
