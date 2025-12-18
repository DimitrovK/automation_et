import type { Footballer, n8nWikiPlayerData, Team } from '@/types/player';
import { AlertTriangle, Calendar, ExternalLink, HelpCircle, MapPin, Search, Shield, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import { GraphiteButton } from '@/components/ui/graphite-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import config from '@/lib/config';

type CareerLookupInfoProps = {
  playerData: n8nWikiPlayerData;
  dbPlayerInfo?: Footballer | null;
  chosenDataSource?: 'wikipedia' | 'database' | null;
  onDataSourceChange?: (dataSource: 'wikipedia' | 'database') => void;
  className?: string;
};

export function CareerLookupInfo({
  playerData,
  dbPlayerInfo,
  chosenDataSource,
  onDataSourceChange,
  className,
}: CareerLookupInfoProps) {
  // Calculate age directly from playerData.dateOfBirth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Parse player name from playerData
  const parsePlayerName = (fullName: string) => {
    const nameParts = fullName.replace(/_/g, ' ').split(' ');
    if (nameParts.length >= 2) {
      const first = nameParts[0];
      const last = nameParts.slice(1).join(' ');
      return { first, last };
    }
    return { first: '', last: fullName.replace(/_/g, ' ') };
  };

  // Check for specific field conflicts (only for players in DB)
  const getFieldConflicts = () => {
    if (!playerData.playerFoundInDB || !dbPlayerInfo) {
      return {};
    }

    const { first, last } = parsePlayerName(playerData.playerName);
    return {
      name: first !== dbPlayerInfo.first_name || last !== dbPlayerInfo.last_name,
      dateOfBirth: playerData.dateOfBirth !== dbPlayerInfo.date_of_birth,
      nationality: playerData.birthCountry !== dbPlayerInfo.nation.name,
    };
  };

  // Get display value based on chosen data source (only applies to players in DB with conflicts)
  const getDisplayValue = (field: 'name' | 'dateOfBirth' | 'nationality') => {
    const conflicts = getFieldConflicts();

    // No conflicts or not in DB - use Wikipedia data
    if (!playerData.playerFoundInDB || !dbPlayerInfo || !conflicts[field]) {
      const { first, last } = parsePlayerName(playerData.playerName);
      return {
        name: `${first} ${last}`.trim(),
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
      }[field];
    }

    // There's a conflict - use chosen data source or default to Wikipedia
    if (chosenDataSource === 'database') {
      return {
        name: `${dbPlayerInfo.first_name} ${dbPlayerInfo.last_name}`.trim(),
        dateOfBirth: dbPlayerInfo.date_of_birth,
        nationality: dbPlayerInfo.nation.name,
      }[field];
    } else {
      const { first, last } = parsePlayerName(playerData.playerName);
      return {
        name: `${first} ${last}`.trim(),
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
      }[field];
    }
  };

  // Helper to render conflict indicator badge
  const renderConflictBadge = (field: 'name' | 'dateOfBirth' | 'nationality') => {
    const conflicts = getFieldConflicts();
    if (!conflicts[field]) {
      return null;
    }

    return (
      <Badge
        variant="outline"
        className={`ml-2 text-xs ${
          chosenDataSource === 'database'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-blue-300 bg-blue-50 text-blue-700'
        }`}
      >
        {chosenDataSource === 'database'
          ? (
              <>
                <Shield className="mr-1 size-3" />
                Using DB
              </>
            )
          : (
              <>
                <Search className="mr-1 size-3" />
                Using Wiki
              </>
            )}
      </Badge>
    );
  };

  // Generate admin links using config
  const getTeamAdminLink = (team: Team) => {
    if (!team.teamFound || !team.teamID) {
      return null;
    }
    return config.getAdminUrl(`FootballData/team/${team.teamID}/change/`);
  };

  const getCountryAdminLink = (playerData: n8nWikiPlayerData) => {
    if (!playerData.countryFoundInDB || !playerData.countryID) {
      return null;
    }
    return config.getAdminUrl(`FootballData/nation/${playerData.countryID}/change/`);
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
    <TooltipProvider>
      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-4 ${className}`}>
        {/* Left Sidebar - Player Profile */}
        <div className="space-y-4 lg:col-span-1">
          {/* Player Profile Card */}
          <Card className="sticky top-4">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                {getDisplayValue('name')}
                {!playerData.playerFoundInDB && <AlertTriangle className="size-5 text-amber-500" />}
                {renderConflictBadge('name')}
              </CardTitle>
              <div className="flex flex-wrap justify-center gap-2">
                {!playerData.playerFoundInDB && (
                  <Badge variant="destructive" className="border-amber-300 bg-amber-100 text-amber-800">
                    <AlertTriangle className="mr-1 size-3" />
                    Not in Database
                  </Badge>
                )}
                {playerData.playerFoundInDB && dbPlayerInfo && chosenDataSource && (
                  <Badge
                    variant="secondary"
                    className={chosenDataSource === 'database'
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                      : 'border-blue-300 bg-blue-100 text-blue-800'}
                  >
                    {chosenDataSource === 'database'
                      ? (
                          <>
                            <Shield className="mr-1 size-3" />
                            Database Data Active
                          </>
                        )
                      : (
                          <>
                            <Search className="mr-1 size-3" />
                            Wikipedia Data Active
                          </>
                        )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 shrink-0 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Age</p>
                    <div className="flex items-center">
                      <p className="text-sm font-medium dark:text-white">
                        {calculateAge(getDisplayValue('dateOfBirth') as string)}
                        {' '}
                        (
                        {getDisplayValue('dateOfBirth')}
                        )
                      </p>
                      {renderConflictBadge('dateOfBirth')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="size-4 shrink-0 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nationality</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium dark:text-white">{getDisplayValue('nationality')}</p>
                      {renderConflictBadge('nationality')}
                      {!playerData.countryFoundInDB && <AlertTriangle className="size-4 text-amber-500" />}
                    </div>
                    {!playerData.countryFoundInDB && (
                      <Badge
                        variant="destructive"
                        className="mt-1 border-amber-300 bg-amber-100 text-xs text-amber-800"
                      >
                        <AlertTriangle className="mr-1 size-3" />
                        Not in Database
                      </Badge>
                    )}
                    {getCountryAdminLink(playerData) && (
                      <a
                        href={getCountryAdminLink(playerData)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                      >
                        Edit Country
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="size-4 shrink-0 text-gray-500" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Position</p>
                    <p className="text-sm font-medium dark:text-white">{playerData.position}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Senior Career */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Senior Career</CardTitle>
                  <CardDescription>Complete club history and statistics</CardDescription>
                </div>
                {/* Data Source Buttons - Only show for players in DB with conflicts */}
                {playerData.playerFoundInDB && dbPlayerInfo && hasAnyTeamConflicts() && (
                  <div className="flex gap-2">
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
                  </div>
                )}
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
                        Admin Link
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
                                appearances: dbTeam.apps,
                                goals: dbTeam.goals,
                                joinYear: dbTeam.start_year,
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
                            {getTeamAdminLink(team)
                              ? (
                                  <a
                                    href={getTeamAdminLink(team)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                                  >
                                    Edit Team
                                    <ExternalLink className="size-3" />
                                  </a>
                                )
                              : (
                                  <span className="text-sm text-gray-400">No link</span>
                                )}
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
        </div>
      </div>
    </TooltipProvider>
  );
}
