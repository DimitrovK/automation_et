'use client';

import type { MetricKey } from '@/types/reports';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">Show</span>
      {METRIC_OPTIONS.map(option => (
        <Button
          key={option.key}
          size="sm"
          variant={option.key === value ? 'default' : 'outline'}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
