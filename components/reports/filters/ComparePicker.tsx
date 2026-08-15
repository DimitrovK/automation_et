'use client';

import { CalendarDays, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isoDay } from '@/lib/report-range';

/** What the offsets are called. Beyond three, the dates say it better. */
const OFFSETS: { value: number; label: string }[] = [
  { value: 1, label: 'Previous period' },
  { value: 2, label: '2 periods back' },
  { value: 3, label: '3 periods back' },
];

/**
 * What the selected range is compared against.
 *
 * Against the immediately preceding period alone, a steady decline reads as
 * flat: every period is a few points down on the one before, and only the one
 * before that shows the slope. "One bad week" and "a trend" are the same
 * picture until you can look further back.
 *
 * Named periods are the other half — "this month against launch month" is a
 * question no offset expresses.
 */
export function ComparePicker({ offset, start, end, onChange }: {
  offset: number;
  start?: string;
  end?: string;
  onChange: (next: { compareOffset: number; compareStart?: string; compareEnd?: string }) => void;
}) {
  const today = isoDay(new Date());
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(start ?? '');
  const [draftEnd, setDraftEnd] = useState(end ?? '');

  const named = !!start;
  // Same rules the API enforces, so a mistake is a disabled button rather than
  // an error panel. An empty end is allowed: it means a single day.
  const invalid = !draftStart
    || draftStart > today
    || (!!draftEnd && (draftStart > draftEnd || draftEnd > today));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Compared with</span>

      {OFFSETS.map(({ value, label }) => (
        <Button
          key={value}
          size="sm"
          variant={!named && value === offset ? 'default' : 'outline'}
          // The named period must be cleared explicitly. `update` merges
          // patches, and an explicit period outranks the offset everywhere
          // downstream — so leaving it set would make this button do nothing
          // while looking selected.
          onClick={() => onChange({ compareOffset: value, compareStart: undefined, compareEnd: undefined })}
        >
          {label}
        </Button>
      ))}

      <Button
        size="sm"
        variant={named ? 'default' : 'outline'}
        onClick={() => setOpen(!open)}
        title="Compare against a specific period"
      >
        <CalendarDays className="mr-1 size-3.5" />
        {named ? `${start} → ${end ?? start}` : 'Specific period'}
      </Button>

      {/* A real button, not an icon inside one. Nesting it made clearing
          mouse-only — no tab stop, no name for a screen reader — and a
          <button> inside a <button> is invalid markup besides. */}
      {named && (
        <Button
          size="sm"
          variant="ghost"
          aria-label="Clear the comparison period"
          onClick={() => {
            onChange({ compareOffset: offset, compareStart: undefined, compareEnd: undefined });
            setOpen(false);
          }}
        >
          <X className="size-3.5" />
        </Button>
      )}

      {open && (
        <div className="flex w-full flex-wrap items-end gap-2 rounded-md border bg-card p-3">
          <label htmlFor="compare-start" className="flex flex-col gap-1 text-xs text-muted-foreground">
            From
            <Input
              id="compare-start"
              type="date"
              value={draftStart}
              max={draftEnd || today}
              onChange={event => setDraftStart(event.target.value)}
              className="h-8 w-40"
            />
          </label>
          <label htmlFor="compare-end" className="flex flex-col gap-1 text-xs text-muted-foreground">
            To
            <Input
              id="compare-end"
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
              onChange({
                compareOffset: offset,
                compareStart: draftStart,
                compareEnd: draftEnd || undefined,
              });
              setOpen(false);
            }}
          >
            Apply
          </Button>
          <span className="text-xs text-muted-foreground">
            {invalid
              ? 'Pick a start date on or before the end date, and not in the future.'
              : 'A period of a different length shows totals without a percentage — a rate across unequal spans describes the calendar, not the platform.'}
          </span>
        </div>
      )}
    </div>
  );
}
