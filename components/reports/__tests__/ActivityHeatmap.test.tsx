import type { HourWeekdayRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityHeatmap } from '@/components/reports/ActivityHeatmap';

/** Monday 09:00 = 6 is busiest; the peak day (Mon) x peak hour (20:00) cell holds 2. */
const ROWS: HourWeekdayRow[] = [
  { weekday: 1, name: 'Monday', hours: Array.from({ length: 24 }, (_, h) => (h === 9 ? 6 : h === 20 ? 2 : 0)) },
  { weekday: 3, name: 'Wednesday', hours: Array.from({ length: 24 }, (_, h) => (h === 20 ? 5 : 0)) },
];

describe('activityHeatmap', () => {
  it('names the busiest slot rather than leaving it to be read off the colours', () => {
    render(
      <ActivityHeatmap
        rows={ROWS}
        peakCell={{ weekday: 1, name: 'Monday', hour: 9, games_started: 6 }}
        busiest={6}
        timezone="Europe/Sofia"
      />,
    );

    expect(screen.getByText(/Busiest slot is Monday at 09:00/)).toBeInTheDocument();
  });

  it('gives every cell an accessible count, so colour is never the only signal', () => {
    render(<ActivityHeatmap rows={ROWS} peakCell={null} busiest={6} timezone="Europe/Sofia" />);

    expect(screen.getByLabelText('Monday 09:00 — 6 sessions')).toBeInTheDocument();
    // Quiet cells must be labelled too — a screen reader user can't see "empty".
    expect(screen.getByLabelText('Wednesday 03:00 — 0 sessions')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(48);
  });

  it('says there is no activity instead of drawing an all-blank grid', () => {
    const empty: HourWeekdayRow[] = [
      { weekday: 1, name: 'Monday', hours: Array.from({ length: 24 }, () => 0) },
    ];

    render(<ActivityHeatmap rows={empty} peakCell={null} busiest={0} timezone="Europe/Sofia" />);

    expect(screen.getByText(/no activity in this window/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('keeps ordinary cells visible against a heavy peak', () => {
    // Play is heavily peaked: a linear ramp renders a cell at 10% of the peak at
    // ~0.21 opacity, which reads as empty and hides the shape of a normal week.
    // A compressive scale keeps it legible. This pins the property, not the
    // exact curve — any scale that stays visible here passes.
    const rows: HourWeekdayRow[] = [
      { weekday: 1, name: 'Monday', hours: Array.from({ length: 24 }, (_, h) => (h === 0 ? 100 : h === 1 ? 10 : 0)) },
    ];

    render(<ActivityHeatmap rows={rows} peakCell={null} busiest={100} timezone="Europe/Sofia" />);

    const ordinary = screen.getByLabelText('Monday 01:00 — 10 sessions');
    const opacity = Number(/rgba\(16, 185, 129, ([\d.]+)\)/.exec(ordinary.getAttribute('style') ?? '')?.[1]);

    expect(opacity).toBeGreaterThan(0.3);
  });

  it('does not divide by zero when the window is empty but rows are present', () => {
    const rows: HourWeekdayRow[] = [
      { weekday: 1, name: 'Monday', hours: Array.from({ length: 24 }, (_, h) => (h === 1 ? 1 : 0)) },
    ];

    // busiest of 0 is inconsistent with the rows, but a NaN opacity would render
    // the grid invisible rather than fail loudly, so it must be handled.
    expect(() =>
      render(<ActivityHeatmap rows={rows} peakCell={null} busiest={0} timezone="Europe/Sofia" />),
    ).not.toThrow();
  });
});
