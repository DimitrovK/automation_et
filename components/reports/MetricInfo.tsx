'use client';

import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlossary } from '@/hooks/use-glossary';

/**
 * The definition of a metric, next to the metric.
 *
 * A glossary page alone doesn't work: nobody leaves the number they're
 * questioning to go and look it up. The caveat is the part worth surfacing —
 * every one is a way the number has actually been misread.
 *
 * Definitions come from the BE, which holds them beside the query that computes
 * them. Nothing is hardcoded here, so this can never disagree with the maths.
 */
export function MetricInfo({ metric }: { metric: string }) {
  // No auth context needed: this only ever renders inside the staff-only report
  // pages, and requiring a provider would make a presentational component throw
  // wherever it is rendered in isolation.
  const { byKey, isLoading, failed } = useGlossary();
  const definition = byKey[metric];

  return (
    <Popover>
      <PopoverTrigger
        className="ml-1 inline-flex align-middle text-muted-foreground/70 transition-colors hover:text-foreground/80"
        aria-label={`What "${definition?.label ?? metric}" means`}
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="start">
        {isLoading && <Skeleton className="h-16 w-full" />}

        {!isLoading && !definition && (
          <p className="text-muted-foreground">
            {failed
              ? 'Could not load the definition. Showing nothing rather than a copy that might no longer match how this is calculated.'
              : `No definition recorded for "${metric}".`}
          </p>
        )}

        {definition && (
          <>
            <p className="font-semibold text-foreground">{definition.label}</p>
            <p className="mt-1 text-foreground/80">{definition.counts}</p>
            {definition.excludes && (
              <p className="mt-2 text-muted-foreground">
                <span className="font-medium">Excludes: </span>
                {definition.excludes}
              </p>
            )}
            {definition.caveat && (
              <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-foreground dark:border-amber-900 dark:bg-amber-900/20">
                {definition.caveat}
              </p>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
