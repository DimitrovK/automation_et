'use client';

import type { MetricKey } from '@/types/reports';
import { FilterGroup, Segmented } from '@/components/reports/filters/FilterBar';
import { cn } from '@/lib/utils';
import { METRIC_OPTIONS } from '@/types/reports';

/**
 * Chooses which metric the chart/table foregrounds. "Played" counts sessions
 * started; "Finished" counts the ones played to the end — the gap between them
 * is the abandonment story, so both need to be reachable rather than one being
 * baked in.
 */
export function MetricToggle({ value, onChange }: {
  value: MetricKey;
  onChange: (metric: MetricKey) => void;
}) {
  return (
    <FilterGroup label="Foreground metric" hint="Which metric gets the large chart; the others keep their own panels below it.">
      <Segmented>
        {METRIC_OPTIONS.map(option => (
          <button
            key={option.key}
            type="button"
            aria-pressed={option.key === value}
            onClick={() => onChange(option.key)}
            className={cn(
              'rounded px-2.5 py-1 text-sm font-medium transition-colors',
              option.key === value
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {option.label}
          </button>
        ))}
      </Segmented>
    </FilterGroup>
  );
}
