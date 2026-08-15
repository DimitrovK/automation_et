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
    // The year is dropped: every bar in a window carries the same one, and the
    // axis has room for about eight labels.
    week: row.week.slice(5),
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
