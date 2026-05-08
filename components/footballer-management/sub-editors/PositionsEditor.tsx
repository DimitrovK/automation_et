'use client';

import { ArrowDown, ArrowUp, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FootballerAPI } from '@/lib/footballer-api';
import { cn } from '@/lib/utils';
import type { FootballerPosition, Position } from '@/types/player';

type Props = { footballerId: number };

type Local = {
  position_id: number;
  position_name: string;
  position_full_name: string;
  position_role: string;
  is_primary: boolean;
  sort_order: number;
};

/**
 * Manage footballer positions via the atomic ``set-positions`` action.
 *
 * Local state holds the in-progress edit; clicking **Save** sends the
 * full new list. ``set-positions`` deletes existing rows and recreates
 * the new set in one transaction, so partial application is impossible.
 */
export function PositionsEditor({ footballerId }: Props) {
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [initial, setInitial] = useState<Local[]>([]);
  const [draft, setDraft] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerValue, setPickerValue] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      FootballerAPI.getPositions(),
      FootballerAPI.getFootballerPositions(footballerId),
    ])
      .then(([positions, assigned]) => {
        if (cancelled) return;
        setAllPositions(positions);
        const local = assignmentsToLocal(assigned);
        setInitial(local);
        setDraft(local);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Failed to load positions');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [footballerId]);

  const usedIds = useMemo(() => new Set(draft.map((d) => d.position_id)), [draft]);
  const available = useMemo(
    () => allPositions.filter((p) => !usedIds.has(p.id)).sort((a, b) => a.sort_order - b.sort_order),
    [allPositions, usedIds],
  );

  const dirty = useMemo(
    () => JSON.stringify(initial) !== JSON.stringify(draft),
    [initial, draft],
  );

  function add() {
    const id = Number(pickerValue);
    if (!Number.isInteger(id) || id <= 0) return;
    const pos = allPositions.find((p) => p.id === id);
    if (!pos) return;
    const newRow: Local = {
      position_id: pos.id,
      position_name: pos.name,
      position_full_name: pos.full_name,
      position_role: pos.role,
      is_primary: draft.length === 0, // First one defaults to primary.
      sort_order: draft.length,
    };
    setDraft([...draft, newRow]);
    setPickerValue('');
  }

  function setPrimary(idx: number) {
    setDraft(draft.map((d, i) => ({ ...d, is_primary: i === idx })));
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...draft];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setDraft(next.map((row, i) => ({ ...row, sort_order: i })));
  }

  function remove(idx: number) {
    const next = draft.filter((_, i) => i !== idx).map((row, i) => ({ ...row, sort_order: i }));
    // If we just removed the primary, promote the first remaining row.
    if (next.length > 0 && !next.some((r) => r.is_primary)) {
      next[0].is_primary = true;
    }
    setDraft(next);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = draft.map((d) => ({
        position_id: d.position_id,
        is_primary: d.is_primary,
        sort_order: d.sort_order,
      }));
      const created = await FootballerAPI.setPositions({
        footballer_id: footballerId,
        positions: payload,
      });
      const next = assignmentsToLocal(created);
      setInitial(next);
      setDraft(next);
      toast.success('Positions saved');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save positions');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDraft(initial);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions</CardTitle>
        <CardDescription>
          Marks which positions this footballer plays. Exactly one is the primary
          (used for the "main position" badge across games). Re-order with the
          arrow buttons; the order shapes scout/grid display.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* Add row */}
            <div className="flex items-center gap-2">
              <Select value={pickerValue} onValueChange={setPickerValue}>
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue placeholder="Pick a position…" />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">All positions assigned.</div>
                  ) : available.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <span className="font-medium">{p.full_name}</span>
                      <span className="ml-2 text-xs text-gray-500">{p.role} · {p.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={add} disabled={!pickerValue}>
                <Plus className="mr-1.5 size-4" /> Add
              </Button>
            </div>

            {/* Picked list */}
            {draft.length === 0 ? (
              <div className="rounded-md border bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-slate-800/40">
                No positions assigned yet.
              </div>
            ) : (
              <ul className="divide-y rounded-md border dark:divide-slate-700 dark:border-slate-700">
                {draft.map((d, idx) => (
                  <li key={d.position_id} className="flex items-center gap-2 px-3 py-2">
                    <Badge variant="outline" className="min-w-12 justify-center font-mono text-xs">
                      {d.position_name}
                    </Badge>
                    <span className="flex-1 truncate text-sm">{d.position_full_name}</span>
                    <Badge variant="secondary" className="text-xs">{d.position_role}</Badge>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setPrimary(idx)}
                      aria-label={d.is_primary ? 'Primary position' : 'Make primary'}
                      className={cn('size-8', d.is_primary ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600')}
                    >
                      <Star className={d.is_primary ? 'size-4 fill-current' : 'size-4'} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up" className="size-8">
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === draft.length - 1} aria-label="Move down" className="size-8">
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(idx)} aria-label="Remove" className="size-8 text-red-600 hover:text-red-700">
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              {dirty && (
                <span className="mr-auto text-xs text-amber-700 dark:text-amber-300">
                  Unsaved changes
                </span>
              )}
              <Button variant="ghost" onClick={reset} disabled={!dirty || saving}>Reset</Button>
              <Button onClick={save} disabled={!dirty || saving}>
                {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                Save positions
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function assignmentsToLocal(rows: FootballerPosition[]): Local[] {
  return [...rows]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order || a.id - b.id;
    })
    .map((r, i) => ({
      position_id: r.position_id,
      position_name: r.position_name,
      position_full_name: r.position_full_name,
      position_role: r.position_role,
      is_primary: r.is_primary,
      sort_order: i,
    }));
}
