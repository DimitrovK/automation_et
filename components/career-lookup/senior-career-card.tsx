import type { Footballer, FootballerTeam, n8nWikiPlayerData, Team } from '@/types/player';
import { AlertTriangle, Check, ExternalLink, HelpCircle, Loader2, RefreshCw, Search, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import { GraphiteButton } from '@/components/ui/graphite-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRowSync } from '@/hooks/use-row-sync';
import config from '@/lib/config';
import { FootballerAPI } from '@/lib/footballer-api';
import { RowSyncButton } from './shared/row-sync-button';

type ClubSyncStatus = 'synced' | 'mismatch' | 'not-in-db' | 'not-found' | 'db-only';

type SeniorCareerCardProps = {
  playerData: n8nWikiPlayerData;
  dbPlayerInfo?: Footballer | null;
  /**
   * Live DB team rows, lifted from the page so per-row inline syncs feed
   * back here and the comparison reruns against fresh data. Falls back to
   * `dbPlayerInfo.teams_played_for` for backwards compatibility.
   */
  dbFootballerTeams?: FootballerTeam[];
  /** Required to enable per-row sync buttons. */
  footballerId?: number | null;
  chosenDataSource?: 'wikipedia' | 'database' | null;
  onDataSourceChange?: (dataSource: 'wikipedia' | 'database') => void;
  /** Called after a successful per-row sync so the parent can refetch DB teams. */
  onClubStatsUpdated?: () => void;
};

function inferTransferType(typeOfTransfer: string | undefined): 'permanent' | 'loan' {
  return (typeOfTransfer || '').toLowerCase().includes('loan') ? 'loan' : 'permanent';
}

/** True iff every tracked stat field on a wiki/DB pair already matches. */
function isClubSynced(wikiTeam: Team, dbTeam: FootballerTeam): boolean {
  return (
    dbTeam.apps === wikiTeam.appearances
    && dbTeam.goals === wikiTeam.goals
    && dbTeam.start_year === wikiTeam.joinYear
    && dbTeam.end_year === wikiTeam.departYear
    && dbTeam.transfer_type === inferTransferType(wikiTeam.typeOfTransfer)
  );
}

export function SeniorCareerCard({
  playerData,
  dbPlayerInfo,
  dbFootballerTeams,
  footballerId,
  chosenDataSource,
  onDataSourceChange,
  onClubStatsUpdated,
}: SeniorCareerCardProps) {
  const sync = useRowSync<number>();

  // Authoritative DB team rows — prefer the lifted prop (refetched after
  // each inline sync) over the snapshot embedded in `dbPlayerInfo`.
  const liveDbTeams: FootballerTeam[] = dbFootballerTeams ?? dbPlayerInfo?.teams_played_for ?? [];
  const dbByTeamId = new Map<number, FootballerTeam>(liveDbTeams.map(t => [t.team_id, t]));

  /** Per-row sync status keyed by wiki teamID; `null` when no actionable sync. */
  const getClubSyncStatus = (team: Team, source: 'wikipedia' | 'database' | 'both'): ClubSyncStatus => {
    if (source === 'database') {
      return 'db-only';
    }
    if (!team.teamFound || team.teamID == null) {
      return 'not-found';
    }
    const dbTeam = dbByTeamId.get(team.teamID);
    if (!dbTeam) {
      return 'not-in-db';
    }
    return isClubSynced(team, dbTeam) ? 'synced' : 'mismatch';
  };

  // `sync.run` rethrows so `runAll` can sequence a batch and `useRowSync`
  // semantics stay consistent across single + batch callers. For single
  // click handlers we swallow at the boundary — the failure already lives
  // in `sync.errors` and the UI reads from there.
  const handleAddClub = async (team: Team) => {
    if (!footballerId || !team.teamID) {
      return;
    }
    try {
      await sync.run(team.teamID, async () => {
        await FootballerAPI.createFootballerTeam({
          footballer_id: footballerId,
          team_id: team.teamID!,
          role: 'player',
          apps: team.appearances,
          goals: team.goals,
          transfer_type: inferTransferType(team.typeOfTransfer),
          start_year: team.joinYear,
          end_year: team.departYear,
        });
        onClubStatsUpdated?.();
      }, 'Failed to add club');
    } catch {
      // Captured in sync.errors[team.teamID] for the UI.
    }
  };

  const handleUpdateClub = async (team: Team) => {
    if (!footballerId || team.teamID == null) {
      return;
    }
    const dbTeam = dbByTeamId.get(team.teamID);
    if (!dbTeam) {
      return;
    }
    try {
      await sync.run(team.teamID, async () => {
        await FootballerAPI.updateFootballerTeam(dbTeam.id, {
          footballer_id: footballerId,
          team_id: dbTeam.team_id,
          role: dbTeam.role,
          apps: team.appearances,
          goals: team.goals,
          transfer_type: inferTransferType(team.typeOfTransfer),
          start_year: team.joinYear,
          end_year: team.departYear,
        });
        onClubStatsUpdated?.();
      }, 'Failed to update club');
    } catch {
      // Captured in sync.errors[team.teamID] for the UI.
    }
  };

  // Count pending operations across all wiki rows that have an actionable
  // status. Drives the "Sync All (N)" affordance.
  const pendingSyncCount = playerData.teams.reduce((acc, team) => {
    const status = getClubSyncStatus(team, 'wikipedia');
    return acc + (status === 'mismatch' || status === 'not-in-db' ? 1 : 0);
  }, 0);

  const handleSyncAll = async () => {
    if (!footballerId) {
      return;
    }
    const ops: Array<() => Promise<void>> = [];
    for (const team of playerData.teams) {
      const status = getClubSyncStatus(team, 'wikipedia');
      if (status === 'mismatch') {
        ops.push(() => handleUpdateClub(team));
      } else if (status === 'not-in-db') {
        ops.push(() => handleAddClub(team));
      }
    }
    await sync.runAll(ops);
  };

  // Generate admin links using config
  const getTeamAdminLink = (team: Team) => {
    if (!team.teamFound || !team.teamID) {
      return null;
    }
    return config.getAdminUrl(`FootballData/team/${team.teamID}/change/`);
  };

  // Check if there are any conflicts at all (including team count mismatch)
  const hasAnyTeamConflicts = () => {
    if (!playerData.playerFoundInDB || !dbPlayerInfo) {
      return false;
    }

    // Check for team count mismatch
    const wikiTeamCount = playerData.teams.length;
    const dbTeamCount = dbPlayerInfo.teams_played_for.length;
    if (wikiTeamCount !== dbTeamCount) {
      return true;
    }

    // Check for individual team conflicts
    return playerData.teams.some((team, index) => {
      const dbTeam = dbPlayerInfo.teams_played_for[index];
      if (!dbTeam) {
        return false;
      }

      const wikiTransferType = (team.typeOfTransfer || '').toLowerCase().trim();
      const wikiType = wikiTransferType.includes('loan') ? 'loan' : 'permanent';

      return team.appearances !== dbTeam.apps || team.goals !== dbTeam.goals
        || team.joinYear !== dbTeam.start_year || team.departYear !== dbTeam.end_year
        || wikiType !== dbTeam.transfer_type;
    });
  };

  // Check for team count mismatch specifically
  const hasTeamCountMismatch = () => {
    if (!playerData.playerFoundInDB || !dbPlayerInfo) {
      return false;
    }
    return playerData.teams.length !== dbPlayerInfo.teams_played_for.length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Senior Career</CardTitle>
            <CardDescription>
              Complete club history and statistics
              {footballerId
                ? (
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      💡 You can sync club stats here directly, or they will be included when you click Deploy/Update Footballer below.
                    </span>
                  )
                : (
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      📋 Club stats will be created automatically when you deploy the footballer below.
                    </span>
                  )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Sync All — only when a footballer exists and at least one row is actionable. */}
            {footballerId && pendingSyncCount > 0 && (
              <Button
                size="sm"
                onClick={handleSyncAll}
                disabled={sync.syncingAll}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
              >
                {sync.syncingAll
                  ? (
                      <>
                        <Loader2 className="mr-1 size-4 animate-spin" />
                        Syncing...
                      </>
                    )
                  : (
                      <>
                        <RefreshCw className="mr-1 size-4" />
                        Sync All (
                        {pendingSyncCount}
                        )
                      </>
                    )}
              </Button>
            )}
            {/* Data Source Buttons - Only show for players in DB with conflicts */}
            {playerData.playerFoundInDB && dbPlayerInfo && hasAnyTeamConflicts() && (
              <>
                <GraphiteButton
                  onClick={() => onDataSourceChange?.('wikipedia')}
                  size="sm"
                  icon={Search}
                >
                  Use Wikipedia Data
                </GraphiteButton>
                <ApiButton
                  onClick={() => onDataSourceChange?.('database')}
                  size="sm"
                  icon={Shield}
                >
                  Use Database Data
                </ApiButton>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Team Conflicts Warning for DB Players */}
        {playerData.playerFoundInDB && dbPlayerInfo && (hasAnyTeamConflicts() || hasTeamCountMismatch()) && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
            <AlertTriangle className="size-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Team Data Comparison:</strong>
              {' '}
              This player exists in the database with the following conflicts:
              <div className="mt-2 space-y-1">
                {hasTeamCountMismatch() && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3 text-amber-600" />
                    <span>
                      <strong>Team Count Mismatch:</strong>
                      {' '}
                      Wikipedia has
                      {playerData.teams.length}
                      {' '}
                      teams,
                      Database has
                      {dbPlayerInfo.teams_played_for.length}
                      {' '}
                      teams
                      {(() => {
                        const wikiCount = playerData.teams.length;
                        const dbCount = dbPlayerInfo.teams_played_for.length;

                        if (wikiCount > dbCount) {
                          const extraTeams = wikiCount - dbCount;
                          const extraTeamNames = playerData.teams
                            .slice(dbCount)
                            .map(team => team.teamName)
                            .join(', ');
                          return (
                            <span className="mt-1 block text-sm">
                              📊
                              {' '}
                              <strong>
                                Wikipedia has
                                {extraTeams}
                                {' '}
                                additional team
                                {extraTeams > 1 ? 's' : ''}
                                :
                              </strong>
                              {' '}
                              {extraTeamNames}
                            </span>
                          );
                        } else if (dbCount > wikiCount) {
                          const extraTeams = dbCount - wikiCount;
                          const extraTeamNames = dbPlayerInfo.teams_played_for
                            .slice(wikiCount)
                            .map(team => team.team_name)
                            .join(', ');
                          return (
                            <span className="mt-1 block text-sm">
                              🏛️
                              {' '}
                              <strong>
                                Database has
                                {extraTeams}
                                {' '}
                                additional team
                                {extraTeams > 1 ? 's' : ''}
                                :
                              </strong>
                              {' '}
                              {extraTeamNames}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </span>
                  </div>
                )}
                {hasAnyTeamConflicts() && !hasTeamCountMismatch() && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3 text-amber-600" />
                    <span>Teams with data conflicts are highlighted below</span>
                  </div>
                )}
              </div>
              {chosenDataSource && (
                <div className="mt-2">
                  Currently using
                  {' '}
                  <strong>{chosenDataSource === 'database' ? 'Database' : 'Wikipedia'}</strong>
                  {' '}
                  data where conflicts exist.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Club
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Apps
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Goals
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Transfer
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Season
                </th>
                {/* Only show Data Source column if there are any conflicts */}
                {hasAnyTeamConflicts() && (
                  <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-center gap-1">
                      Data Source
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="size-3 cursor-help text-gray-400 hover:text-gray-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-48 text-xs">
                            {playerData?.playerFoundInDB
                              ? 'Used to indicate the source of truth used for updating existing footballer records in case of conflicts'
                              : 'Used to indicate the source of truth that would be used for creating new footballer records'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                )}
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
              // For players in DB, we need to handle different scenarios
                if (playerData.playerFoundInDB && dbPlayerInfo) {
                  const allTeamEntries: Array<{
                    team: Team;
                    dbTeam: any;
                    index: number;
                    source: 'wikipedia' | 'database' | 'both';
                    isDifferentTeam: boolean;
                  }> = [];

                  // Handle Wikipedia teams
                  playerData.teams.forEach((wikiTeam, index) => {
                    const correspondingDbTeam = dbPlayerInfo.teams_played_for[index];

                    // If team IDs are different or DB team doesn't exist, these are different teams
                    const isDifferentTeam = !correspondingDbTeam
                      || (wikiTeam.teamID && correspondingDbTeam.team_id && wikiTeam.teamID !== correspondingDbTeam.team_id);

                    if (isDifferentTeam) {
                    // Only show Wikipedia team if Wikipedia is chosen or no source is chosen
                      if (!chosenDataSource || chosenDataSource === 'wikipedia') {
                        allTeamEntries.push({
                          team: wikiTeam,
                          dbTeam: null,
                          index,
                          source: 'wikipedia' as const,
                          isDifferentTeam: true,
                        });
                      }
                    } else {
                    // Same team with potential conflicts
                      allTeamEntries.push({
                        team: wikiTeam,
                        dbTeam: correspondingDbTeam,
                        index,
                        source: 'both' as const,
                        isDifferentTeam: false,
                      });
                    }
                  });

                  // Handle DB teams that don't have corresponding Wikipedia teams
                  dbPlayerInfo.teams_played_for.forEach((dbTeam, index) => {
                    const correspondingWikiTeam = playerData.teams[index];

                    // If team IDs are different or Wiki team doesn't exist, these are different teams
                    const isDifferentTeam = !correspondingWikiTeam
                      || (correspondingWikiTeam.teamID && dbTeam.team_id && correspondingWikiTeam.teamID !== dbTeam.team_id);

                    if (isDifferentTeam) {
                    // Only show DB team if Database is chosen
                      if (chosenDataSource === 'database') {
                      // Create a fake wiki team structure for DB team
                        const fakeWikiTeam: Team = {
                          teamName: dbTeam.team_name,
                          originalTeamName: dbTeam.team_name,
                          teamFound: true,
                          teamID: dbTeam.team_id,
                          appearances: dbTeam.apps ?? 0,
                          goals: dbTeam.goals ?? 0,
                          joinYear: dbTeam.start_year ?? 0,
                          departYear: dbTeam.end_year,
                          typeOfTransfer: dbTeam.transfer_type === 'loan' ? 'loan' : 'permanent',
                          TeamNameDB: dbTeam.team_name,
                          position: playerData.position,
                          playerName: playerData.playerName,
                          dateOfBirth: playerData.dateOfBirth,
                        };

                        allTeamEntries.push({
                          team: fakeWikiTeam,
                          dbTeam,
                          index,
                          source: 'database' as const,
                          isDifferentTeam: true,
                        });
                      }
                    }
                  });

                  return allTeamEntries.sort((a, b) => a.team.joinYear - b.team.joinYear);
                } else {
                // For players not in DB, just show Wikipedia teams
                  return playerData.teams
                    .sort((a, b) => a.joinYear - b.joinYear)
                    .map((team, index) => ({
                      team,
                      dbTeam: null,
                      index,
                      source: 'wikipedia' as const,
                      isDifferentTeam: false,
                    }));
                }
              })().map(({ team, dbTeam, index, source, isDifferentTeam }) => {
                // Check if this team has conflicts with DB data (only for same teams)
                const teamConflicts = dbTeam && !isDifferentTeam
                  ? {
                      appearances: team.appearances !== dbTeam.apps,
                      goals: team.goals !== dbTeam.goals,
                      joinYear: team.joinYear !== dbTeam.start_year,
                      departYear: team.departYear !== dbTeam.end_year,
                      transferType: (() => {
                        const wikiTransferType = (team.typeOfTransfer || '').toLowerCase().trim();
                        const wikiType = wikiTransferType.includes('loan') ? 'loan' : 'permanent';
                        return wikiType !== dbTeam.transfer_type;
                      })(),
                    }
                  : null;

                const hasAnyConflicts = teamConflicts && (
                  teamConflicts.appearances || teamConflicts.goals
                  || teamConflicts.joinYear || teamConflicts.departYear || teamConflicts.transferType
                );

                // Get specific conflict indicators or source info
                const getConflictIndicators = () => {
                  if (isDifferentTeam) {
                    return source === 'database' ? ['From Database Only'] : ['From Wikipedia Only'];
                  }
                  if (!teamConflicts || !hasAnyConflicts) {
                    return [];
                  }

                  const conflicts = [];
                  if (teamConflicts.appearances) {
                    conflicts.push('Apps');
                  }
                  if (teamConflicts.goals) {
                    conflicts.push('Goals');
                  }
                  if (teamConflicts.joinYear) {
                    conflicts.push('Join');
                  }
                  if (teamConflicts.departYear) {
                    conflicts.push('End');
                  }
                  if (teamConflicts.transferType) {
                    conflicts.push('Transfer');
                  }

                  return conflicts;
                };

                return (
                  <tr
                    key={`${index}-${team.teamName}-${source}`}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700/50 ${
                      !team.teamFound
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                        : hasAnyConflicts
                          ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                          : isDifferentTeam ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div
                            className={`font-medium ${!team.teamFound ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'} flex items-center gap-1`}
                          >
                            {!team.teamFound && <AlertTriangle className="size-4 text-red-500" />}
                            {isDifferentTeam && source === 'database' && <Shield className="size-4 text-emerald-600" />}
                            {isDifferentTeam && source === 'wikipedia' && <Search className="size-4 text-blue-600" />}
                            {team.teamName}
                          </div>
                          {team.originalTeamName !== team.teamName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              (
                              {team.originalTeamName}
                              )
                            </div>
                          )}
                          {team.teamFound && team.TeamNameDB && team.TeamNameDB !== team.teamName && (
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              Name in DB:
                              {' '}
                              {team.TeamNameDB}
                            </div>
                          )}
                          {isDifferentTeam && (
                            <div className={`text-xs font-medium ${
                              source === 'database'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                            >
                              {source === 'database' ? 'Database Only' : 'Wikipedia Only'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(() => {
                          // If different team or no DB team, use wiki data
                          if (isDifferentTeam || !dbTeam) {
                            return team.appearances;
                          }

                          // If same team and database is chosen and there's a conflict, use DB data
                          if (chosenDataSource === 'database' && teamConflicts?.appearances) {
                            return dbTeam.apps;
                          }

                          // Default to wiki data
                          return team.appearances;
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(() => {
                          // If different team or no DB team, use wiki data
                          if (isDifferentTeam || !dbTeam) {
                            return team.goals;
                          }

                          // If same team and database is chosen and there's a conflict, use DB data
                          if (chosenDataSource === 'database' && teamConflicts?.goals) {
                            return dbTeam.goals;
                          }

                          // Default to wiki data
                          return team.goals;
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          (() => {
                            let transferType = team.typeOfTransfer || '';

                            // If same team and database is chosen and there's a transfer type conflict, use DB data
                            if (!isDifferentTeam && dbTeam && chosenDataSource === 'database' && teamConflicts?.transferType) {
                              transferType = dbTeam.transfer_type === 'loan' ? 'loan' : 'permanent';
                            }

                            return transferType.toLowerCase().includes('loan')
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200';
                          })()
                        }`}
                      >
                        {(() => {
                          let transferType = team.typeOfTransfer || '';

                          // If same team and database is chosen and there's a transfer type conflict, use DB data
                          if (!isDifferentTeam && dbTeam && chosenDataSource === 'database' && teamConflicts?.transferType) {
                            transferType = dbTeam.transfer_type === 'loan' ? 'loan' : 'permanent';
                          }

                          return transferType.toLowerCase().includes('loan') ? 'Loan' : 'Permanent';
                        })()}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {(() => {
                          let joinYear = team.joinYear;
                          let departYear = team.departYear;

                          // If same team and database is chosen and there are join/depart year conflicts, use DB data
                          if (!isDifferentTeam && dbTeam && chosenDataSource === 'database') {
                            if (teamConflicts?.joinYear) {
                              joinYear = dbTeam.start_year;
                            }
                            if (teamConflicts?.departYear) {
                              departYear = dbTeam.end_year;
                            }
                          }

                          return `${joinYear}${departYear ? `-${departYear}` : ''}`;
                        })()}
                      </div>
                    </td>
                    {/* Only render Data Source column if there are any conflicts */}
                    {hasAnyTeamConflicts() && (
                      <td className="px-2 py-3 text-center">
                        {isDifferentTeam
                          ? (
                              <div className="space-y-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    source === 'database'
                                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                      : 'border-blue-300 bg-blue-50 text-blue-700'
                                  }`}
                                >
                                  {source === 'database'
                                    ? (
                                        <>
                                          <Shield className="mr-1 size-3" />
                                          Database
                                        </>
                                      )
                                    : (
                                        <>
                                          <Search className="mr-1 size-3" />
                                          Wikipedia
                                        </>
                                      )}
                                </Badge>
                                <div className={`text-xs ${
                                  source === 'database'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                                >
                                  {getConflictIndicators().join(', ')}
                                </div>
                              </div>
                            )
                          : hasAnyConflicts
                            ? (
                                <div className="space-y-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      chosenDataSource === 'database'
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                        : 'border-blue-300 bg-blue-50 text-blue-700'
                                    }`}
                                  >
                                    {chosenDataSource === 'database'
                                      ? (
                                          <>
                                            <Shield className="mr-1 size-3" />
                                            Database
                                          </>
                                        )
                                      : (
                                          <>
                                            <Search className="mr-1 size-3" />
                                            Wikipedia
                                          </>
                                        )}
                                  </Badge>
                                  <div className="text-xs text-amber-600 dark:text-amber-400">
                                    Conflicts:
                                    {' '}
                                    {getConflictIndicators().join(', ')}
                                  </div>
                                </div>
                              )
                            : (
                                <div className="space-y-1">
                                  <span className="text-xs text-gray-500">Wikipedia</span>
                                  <div className="text-xs text-green-600 dark:text-green-400">
                                    No conflicts
                                  </div>
                                </div>
                              )}
                      </td>
                    )}
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {team.teamFound
                          ? (
                              <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                                Found in DB
                              </Badge>
                            )
                          : (
                              <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
                                <AlertTriangle className="mr-1 size-3" />
                                Not found in DB
                              </Badge>
                            )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col gap-1.5">
                        {(() => {
                          const syncStatus = getClubSyncStatus(team, source);
                          // `team.teamID` is the row key for sync state; `null` rows
                          // (not-found) can't be synced and skip the button entirely.
                          const opStatus = team.teamID != null ? sync.status[team.teamID] : undefined;
                          const opError = team.teamID != null ? sync.errors[team.teamID] : undefined;

                          if (opStatus) {
                            return (
                              <RowSyncButton
                                variant={syncStatus === 'not-in-db' ? 'add' : 'update'}
                                status={opStatus}
                                error={opError}
                                onClick={() => { /* idle-only — never rendered when opStatus is set */ }}
                              />
                            );
                          }
                          if (footballerId && syncStatus === 'mismatch') {
                            return (
                              <RowSyncButton
                                variant="update"
                                status={undefined}
                                onClick={() => handleUpdateClub(team)}
                                disabled={sync.syncingAll}
                              />
                            );
                          }
                          if (footballerId && syncStatus === 'not-in-db') {
                            return (
                              <RowSyncButton
                                variant="add"
                                status={undefined}
                                onClick={() => handleAddClub(team)}
                                disabled={sync.syncingAll}
                              />
                            );
                          }
                          if (footballerId && syncStatus === 'synced') {
                            return (
                              <Badge variant="secondary" className="w-fit border-green-200 bg-green-100 text-green-800">
                                <Check className="mr-1 size-3" />
                                Synced
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                        {getTeamAdminLink(team)
                          ? (
                              <a
                                href={getTeamAdminLink(team)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                              >
                                Edit Team
                                <ExternalLink className="size-3" />
                              </a>
                            )
                          : (
                              <span className="text-xs text-gray-400">No link</span>
                            )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-700/30">
                <td className="px-2 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  {playerData.summary.totalTeams}
                  {' '}
                  clubs
                </td>
                <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">
                  {playerData.totalAppearances}
                </td>
                <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">
                  {playerData.totalGoals}
                </td>
                <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">-</td>
                <td className="px-2 py-3 font-semibold text-gray-900 dark:text-white">Total</td>
                {/* Only show Data Source column if there are any conflicts */}
                {hasAnyTeamConflicts() && (
                  <td className="px-2 py-3 text-center">
                    {playerData.playerFoundInDB && chosenDataSource && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          chosenDataSource === 'database'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-blue-300 bg-blue-50 text-blue-700'
                        }`}
                      >
                        {chosenDataSource === 'database'
                          ? (
                              <>
                                <Shield className="mr-1 size-3" />
                                DB Active
                              </>
                            )
                          : (
                              <>
                                <Search className="mr-1 size-3" />
                                Wiki Active
                              </>
                            )}
                      </Badge>
                    )}
                  </td>
                )}
                <td className="px-2 py-3">
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="bg-green-100 text-xs text-green-800">
                      {playerData.summary.foundTeams}
                      {' '}
                      found
                    </Badge>
                    {playerData.summary.notFoundTeams > 0 && (
                      <Badge variant="destructive" className="bg-red-100 text-xs text-red-800">
                        <AlertTriangle className="mr-1 size-3" />
                        {playerData.summary.notFoundTeams}
                        {' '}
                        missing
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
