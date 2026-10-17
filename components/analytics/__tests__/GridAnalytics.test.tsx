import type {
  GridAnalyticsResponse,
  GridCriterionRow,
  GridFootballerRow,
  GridModeRow,
} from '@/types/reports';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GridBreakdown } from '@/components/analytics/grid/GridBreakdown';
import { GridCriteria } from '@/components/analytics/panels/GridContent';
import { GridPool } from '@/components/analytics/panels/GridPool';

function mode(over: Partial<GridModeRow>): GridModeRow {
  return {
    difficulty: 'HARD',
    footballer_status: 'BOTH',
    grid_size: '4x4',
    sessions: 3758,
    daily_sessions: 1200,
    daily_pct: 31.9,
    finished: 3161,
    completion_pct: 84.1,
    perfect: 77,
    perfect_pct: 2.4,
    avg_score: 11.6,
    wrong_guesses: 49844,
    ...over,
  };
}

function criterion(over: Partial<GridCriterionRow> & Pick<GridCriterionRow, 'label'>): GridCriterionRow {
  return {
    criterion_type: 'NATIONALITY',
    sessions: 55,
    attempts: 171,
    wrong: 158,
    wrong_pct: 92.4,
    ...over,
  };
}

function footballer(over: Partial<GridFootballerRow> & Pick<GridFootballerRow, 'footballer_id' | 'name'>): GridFootballerRow {
  return {
    shown: 40,
    placed: 10,
    wrong: 25,
    skipped: 5,
    bait_guesses: 7,
    wrong_pct: 62.5,
    skip_pct: 12.5,
    ...over,
  };
}

function response(over: Partial<GridAnalyticsResponse> = {}): GridAnalyticsResponse {
  return {
    start: '2026-06-01',
    end: '2026-08-28',
    days: 89,
    window: 90,
    game_type: null,
    include_bots: false,
    modes: [],
    footballers: [],
    criteria: [],
    criterion_types: [],
    teams: [],
    assists: {
      summary: {
        et_used: 0,
        et_wasted: 0,
        et_hits_earned: 0,
        sessions_using_et: 0,
        avg_et_position_pct: null,
        deliberate_skips: 0,
        distractor_skips: 0,
        penalty_skips: 0,
        sessions_skipping: 0,
      },
      et_footballers: [],
      skip_footballers: [],
      et_criteria: [],
    },
    pools: [],
    breakdown: { group_by: 'board', rows: [] },
    population: { play_type: 'all', board: null, variation_mode: null, reveal: null },
    ...over,
  };
}

// Every card folds; these tests are about what an open card shows.
beforeEach(() => {
  for (const id of ['grid-breakdown', 'grid-criteria', 'grid-footballers', 'grid-help', 'grid-stock']) {
    localStorage.setItem(`panel-open:${id}`, '1');
  }
});

describe('GridBreakdown', () => {
  const noop = () => {};

  it('names each mode in reader words, with its share of sessions', () => {
    render(
      <GridBreakdown
        groupBy="mode"
        onGroupByChange={noop}
        data={response({
          modes: [
            mode({}),
            mode({ difficulty: 'EASY', footballer_status: 'NOT_ACTIVE', grid_size: '3x3', sessions: 12, daily_sessions: 0, daily_pct: 0.0 }),
            mode({ difficulty: null, sessions: 1 }),
          ],
        })}
      />,
    );

    const table = screen.getAllByText('Hard · 4x4')[0]!.closest('table')!;

    expect(within(table).getAllByRole('columnheader').map(th => th.textContent).slice(0, 3)).toEqual(['Mode', 'Sessions', 'Daily']);
    expect(screen.getByText('Standard · Retired · 3x3')).toBeInTheDocument();
    // A null difficulty is a data bug: the row must show, not vanish.
    expect(screen.getByText('Unclassified · 4x4')).toBeInTheDocument();
    expect(screen.queryByText(/NOT_ACTIVE|BOTH/)).not.toBeInTheDocument();
  });

  it('groups by any split from the breakdown rows, and flags a weak row in the folded headline', () => {
    const { rerender } = render(
      <GridBreakdown
        groupBy="board"
        onGroupByChange={noop}
        data={response({
          breakdown: {
            group_by: 'board',
            rows: [
              { ...mode({}), key: 'global', label: 'Global' },
              { ...mode({ sessions: 80, completion_pct: 41.0 }), key: '7', label: 'Bulgaria' },
            ],
          },
        })}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Board' })).toBeInTheDocument();
    expect(screen.getByText('Bulgaria completes at 41%')).toBeInTheDocument();

    // A response for another grouping is never drawn under this one's heading.
    rerender(<GridBreakdown groupBy="reveal" onGroupByChange={noop} data={response()} />);

    expect(screen.getByText('No Grid session in this window.')).toBeInTheDocument();
  });

  it('narrows the page to a mode on click, and clears it on a second click', () => {
    const onSelectMode = vi.fn();
    render(<GridBreakdown groupBy="mode" onGroupByChange={noop} data={response({ modes: [mode({})] })} onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hard · 4x4' }));

    expect(onSelectMode).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 'HARD', grid_size: '4x4' }));
  });
});

describe('GridCriteria', () => {
  it('renders the worklist with wrong rates', () => {
    render(
      <GridCriteria
        data={response({ criteria: [criterion({ label: 'ABW' })] })}
      />,
    );
    const row = screen.getByText('ABW').closest('tr')!;

    expect(within(row).getByText('92.4%')).toBeInTheDocument();
    // Human label in the cell, wire value in the tooltip.
    expect(within(row).getByText('Nationality')).toHaveAttribute('title', 'NATIONALITY');
  });
});

describe('GridCriteria tabs', () => {
  it('shows types and clubs as tabs of the same card', () => {
    render(
      <GridCriteria
        data={response({
          criterion_types: [{ criterion_type: 'PLAYED_FOR_CLUB', identities: 287, attempts: 66330, wrong: 42711, wrong_pct: 64.4 }],
          teams: [criterion({ label: 'Man Utd', criterion_type: 'PLAYED_FOR_CLUB', wrong_pct: 33.0 })],
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'By type' }));
    const row = screen.getByText('Played for club').closest('tr')!;

    expect(within(row).getByText('66,330')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clubs' }));

    expect(screen.getByText('Man Utd')).toBeInTheDocument();
    // Every club row is PLAYED_FOR_CLUB: a type column would be noise.
    expect(screen.queryByText('Played for club')).not.toBeInTheDocument();
  });
});

describe('GridPool', () => {
  it('renders the outcome split for each footballer', () => {
    render(
      <GridPool
        data={response({
          footballers: [footballer({ footballer_id: 1, name: 'Ray Stewart' })],
        })}
      />,
    );
    const row = screen.getByText('Ray Stewart').closest('tr')!;

    expect(within(row).getByText('62.5%')).toBeInTheDocument();
    expect(within(row).getByText('12.5%')).toBeInTheDocument();
    expect(within(row).getByText('7')).toBeInTheDocument();
  });

  it('shows the threshold hint when nothing qualifies', () => {
    render(<GridPool data={response()} />);

    expect(screen.getByText(/25 decided appearances/)).toBeInTheDocument();
  });
});

describe('GridAssists', () => {
  const assists = {
    summary: {
      et_used: 4070,
      et_wasted: 2027,
      et_hits_earned: 5165,
      sessions_using_et: 2771,
      avg_et_position_pct: 28.0,
      deliberate_skips: 59217,
      distractor_skips: 22887,
      penalty_skips: 31526,
      sessions_skipping: 4966,
    },
    et_footballers: [{ footballer_id: 1, name: 'Luis Hernandez', et_uses: 11, wasted: 6 }],
    skip_footballers: [{ footballer_id: 2, name: 'Carlos Ruiz', skips: 81 }],
    et_criteria: [{ criterion_type: 'CLUB_GOALS_GTE', label: '150+ Club Goals', placements: 43 }],
  };

  it('splits the summary the way the numbers mean', async () => {
    const { GridAssists } = await import('@/components/analytics/panels/GridAssists');
    render(<GridAssists data={{ ...response(), assists }} />);

    // Wasted rides with its share; placeable skips are the ranked number,
    // distractors and penalties are context.
    expect(screen.getByText('2,027 (50%)')).toBeInTheDocument();
    expect(screen.getByText('36,330')).toBeInTheDocument();
    expect(screen.getByText('28% into the run')).toBeInTheDocument();
  });

  it('renders the three worklists', async () => {
    const { GridAssists } = await import('@/components/analytics/panels/GridAssists');
    render(<GridAssists data={{ ...response(), assists }} />);

    expect(screen.getByText('Luis Hernandez')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.getByText('150+ Club Goals')).toBeInTheDocument();
  });

  it('shows the empty state when nothing was spent', async () => {
    const { GridAssists } = await import('@/components/analytics/panels/GridAssists');
    render(
      <GridAssists
        data={{
          ...response(),
          assists: {
            summary: {
              et_used: 0,
              et_wasted: 0,
              et_hits_earned: 0,
              sessions_using_et: 0,
              avg_et_position_pct: null,
              deliberate_skips: 0,
              distractor_skips: 0,
              penalty_skips: 0,
              sessions_skipping: 0,
            },
            et_footballers: [],
            skip_footballers: [],
            et_criteria: [],
          },
        }}
      />,
    );

    expect(screen.getByText('No Extra Time or skip in this window.')).toBeInTheDocument();
  });
});

describe('GridPools', () => {
  const pool = {
    board: 'global',
    board_label: 'Global',
    variation_mode: null,
    variation_mode_label: null,
    grid_size: '3x3',
    difficulty: 'HARD',
    footballer_status: 'NOT_ACTIVE',
    admin_only: false,
    active: 0,
    retired: 3,
    target_pool_size: 2,
    max_pool_size: 6,
    auto_size_enabled: true,
    exhausted_count: 5,
    last_exhausted_at: '2026-08-28T10:00:00+00:00',
  };

  it('labels the bucket and flags under-floor stock', async () => {
    const { GridPools } = await import('@/components/analytics/panels/GridPools');
    render(<GridPools data={{ ...response(), pools: [pool] }} />);

    expect(screen.getByText('Hard · Retired · 3x3')).toBeInTheDocument();

    const stock = screen.getByText('0 / 2');

    expect(stock).toHaveClass('text-amber-600');
    expect(screen.getByText('last 2026-08-28')).toBeInTheDocument();
    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('marks admin test pools and pinned sizing', async () => {
    const { GridPools } = await import('@/components/analytics/panels/GridPools');
    render(
      <GridPools
        data={{
          ...response(),
          pools: [{
            ...pool,
            admin_only: true,
            auto_size_enabled: false,
            active: 4,
            last_exhausted_at: null,
          }],
        }}
      />,
    );

    expect(screen.getByText('test pool')).toBeInTheDocument();
    expect(screen.getByText('pinned')).toBeInTheDocument();
    // At/above floor: no amber.
    expect(screen.getByText('4 / 2')).not.toHaveClass('text-amber-600');
  });
});

describe('worklist footballer links', () => {
  it('every footballer name links to the editor', async () => {
    const { GridPool } = await import('@/components/analytics/panels/GridPool');
    const { GridAssists } = await import('@/components/analytics/panels/GridAssists');
    render(<GridPool data={response({ footballers: [footballer({ footballer_id: 7, name: 'Ray Stewart' })] })} />);
    render(
      <GridAssists
        data={{
          ...response(),
          assists: {
            ...response().assists,
            summary: { ...response().assists.summary, et_used: 1 },
            et_footballers: [{ footballer_id: 8, name: 'Luis Hernandez', et_uses: 3, wasted: 1 }],
            skip_footballers: [{ footballer_id: 9, name: 'Carlos Ruiz', skips: 4 }],
          },
        }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Ray Stewart' })).toHaveAttribute('href', '/footballer-management?edit=7');
    expect(screen.getByRole('link', { name: 'Luis Hernandez' })).toHaveAttribute('href', '/footballer-management?edit=8');
    expect(screen.getByRole('link', { name: 'Carlos Ruiz' })).toHaveAttribute('href', '/footballer-management?edit=9');
  });
});
