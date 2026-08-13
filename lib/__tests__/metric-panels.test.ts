import { describe, expect, it } from 'vitest';
import { metricPanels } from '@/lib/metric-panels';
import { METRIC_OPTIONS } from '@/types/reports';

describe('metricPanels', () => {
  it('puts only the selected metric on the large chart', () => {
    // All four used to share one axis, which flattened the small series and
    // implied the gap between two lines meant something — one counts sessions,
    // another counts people.
    expect(metricPanels('distinct_players').primary).toBe('distinct_players');
    expect(metricPanels('distinct_players').context).not.toContain('distinct_players');
  });

  it('gives every other metric a panel, and no metric twice', () => {
    for (const { key } of METRIC_OPTIONS) {
      const { primary, context } = metricPanels(key);

      expect(new Set([primary, ...context]).size).toBe(METRIC_OPTIONS.length);
      expect(context).toHaveLength(METRIC_OPTIONS.length - 1);
    }
  });

  it('drops no metric, whichever is selected', () => {
    // A metric silently missing from both regions is invisible on the page,
    // and nothing else would catch it.
    for (const { key } of METRIC_OPTIONS) {
      const { primary, context } = metricPanels(key);
      const shown = new Set<string>([primary, ...context]);

      for (const option of METRIC_OPTIONS) {
        expect(shown.has(option.key), `${option.key} missing when ${key} is selected`).toBe(true);
      }
    }
  });

  it('keeps the declared order in the context panels', () => {
    // So the row doesn't reshuffle when the selection changes, which would
    // make the eye re-find each panel every time.
    expect(metricPanels('games_started').context).toEqual(['games_finished', 'distinct_players', 'mp_player_sessions']);
  });
});
