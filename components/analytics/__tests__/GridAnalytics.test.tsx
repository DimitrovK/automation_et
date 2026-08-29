import type {
  GridAnalyticsResponse,
  GridCriterionRow,
  GridFootballerRow,
  GridModeRow,
} from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCriteria, GridCriterionTypes, GridTeams } from '@/components/analytics/panels/GridContent';
import { GridModes } from '@/components/analytics/panels/GridModes';
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
    variations: [],
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
    ...over,
  };
}

describe('GridModes', () => {
  it('composes the mode label from difficulty, roster and size', () => {
    render(
      <GridModes
        data={response({
          modes: [
            mode({}),
            mode({ difficulty: 'EASY', footballer_status: 'NOT_ACTIVE', grid_size: '3x3', sessions: 12, daily_sessions: 0, daily_pct: 0.0 }),
          ],
        })}
      />,
    );

    // The wire vocabulary never leaks: EASY reads Standard, NOT_ACTIVE reads
    // Retired, BOTH adds nothing.
    expect(screen.getByText('Hard · 4x4')).toBeInTheDocument();

    // Header and cells stay aligned: the Daily column sits between the
    // mode label and Sessions in BOTH.
    const table = screen.getByText('Hard · 4x4').closest('table')!;
    const headers = within(table).getAllByRole('columnheader').map(th => th.textContent);

    expect(headers.slice(0, 3)).toEqual(['Mode', 'Daily', 'Sessions']);
    expect(within(table).getByText('31.9%')).toBeInTheDocument();
    expect(screen.getByText('Standard · Retired · 3x3')).toBeInTheDocument();
    expect(screen.queryByText(/NOT_ACTIVE|BOTH/)).not.toBeInTheDocument();
  });

  it('never hides an unclassified bucket', () => {
    // difficulty null is a data bug when it appears — the row must render,
    // not vanish, or the bug stays invisible.
    render(<GridModes data={response({ modes: [mode({ difficulty: null })] })} />);

    expect(screen.getByText('Unclassified · 4x4')).toBeInTheDocument();
  });

  it('renders variations with the same outcome columns', () => {
    render(
      <GridModes
        data={response({
          modes: [mode({})],
          variations: [{
            variation_id: null,
            variation: 'Default',
            sessions: 6888,
            finished: 5616,
            completion_pct: 81.5,
            perfect: 232,
            perfect_pct: 4.1,
            avg_score: 12.6,
          }],
        })}
      />,
    );
    const row = screen.getByText('Default').closest('tr')!;

    expect(within(row).getByText('81.5%')).toBeInTheDocument();
  });

  it('shows an empty state when nothing was played', () => {
    render(<GridModes data={response()} />);

    expect(screen.getByText('No Grid session in this window.')).toBeInTheDocument();
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

describe('GridCriterionTypes', () => {
  it('states reach via attempts and identities', () => {
    render(
      <GridCriterionTypes
        data={response({
          criterion_types: [{
            criterion_type: 'PLAYED_FOR_CLUB',
            identities: 287,
            attempts: 66330,
            wrong: 42711,
            wrong_pct: 64.4,
          }],
        })}
      />,
    );
    const row = screen.getByText('Played for club').closest('tr')!;

    expect(within(row).getByText('287')).toBeInTheDocument();
    expect(within(row).getByText('66,330')).toBeInTheDocument();
  });
});

describe('GridTeams', () => {
  it('renders clubs without the redundant type column', () => {
    render(
      <GridTeams
        data={response({
          teams: [criterion({ label: 'Man Utd', criterion_type: 'PLAYED_FOR_CLUB', wrong_pct: 33.0 })],
        })}
      />,
    );

    expect(screen.getByText('Man Utd')).toBeInTheDocument();
    // Every row here is PLAYED_FOR_CLUB — a type column would be noise.
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

describe('GridPopularity', () => {
  it('renders both charts with accessible summaries, largest first', async () => {
    const { GridPopularity } = await import('@/components/analytics/panels/GridPopularity');
    render(
      <GridPopularity
        data={response({
          modes: [
            mode({ sessions: 10, difficulty: 'EASY', grid_size: '3x3' }),
            mode({ sessions: 3758 }),
          ],
          variations: [{
            variation_id: null,
            variation: 'Default',
            sessions: 3768,
            finished: 3000,
            completion_pct: 79.6,
            perfect: 100,
            perfect_pct: 3.3,
            avg_score: 12.0,
          }],
        })}
      />,
    );

    expect(screen.getByText('Modes people pick')).toBeInTheDocument();
    expect(screen.getByText('Variations people pick')).toBeInTheDocument();
    // The sr-only summary carries the ranked values — largest mode first.
    expect(screen.getByText(/Grid sessions by mode: Hard · 4x4 3758/)).toBeInTheDocument();
    expect(screen.getByText(/Grid sessions by variation: Default 3768/)).toBeInTheDocument();
  });

  it('shows an empty state when nothing was played', async () => {
    const { GridPopularity } = await import('@/components/analytics/panels/GridPopularity');
    render(<GridPopularity data={response()} />);

    expect(screen.getByText('No Grid session in this window.')).toBeInTheDocument();
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
    grid_size: '3x3',
    difficulty: 'HARD',
    footballer_status: 'NOT_ACTIVE',
    variation: null,
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
            variation: 'World Cup',
          }],
        }}
      />,
    );

    expect(screen.getByText('test pool')).toBeInTheDocument();
    expect(screen.getByText('pinned')).toBeInTheDocument();
    expect(screen.getByText('Hard · Retired · 3x3 · World Cup')).toBeInTheDocument();
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

describe('GridBehaviourStrip', () => {
  it('renders the four behaviour figures for grid and links to reports', async () => {
    const { GridBehaviourStrip } = await import('@/components/analytics/panels/GridBehaviourStrip');
    render(
      <GridBehaviourStrip
        data={{
          by_game: [{
            game_type: 'grid',
            completion_pct: 84.1,
            sessions_per_player: 3.2,
            share_pct: 18.5,
            repeat_players: 41,
            repeat_rate_pct: 22.4,
            previous_games_started: 100,
            trend_pct: 4.2,
            games_started: 120,
            games_finished: 101,
          }],
        } as never}
      />,
    );

    expect(screen.getByText('84.1%')).toBeInTheDocument();
    expect(screen.getByText('22.4%')).toBeInTheDocument();
    expect(screen.getByText('3.2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full behaviour view/i })).toHaveAttribute('href', '/reports/games/grid');
  });

  it('renders nothing without a grid row', async () => {
    const { GridBehaviourStrip } = await import('@/components/analytics/panels/GridBehaviourStrip');
    const { container } = render(<GridBehaviourStrip data={{ by_game: [] } as never} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('mode drill-down UI', () => {
  it('selecting a mode row reports the row, selecting it again clears', async () => {
    const { GridModes } = await import('@/components/analytics/panels/GridModes');
    const { modeKey } = await import('@/components/analytics/panels/grid-mode');
    const row = mode({});
    const onSelectMode = vi.fn();
    render(
      <GridModes
        data={response({ modes: [row] })}
        selectedKey={null}
        onSelectMode={onSelectMode}
      />,
    );

    const button = screen.getByRole('button', { name: 'Hard · 4x4' });

    expect(button).toHaveAttribute('aria-pressed', 'false');

    button.click();

    expect(onSelectMode).toHaveBeenCalledWith(row);

    // Re-render as selected: same click now clears.
    onSelectMode.mockClear();
    render(
      <GridModes
        data={response({ modes: [row] })}
        selectedKey={modeKey(row)}
        onSelectMode={onSelectMode}
      />,
    );
    const selected = screen.getAllByRole('button', { name: 'Hard · 4x4' })[1]!;

    expect(selected).toHaveAttribute('aria-pressed', 'true');

    selected.click();

    expect(onSelectMode).toHaveBeenCalledWith(null);
  });

  it('chips render the narrowing and clear on click', async () => {
    const { ActiveFilterChips } = await import('@/components/analytics/ActiveFilterChips');
    const clear = vi.fn();
    render(
      <ActiveFilterChips
        chips={[{ key: 'mode', kind: 'Mode', label: 'Hard · Retired · 3x3', onClear: clear }]}
      />,
    );

    expect(screen.getByText('Hard · Retired · 3x3')).toBeInTheDocument();

    screen.getByRole('button', { name: 'Clear mode filter' }).click();

    expect(clear).toHaveBeenCalled();
  });

  it('renders nothing with no chips', async () => {
    const { ActiveFilterChips } = await import('@/components/analytics/ActiveFilterChips');
    const { container } = render(<ActiveFilterChips chips={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
