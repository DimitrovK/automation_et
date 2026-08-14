'use client';

import type { RangeState } from '@/lib/report-range';
import { X } from 'lucide-react';
import { useState } from 'react';
import { FilterGroup, Segmented } from '@/components/reports/FilterBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { activePreset, isoDay, yesterdayRange } from '@/lib/report-range';
import { cn } from '@/lib/utils';
import { REPORT_WINDOWS } from '@/types/reports';

/**
 * Presets for the common case, explicit dates for everything else.
 *
 * The preset list mirrors ALLOWED_WINDOWS on the BE, which 400s on anything
 * else, so the buttons can't produce a failing request. Custom dates are
 * validated the same way the server does (start <= end, end not in the future)
 * before being applied, so a mistake shows up as a disabled button rather than
 * a red error panel.
 *
 * Today and Yesterday are named rather than numbered. "1d" is technically the
 * same range and reads as a duration — "how is today going" is the question
 * this section is asked most often, and it deserves a word, not an arithmetic
 * exercise. Yesterday is an explicit start=end, because a window only ever
 * counts back from today.
 */
export function RangePicker({ value, onChange, includeBots, onIncludeBotsChange }: {
  value: RangeState;
  onChange: (range: RangeState) => void;
  includeBots: boolean;
  onIncludeBotsChange: (v: boolean) => void;
}) {
  // One clock reading for the whole render. Two `new Date()` calls can land
  // either side of midnight, and the validation bounds and the lit button would
  // then be describing different days.
  const now = new Date();
  const today = isoDay(now);
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(value.start ?? '');
  const [draftEnd, setDraftEnd] = useState(value.end ?? today);

  const active = activePreset(value, now);
  const custom = active === 'custom';
  const invalid = !draftStart || draftStart > draftEnd || draftEnd > today;

  /** One option in the range segment. */
  const option = (key: string | number, label: string, isActive: boolean, onSelect: () => void) => (
    <button
      key={key}
      type="button"
      aria-pressed={isActive}
      onClick={onSelect}
      className={cn(
        'rounded px-2.5 py-1 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'text-muted-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      <FilterGroup label="Range">
        <Segmented>
          {option('today', 'Today', active === 'today', () => onChange({ window: 1 }))}
          {option('yesterday', 'Yesterday', active === 'yesterday', () => onChange(yesterdayRange(now, value.window)))}
          {/* 1 is excluded: it is the Today button above, and "1d" beside it
              would be the same range offered twice under two names. */}
          {REPORT_WINDOWS.filter(w => w > 1).map(w => option(w, `${w}d`, active === w, () => onChange({ window: w })))}
          {option(
            'custom',
            custom ? `${value.start} → ${value.end ?? today}` : 'Custom…',
            custom,
            () => setOpen(!open),
          )}
        </Segmented>
      </FilterGroup>

      {custom && (
        <FilterGroup>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Clear the custom range"
            onClick={() => {
              onChange({ window: value.window });
              setOpen(false);
            }}
          >
            <X className="mr-1 size-3.5" />
            Clear
          </Button>
        </FilterGroup>
      )}

      {/* A switch, not a button. Button labels read as actions, so "Bots
          excluded" in an unfilled style read as "click to exclude bots" —
          implying they currently weren't. A switch reads as state: off means
          off, and the label never has to be interpreted as an instruction. It
          also stops the control competing with the window presets beside it,
          where filled genuinely does mean "selected". */}
      <FilterGroup
        label="Accounts"
        hint="Bot and simulation accounts (is_dummy). Off by default — Anonymous players are real people and are always counted."
      >
        <label
          htmlFor="include-bots"
          className="flex h-8 items-center gap-2 text-sm text-muted-foreground"
        >
          <Switch
            id="include-bots"
            checked={includeBots}
            onCheckedChange={onIncludeBotsChange}
          />
          Include bots
        </label>
      </FilterGroup>

      {open && (
        <div className="flex w-full basis-full flex-wrap items-end gap-2 rounded-md border bg-card p-3">
          <label htmlFor="range-start" className="flex flex-col gap-1 text-xs text-muted-foreground">
            From
            <Input
              id="range-start"
              type="date"
              value={draftStart}
              max={draftEnd || today}
              onChange={event => setDraftStart(event.target.value)}
              className="h-8 w-40"
            />
          </label>
          <label htmlFor="range-end" className="flex flex-col gap-1 text-xs text-muted-foreground">
            To
            <Input
              id="range-end"
              type="date"
              value={draftEnd}
              min={draftStart}
              max={today}
              onChange={event => setDraftEnd(event.target.value)}
              className="h-8 w-40"
            />
          </label>
          <Button
            size="sm"
            disabled={invalid}
            onClick={() => {
              onChange({ window: value.window, start: draftStart, end: draftEnd });
              setOpen(false);
            }}
          >
            Apply
          </Button>
          {invalid && (
            <span className="text-xs text-muted-foreground">
              Pick a start date on or before the end date, and not in the future.
            </span>
          )}
        </div>
      )}
    </>
  );
}
