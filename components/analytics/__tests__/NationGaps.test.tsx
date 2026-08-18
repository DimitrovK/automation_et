import type { NationGapsResponse } from '@/types/reports';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('sends every nation to its footballers', () => {
    // The short code, not the id: `/data/footballers/` filters by name,
    // nationality or short code, and the id is not one of them.
    render(<NationDepth data={data()} {...depthProps} />);

    expect(screen.getByRole('link', { name: /Italy/ })).toHaveAttribute(
      'href',
      '/footballer-management?nation=ITA',
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
      '/footballer-management?nation=TUV',
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
});
