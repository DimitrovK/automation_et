import type { ContentResponse, ContentRow, FallbackRow, FallbacksResponse } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentHealth, FormatFallbacks } from '@/components/reports/panels/ContentHealth';

const META = {
  missing11: { key: 'missing11', label: 'Missing11', display_name: 'Guess The Line Up', color: '#2563eb', color_dark: '#60a5fa' },
  grid: { key: 'grid', label: 'Grid', display_name: 'Grid', color: '#f97316', color_dark: '#fdba74' },
  quiz: { key: 'quiz', label: 'Quiz', display_name: 'Quiz', color: '#059669', color_dark: '#34d399' },
} as never;

function row(over: Partial<ContentRow> & Pick<ContentRow, 'game_type'>): ContentRow {
  return {
    item: 'lineup',
    scheduled: true,
    total: 458,
    unused: 0,
    exhausted: 0,
    usable: 458,
    runway_days: 30,
    staged_ahead: 30,
    last_staged: '2026-09-14',
    low: false,
    dry: false,
    topped_up_by_a_job: false,
    ...over,
  };
}

function response(rows: ContentRow[], warningDays = 14): ContentResponse {
  return {
    as_of: '2026-08-15',
    rows,
    warning_days: warningDays,
    games_running_low: rows.filter(r => r.low).map(r => r.game_type),
  };
}

describe('contentHealth', () => {
  it('says a game is dry, and for how long', () => {
    // Not "0 days". The distinction between running out today and having run
    // out three weeks ago is what decides how urgent this is.
    render(
      <ContentHealth
        data={response([row({
          game_type: 'missing11',
          runway_days: -20,
          staged_ahead: 0,
          dry: true,
          low: true,
          last_staged: '2026-07-26',
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('Dry 20d')).toBeInTheDocument();
    expect(screen.getByText(/2026-07-26/)).toBeInTheDocument();
  });

  it('does not treat a full catalogue as health', () => {
    // 458 lineups, every one served. A coverage bar draws that as full on the
    // day the game runs out of anything to show.
    render(
      <ContentHealth
        data={response([row({
          game_type: 'missing11',
          total: 458,
          unused: 0,
          runway_days: -20,
          dry: true,
          low: true,
        })])}
        meta={META}
      />,
    );
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('Dry 20d');
    expect(cells[2]).toHaveTextContent('458');
  });

  it('says a pooled game has no schedule rather than no runway', () => {
    // A zero here reads as "out of content" for a game that simply has no
    // calendar to be measured against.
    render(
      <ContentHealth
        data={response([row({
          game_type: 'quiz',
          scheduled: false,
          item: 'quiz',
          runway_days: null,
          staged_ahead: null,
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('no schedule')).toBeInTheDocument();
  });

  it('marks a machine-filled pool, because a shrinking one is a broken job', () => {
    // Different alert, different owner. Filed under "write more content" it
    // wastes a week before anyone checks the scheduler.
    render(
      <ContentHealth
        data={response([row({
          game_type: 'grid',
          scheduled: false,
          item: 'grid',
          runway_days: null,
          topped_up_by_a_job: true,
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('machine-filled')).toBeInTheDocument();
  });

  it('states the threshold it is colouring against', () => {
    render(<ContentHealth data={response([row({ game_type: 'missing11' })], 14)} meta={META} />);

    expect(screen.getByText(/Amber under 14 days/)).toBeInTheDocument();
  });
});

function fallbackRow(over: Partial<FallbackRow> & Pick<FallbackRow, 'challenge_type'>): FallbackRow {
  return {
    challenges: 100,
    multiple_choice: 82,
    fallbacks: 18,
    wanted_multiple_choice: 100,
    fallback_pct: 18,
    unstamped: 0,
    ...over,
  };
}

function fallbacks(rows: FallbackRow[], unstamped = 0): FallbacksResponse {
  return {
    rows,
    total_wanted_multiple_choice: rows.reduce((sum, r) => sum + r.wanted_multiple_choice, 0),
    total_fallbacks: rows.reduce((sum, r) => sum + r.fallbacks, 0),
    total_unstamped: unstamped,
  } as unknown as FallbacksResponse;
}

describe('formatFallbacks', () => {
  it('shows the rate against what wanted a grid, not against everything', () => {
    render(<FormatFallbacks data={fallbacks([fallbackRow({ challenge_type: 'CLUB_CONNECTION' })])} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('100');
    expect(cells[3]).toHaveTextContent('18%');
  });

  it('says the rate is unknown, not zero, when nothing carries the flag', () => {
    // Every challenge predating the flag reported as a clean 0% is the specific
    // wrong answer here — it says the content is fine when nothing was measured.
    render(<FormatFallbacks data={fallbacks([], 16651)} />);

    expect(screen.getByText(/unknown rather than zero/)).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('says how many rows were left out of the rates', () => {
    render(
      <FormatFallbacks
        data={fallbacks([fallbackRow({ challenge_type: 'CLUB_CONNECTION' })], 400)}
      />,
    );

    expect(screen.getByText(/400 challenges in this window predate the flag/)).toBeInTheDocument();
  });
});
