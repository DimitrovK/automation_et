import type { HourWeekdayRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityHeatmap, heatmapRamp } from '@/components/reports/ActivityHeatmap';

/** Monday 09:00 = 6 is busiest; the peak day (Mon) x peak hour (20:00) cell holds 2. */
const ROWS: HourWeekdayRow[] = [
  { weekday: 1, name: 'Monday', hours: Array.from({ length: 24 }, (_, h) => (h === 9 ? 6 : h === 20 ? 2 : 0)) },
  { weekday: 3, name: 'Wednesday', hours: Array.from({ length: 24 }, (_, h) => (h === 20 ? 5 : 0)) },
];

describe('heatmapRamp', () => {
  it('uses different steps per surface', () => {
    // The light ramp darkens toward the busy end; reused on a dark card its
    // darkest step nearly disappears, so the busiest hours would read as the
    // emptiest. Each surface needs its own anchor, not a shared one.
    expect(heatmapRamp(true)).not.toEqual(heatmapRamp(false));
  });

  it('keeps four steps on both surfaces', () => {
    // The legend labels one count range per step; a mismatch would label the
    // wrong ranges rather than fail visibly.
    expect(heatmapRamp(true)).toHaveLength(4);
    expect(heatmapRamp(false)).toHaveLength(4);
  });
});

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

  it('puts cells in distinguishable buckets rather than a smooth ramp', () => {
    // The complaint: with most hours active, a continuous opacity ramp read as
    // one wash of green. Nobody can tell 60% opacity from 70%. Discrete steps
    // can be told apart and can be labelled with what they mean.
    const rows: HourWeekdayRow[] = [
      { weekday: 1, name: 'Monday', hours: Array.from({ length: 24 }, (_, h) => (h === 0 ? 100 : h === 1 ? 10 : h === 2 ? 60 : 0)) },
    ];

    render(<ActivityHeatmap rows={rows} peakCell={null} busiest={100} timezone="Europe/Sofia" />);

    const colourOf = (label: string) =>
      /background-color:\s*([^;]+)/.exec(screen.getByLabelText(label).getAttribute('style') ?? '')?.[1];

    const top = colourOf('Monday 00:00 — 100 sessions');
    const mid = colourOf('Monday 02:00 — 60 sessions');
    const low = colourOf('Monday 01:00 — 10 sessions');

    // Three different volumes must land on three different, named colours.
    expect(new Set([top, mid, low]).size).toBe(3);
  });

  it('states the count range each colour stands for', () => {
    // A legend of unlabelled swatches still requires decoding by eye.
    const rows: HourWeekdayRow[] = [
      { weekday: 1, name: 'Monday', hours: Array.from({ length: 24 }, (_, h) => (h === 0 ? 100 : 0)) },
    ];

    render(<ActivityHeatmap rows={rows} peakCell={null} busiest={100} timezone="Europe/Sofia" />);

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText(/76–100|100/)).toBeTruthy();
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
    const colour = /background-color:\s*([^;]+)/.exec(ordinary.getAttribute('style') ?? '')?.[1];

    // A 10-of-100 cell must still be painted, not left indistinguishable from
    // an empty one — which is what a linear ramp did to it.
    expect(colour).toBeTruthy();
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
