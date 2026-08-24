'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * A debounced text filter that narrows a server-side list.
 *
 * Not an autocomplete dropdown, deliberately. There are 2,017 categories, so
 * the list cannot be held client-side, and a dropdown over a server round trip
 * either lags the keystrokes or fires a request per character. Typing filters
 * the table itself, which is the same job with the results already on screen.
 *
 * Debounced because every change is a query: without it, "england" is seven
 * requests and the answers can arrive out of order.
 */
export function SearchBox({ value, onChange, placeholder, className, delay = 300, label }: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  className?: string;
  delay?: number;
  /** Accessible name. Falls back to the placeholder, which is not a label. */
  label?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [lastCommitted, setLastCommitted] = useState(value);
  const pending = draft !== value;

  // Follow the committed value when it changes from OUTSIDE (a cleared filter,
  // a restored URL) without fighting the user mid-keystroke.
  //
  // Adjusted during render rather than in an effect. Syncing props into state
  // with `useEffect` renders once with the stale value and then again with the
  // new one, so the box visibly shows the old text for a frame — and it is what
  // `react-hooks-extra/no-direct-set-state-in-use-effect` is pointing at. React
  // re-runs this component immediately, before touching the DOM.
  if (value !== lastCommitted) {
    setLastCommitted(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) {
      return;
    }
    const timer = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(timer);
    // `onChange` is rebuilt each render by callers; keying on it would reset
    // the timer every render and the query would never fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, value, delay]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        value={draft}
        onChange={event => setDraft(event.target.value)}
        placeholder={placeholder}
        // A placeholder disappears the moment anyone types, so it cannot be the
        // accessible name — and this box's name is the only thing that says
        // WHAT it filters.
        aria-label={label ?? placeholder}
        className="h-8 px-8 text-sm"
      />
      {/* The debounce, made visible. Without it the box looks inert for a third
          of a second after the last keystroke, which reads as "nothing
          happened" rather than "waiting for you to stop typing". */}
      {pending && (
        <span
          aria-hidden
          className="absolute top-1/2 right-8 size-3 -translate-y-1/2 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground"
        />
      )}
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
