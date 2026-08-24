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
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-lg border bg-card/60 px-4 py-3">
      {children}
    </div>
  );
}

/**
 * One named control within the bar.
 *
 * `label` is optional for a control that belongs to the one before it — a
 * clear button beside the range it clears. Those still need the caption's
 * height reserved or they sit a line too high, so the space is rendered
 * explicitly and hidden from assistive tech.
 *
 * The earlier version passed `label="&nbsp;"` for that. It rendered correctly
 * — JSX decodes entities in an attribute literal, so it produced a real
 * non-breaking space rather than the six characters — but it left a captioned
 * <p> in the accessibility tree with nothing to say, and made "no name" look
 * like a typo rather than a decision.
 */
export function FilterGroup({ label, children, hint }: {
  label?: string;
  children: ReactNode;
  /** Shown on hover — for the rule behind a control, not for its name. */
  hint?: string;
}) {
  return (
    <div className="space-y-1.5" title={hint}>
      {label
        ? (
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {label}
            </p>
          )
        : <p className="text-[11px] leading-normal" aria-hidden>{'\u00A0'}</p>}
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
    <div className="flex flex-wrap gap-0.5 rounded-md border bg-muted/50 p-0.5">
      {children}
    </div>
  );
}
