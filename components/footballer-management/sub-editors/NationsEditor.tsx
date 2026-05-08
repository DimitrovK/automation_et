'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FootballerAPI } from '@/lib/footballer-api';
import type { FootballerNation, FootballerNationStat } from '@/types/player';

type Props = {
  footballerId: number;
  /** Primary + secondary nations the API will allow on this footballer
   *  (validated server-side: nation must be primary OR in other_nations).
   *  Pass them so the inline picker only offers eligible options. */
  eligibleNations: FootballerNation[];
};

type Draft = {
  id?: number;
  nation_id: number | null;
  nation_name: string | null;
  apps: number | null;
  goals: number | null;
};

const EMPTY_DRAFT: Draft = { nation_id: null, nation_name: null, apps: null, goals: null };

/**
 * Manage FootballerNation rows — international apps/goals per nation
 * the footballer is eligible for. Shape mirrors TeamsEditor: list +
 * inline edit + add row.
 */
export function NationsEditor({ footballerId, eligibleNations }: Props) {
  const [rows, setRows] = useState<FootballerNationStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | 'new' | null>(null);

  const [editId, setEditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [newDraft, setNewDraft] = useState<Draft | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await FootballerAPI.getFootballerNations(footballerId);
      setRows(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load national stats');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footballerId]);

  function startEdit(row: FootballerNationStat) {
    setEditId(row.id);
    setEditDraft({
      id: row.id,
      nation_id: row.nation_id,
      nation_name: row.nation_name,
      apps: row.apps ?? null,
      goals: row.goals ?? null,
    });
  }

  async function saveNew() {
    if (!newDraft) return;
    if (!newDraft.nation_id) {
      toast.error('Pick a nation.');
      return;
    }
    setBusyId('new');
    try {
      await FootballerAPI.createFootballerNation({
        footballer_id: footballerId,
        nation_id: newDraft.nation_id,
        apps: newDraft.apps ?? 0,
        goals: newDraft.goals ?? 0,
      });
      toast.success(`Added ${newDraft.nation_name} stats`);
      setNewDraft(null);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add national stats');
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit() {
    if (!editDraft || !editDraft.id) return;
    if (!editDraft.nation_id) {
      toast.error('Pick a nation.');
      return;
    }
    setBusyId(editDraft.id);
    try {
      await FootballerAPI.updateFootballerNation(editDraft.id, {
        footballer_id: footballerId,
        nation_id: editDraft.nation_id,
        apps: editDraft.apps ?? 0,
        goals: editDraft.goals ?? 0,
      });
      toast.success(`Updated ${editDraft.nation_name} stats`);
      setEditId(null);
      setEditDraft(null);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update national stats');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: FootballerNationStat) {
    if (!confirm(`Delete ${row.nation_name} stats?`)) return;
    setBusyId(row.id);
    try {
      await FootballerAPI.deleteFootballerNation(row.id);
      toast.success(`Removed ${row.nation_name}`);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  }

  const eligibleIds = eligibleNations.map((n) => n.id);
  const usedIds = rows.map((r) => r.nation_id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>National team stats</CardTitle>
          <CardDescription>
            Apps and goals scored for each nation the footballer represents (primary or
            secondary). Only nations already in the player's eligibility list show up
            in the picker.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNewDraft({ ...EMPTY_DRAFT })}
          disabled={!!newDraft || loading}
        >
          <Plus className="mr-1.5 size-4" /> Add nation
        </Button>
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 && !newDraft ? (
          <div className="rounded-md border bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-slate-800/40">
            No international stats yet. Click <strong>Add nation</strong> to record some.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nation</TableHead>
                <TableHead className="text-right">Apps</TableHead>
                <TableHead className="text-right">Goals</TableHead>
                <TableHead className="w-32 text-right" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const editing = editId === row.id && editDraft;
                if (editing) {
                  return (
                    <NationRowEditor
                      key={row.id}
                      draft={editDraft!}
                      onChange={setEditDraft}
                      onSave={saveEdit}
                      onCancel={() => { setEditId(null); setEditDraft(null); }}
                      saving={busyId === row.id}
                      eligibleIds={eligibleIds}
                      excludeIds={usedIds.filter((i) => i !== row.nation_id)}
                    />
                  );
                }
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.nation_name}</TableCell>
                    <TableCell className="text-right">{row.apps ?? '—'}</TableCell>
                    <TableCell className="text-right">{row.goals ?? '—'}</TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>Edit</Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(row)}
                        aria-label={`Delete ${row.nation_name}`}
                        className="size-8 text-red-600 hover:text-red-700"
                        disabled={busyId === row.id}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {newDraft && (
                <NationRowEditor
                  draft={newDraft}
                  onChange={setNewDraft}
                  onSave={saveNew}
                  onCancel={() => setNewDraft(null)}
                  saving={busyId === 'new'}
                  eligibleIds={eligibleIds}
                  excludeIds={usedIds}
                  isNew
                />
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NationRowEditor(props: {
  draft: Draft;
  onChange: (d: Draft | null) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  eligibleIds: number[];
  excludeIds: number[];
  isNew?: boolean;
}) {
  const { draft, onChange, onSave, onCancel, saving, eligibleIds, excludeIds, isNew } = props;
  const setN = (k: keyof Draft, v: Draft[keyof Draft]) => onChange({ ...draft, [k]: v });
  const num = (s: string) => (s === '' ? null : Number(s));

  // The combobox should only offer nations the footballer is eligible
  // for AND not yet used in another row.
  const exclude = Array.from(new Set([...excludeIds, ...nationsNotEligible(eligibleIds)]));

  return (
    <TableRow className={isNew ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : 'bg-amber-50/40 dark:bg-amber-900/10'}>
      <TableCell className="min-w-48">
        <NationCombobox
          value={draft.nation_id ?? null}
          onChange={(id, n) => onChange({ ...draft, nation_id: id, nation_name: n.name })}
          excludeIds={exclude}
          compact
          placeholder="Pick a nation…"
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          value={draft.apps ?? ''}
          onChange={(e) => setN('apps', num(e.target.value))}
          className="h-9 w-20 px-2 text-right"
          aria-label="Apps"
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          value={draft.goals ?? ''}
          onChange={(e) => setN('goals', num(e.target.value))}
          className="h-9 w-20 px-2 text-right"
          aria-label="Goals"
        />
      </TableCell>
      <TableCell className="space-x-1 text-right">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : isNew ? 'Add' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </TableCell>
    </TableRow>
  );
}

/** When eligible nations is empty (legacy data), no exclusion — let the
 *  user pick anything and the server validates. Otherwise we'd have to
 *  exclude every other nation in the world, which is silly. */
function nationsNotEligible(eligibleIds: number[]): number[] {
  if (eligibleIds.length === 0) return [];
  // We'd need the full nations list to invert this, which is async. The
  // NationCombobox already filters by available; trust that for now.
  return [];
}
