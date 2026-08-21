'use client';

import type { PlayOutcome } from '@/types/reports';
import { cn } from '@/lib/utils';

/**
 * The four things that happen when a player meets a footballer, in order of
 * how well it went. Colours run good → bad so the shape is readable before any
 * of the labels are.
 */
const SEGMENTS = [
  { key: 'solved_unaided', label: 'solved unaided', className: 'bg-emerald-500/80' },
  { key: 'solved_helped', label: 'solved after help', className: 'bg-amber-400/80' },
  { key: 'unsolved', label: 'unsolved', className: 'bg-rose-500/70' },
  { key: 'unfinished', label: 'left unfinished', className: 'bg-muted-foreground/40' },
] as const;

/**
 * What happened across every play of one footballer.
 *
 * This replaces reading three separate percentages and holding them in your
 * head. "Needed help 25%" is only interpretable next to how often the thing was
 * solved at all and how often people walked away — a footballer solved 95% of
 * the time with a quarter taking hints is working as intended, and one solved
 * 20% of the time with the same help rate is not.
 *
 * The segments are counts from the server, not the rates rounded — three
 * rounded percentages do not reliably add to a whole, and a bar that does not
 * fill its track reads as missing data.
 */
export function OutcomeBar({ outcome, plays, className }: {
  outcome: PlayOutcome;
  plays: number;
  className?: string;
}) {
  if (!plays) {
    // Nothing rather than an empty track: an unfilled bar reads at a glance as
    // "everything failed", which is the opposite of "nobody played this".
    return null;
  }

  const parts = SEGMENTS
    .map(segment => ({ ...segment, value: outcome[segment.key] }))
    .filter(segment => segment.value > 0);

  const description = `${plays.toLocaleString()} ${plays === 1 ? 'play' : 'plays'}: ${
    parts.map(part => `${part.value} ${part.label}`).join(', ')
  }`;

  return (
    <span
      role="img"
      aria-label={description}
      title={description}
      className={cn('flex h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      {parts.map(part => (
        <span
          key={part.key}
          data-segment={part.key}
          aria-hidden
          className={part.className}
          style={{ width: `${(part.value * 100) / plays}%` }}
        />
      ))}
    </span>
  );
}

/** What the colours mean, printed once above the table rather than per row. */
export function OutcomeLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground', className)}>
      {SEGMENTS.map(segment => (
        <li key={segment.key} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2 rounded-full', segment.className)} />
          {segment.label}
        </li>
      ))}
    </ul>
  );
}
