'use client';

import type { RangeState } from '@/lib/report-range';
import { CalendarDays, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { activePreset, isoDay, yesterdayRange } from '@/lib/report-range';
import { REPORT_WINDOWS } from '@/types/reports';
import { Switch } from '@/components/ui/switch';

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">Range</span>

      <Button
        size="sm"
        variant={active === 'today' ? 'default' : 'outline'}
        onClick={() => onChange({ window: 1 })}
      >
        Today
      </Button>
      <Button
        size="sm"
        variant={active === 'yesterday' ? 'default' : 'outline'}
        onClick={() => onChange(yesterdayRange(now, value.window))}
      >
        Yesterday
      </Button>

      {/* 1 is excluded: it is the Today button above, and "1d" beside it would
          be the same range offered twice under two names. */}
      {REPORT_WINDOWS.filter(w => w > 1).map(w => (
        <Button
          key={w}
          size="sm"
          variant={active === w ? 'default' : 'outline'}
          onClick={() => onChange({ window: w })}
        >
          {w}
          d
        </Button>
      ))}

      <Button
        size="sm"
        variant={custom ? 'default' : 'outline'}
        onClick={() => setOpen(!open)}
        title="Pick exact dates"
      >
        <CalendarDays className="mr-1 size-3.5" />
        {custom ? `${value.start} → ${value.end ?? today}` : 'Custom'}
        {custom && (
          <X
            className="ml-1 size-3"
            onClick={(event) => {
              event.stopPropagation();
              onChange({ window: value.window });
              setOpen(false);
            }}
          />
        )}
      </Button>

      {/* A switch, not a button. Button labels read as actions, so "Bots
          excluded" in an unfilled style read as "click to exclude bots" —
          implying they currently weren't. A switch reads as state: off means
          off, and the label never has to be interpreted as an instruction. It
          also stops the control competing with the window presets beside it,
          where filled genuinely does mean "selected". */}
      <label
        htmlFor="include-bots"
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
        title="Bot and simulation accounts (is_dummy). Off by default — Anonymous players are real people and are always counted."
      >
        <Switch
          id="include-bots"
          checked={includeBots}
          onCheckedChange={onIncludeBotsChange}
        />
        Include bots
      </label>

      {open && (
        <div className="flex w-full flex-wrap items-end gap-2 rounded-md border bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <label htmlFor="range-start" className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
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
          <label htmlFor="range-end" className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
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
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Pick a start date on or before the end date, and not in the future.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
