'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * A worklist, showing its first rows and admitting how long it is.
 *
 * These lists are gaps to go and fix — 101 nations with no footballer, 53 empty
 * teams. The count is the signal and the rows are the sample: the top is where
 * you start, and rows 40 to 101 are identical in kind. Printing all of them
 * turns a panel into a scroll.
 *
 * The server does the capping and sends `total` alongside, so "10 of 101" is
 * honest without transferring 101 rows. Slicing client-side would ship the
 * whole table and hide most of it — the payload would grow with the problem,
 * which is exactly backwards.
 *
 * Expanding refetches at a higher limit rather than revealing hidden rows,
 * because there are no hidden rows to reveal.
 */
export function CappedList({ total, shown, expanded, onExpand, emptyLabel, children, className }: {
  /** The real number behind the sample. */
  total: number;
  /**
   * How many rows are actually rendered — `items.length`, never the limit that
   * was requested. The server can return fewer than asked for, and deriving
   * this from the limit would claim ten rows while showing two.
   */
  shown: number;
  /** Whether the caller has already asked for more. */
  expanded?: boolean;
  /** Ask for a bigger page. Omit when the caller cannot refetch. */
  onExpand?: () => void;
  /** What "none" means here — an empty gap list is usually good news. */
  emptyLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  if (total === 0) {
    // Not an error and not a blank: for a gap list, zero is the goal.
    return <p className={cn('text-sm text-muted-foreground', className)}>{emptyLabel}</p>;
  }

  const more = total - shown;

  return (
    <div className={cn('space-y-2', className)}>
      {children}
      {/* Only when the sample is short of the total. "10 of 10" is noise. */}
      {more > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {`Showing ${shown.toLocaleString()} of ${total.toLocaleString()}`}
          </p>
          {onExpand && !expanded && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-0.5 text-xs"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                onExpand();
              }}
            >
              {busy ? 'Loading…' : `Show ${Math.min(more, 90).toLocaleString()} more`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
