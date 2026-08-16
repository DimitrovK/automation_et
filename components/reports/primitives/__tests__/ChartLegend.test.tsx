import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChartLegend } from '@/components/reports/primitives/ChartLegend';

// The glossary popover fetches its definitions; this component's job is only to
// decide whether the link is offered at all, so stand it in with a marker.
vi.mock('@/components/reports/primitives/MetricInfo', () => ({
  MetricInfo: ({ metric }: { metric: string }) => <span data-testid={`info-${metric}`} />,
}));

describe('chartLegend', () => {
  it('names every series in text, so identity is never colour alone', () => {
    render(
      <ChartLegend
        series={[
          { label: 'Stayed', colour: '#0a0' },
          { label: 'Churned', colour: '#a00' },
        ]}
      />,
    );

    expect(screen.getByText('Stayed')).toBeInTheDocument();
    expect(screen.getByText('Churned')).toBeInTheDocument();
  });

  it('renders nothing for a single series — the card title already names it', () => {
    const { container } = render(
      <ChartLegend series={[{ label: 'Sessions', colour: '#0a0' }]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('offers the glossary only for the series that declare a key', () => {
    render(
      <ChartLegend
        series={[
          { label: 'Returning', colour: '#0a0' },
          { label: 'New', colour: '#00a', metric: 'new_players' },
        ]}
      />,
    );

    expect(screen.getByTestId('info-new_players')).toBeInTheDocument();
    // Not a definition that does not exist: there is no `returning_players`
    // entry in the BE glossary, and linking one would render "no definition".
    expect(screen.queryByTestId('info-returning_players')).not.toBeInTheDocument();
  });

  it('hides the swatch from assistive tech — the label carries the meaning', () => {
    const { container } = render(
      <ChartLegend
        series={[
          { label: 'Stayed', colour: 'rgb(0, 170, 0)' },
          { label: 'New', colour: 'rgb(0, 0, 170)' },
        ]}
      />,
    );

    const swatches = container.querySelectorAll('[aria-hidden]');

    expect(swatches).toHaveLength(2);
    expect(swatches[0]).toHaveStyle({ backgroundColor: 'rgb(0, 170, 0)' });
  });
});
