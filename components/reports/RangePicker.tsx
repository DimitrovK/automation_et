'use client';

import type { RangeState } from '@/lib/report-range';
import { CalendarDays, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isoDay } from '@/lib/report-range';
import { REPORT_WINDOWS } from '@/types/reports';

/**
 * Presets for the common case, explicit dates for everything else.
 *
 * The preset list mirrors ALLOWED_WINDOWS on the BE, which 400s on anything
 * else, so the buttons can't produce a failing request. Custom dates are
 * validated the same way the server does (start <= end, end not in the future)
 * before being applied, so a mistake shows up as a disabled button rather than
 * a red error panel.
 */
export function RangePicker({ value, onChange, includeBots, onIncludeBotsChange }: {
  value: RangeState;
  onChange: (range: RangeState) => void;
  includeBots: boolean;
  onIncludeBotsChange: (v: boolean) => void;
}) {
  const today = isoDay(new Date());
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(value.start ?? '');
  const [draftEnd, setDraftEnd] = useState(value.end ?? today);

  const custom = !!value.start;
  const invalid = !draftStart || draftStart > draftEnd || draftEnd > today;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">Range</span>

      {REPORT_WINDOWS.map(w => (
        <Button
          key={w}
          size="sm"
          variant={!custom && w === value.window ? 'default' : 'outline'}
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

      <Button
        size="sm"
        variant={includeBots ? 'default' : 'outline'}
        onClick={() => onIncludeBotsChange(!includeBots)}
        title="Bot/simulation accounts (is_dummy) are excluded by default"
      >
        {includeBots ? 'Bots included' : 'Bots excluded'}
      </Button>

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
