import type { GrowthResponse, GrowthRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GrowthFlow } from '@/components/reports/charts/GrowthFlow';
import { toChartRow } from '@/lib/growth-flow';

// recharts measures its container, which jsdom reports as zero, so the SVG never
// renders. The stacking claim is therefore asserted against `toChartRow` — the
// data the chart is handed — rather than against paths. That is the honest test
// anyway: the claim is "churn goes below the line", not "recharts drew a rect".
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
  };
});

function row(over: Partial<GrowthRow> & Pick<GrowthRow, 'week'>): GrowthRow {
  return {
    new: 40,
    resurrected: 10,
    retained: 80,
    churned: 30,
    active: 130,
    previous_active: 110,
    net: 20,
    quick_ratio: 1.67,
    provisional: false,
    week_covered: true,
    ...over,
  };
}

function response(rows: GrowthRow[], over: Partial<GrowthResponse['summary']> = {}): GrowthResponse {
  const settled = rows.filter(r => !r.provisional);
  return {
    rows,
    bands: ['new', 'resurrected', 'retained', 'churned'],
    weeks_covered: settled.length,
    summary: {
      new: settled.reduce((sum, r) => sum + r.new, 0),
      resurrected: settled.reduce((sum, r) => sum + r.resurrected, 0),
      churned: settled.reduce((sum, r) => sum + r.churned, 0),
      quick_ratio: 1.06,
      ...over,
    },
  } as unknown as GrowthResponse;
}

describe('growthFlow', () => {
  it('leads with the quick ratio, which is the number that says which way it is going', () => {
    render(<GrowthFlow data={response([row({ week: '2026-06-01' })])} />);

    expect(screen.getByText('Quick ratio')).toBeInTheDocument();
    expect(screen.getByText('1.06')).toBeInTheDocument();
  });

  it('shows a dash rather than a number when nothing churned', () => {
    // Not infinity, and not zero. A week that lost nobody has no ratio, and
    // rendering that as a spike makes the best week on record read as an
    // anomaly.
    render(<GrowthFlow data={response([row({ week: '2026-06-01' })], { quick_ratio: null })} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('says how many settled weeks the totals cover', () => {
    // The running week is excluded from them, so a reader comparing this with
    // the date picker would otherwise find the totals short and assume a bug.
    render(
      <GrowthFlow
        data={response([
          row({ week: '2026-06-01' }),
          row({ week: '2026-06-08' }),
          row({ week: '2026-06-15', provisional: true }),
        ])}
      />,
    );

    expect(screen.getByText('Totals cover 2 settled weeks.')).toBeInTheDocument();
  });

  it('warns that the running week understates what it will keep', () => {
    // Its churn cannot be counted until the following week ends. Unmarked, the
    // last bar on every run of this report looks like a collapse.
    render(
      <GrowthFlow
        data={response([row({ week: '2026-06-01' }), row({ week: '2026-06-08', provisional: true })])}
      />,
    );

    expect(screen.getByText(/Week of 2026-06-08 is still running/)).toBeInTheDocument();
  });

  it('says nothing about a running week when every week has settled', () => {
    render(<GrowthFlow data={response([row({ week: '2026-06-01' })])} />);

    expect(screen.queryByText(/is still running/)).not.toBeInTheDocument();
  });

  it('has an empty state rather than an axis with nothing on it', () => {
    render(<GrowthFlow data={response([])} />);

    expect(screen.getByText('No player activity in this window.')).toBeInTheDocument();
  });
});

describe('toChartRow', () => {
  it('turns churn negative so it stacks below the line', () => {
    // The API sends it positive on purpose, so a client that does not know to
    // invert it never finds a negative in a chart that cannot handle one. This
    // component is the one that decides.
    expect(toChartRow(row({ week: '2026-06-01', churned: 30 })).churned).toBe(-30);
  });

  it('leaves the three gaining bands alone', () => {
    const chart = toChartRow(row({ week: '2026-06-01', new: 40, resurrected: 10, retained: 80 }));

    expect([chart.new, chart.resurrected, chart.retained]).toEqual([40, 10, 80]);
  });

  it('keeps the full date as the key and shortens only the label', () => {
    // The range picker allows arbitrary custom spans, so across a multi-year
    // selection MM-DD repeats and a categorical axis collapses two different
    // weeks onto one bar (Copilot on #122). The key stays unambiguous; the
    // label is what gets shortened.
    const chart = toChartRow(row({ week: '2026-06-01' }));

    expect(chart.week).toBe('2026-06-01');
    expect(chart.label).toBe('06-01');
  });
});
