import type { TeamGapsResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SquadDepth } from '@/components/analytics/panels/SquadDepth';
import { TeamGaps } from '@/components/analytics/panels/TeamGaps';

function data(over: Partial<TeamGapsResponse> = {}): TeamGapsResponse {
  return {
    teams_by_players: {
      items: [
        { name: 'Inter', nation: 'Italy', players: 352 },
        { name: 'Milan', nation: 'Italy', players: 338 },
      ],
      total: 4402,
      limit: 10,
    },
    teams_without_footballers: {
      items: [{ name: 'Empty FC', nation: null }],
      total: 53,
      limit: 10,
    },
    review_queue: {},
    ...over,
  } as unknown as TeamGapsResponse;
}

const props = { search: '', onSearchChange: vi.fn() };

describe('squadDepth', () => {
  it('carries its own filter, on the card it narrows', () => {
    // In the page filter bar it had nothing to say which of the two tables it
    // applied to — and it applies to this one only.
    render(<SquadDepth data={data()} {...props} />);

    expect(screen.getByLabelText('Filter teams in this table')).toBeInTheDocument();
  });

  it('numbers the rows, so a position means something', () => {
    render(<SquadDepth data={data()} {...props} />);

    const items = screen.getAllByRole('listitem');

    expect(items[0]).toHaveTextContent('1');
    expect(items[0]).toHaveTextContent('Inter');
    expect(items[1]).toHaveTextContent('2');
  });

  it('names the nation, and says so when there is none', () => {
    render(<SquadDepth data={data()} {...props} />);

    // Both rows are Italian, so there are two.
    expect(screen.getAllByText('Italy')).toHaveLength(2);
  });

  it('says which search found nothing', () => {
    render(
      <SquadDepth
        data={data({ teams_by_players: { items: [], total: 0, limit: 10 } })}
        search="zzz"
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByText('No team matches "zzz".')).toBeInTheDocument();
  });

  it('renders nothing before the backend ships the ranking', () => {
    const { container } = render(<SquadDepth data={data({ teams_by_players: undefined })} {...props} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('teamGaps', () => {
  it('lists empty teams as chips rather than a two-column table', () => {
    // Every entry is the same fact — an empty squad — so a table would spend two
    // columns repeating it.
    render(<TeamGaps data={data()} />);

    expect(screen.getByText('Empty FC')).toBeInTheDocument();
    expect(screen.getByText('No nation')).toBeInTheDocument();
  });

  it('reports the real gap, not the chips shown', () => {
    render(<TeamGaps data={data()} />);

    expect(screen.getByText('Showing 1 of 53')).toBeInTheDocument();
  });
});
