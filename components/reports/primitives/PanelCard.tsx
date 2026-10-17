'use client';

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STORAGE_PREFIX = 'panel-open:';

function readStored(id: string): boolean | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_PREFIX + id);
    return raw === null || raw === undefined ? null : raw === '1';
  } catch {
    return null;
  }
}

function writeStored(id: string, open: boolean) {
  try {
    globalThis.localStorage?.setItem(STORAGE_PREFIX + id, open ? '1' : '0');
  } catch {
    // Private mode or blocked storage: the panel still opens and closes, it just
    // won't remember. Nothing on the page depends on it.
  }
}

/**
 * A report card that can fold away.
 *
 * The report pages grew into walls of open tables, and the one thing a reader
 * needed was below five they didn't. A folded card keeps its title and a
 * one-line `summary` — the number worth knowing without opening it — so a page
 * of folded cards still reads as a dashboard rather than a list of headings.
 *
 * Open or closed is remembered per card `id` in this browser only (a reader's
 * convenience, not shared state). Before the stored value is read the card
 * renders `defaultOpen`, the same as the server did, so hydration agrees.
 *
 * Without `collapsible` it is a plain card with the same header, so a page can
 * mix the two without two header styles.
 */
export function PanelCard({
  id,
  title,
  info,
  description,
  summary,
  actions,
  collapsible = true,
  defaultOpen = false,
  className,
  contentClassName,
  children,
}: {
  /** Stable and unique on the page: the remembered state is keyed by it. */
  id: string;
  title: ReactNode;
  /** A control beside the title (a glossary link). Kept outside the toggle: a button can't hold a button. */
  info?: ReactNode;
  description?: ReactNode;
  /** One line shown beside the title — the headline while folded. */
  summary?: ReactNode;
  /** Controls on the right of the header (a switch, a toggle). Shown only while open. */
  actions?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || !collapsible);
  const bodyId = useId();

  useEffect(() => {
    if (!collapsible) {
      return;
    }
    const stored = readStored(id);
    if (stored !== null) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setOpen(stored);
    }
  }, [id, collapsible]);

  const toggle = () => {
    writeStored(id, !open);
    setOpen(!open);
  };

  const heading = (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <CardTitle className="flex items-center gap-2 text-base">{title}</CardTitle>
      {summary && (
        <span className="text-sm font-normal text-muted-foreground">{summary}</span>
      )}
    </span>
  );

  return (
    <Card className={cn('gap-0', className)} data-panel-id={id} data-open={open ? 'true' : 'false'}>
      <CardHeader className={cn('space-y-2', open && 'pb-4')}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          {collapsible
            ? (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={open}
                  aria-controls={bodyId}
                  className="group flex min-w-0 items-start gap-2 text-left"
                >
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground',
                      !open && '-rotate-90',
                    )}
                  />
                  {heading}
                </button>
              )
            : heading}
          {info && <span className="mt-0.5 shrink-0">{info}</span>}
          {open && actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {open && description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {open && (
        <CardContent id={bodyId} className={contentClassName}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * A small set of mutually exclusive buttons — a split, a grouping, a bucket size.
 * Same look as the activity chart's day/week/month switch.
 */
export function Segmented<T extends string>({ label, value, options, onChange }: {
  /** Read by screen readers; the buttons carry the visible words. */
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-md border p-0.5">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded px-2 py-0.5 text-xs font-medium transition-colors',
            value === option.value
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A folded group of existing cards: one bar with a title and a summary, the
 * cards below it only while open. For report cards that draw their own frame
 * (the retention, hour and duration cards) and so can't take a PanelCard header
 * without a card inside a card.
 */
export function Fold({ id, title, summary, defaultOpen = false, children }: {
  id: string;
  title: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  useEffect(() => {
    const stored = readStored(id);
    if (stored !== null) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setOpen(stored);
    }
  }, [id]);

  return (
    <div className="space-y-3" data-panel-id={id} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => {
          writeStored(id, !open);
          setOpen(!open);
        }}
        className="group flex w-full items-baseline gap-2 rounded-lg border bg-card px-5 py-3 text-left shadow-xs hover:bg-muted/40"
      >
        <ChevronDown
          aria-hidden
          className={cn('size-4 shrink-0 self-center text-muted-foreground transition-transform', !open && '-rotate-90')}
        />
        <span className="text-base font-semibold">{title}</span>
        {summary && <span className="text-sm text-muted-foreground">{summary}</span>}
      </button>
      {open && <div id={bodyId} className="space-y-4">{children}</div>}
    </div>
  );
}
