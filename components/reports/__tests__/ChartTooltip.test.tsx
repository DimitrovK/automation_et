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

    expect(screen.getByText('20,123')).not.toHaveAttribute('style');
  });

  it('formats numbers so long counts stay readable', () => {
    render(<ChartTooltip active payload={PAYLOAD} label="28 Jul" />);

    expect(screen.getByText('20,123')).toBeInTheDocument();
  });

  it('shows a dash for a gap rather than zero', () => {
    // Uncovered days are drawn as breaks; the tooltip must not turn one into 0.
    render(<ChartTooltip active payload={[{ name: 'Played', value: null, color: '#059669' }]} label="28 Jul" />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders nothing when inactive', () => {
    const { container } = render(<ChartTooltip payload={PAYLOAD} label="28 Jul" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps a zero label, which is a real hour', () => {
    // Midnight is a value, not an absence — a falsiness check would drop it.
    // Unformatted on purpose: a formatter turns 0 into a truthy "0:00" and the
    // check is never exercised, which is exactly how this test first passed
    // against a mutation it should have caught.
    render(<ChartTooltip active payload={PAYLOAD} label={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('draws no heading when the formatter returns nothing', () => {
    // A scatter's identity is the point, not a shared x-value, so its label
    // formatter returns ''. The heading would otherwise be an empty line with
    // a margin above the series.
    const { container } = render(<ChartTooltip active payload={PAYLOAD} label="28 Jul" labelFormatter={() => ''} />);

    expect(container.querySelector('.mb-1')).toBeNull();
  });

  it('applies a label formatter when given one', () => {
    render(<ChartTooltip active payload={PAYLOAD} label={14} labelFormatter={h => `${h}:00`} />);

    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('takes the dot colour off the datum when the series has none', () => {
    // A bar coloured per-<Cell> (favourites: one colour per game) leaves
    // entry.color undefined, because recharts fills it from the <Bar>'s own
    // fill. Without the fallback the identity mark renders as an empty gap.
    const { container } = render(
      <ChartTooltip
        active
        payload={[{ name: 'Favourited by', value: 7, payload: { fill: '#166534' } }]}
        label="Guess The Line Up"
      />,
    );
    const swatch = container.querySelector('span[aria-hidden]');

    expect(swatch?.getAttribute('style')).toContain('rgb(22, 101, 52)');
  });

  it('prefers the series colour over the datum when both exist', () => {
    const { container } = render(
      <ChartTooltip
        active
        payload={[{ name: 'Played', value: 1, color: '#059669', payload: { fill: '#166534' } }]}
        label="28 Jul"
      />,
    );

    expect(container.querySelector('span[aria-hidden]')?.getAttribute('style')).toContain('rgb(5, 150, 105)');
  });

  it('renders a footer line for a figure the rows imply but do not list', () => {
    render(
      <ChartTooltip
        active
        payload={[{ name: 'Favourited', value: 7, color: '#10b981', payload: { play_through_pct: 42 } }]}
        label="Grid"
        footer={row => (typeof row.play_through_pct === 'number' ? `Play-through: ${row.play_through_pct}%` : null)}
      />,
    );

    expect(screen.getByText('Play-through: 42%')).toBeInTheDocument();
  });

  it('omits the footer when there is no formatter for it', () => {
    render(<ChartTooltip active payload={PAYLOAD} label="28 Jul" />);

    expect(screen.queryByText(/Play-through/)).not.toBeInTheDocument();
  });

  it('draws no footer rule when the datum cannot support one', () => {
    // A formatter that returns nothing must leave no trace: an empty bordered
    // line under the series reads as a rendering fault.
    const { container } = render(
      <ChartTooltip
        active
        payload={[{ name: 'Favourited', value: 7, color: '#10b981', payload: { slug: 'grid' } }]}
        label="Grid"
        footer={row => (typeof row.play_through_pct === 'number' ? `Play-through: ${row.play_through_pct}%` : null)}
      />,
    );

    expect(container.querySelector('.border-t')).toBeNull();
  });
});
