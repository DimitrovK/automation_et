'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TeamCombobox } from '@/components/footballer-management/TeamCombobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FootballerAPI } from '@/lib/footballer-api';
import type { CreateFootballerTeamRequest, FootballerTeam } from '@/types/player';

type Props = { footballerId: number };

type DraftTeam = Partial<FootballerTeam> & {
  id?: number;
  team_id?: number;
  team_name?: string;
  role: 'player' | 'manager';
  start_year: number | null;
  end_year: number | null;
  apps: number | null;
  goals: number | null;
  transfer_type: 'permanent' | 'loan';
};

const EMPTY_DRAFT: DraftTeam = {
  role: 'player',
  start_year: null,
  end_year: null,
  apps: null,
  goals: null,
  transfer_type: 'permanent',
};

/**
 * Manage a footballer's full FootballerTeam history (player and manager
 * stints). Supports add, edit-in-place, and delete. Add row appears
 * inline below the table; existing rows enter edit mode on the row's
 * Edit button.
 */
export function TeamsEditor({ footballerId }: Props) {
  const [rows, setRows] = useState<FootballerTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<DraftTeam | null>(null);
  const [newDraft, setNewDraft] = useState<DraftTeam | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await FootballerAPI.getFootballerTeams(footballerId);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footballerId]);

  function startEdit(row: FootballerTeam) {
    setEditId(row.id);
    setEditDraft({
      id: row.id,
      team_id: row.team_id,
      team_name: row.team_name,
      role: row.role as 'player' | 'manager',
      start_year: row.start_year ?? null,
      end_year: row.end_year ?? null,
      apps: row.apps ?? null,
      goals: row.goals ?? null,
      transfer_type: (row.transfer_type as 'permanent' | 'loan') ?? 'permanent',
    });
  }

  function cancelEdit() {
    setEditId(null);
    setEditDraft(null);
  }

  function startAdd() {
    setNewDraft({ ...EMPTY_DRAFT });
  }

  function cancelAdd() {
    setNewDraft(null);
  }

  function validate(d: DraftTeam): string | null {
    if (!d.team_id) return 'Pick a team.';
    if (d.start_year !== null && (d.start_year < 1850 || d.start_year > 2100)) {
      return 'Start year looks wrong.';
    }
    if (d.end_year !== null && d.start_year !== null && d.end_year < d.start_year) {
      return 'End year must be ≥ start year.';
    }
    return null;
  }

  function buildPayload(d: DraftTeam): CreateFootballerTeamRequest {
    return {
      footballer_id: footballerId,
      team_id: d.team_id!,
      role: d.role,
      apps: d.apps ?? 0,
      goals: d.goals ?? 0,
      transfer_type: d.transfer_type,
      start_year: d.start_year ?? 0,
      end_year: d.end_year ?? null,
    };
  }

  async function saveNew() {
    if (!newDraft) return;
    const err = validate(newDraft);
    if (err) {
      toast.error(err);
      return;
    }
    setSavingId('new');
    try {
      await FootballerAPI.createFootballerTeam(buildPayload(newDraft));
      toast.success(`Added ${newDraft.team_name} stint`);
      setNewDraft(null);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add team');
    } finally {
      setSavingId(null);
    }
  }

  async function saveEdit() {
    if (!editDraft || !editDraft.id) return;
    const err = validate(editDraft);
    if (err) {
      toast.error(err);
      return;
    }
    setSavingId(editDraft.id);
    try {
      await FootballerAPI.patchFootballerTeam(editDraft.id, {
        role: editDraft.role,
        start_year: editDraft.start_year ?? undefined,
        end_year: editDraft.end_year,
        apps: editDraft.apps ?? undefined,
        goals: editDraft.goals ?? undefined,
        transfer_type: editDraft.transfer_type,
        team_id: editDraft.team_id,
      });
      toast.success(`Updated ${editDraft.team_name} stint`);
      setEditId(null);
      setEditDraft(null);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update team stint');
    } finally {
      setSavingId(null);
    }
  }

  async function remove(row: FootballerTeam) {
    if (!confirm(`Delete ${row.team_name} (${row.role}) stint? This cannot be undone.`)) return;
    setSavingId(row.id);
    try {
      await FootballerAPI.deleteFootballerTeam(row.id);
      toast.success(`Removed ${row.team_name} stint`);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete team');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Teams & manager stints</CardTitle>
          <CardDescription>
            Every club this footballer was registered with. Add a new stint with the button on the right.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={startAdd}
          disabled={!!newDraft || loading}
        >
          <Plus className="mr-1.5 size-4" />
          Add stint
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && rows.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" /> Loading stints…
          </div>
        ) : rows.length === 0 && !newDraft ? (
          <div className="rounded-md border bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-slate-800/40">
            No team stints yet. Click <strong>Add stint</strong> to create the first one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Years</TableHead>
                <TableHead className="text-right">Apps</TableHead>
                <TableHead className="text-right">Goals</TableHead>
                <TableHead>Transfer</TableHead>
                <TableHead className="w-32 text-right" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isEditing = editId === row.id && editDraft;
                if (isEditing) {
                  return (
                    <RowEditor
                      key={row.id}
                      draft={editDraft!}
                      saving={savingId === row.id}
                      onChange={(d) => setEditDraft(d)}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                    />
                  );
                }
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.team_name}</TableCell>
                    <TableCell>
                      <Badge variant={row.role === 'manager' ? 'default' : 'secondary'}>
                        {row.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.start_year ?? '—'}–{row.end_year ?? 'present'}
                    </TableCell>
                    <TableCell className="text-right">{row.apps ?? '—'}</TableCell>
                    <TableCell className="text-right">{row.goals ?? '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={row.transfer_type === 'loan' ? 'destructive' : 'secondary'}
                        className={
                          row.transfer_type === 'loan'
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100'
                            : ''
                        }
                      >
                        {row.transfer_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(row)}
                        disabled={savingId === row.id}
                        aria-label={`Delete ${row.team_name}`}
                        className="ml-1 size-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {newDraft && (
                <RowEditor
                  draft={newDraft}
                  saving={savingId === 'new'}
                  onChange={(d) => setNewDraft(d)}
                  onSave={saveNew}
                  onCancel={cancelAdd}
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

// ---- inline row editor ------------------------------------------------

function RowEditor(props: {
  draft: DraftTeam;
  saving: boolean;
  onChange: (d: DraftTeam) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const { draft, saving, onChange, onSave, onCancel, isNew } = props;
  const set = <K extends keyof DraftTeam>(k: K, v: DraftTeam[K]) =>
    onChange({ ...draft, [k]: v });

  const numOrNull = (s: string) => {
    if (s === '' || s === null) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return (
    <TableRow className={isNew ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : 'bg-amber-50/40 dark:bg-amber-900/10'}>
      <TableCell className="min-w-48">
        <TeamCombobox
          value={draft.team_id ? { id: draft.team_id, name: draft.team_name || '' } : null}
          onChange={(t) => onChange({ ...draft, team_id: t.id, team_name: t.name })}
          compact
        />
      </TableCell>
      <TableCell>
        <Select value={draft.role} onValueChange={(v) => set('role', v as 'player' | 'manager')}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="Start"
            value={draft.start_year ?? ''}
            onChange={(e) => set('start_year', numOrNull(e.target.value))}
            className="h-9 w-20 px-2"
            aria-label="Start year"
          />
          <span className="text-gray-400">–</span>
          <Input
            type="number"
            placeholder="End"
            value={draft.end_year ?? ''}
            onChange={(e) => set('end_year', numOrNull(e.target.value))}
            className="h-9 w-20 px-2"
            aria-label="End year"
          />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          value={draft.apps ?? ''}
          onChange={(e) => set('apps', numOrNull(e.target.value))}
          className="h-9 w-20 px-2 text-right"
          aria-label="Apps"
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          value={draft.goals ?? ''}
          onChange={(e) => set('goals', numOrNull(e.target.value))}
          className="h-9 w-20 px-2 text-right"
          aria-label="Goals"
        />
      </TableCell>
      <TableCell>
        <Select
          value={draft.transfer_type}
          onValueChange={(v) => set('transfer_type', v as 'permanent' | 'loan')}
        >
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="permanent">Permanent</SelectItem>
            <SelectItem value="loan">Loan</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="space-x-1 text-right">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : isNew ? 'Add' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </TableCell>
    </TableRow>
  );
}

