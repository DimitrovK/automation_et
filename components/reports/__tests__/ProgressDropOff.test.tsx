import type { ProgressResponse, ProgressRow } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressDropOff } from '@/components/reports/panels/ProgressDropOff';

const META = {
  missing11: { key: 'missing11', label: 'Missing11', display_name: 'Guess The Line Up', color: '#2563eb', color_dark: '#60a5fa' },
  scout: { key: 'scout', label: 'Scout', display_name: 'Scout', color: '#16a34a', color_dark: '#4ade80' },
} as never;

function band(key: string, count: number, pct: number) {
  return { key, from_pct: 0, to_pct: null, count, pct };
}

function row(over: Partial<ProgressRow> & Pick<ProgressRow, 'game_type'>): ProgressRow {
  return {
    supported: true,
    reason: null,
    unit: 'lineup slots filled',
    never_started: 0,
    sessions: 100,
    abandoned: 50,
    finished: 50,
    abandoned_bands: [
      band('none', 22, 44),
      band('under_25', 9, 18),
      band('under_50', 10, 20),
      band('under_75', 6, 12),
      band('under_100', 3, 6),
      band('complete', 0, 0),
    ],
    finished_bands: [band('complete', 50, 100)],
    abandoned_no_progress_pct: 44,
    finished_no_progress_pct: 3.6,
    ...over,
  };
}

function response(rows: ProgressRow[]): ProgressResponse {
  // Cast past the range echo: it is on every response and none of it is read here.
  return {
    rows,
    games_without_progress: rows.filter(r => !r.supported).map(r => r.game_type),
    total_abandoned: rows.reduce((sum, r) => sum + r.abandoned, 0),
  } as unknown as ProgressResponse;
}

describe('progressDropOff', () => {
  it('shows the abandoned figure beside the finished one', () => {
    // The comparison IS the finding. 44% of abandoned sessions getting nowhere
    // reads as an indictment of the game until 3.6% of finished ones show it is
    // something players do too — so the two are columns of the same row, never
    // one number with the other a page away.
    render(<ProgressDropOff data={response([row({ game_type: 'missing11' })])} meta={META} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[2]).toHaveTextContent('44%');
    expect(cells[3]).toHaveTextContent('3.6%');
  });

  it('separates sessions that were never started from ones that stalled', () => {
    // Grid keeps 959 of the first against 164 of the second. One combined
    // number would read as the second and send someone to fix the wrong thing.
    render(
      <ProgressDropOff
        data={response([row({ game_type: 'missing11', abandoned: 1123, never_started: 959 })])}
        meta={META}
      />,
    );

    expect(screen.getByText('959 never started')).toBeInTheDocument();
  });

  it('names every game that reports no progress, with its reason', () => {
    // Eight missing games on a per-game table reads as a broken request.
    render(
      <ProgressDropOff
        data={response([
          row({ game_type: 'missing11' }),
          row({
            game_type: 'scout',
            supported: false,
            unit: null,
            reason: 'guesses count against the player here — more of them is worse, not further along',
            abandoned: 0,
            finished: 0,
            abandoned_bands: [],
            finished_bands: [],
            abandoned_no_progress_pct: null,
            finished_no_progress_pct: null,
          }),
        ])}
        meta={META}
      />,
    );

    expect(screen.getByText('One game reports no progress')).toBeInTheDocument();
    expect(screen.getByText(/count against the player/)).toBeInTheDocument();
  });

  it('keeps a game out of the table when it cannot report progress', () => {
    // Rendered as a row of dashes it would sit in the ranking, and a reader
    // sorting by drop-off would read "no bar" as "no drop-off".
    render(
      <ProgressDropOff
        data={response([row({
          game_type: 'scout',
          supported: false,
          reason: 'guesses count against the player here',
          abandoned: 0,
          abandoned_bands: [],
          abandoned_no_progress_pct: null,
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('No sessions were abandoned in this window.')).toBeInTheDocument();
  });

  it('links each game to its own report', () => {
    render(<ProgressDropOff data={response([row({ game_type: 'missing11' })])} meta={META} />);

    expect(screen.getByRole('link', { name: /Guess The Line Up/ }))
      .toHaveAttribute('href', '/reports/games/missing11');
  });

  it('says what a step is for this game, since the games disagree', () => {
    // Missing11 counts lineup slots FILLED CORRECTLY and Grid counts
    // footballers REACHED — its cursor moves on a wrong guess too. Two bars of
    // the same length mean different things.
    render(<ProgressDropOff data={response([row({ game_type: 'missing11' })])} meta={META} />);

    expect(screen.getByText('measured in lineup slots filled')).toBeInTheDocument();
  });
});
