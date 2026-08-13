import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartTooltip } from '@/components/reports/ChartTooltip';

const PAYLOAD = [
  { name: 'Finished', value: 20123, color: '#059669', dataKey: 'games_finished' },
  { name: 'Players', value: 19, color: '#2563eb', dataKey: 'distinct_players' },
];

describe('chartTooltip', () => {
  it('gives every series a swatch in its own line colour', () => {
    // The bug: recharts listed "Finished 20123 · Players 19" as plain text
    // while the legend coloured them, so the reader matched them by memory.
    const { container } = render(<ChartTooltip active payload={PAYLOAD} label="28 Jul" />);
    const swatches = [...container.querySelectorAll('span[aria-hidden]')]
      .map(node => node.getAttribute('style'));

    // jsdom normalises hex to rgb(), so assert the resolved values.
    expect(swatches).toHaveLength(2);
    expect(swatches[0]).toContain('rgb(5, 150, 105)');
    expect(swatches[1]).toContain('rgb(37, 99, 235)');
    expect(swatches[0]).not.toBe(swatches[1]);
  });

  it('keeps the value in text colour rather than the series colour', () => {
    // A coloured mark beside a label carries identity without costing
    // legibility; coloured text on a small tooltip does.
    render(<ChartTooltip active payload={PAYLOAD} label="28 Jul" />);

    expect(screen.getByText('20,123').getAttribute('style')).toBeNull();
  });

  it('formats numbers so long counts stay readable', () => {
    render(<ChartTooltip active payload={PAYLOAD} label="28 Jul" />);

    expect(screen.getByText('20,123')).toBeTruthy();
  });

  it('shows a dash for a gap rather than zero', () => {
    // Uncovered days are drawn as breaks; the tooltip must not turn one into 0.
    render(<ChartTooltip active payload={[{ name: 'Played', value: null, color: '#059669' }]} label="28 Jul" />);

    expect(screen.getByText('—')).toBeTruthy();
  });

  it('renders nothing when inactive', () => {
    const { container } = render(<ChartTooltip payload={PAYLOAD} label="28 Jul" />);

    expect(container.firstChild).toBeNull();
  });

  it('applies a label formatter when given one', () => {
    render(<ChartTooltip active payload={PAYLOAD} label={14} labelFormatter={h => `${h}:00`} />);

    expect(screen.getByText('14:00')).toBeTruthy();
  });
});
