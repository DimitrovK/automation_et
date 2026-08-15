import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Distribution } from '@/components/reports/primitives/Distribution';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';
import { SmallSampleNotice } from '@/components/reports/primitives/SmallSampleNotice';

const BANDS = [
  { label: 'under 1h', count: 10, pct: 10 },
  { label: '1h–1d', count: 30, pct: 30 },
  { label: 'over 1d', count: 60, pct: 60 },
];

describe('distribution', () => {
  it('shows every band with its count and share', () => {
    render(<Distribution bands={BANDS} />);

    expect(screen.getByText(/under 1h/)).toBeInTheDocument();
    expect(screen.getByText(/over 1d/)).toBeInTheDocument();
  });

  it('sizes bars from the counts, not the rounded shares', () => {
    // Rounding each band on its own is right for the LABEL and wrong for the
    // geometry: three bands at 33.3% leave the bar 0.1% short, and the gap is
    // visible. Widths come from the raw counts so they always fill it.
    const { container } = render(
      <Distribution bands={[
        { label: 'a', count: 1, pct: 33.3 },
        { label: 'b', count: 1, pct: 33.3 },
        { label: 'c', count: 1, pct: 33.3 },
      ]}
      />,
    );
    const widths = [...container.querySelectorAll('span[style*="width"]')]
      .map(el => Number.parseFloat((el as HTMLElement).style.width));

    expect(widths.reduce((sum, w) => sum + w, 0)).toBeCloseTo(100);
  });

  it('draws nothing rather than a row of zeroes when there is no data', () => {
    // An empty distribution has no shape. Drawing one implies a measurement
    // that was never taken.
    render(<Distribution bands={BANDS.map(b => ({ ...b, count: 0 }))} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('smallSampleNotice', () => {
  it('states the count and the bar, not just "too few"', () => {
    render(<SmallSampleNotice have={3} need={20} />);

    expect(screen.getByText('— 3 players, needs 20')).toBeInTheDocument();
  });

  it('explains why in the title, singularised', () => {
    render(<SmallSampleNotice have={3} need={20} />);

    expect(screen.getByTitle(/a single player moves the figure/)).toBeInTheDocument();
  });
});

describe('sectionHeader', () => {
  it('is a heading, so a page can be navigated by structure', () => {
    render(<SectionHeader title="How long a session lasts" description="Which games hold attention." />);

    expect(screen.getByRole('heading', { name: 'How long a session lasts' })).toBeInTheDocument();
  });
});

describe('metricRow', () => {
  it('renders terms and values as a description list', () => {
    // A <dl>, because that is what this is. The hand-rolled versions were split
    // between <dl> and <div>, and the <div> ones handed a screen reader a wall
    // of unassociated text.
    const { container } = render(
      <MetricRow metrics={[
        { label: 'Started', value: '120' },
        { label: 'Players', value: '40', metric: 'distinct_players' },
      ]}
      />,
    );

    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });

  it('offers the glossary only where a metric key was given', () => {
    render(
      <MetricRow metrics={[
        { label: 'Solo', value: '9' },
        { label: 'Players', value: '40', metric: 'distinct_players' },
      ]}
      />,
    );

    expect(screen.getByLabelText('What "distinct_players" means')).toBeInTheDocument();
    expect(screen.queryByLabelText('What "Solo" means')).not.toBeInTheDocument();
  });
});
