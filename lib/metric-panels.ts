/**
 * Which metric goes where on the activity chart.
 *
 * All four used to share one y-axis. That flattened the small series — distinct
 * players runs in the tens where games played runs in the thousands — and,
 * worse, a shared axis asserts comparability: it invites reading the gap
 * between two lines as meaningful when one counts sessions and the other counts
 * people.
 *
 * So the selected metric gets the large chart and the rest get their own
 * panels, each with its own scale. The split is here rather than inline because
 * it is the claim being made — that no metric is drawn twice, and none is
 * dropped — and a recharts tree renders nothing measurable in jsdom.
 */

import type { MetricKey } from '@/types/reports';
import { METRIC_OPTIONS } from '@/types/reports';

export type MetricPanels = {
  /** The one metric on the large chart, at its own scale. */
  primary: MetricKey;
  /** The others, one small panel each, each at its own scale. */
  context: MetricKey[];
};

export function metricPanels(metric: MetricKey): MetricPanels {
  const keys = METRIC_OPTIONS.map(option => option.key);
  return {
    primary: metric,
    // Every other metric, in the declared order. Filtering rather than slicing
    // so a metric added to the registry appears here without a second edit.
    context: keys.filter(key => key !== metric),
  };
}
