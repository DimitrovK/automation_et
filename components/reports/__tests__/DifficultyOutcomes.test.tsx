import type { AttemptRow, AttemptsResponse, DifficultyBucket, DifficultyResponse, DifficultyRow } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AttemptSpread } from '@/components/reports/panels/AttemptSpread';
import { DifficultyOutcomes } from '@/components/reports/panels/DifficultyOutcomes';

const META = {
  conquest: { key: 'conquest', label: 'Conquest', display_name: 'Football Conquest', color: '#7c3aed', color_dark: '#a78bfa' },
  grid: { key: 'grid', label: 'Grid', display_name: 'Grid', color: '#f97316', color_dark: '#fdba74' },
  missing_team: { key: 'missing_team', label: 'Missing Team', display_name: 'Missing Team', color: '#0891b2', color_dark: '#22d3ee' },
  missing11: { key: 'missing11', label: 'Missing11', display_name: 'Guess The Line Up', color: '#2563eb', color_dark: '#60a5fa' },
} as never;

function bucket(over: Partial<DifficultyBucket> & Pick<DifficultyBucket, 'value'>): DifficultyBucket {
  return {
    off_scale: false,
    below_threshold: false,
    sessions: 100,
    finished: 80,
    swept: 0,
    completion_pct: 80,
    wins: null,
    decided: null,
    win_rate_pct: null,
    ...over,
  };
}

function row(over: Partial<DifficultyRow> & Pick<DifficultyRow, 'game_type'>): DifficultyRow {
  return {
    sessions: 1000,
    finished: 800,
    swept: 0,
    sweeper_hours: null,
    completion_pct: 80,
    has_verdict: false,
    decided: null,
    verdict_coverage_pct: null,
    win_rate_pct: null,
    difficulty_label: null,
    difficulty: [],
    ...over,
  };
}

function response(rows: DifficultyRow[], minSessions = 30): DifficultyResponse {
  return {
    rows,
    games_with_difficulty: rows.filter(r => r.difficulty_label).map(r => r.game_type),
    min_sessions: minSessions,
  } as unknown as DifficultyResponse;
}

describe('difficultyOutcomes', () => {
  it('shows what the timer closed beside what the players finished', () => {
    // The correction is the point. Conquest reads 99% complete with swept
    // sessions in and 44% with them out — putting the swept count in a footnote
    // leaves the corrected figure looking like an unexplained drop.
    render(
      <DifficultyOutcomes
        data={response([row({
          game_type: 'conquest',
          sessions: 2347,
          completion_pct: 44.4,
          swept: 1283,
          sweeper_hours: 24,
          has_verdict: true,
          win_rate_pct: 19.6,
          verdict_coverage_pct: 44.4,
        })])}
        meta={META}
      />,
    );
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[2]).toHaveTextContent('44.4%');
    expect(cells[3]).toHaveTextContent('1,283');
    expect(cells[3]).toHaveTextContent('after 24h idle');
  });

  it('says a game has no verdict rather than reporting it as 0% won', () => {
    // 0% would rank a game with no result column as the hardest on the
    // platform, when the reason it has none is that it records no win.
    render(<DifficultyOutcomes data={response([row({ game_type: 'grid' })])} meta={META} />);

    expect(screen.getByText('no verdict')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('states how much of the data a win rate is drawn from', () => {
    // Four games write `result` for multiplayer rounds only. 3.6% coverage
    // printed beside 100% coverage invites a comparison that is not one.
    render(
      <DifficultyOutcomes
        data={response([row({
          game_type: 'missing_team',
          has_verdict: true,
          win_rate_pct: 35.9,
          verdict_coverage_pct: 3.6,
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('from 3.6% of sessions')).toBeInTheDocument();
  });

  it('withholds a bucket rate below the threshold but keeps its count', () => {
    // 11 EXTREME sessions: one moves completion nine points. "Nobody plays
    // EXTREME" is itself the answer to whether its difficulty needs tuning.
    render(
      <DifficultyOutcomes
        data={response([row({
          game_type: 'missing_team',
          difficulty_label: 'Difficulty',
          difficulty: [bucket({ value: 'EXTREME', sessions: 11, below_threshold: true, completion_pct: null })],
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('— 11 sessions, needs 30')).toBeInTheDocument();
  });

  it('keeps unrecorded difficulty as a row rather than dropping it', () => {
    // On Missing Team it is the biggest bucket there is. Dropped, the tiers
    // would look like the whole game.
    render(
      <DifficultyOutcomes
        data={response([row({
          game_type: 'missing_team',
          difficulty_label: 'Difficulty',
          difficulty: [bucket({ value: null, sessions: 905 }), bucket({ value: 'EASY', sessions: 476 })],
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('Not recorded')).toBeInTheDocument();
    expect(screen.getByText('905')).toBeInTheDocument();
  });

  it('flags a value the declared scale does not know about', () => {
    render(
      <DifficultyOutcomes
        data={response([row({
          game_type: 'missing_team',
          difficulty_label: 'Difficulty',
          difficulty: [bucket({ value: 'NIGHTMARE', off_scale: true })],
        })])}
        meta={META}
      />,
    );

    expect(screen.getByText('off scale')).toBeInTheDocument();
  });

  it('names the axis the game actually records', () => {
    // Grid HAS a column called difficulty and it is null on every session. The
    // header says "Grid size" because that is what is on the axis.
    render(
      <DifficultyOutcomes
        data={response([row({
          game_type: 'grid',
          difficulty_label: 'Grid size',
          difficulty: [bucket({ value: '3x3' })],
        })])}
        meta={META}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Grid size' })).toBeInTheDocument();
    expect(screen.getByText('by grid size')).toBeInTheDocument();
  });
});

function attemptRow(over: Partial<AttemptRow> & Pick<AttemptRow, 'game_type'>): AttemptRow {
  return {
    sessions: 1000,
    allowance_scope: 'session',
    allowances: [5],
    over_allowance: 127,
    over_allowance_pct: 12.7,
    bands: [
      { from_attempts: 0, to_attempts: 0, count: 276, pct: 27.6 },
      { from_attempts: 1, to_attempts: 2, count: 201, pct: 20.1 },
      { from_attempts: 3, to_attempts: 5, count: 396, pct: 39.6 },
      { from_attempts: 6, to_attempts: 10, count: 127, pct: 12.7 },
      { from_attempts: 11, to_attempts: null, count: 0, pct: 0 },
    ],
    ...over,
  };
}

describe('attemptSpread', () => {
  it('reports overruns where the allowance is per session', () => {
    render(
      <AttemptSpread
        data={{ rows: [attemptRow({ game_type: 'tenable' })] } as unknown as AttemptsResponse}
        meta={META}
      />,
    );

    expect(screen.getByText('12.7%')).toBeInTheDocument();
    expect(screen.getByText('per session')).toBeInTheDocument();
  });

  it('refuses to compare a per-step allowance with a session total', () => {
    // Missing11 allows 7 per lineup SLOT. A session's 38 guesses read against 7
    // would report every player as having overrun fourfold.
    render(
      <AttemptSpread
        data={{
          rows: [attemptRow({
            game_type: 'missing11',
            allowance_scope: 'step',
            allowances: [7],
            over_allowance: null,
            over_allowance_pct: null,
          })],
        } as unknown as AttemptsResponse}
        meta={META}
      />,
    );

    expect(screen.getByText('n/a')).toBeInTheDocument();
    expect(screen.getByText('per step')).toBeInTheDocument();
  });

  it('labels the open-ended top band as open-ended', () => {
    // "11–null" or a silent ceiling both read as a bound the data does not have.
    render(
      <AttemptSpread
        data={{ rows: [attemptRow({ game_type: 'tenable' })] } as unknown as AttemptsResponse}
        meta={META}
      />,
    );

    expect(screen.getByText(/11\+/)).toBeInTheDocument();
  });
});
