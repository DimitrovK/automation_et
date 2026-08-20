'use client';

import type { LucideIcon } from 'lucide-react';
import type { CareerPathFootballerRow, HelperUse } from '@/types/reports';
import { Eye, LayoutGrid, Lightbulb, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The four ways Career Path helps a stuck player, per footballer.
 *
 * The reason this exists rather than four more columns: a zero in a helper
 * column means two completely different things and the flat table could not
 * tell them apart. Helpers are configured per path — hints are switched off in
 * about a third of SINGLE paths, skips are absent from Stoppage Time and every
 * multiplayer mode — so "0 hints" is either "nobody needed one" or "hints were
 * never on". One is a footballer that reads fine; the other is no evidence at
 * all. Each tile carries its own denominator so the difference is visible.
 *
 * Reveals are the exception and say so. `reveals_allowed = 0` means UNLIMITED
 * on the backend, so the obvious predicate marks the CAPPED paths as the
 * eligible ones and reports the reverse of the truth, and Sudden Death earns
 * helpers mid-game rather than allocating them. A denominator that is
 * confidently backwards is worse than an admitted gap.
 */

type Helper = {
  key: keyof NonNullable<CareerPathFootballerRow['help']>;
  label: string;
  icon: LucideIcon;
  /** What `used` counts, as a verb the tile can end a sentence with. */
  verb: string;
  /** Tailwind classes for the icon tile. Theme tokens, so dark mode holds. */
  tone: string;
  bar: string;
};

const HELPERS: Helper[] = [
  { key: 'hint', label: 'Hints', icon: Lightbulb, verb: 'hinted', tone: 'bg-chart-3/10 text-chart-3', bar: 'bg-chart-3' },
  { key: 'reveal', label: 'Reveals', icon: Eye, verb: 'revealed', tone: 'bg-chart-4/10 text-chart-4', bar: 'bg-chart-4' },
  { key: 'skip', label: 'Skips', icon: SkipForward, verb: 'skipped', tone: 'bg-chart-2/10 text-chart-2', bar: 'bg-chart-2' },
  { key: 'similar', label: 'Similar grid', icon: LayoutGrid, verb: 'reached', tone: 'bg-chart-1/10 text-chart-1', bar: 'bg-chart-1' },
];

/** What the tile leads with, which depends on what is knowable. */
function headline(use: HelperUse): string {
  if (use.eligible === null) {
    return use.used.toLocaleString();
  }
  if (use.eligible === 0) {
    return 'n/a';
  }
  return `${Math.round((use.used / use.eligible) * 100)}%`;
}

function caption(use: HelperUse, verb: string): string {
  if (use.eligible === null) {
    return `${verb} · how often it was on offer is not recorded`;
  }
  if (use.eligible === 0) {
    return 'never offered on these appearances';
  }
  const base = `${use.used.toLocaleString()} of ${use.eligible.toLocaleString()} ${verb}`;
  // Only when they differ. "3 of 18 hinted · 3 times" is noise.
  return use.events !== null && use.events !== use.used
    ? `${base} · ${use.events.toLocaleString()} times`
    : base;
}

function HelperTile({ helper, use }: { helper: Helper; use: HelperUse }) {
  const { icon: Icon } = helper;
  const unavailable = use.eligible === 0;
  const pct = use.eligible && use.eligible > 0
    ? Math.min(100, (use.used / use.eligible) * 100)
    : null;

  return (
    <div className={cn('rounded-lg border bg-card p-3', unavailable && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', helper.tone)}>
            <Icon className="size-3.5" />
          </span>
          <span className="truncate text-xs font-medium text-foreground">{helper.label}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {headline(use)}
        </span>
      </div>

      {/* A track even with no fill, so a helper that WAS offered and never taken
          still reads as a measurement rather than as a missing tile. Omitted
          only when there is no denominator to draw against. */}
      {pct !== null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.09]">
          <div className={cn('h-full rounded-full', helper.bar)} style={{ width: `${pct}%` }} />
        </div>
      )}

      <p className="mt-1.5 text-[0.7rem] leading-snug text-muted-foreground">
        {caption(use, helper.verb)}
        {use.derived && (
          <span
            className="ml-1 rounded bg-muted px-1 py-px text-[0.65rem]"
            title="Nothing logs that the grid was shown. This counts appearances past the path's own wrong-guess threshold."
          >
            derived
          </span>
        )}
      </p>
    </div>
  );
}

export function HelperBreakdown({ help }: { help: NonNullable<CareerPathFootballerRow['help']> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {HELPERS.map(helper => (
        <HelperTile key={helper.key} helper={helper} use={help[helper.key]} />
      ))}
    </div>
  );
}
