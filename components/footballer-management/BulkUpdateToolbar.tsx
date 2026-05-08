'use client';

import { CheckSquare, Loader2, MinusSquare, Square, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FootballerAPI } from '@/lib/footballer-api';
import type { FootballerBulkUpdates } from '@/types/player';

type Props = {
  /** Ids of every footballer rendered in the current result set —
   *  used by the "select all" toggle. */
  visibleIds: number[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onApplied: () => void;
  className?: string;
};

const STATUS_CHOICES: { value: NonNullable<FootballerBulkUpdates['status']>; label: string }[] = [
  { value: 'AWAITING_REVISION', label: 'Awaiting Revision' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'AWAITING_CHANGE_CHECK', label: 'Awaiting Change Check' },
];

const DIFFICULTY_CHOICES: {
  value: NonNullable<FootballerBulkUpdates['career_path_difficulty']>;
  label: string;
}[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HARD', label: 'Hard' },
  { value: 'EXTREME', label: 'Extreme' },
];

/**
 * Bulk-update toolbar: select footballers from the list and apply a
 * fixed-allowlist set of field updates in one call.
 *
 * Lives above the result list. Stays inert (no API call) until the
 * user picks at least one footballer AND chooses at least one field
 * update.
 */
export function BulkUpdateToolbar({
  visibleIds,
  selectedIds,
  onSelectionChange,
  onApplied,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<FootballerBulkUpdates>({});
  const [submitting, setSubmitting] = useState(false);

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && visibleIds.some((id) => selectedIds.has(id));

  const updateCount = Object.keys(updates).filter(
    (k) => updates[k as keyof FootballerBulkUpdates] !== undefined,
  ).length;

  const canApply = selectedIds.size > 0 && updateCount > 0;

  const summary = useMemo(() => {
    if (selectedIds.size === 0) return 'No footballers selected.';
    if (selectedIds.size === 1) return '1 footballer selected.';
    return `${selectedIds.size} footballers selected.`;
  }, [selectedIds]);

  function toggleAll() {
    if (allSelected || someSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(visibleIds));
    }
  }

  function setUpdate<K extends keyof FootballerBulkUpdates>(
    key: K,
    value: FootballerBulkUpdates[K] | undefined,
  ) {
    setUpdates((u) => {
      const next = { ...u };
      if (value === undefined) delete next[key];
      else (next[key] as FootballerBulkUpdates[K]) = value;
      return next;
    });
  }

  async function apply() {
    if (!canApply) return;
    setSubmitting(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await FootballerAPI.bulkUpdateFootballers(ids, updates);
      toast.success(
        res.updated === 1
          ? '1 footballer updated.'
          : `${res.updated} footballers updated.`,
      );
      // Drop the selection + reset the staged updates after success so
      // the toolbar doesn't keep firing the same change on a later refresh.
      onSelectionChange(new Set());
      setUpdates({});
      setOpen(false);
      onApplied();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setSubmitting(false);
    }
  }

  const SelectAllIcon = allSelected ? CheckSquare : someSelected ? MinusSquare : Square;

  return (
    <Card className={className}>
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={visibleIds.length === 0}
            className="gap-2"
          >
            <SelectAllIcon className="size-4" />
            {allSelected ? 'Deselect all' : 'Select all on this page'}
          </Button>

          <span className="text-sm text-gray-600 dark:text-gray-300">{summary}</span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant={open ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOpen((o) => !o)}
              disabled={selectedIds.size === 0}
              className="gap-2"
            >
              <Wand2 className="size-4" />
              {open ? 'Hide bulk actions' : 'Bulk actions'}
            </Button>
          </div>
        </div>

        {open && (
          <div className="grid grid-cols-1 gap-3 rounded-md border bg-gray-50/50 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:bg-slate-800/40">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Status
              </label>
              <Select
                value={updates.status ?? '__noop__'}
                onValueChange={(v) =>
                  setUpdate('status', v === '__noop__' ? undefined : (v as FootballerBulkUpdates['status']))
                }
              >
                <SelectTrigger><SelectValue placeholder="Don't change" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__noop__">Don't change</SelectItem>
                  {STATUS_CHOICES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Career path difficulty
              </label>
              <Select
                value={updates.career_path_difficulty ?? '__noop__'}
                onValueChange={(v) =>
                  setUpdate(
                    'career_path_difficulty',
                    v === '__noop__'
                      ? undefined
                      : (v as FootballerBulkUpdates['career_path_difficulty']),
                  )
                }
              >
                <SelectTrigger><SelectValue placeholder="Don't change" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__noop__">Don't change</SelectItem>
                  {DIFFICULTY_CHOICES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <BoolFlag
              label="Retired"
              value={updates.retired}
              onChange={(v) => setUpdate('retired', v)}
            />
            <BoolFlag
              label="Is player"
              value={updates.is_player}
              onChange={(v) => setUpdate('is_player', v)}
            />
            <BoolFlag
              label="Is manager"
              value={updates.is_manager}
              onChange={(v) => setUpdate('is_manager', v)}
            />
            <BoolFlag
              label="Might change"
              value={updates.might_change}
              onChange={(v) => setUpdate('might_change', v)}
            />
            <BoolFlag
              label="Available for Career Path"
              value={updates.available_for_career_path}
              onChange={(v) => setUpdate('available_for_career_path', v)}
            />
            <BoolFlag
              label="Available for Grid"
              value={updates.available_for_grid}
              onChange={(v) => setUpdate('available_for_grid', v)}
            />
            <BoolFlag
              label="Available for Scout"
              value={updates.available_for_scout}
              onChange={(v) => setUpdate('available_for_scout', v)}
            />
          </div>
        )}

        {open && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 dark:border-slate-700">
            <div className="text-xs text-gray-500">
              {updateCount === 0
                ? 'Pick at least one field to change.'
                : `${updateCount} ${updateCount === 1 ? 'field' : 'fields'} will be applied to ${selectedIds.size} ${
                    selectedIds.size === 1 ? 'footballer' : 'footballers'
                  }.`}
            </div>
            <Button onClick={apply} disabled={!canApply || submitting}>
              {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Apply to {selectedIds.size} {selectedIds.size === 1 ? 'footballer' : 'footballers'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BoolFlag({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  // Tri-state: undefined (don't change) → true → false → undefined.
  // The label-click cycles, the Switch directly sets true/false; the
  // small ✕ button on the right clears the field back to undefined.
  return (
    <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center gap-2">
        <Switch
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
          aria-label={label}
        />
        <span className="text-sm">{label}</span>
      </div>
      <span
        className={
          'text-xs '
          + (value === undefined ? 'text-gray-400' : value ? 'text-emerald-600' : 'text-red-600')
        }
      >
        {value === undefined ? 'no change' : value ? 'will be true' : 'will be false'}
      </span>
      {value !== undefined && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="ml-2 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label={`Clear ${label}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
