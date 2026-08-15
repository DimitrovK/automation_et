import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * What a panel says when it has nothing to show.
 *
 * Ten of these were written by hand at three different paddings (py-4, py-6,
 * py-8), so panels sitting side by side settled at different heights when both
 * were empty.
 *
 * The copy matters more than the spacing. Half of them said some version of "No
 * data yet", which tells a reader nothing they had not already worked out from
 * the blank panel — not whether the filters are too narrow, not whether the
 * feature is unused, not whether something is broken. An empty panel is the one
 * place where the interface has the reader's full attention and nothing to
 * compete with, so it should say what is missing and, where there is one, what
 * would change it.
 */
export function EmptyState({ children, hint, className }: {
  /** What is missing, in the reader's terms. */
  children: ReactNode;
  /** What would change it, when anything would. Omitted rather than padded. */
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('py-6 text-center', className)}>
      <p className="text-sm text-muted-foreground">{children}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
