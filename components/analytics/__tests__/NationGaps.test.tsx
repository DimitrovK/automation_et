import type { NationGapsResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NationGaps } from '@/components/analytics/panels/NationGaps';
import { ReviewQueue } from '@/components/analytics/panels/ReviewQueue';

function data(): NationGapsResponse {
  return {
    nations_without_footballers: {
      items: [{ name: 'Afghanistan', short: 'AFG' }, { name: 'American Samoa', short: 'ASM' }],
      total: 101,
      limit: 10,
    },
    nations_without_teams: { items: [{ name: 'Aruba', short: 'ABW' }], total: 94, limit: 10 },
    nations_by_footballers: {
      items: [{ name: 'England', short: 'ENG', footballers: 467 }],
      total: 132,
      limit: 10,
    },
  };
}

describe('nationGaps', () => {
  it('describes the gap by its real size, not by the sample', () => {
    render(<NationGaps data={data()} />);

    expect(screen.getByText('Showing 2 of 101')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 94')).toBeInTheDocument();
  });

  it('keeps "no footballers" and "no teams" as separate jobs', () => {
    // They overlap heavily but are not the same fix: a nation can have players
    // and no clubs, and club-based content needs the clubs.
    render(<NationGaps data={data()} />);

    expect(screen.getByText('Nations with no footballers')).toBeInTheDocument();
    expect(screen.getByText('Nations with no teams')).toBeInTheDocument();
  });

  it('shows the depth ranking with its counts', () => {
    render(<NationGaps data={data()} />);

    expect(screen.getByText('England')).toBeInTheDocument();
    expect(screen.getByText('467')).toBeInTheDocument();
  });
});

describe('reviewQueue', () => {
  it('renders nothing when nothing is pending', () => {
    // Not every deployment uses the review states. A permanent row of zeros
    // would be a workflow the page invented.
    const { container } = render(<ReviewQueue counts={{}} subject="teams" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the backend predates the field', () => {
    const { container } = render(<ReviewQueue counts={undefined} subject="teams" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('names the status in words when something is waiting', () => {
    render(<ReviewQueue counts={{ AWAITING_REVISION: 12 }} subject="footballers" />);

    expect(screen.getByText('Awaiting revision')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
