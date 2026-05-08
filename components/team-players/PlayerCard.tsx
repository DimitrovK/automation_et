import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TeamPlayerRow } from '@/types/team';

function formatYears(start: number | null, end: number | null): string {
  if (start === null && end === null) return '—';
  if (start !== null && end === null) return `${start} – present`;
  if (start === null && end !== null) return `? – ${end}`;
  return `${start} – ${end}`;
}

type Props = {
  player: TeamPlayerRow;
  /** Optional handler called with the footballer id when the user
   *  clicks the inline edit button. The parent decides where to send
   *  them — usually `/footballer-management?edit=<id>`. */
  onEdit?: (footballerId: number) => void;
};

export function PlayerCard({ player, onEdit }: Props) {
  return (
    <Card data-testid={`player-card-${player.id}`} className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-2 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight">{player.full_name}</h3>
            <p className="text-xs font-mono text-gray-400">#{player.footballer_id}</p>
          </div>
          <Badge variant={player.role === 'manager' ? 'default' : 'secondary'}>
            {player.role}
          </Badge>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300">
          {player.nation_name ?? 'Unknown'}
          {player.nation_short ? ` (${player.nation_short})` : ''}
          {player.retired ? ' · retired' : ''}
        </div>

        <div className="text-sm font-medium">
          {formatYears(player.start_year, player.end_year)}
        </div>

        {player.role === 'player' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{player.apps ?? 0} apps</Badge>
            <Badge variant="outline">{player.goals ?? 0} goals</Badge>
            <Badge
              variant={player.transfer_type === 'loan' ? 'destructive' : 'secondary'}
              className={
                player.transfer_type === 'loan'
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100'
                  : ''
              }
            >
              {player.transfer_type}
            </Badge>
          </div>
        )}

        {onEdit && (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(player.footballer_id)}
              aria-label={`Edit ${player.full_name}`}
              className="h-8 w-full"
            >
              <Pencil className="mr-1.5 size-3.5" />
              Edit footballer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
