'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * The caveat behind a panel, on demand rather than always on screen.
 *
 * These explanations earn their keep — "these rows deliberately sum to more than
 * the bank holds" is the difference between reading the table right and filing a
 * bug — but they are read once and then re-read every visit forever. Four of them
 * stacked down a page is more prose than data.
 *
 * A tooltip rather than a popover: this is a footnote, not a glossary entry, and
 * it should not need a click to dismiss. `MetricInfo` stays a popover because a
 * metric definition is longer and often the thing you came for.
 *
 * Carries its own `TooltipProvider` because the app mounts none globally — and a
 * Radix tooltip with no provider ancestor silently never opens.
 */
export function InfoHint({ children, label, className }: {
  /** The explanation. Kept short enough to read in a hover. */
  children: ReactNode;
  /** What it explains, for the button's accessible name. */
  label: string;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger
          // A real button: a hover-only affordance is invisible to a keyboard,
          // and Radix opens on focus as well as on hover.
          type="button"
          aria-label={`About ${label}`}
          className={cn(
            'inline-flex shrink-0 rounded-full text-muted-foreground/70 transition-colors hover:text-foreground',
            className,
          )}
        >
          <Info className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
