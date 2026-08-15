import type { GrowthRow } from '@/types/reports';

/**
 * One growth week, shaped for a stacked bar chart.
 *
 * Its own module rather than an export from the chart, so the one decision worth
 * testing here is testable: jsdom reports a zero-size container and recharts
 * draws nothing, so asserting "churn goes below the line" against rendered paths
 * is not possible. Asserting it against the data the chart is handed is both
 * possible and the more honest check.
 */
export function toChartRow(row: GrowthRow) {
  return {
    // The full date is the KEY, because the range picker allows arbitrary
    // custom spans: across a multi-year selection, MM-DD repeats and a
    // categorical axis collapses two different weeks onto one bar (Copilot on
    // #122). The short form is a separate field the axis formats with, so the
    // label stays readable without the key becoming ambiguous.
    week: row.week,
    label: row.week.slice(5),
    retained: row.retained,
    resurrected: row.resurrected,
    new: row.new,
    // The API sends churn POSITIVE, on purpose — so a client that does not know
    // to stack it downward never finds a negative in a chart that cannot handle
    // one. Turning it negative is the chart's decision, made here.
    churned: -row.churned,
    provisional: row.provisional,
  };
}
