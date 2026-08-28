import type {
  GridAnalyticsResponse,
  GridCriterionRow,
  GridFootballerRow,
  GridModeRow,
} from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GridCriteria, GridCriterionTypes, GridTeams } from '@/components/analytics/panels/GridContent';
import { GridModes } from '@/components/analytics/panels/GridModes';
import { GridPool } from '@/components/analytics/panels/GridPool';

function mode(over: Partial<GridModeRow>): GridModeRow {
  return {
    difficulty: 'HARD',
    footballer_status: 'BOTH',
    grid_size: '4x4',
    sessions: 3758,
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
            mode({ difficulty: 'EASY', footballer_status: 'NOT_ACTIVE', grid_size: '3x3', sessions: 12 }),
          ],
        })}
      />,
    );

    // The wire vocabulary never leaks: EASY reads Standard, NOT_ACTIVE reads
    // Retired, BOTH adds nothing.
    expect(screen.getByText('Hard · 4x4')).toBeInTheDocument();
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
    expect(within(row).getByText('NATIONALITY')).toBeInTheDocument();
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
    const row = screen.getByText('PLAYED_FOR_CLUB').closest('tr')!;

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
    expect(screen.queryByText('PLAYED_FOR_CLUB')).not.toBeInTheDocument();
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
