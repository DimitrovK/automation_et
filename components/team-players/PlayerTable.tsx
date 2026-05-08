import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TeamPlayerRow } from '@/types/team';

function formatYears(start: number | null, end: number | null): string {
  if (start === null && end === null) return '—';
  if (start !== null && end === null) return `${start} – present`;
  if (start === null && end !== null) return `? – ${end}`;
  return `${start} – ${end}`;
}

type Props = {
  players: TeamPlayerRow[];
  /** Optional handler called with the footballer id when the user
   *  clicks the row's edit icon. */
  onEdit?: (footballerId: number) => void;
};

export function PlayerTable({ players, onEdit }: Props) {
  if (players.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-gray-500">
        No players match the current filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 text-right font-mono text-xs">ID</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Nation</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Years</TableHead>
            <TableHead className="text-right">Apps</TableHead>
            <TableHead className="text-right">Goals</TableHead>
            <TableHead>Transfer</TableHead>
            {onEdit && <TableHead className="w-12 text-right" aria-label="Actions" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((p) => (
            <TableRow key={p.id} data-testid={`player-row-${p.id}`}>
              <TableCell className="text-right font-mono text-xs text-gray-500">
                #{p.footballer_id}
              </TableCell>
              <TableCell className="font-medium">
                {p.full_name}
                {p.retired && (
                  <Badge variant="outline" className="ml-2 text-xs">retired</Badge>
                )}
              </TableCell>
              <TableCell>
                {p.nation_short ?? p.nation_name ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant={p.role === 'manager' ? 'default' : 'secondary'}>
                  {p.role}
                </Badge>
              </TableCell>
              <TableCell>{formatYears(p.start_year, p.end_year)}</TableCell>
              <TableCell className="text-right">{p.apps ?? '—'}</TableCell>
              <TableCell className="text-right">{p.goals ?? '—'}</TableCell>
              <TableCell>
                <Badge
                  variant={p.transfer_type === 'loan' ? 'destructive' : 'secondary'}
                  className={
                    p.transfer_type === 'loan'
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100'
                      : ''
                  }
                >
                  {p.transfer_type}
                </Badge>
              </TableCell>
              {onEdit && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(p.footballer_id)}
                    aria-label={`Edit ${p.full_name}`}
                    className="size-8"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
