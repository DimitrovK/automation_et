import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TeamHeaderInfo } from '@/types/team';

type Props = { team: TeamHeaderInfo };

export function TeamHeader({ team }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-2xl">{team.name}</CardTitle>
            <CardDescription>
              {team.nation_name ?? 'Unknown nation'}
              {team.founding_year ? ` · founded ${team.founding_year}` : ''}
              {team.parent_team_name ? ` · part of ${team.parent_team_name}` : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" data-testid="players-count">
              {team.total_players} players
            </Badge>
            <Badge variant="outline" data-testid="managers-count">
              {team.total_managers} managers
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
