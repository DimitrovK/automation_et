import type { NationGapsResponse } from '@/types/reports';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NationDepth } from '@/components/analytics/panels/NationDepth';
import { NationGaps } from '@/components/analytics/panels/NationGaps';

function data(over: Partial<NationGapsResponse> = {}): NationGapsResponse {
  return {
    nations_by_footballers: {
      items: [
        { id: 1, name: 'Italy', short: 'ITA', flag: '/media/nation_flags/italy-flag.png', footballers: 812 },
        { id: 2, name: 'Spain', short: 'ESP', flag: null, footballers: 640 },
      ],
      total: 178,
      limit: 10,
      page: 1,
      pages: 18,
    },
    nations_without_footballers: {
      items: [{ id: 40, name: 'Tuvalu', short: 'TUV', flag: '/media/nation_flags/tuvalu-flag.png' }],
      total: 55,
      limit: 10,
    },
    nations_without_teams: {
      items: [{ id: 41, name: 'Nauru', short: 'NRU', flag: null }],
      total: 61,
      limit: 10,
    },
    ordering: 'footballers',
    ...over,
  } as NationGapsResponse;
}

const depthProps = {
  search: '',
  onSearchChange: vi.fn(),
  ordering: 'footballers' as const,
  onSort: vi.fn(),
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe('nationDepth', () => {
  it('numbers rows by their place in the whole table, not in the page', () => {
    render(
      <NationDepth
        data={data({ nations_by_footballers: { ...data().nations_by_footballers, page: 3, limit: 10 } })}
        {...depthProps}
      />,
    );

    const rows = screen.getAllByRole('row').slice(1);

    expect(within(rows[0]).getByText('21')).toBeInTheDocument();
  });

  it('sends every nation to its footballers, by id', () => {
    // The id, not the short code: `/data/footballers/` filters `nation`
    // through a ModelChoiceFilter, so a code is rejected outright with
    // "Select a valid choice" rendered as a page-level error.
    render(<NationDepth data={data()} {...depthProps} />);

    expect(screen.getByRole('link', { name: /Italy/ })).toHaveAttribute(
      'href',
      '/footballer-management?nation=1',
    );
  });

  it('marks the sorted column and sorts through the server', () => {
    const onSort = vi.fn();
    render(<NationDepth data={data()} {...depthProps} onSort={onSort} />);

    const header = screen.getByRole('columnheader', { name: /Footballers/ });

    expect(header).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(within(header).getByRole('button'));

    expect(onSort).toHaveBeenCalledWith('footballers');
  });

  it('pages rather than expanding once', () => {
    render(<NationDepth data={data()} {...depthProps} />);

    expect(screen.getByText('Showing 2 of 178 results')).toBeInTheDocument();
    expect(screen.getByLabelText('Rows per page')).toBeInTheDocument();
  });

  it('names what the filter box filters', () => {
    // The box sits on the card rather than in a page filter bar, so its
    // accessible name is the only thing saying WHICH of the three lists it
    // narrows. A placeholder cannot do that job — it disappears on the first
    // keystroke.
    render(<NationDepth data={data()} {...depthProps} />);

    expect(screen.getByLabelText('Filter nations in this table')).toBeInTheDocument();
  });

  it('debounces the filter instead of firing a request per keystroke', async () => {
    vi.useFakeTimers();
    try {
      const onSearchChange = vi.fn();
      render(<NationDepth data={data()} {...depthProps} onSearchChange={onSearchChange} />);

      const box = screen.getByLabelText('Filter nations in this table');

      fireEvent.change(box, { target: { value: 'i' } });
      fireEvent.change(box, { target: { value: 'it' } });
      fireEvent.change(box, { target: { value: 'ita' } });

      // Nothing yet: "ita" as three requests can also answer out of order.
      expect(onSearchChange).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onSearchChange).toHaveBeenCalledTimes(1);
      expect(onSearchChange).toHaveBeenCalledWith('ita');
    } finally {
      vi.useRealTimers();
    }
  });

  it('tells an empty search apart from an empty catalogue', () => {
    // "No footballers are assigned to a nation yet" under a filter that matched
    // nothing reads as the data having vanished.
    const empty = data({
      nations_by_footballers: { ...data().nations_by_footballers, items: [], total: 0 },
    });

    const { rerender } = render(<NationDepth data={empty} {...depthProps} search="zz" />);

    expect(screen.getByText('No nation matches "zz".')).toBeInTheDocument();

    rerender(<NationDepth data={empty} {...depthProps} search="" />);

    expect(screen.getByText('No footballers are assigned to a nation yet.')).toBeInTheDocument();
  });
});

describe('nationGaps', () => {
  it('keeps the two gaps apart, because they are different jobs', () => {
    // A nation with no footballers cannot appear in anything nation-scoped; a
    // nation with no teams cannot appear in club-based content. They overlap
    // heavily but fixing one does not fix the other.
    render(<NationGaps data={data()} />);

    expect(screen.getByText('Nations with no footballers')).toBeInTheDocument();
    expect(screen.getByText('Nations with no teams')).toBeInTheDocument();
    expect(screen.getByText('Tuvalu')).toBeInTheDocument();
    expect(screen.getByText('Nauru')).toBeInTheDocument();
  });

  it('sends a footballer-less nation to the screen that fills it', () => {
    render(<NationGaps data={data()} />);

    expect(screen.getByRole('link', { name: /Tuvalu/ })).toHaveAttribute(
      'href',
      '/footballer-management?nation=40',
    );
  });

  it('sends a team-less nation to the admin, since nothing in here adds a team', () => {
    // The one external link on the page. There is no team-management screen in
    // this app, so the alternative is a chip that names a job with nowhere to
    // do it.
    render(<NationGaps data={data()} />);

    const link = screen.getByRole('link', { name: /Nauru/ });

    expect(link).toHaveAttribute('href', expect.stringContaining('FootballData/team/add/'));
    expect(link).toHaveAttribute('href', expect.stringContaining('nation=41'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('reports the real gaps, not the chips shown', () => {
    render(<NationGaps data={data()} />);

    expect(screen.getByText('Showing 1 of 55')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 61')).toBeInTheDocument();
  });

  it('leads with the count, because the count is the signal', () => {
    // The list is a sample — rows 40 to 55 are identical in kind — so the
    // number is the thing to read first, not 12px grey text under the chips.
    render(<NationGaps data={data()} />);

    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('61')).toBeInTheDocument();
  });

  it('reads zero as good news rather than as a blank panel', () => {
    render(
      <NationGaps
        data={data({
          nations_without_footballers: { items: [], total: 0, limit: 10 },
          nations_without_teams: { items: [], total: 0, limit: 10 },
        })}
      />,
    );

    expect(screen.getByText('Every active nation has at least one footballer.')).toBeInTheDocument();
    expect(screen.getByText('Every active nation has at least one team.')).toBeInTheDocument();
    // No "Showing 0 of 0" and no expand button to press.
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument();
  });

  it('says the admin link leaves the app', () => {
    // The one link on the page that opens a new tab. Unannounced, it reads as
    // the page having jumped somewhere on its own.
    render(<NationGaps data={data()} />);

    expect(screen.getByRole('link', { name: /opens the Django admin in a new tab/ })).toHaveAttribute(
      'target',
      '_blank',
    );
  });
});
