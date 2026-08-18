import type { TeamGapsResponse } from '@/types/reports';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SquadDepth } from '@/components/analytics/panels/SquadDepth';
import { TeamGaps } from '@/components/analytics/panels/TeamGaps';

function data(over: Partial<TeamGapsResponse> = {}): TeamGapsResponse {
  return {
    teams_by_players: {
      items: [
        {
          id: 11,
          name: 'Inter',
          nation: 'Italy',
          flag: '/media/nation_flags/italy-flag.png',
          badge: '/media/team_badges/inter.svg',
          players: 352,
        },
        { id: 12, name: 'Milan', nation: 'Italy', flag: null, badge: null, players: 338 },
      ],
      total: 4402,
      limit: 10,
      page: 1,
      pages: 441,
    },
    teams_without_footballers: {
      items: [{ id: 90, name: 'Empty FC', nation: null, flag: null, badge: null }],
      total: 53,
      limit: 10,
    },
    review_queue: {},
    ordering: 'players',
    ...over,
  } as TeamGapsResponse;
}

const props = {
  search: '',
  onSearchChange: vi.fn(),
  ordering: 'players' as const,
  onSort: vi.fn(),
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe('squadDepth', () => {
  it('carries its own filter, on the card it narrows', () => {
    // In the page filter bar it had nothing to say which of the two tables it
    // applied to — and it applies to this one only.
    render(<SquadDepth data={data()} {...props} />);

    expect(screen.getByLabelText('Filter teams in this table')).toBeInTheDocument();
  });

  it('numbers rows by their place in the whole table, not in the page', () => {
    // Row one of page five is row 41. Numbering from one on every page would
    // say the opposite of what a ranked table is for.
    render(
      <SquadDepth
        data={data({
          teams_by_players: { ...data().teams_by_players!, page: 5, limit: 10 },
        })}
        {...props}
      />,
    );

    const rows = screen.getAllByRole('row').slice(1); // drop the header row

    expect(within(rows[0]).getByText('41')).toBeInTheDocument();
    expect(within(rows[1]).getByText('42')).toBeInTheDocument();
  });

  it('shows the squad size as the figure, with no bar', () => {
    // The bar compared ten rows against the biggest of the ten. Across 441
    // pages there is no "the biggest on screen" worth comparing against, and
    // the count is the answer anyway.
    render(<SquadDepth data={data()} {...props} />);

    expect(screen.getByText('352')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('sends every row to the squad behind it', () => {
    render(<SquadDepth data={data()} {...props} />);

    expect(screen.getByRole('link', { name: /Inter/ })).toHaveAttribute(
      'href',
      '/team-players?teamId=11',
    );
  });

  it('marks the sorted column and sorts through the server', () => {
    // Sorting the fetched page in the browser would order ten rows out of
    // 4,402 and read as broken the moment there is a page two.
    const onSort = vi.fn();
    render(<SquadDepth data={data()} {...props} onSort={onSort} />);

    const header = screen.getByRole('columnheader', { name: /Players/ });

    expect(header).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(within(header).getByRole('button'));

    expect(onSort).toHaveBeenCalledWith('players');
  });

  it('marks the name column when that is what the server sorted by', () => {
    render(<SquadDepth data={data()} {...props} ordering="name" />);

    expect(screen.getByRole('columnheader', { name: /Team/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: /Players/ })).not.toHaveAttribute('aria-sort');
  });

  it('offers the page sizes the endpoint will actually serve', () => {
    // 100 is MAX_LIST_LIMIT server-side; anything larger comes back clamped,
    // so a bigger option would be a control that lies about what it did.
    render(<SquadDepth data={data()} {...props} />);

    expect(screen.getByLabelText('Rows per page')).toBeInTheDocument();
  });

  it('pages through the whole table rather than expanding once', () => {
    render(<SquadDepth data={data()} {...props} />);

    expect(screen.getByText('Showing 2 of 4402 results')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show 90 more/ })).not.toBeInTheDocument();
  });

  it('says which search found nothing', () => {
    render(
      <SquadDepth
        data={data({
          teams_by_players: { items: [], total: 0, limit: 10, page: 1, pages: 1 },
        })}
        {...props}
        search="zzz"
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

  it('makes an empty team one click from the screen that fills it', () => {
    render(<TeamGaps data={data()} />);

    expect(screen.getByRole('link', { name: /Empty FC/ })).toHaveAttribute(
      'href',
      '/team-players?teamId=90',
    );
  });

  it('still lists a team the API has not given an id yet', () => {
    // The ids arrive in a later backend deploy than this page. A chip with no
    // id is a chip you cannot click, not a chip that disappears.
    render(
      <TeamGaps
        data={data({
          teams_without_footballers: {
            items: [{ name: 'Idless FC', nation: 'Spain' }],
            total: 1,
            limit: 10,
          },
        })}
      />,
    );

    expect(screen.getByText('Idless FC')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('reports the real gap, not the chips shown', () => {
    render(<TeamGaps data={data()} />);

    expect(screen.getByText('Showing 1 of 53')).toBeInTheDocument();
  });
});
