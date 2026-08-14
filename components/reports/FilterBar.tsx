'use client';

import type { ReactNode } from 'react';

/**
 * The row of controls above a report.
 *
 * Every reporting page had the same problem: a range picker, a game filter, a
 * metric toggle and a bots switch laid out as one undifferentiated line of
 * buttons. Nothing said which control did what, or which of the twelve things
 * on screen were currently narrowing the data — so "7d 10d 15d 30d 60d 90d
 * Custom" read as seven equal choices with no visible answer to "what am I
 * looking at".
 *
 * This gives each control a name and a boundary. The label is the point: a
 * segmented control with a caption is self-explanatory, and the same control
 * unlabelled is a row of jargon.
 */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-lg border bg-white/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
      {children}
    </div>
  );
}

/** One named control within the bar. */
export function FilterGroup({ label, children, hint }: {
  label: string;
  children: ReactNode;
  /** Shown on hover — for the rule behind a control, not for its name. */
  hint?: string;
}) {
  return (
    <div className="space-y-1.5" title={hint}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * A set of mutually exclusive options, drawn as one object rather than as
 * separate buttons.
 *
 * Separate outline buttons say "here are seven actions"; a segmented control
 * says "here is one setting, currently on this value" — which is what a range
 * is. Same visual language as the section nav, so a reader learns it once.
 */
export function Segmented({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-0.5 rounded-md border bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-900/40">
      {children}
    </div>
  );
}
