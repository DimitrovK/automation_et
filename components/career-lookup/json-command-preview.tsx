'use client';

import type {
  CreateFootballerNationRequest,
  CreateFootballerRequest,
  CreateFootballerTeamRequest,
  Footballer,
  FootballerNationStat,
  n8nWikiPlayerData,
  PlayerConfiguration,
} from '@/types/player';
import type { SelectedPosition } from '@/components/career-lookup/position-card';
import { AlertTriangle, Check, ChevronDown, ChevronUp, Code, Copy, FileText } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GraphiteButton } from '@/components/ui/graphite-button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';

type JsonCommandPreviewProps = {
  playerData: n8nWikiPlayerData | null;
  playerConfig: PlayerConfiguration;
  dbPlayerInfo?: Footballer | null;
  chosenDataSource?: 'wikipedia' | 'database' | null;
  dbNationalTeams?: FootballerNationStat[];
  selectedPositions?: SelectedPosition[];
};

export function JsonCommandPreview({
  playerData,
  playerConfig,
  dbPlayerInfo,
  chosenDataSource,
  dbNationalTeams,
  selectedPositions,
}: JsonCommandPreviewProps) {
  const { user } = useAuth();
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showApiCommands, setShowApiCommands] = useState(false);
  const [showAsHttpRequest, setShowAsHttpRequest] = useState(false);

  // Function to detect changes between current config and database data
  const getPlayerChanges = useMemo(() => {
    if (!dbPlayerInfo || !playerData) {
      return null;
    }

    const changes: Partial<CreateFootballerRequest> = {};

    // Compare basic info
    const safeFirstName = playerConfig.firstName ? playerConfig.firstName.trim() : '';
    const dbFirstName = dbPlayerInfo.first_name ? dbPlayerInfo.first_name : '';
    if (safeFirstName !== dbFirstName) {
      changes.first_name = safeFirstName;
    }
    if (playerConfig.lastName.trim() !== dbPlayerInfo.last_name) {
      changes.last_name = playerConfig.lastName.trim();
    }
    if (playerConfig.dateOfBirth !== dbPlayerInfo.date_of_birth) {
      changes.date_of_birth = playerConfig.dateOfBirth;
    }
    if (playerConfig.countryID !== dbPlayerInfo.nation.id) {
      changes.nation_id = playerConfig.countryID!;
    }
    if ((playerConfig.wikipediaUrl.trim() || null) !== dbPlayerInfo.wikipedia_url) {
      changes.wikipedia_url = playerConfig.wikipediaUrl.trim() || null;
    }

    // Compare settings
    if (playerConfig.show_date_of_birth_on_search !== dbPlayerInfo.show_date_of_birth_on_search) {
      changes.show_date_of_birth_on_search = playerConfig.show_date_of_birth_on_search;
    }
    if (playerConfig.retired !== dbPlayerInfo.retired) {
      changes.retired = playerConfig.retired;
    }
    if (playerConfig.is_player !== dbPlayerInfo.is_player) {
      changes.is_player = playerConfig.is_player;
    }
    if (playerConfig.is_manager !== dbPlayerInfo.is_manager) {
      changes.is_manager = playerConfig.is_manager;
    }
    if (playerConfig.might_change !== dbPlayerInfo.might_change) {
      changes.might_change = playerConfig.might_change;
    }
    if (playerConfig.available_for_career_path !== dbPlayerInfo.available_for_career_path) {
      changes.available_for_career_path = playerConfig.available_for_career_path;
    }
    if (playerConfig.career_path_difficulty !== dbPlayerInfo.career_path_difficulty) {
      changes.career_path_difficulty = playerConfig.career_path_difficulty;
    }
    if (playerConfig.status !== dbPlayerInfo.status) {
      changes.status = playerConfig.status;
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }, [playerData, playerConfig, dbPlayerInfo]);

  const hasChanges = getPlayerChanges !== null;
  const isExistingPlayer = playerData?.playerFoundInDB && dbPlayerInfo;

  // Function to analyze team changes when Wikipedia is chosen as data source
  const getTeamChanges = useMemo(() => {
    if (!isExistingPlayer || !dbPlayerInfo || chosenDataSource !== 'wikipedia' || !playerData?.teams) {
      return { updates: [], creates: [], deletes: [] };
    }

    const wikipediaTeams = playerData.teams.filter(team => team.teamFound && team.teamID);
    const dbTeams = dbPlayerInfo.teams_played_for || [];

    const updates: Array<{ id: number; changes: Partial<CreateFootballerTeamRequest>; teamName: string; position: number }> = [];
    const creates: Array<{ teamData: CreateFootballerTeamRequest; teamName: string; position: number }> = [];
    const deletes: Array<{ id: number; teamName: string; position: number }> = [];

    // Position-based matching: compare teams by their position in the arrays
    const minLength = Math.min(wikipediaTeams.length, dbTeams.length);

    // Process teams that exist in both arrays (by position)
    for (let i = 0; i < minLength; i++) {
      const wikiTeam = wikipediaTeams[i];
      const dbTeam = dbTeams[i];

      const transferTypeString = (wikiTeam.typeOfTransfer || '').toLowerCase().trim();
      const transferType = transferTypeString.includes('loan') ? 'loan' : 'permanent';

      // Check if this is the same team (by team_id) or a completely different team
      const isSameTeam = dbTeam.team_id === wikiTeam.teamID;

      if (isSameTeam) {
        // Same team - check for field changes
        const changes: Partial<CreateFootballerTeamRequest> = {};

        if (dbTeam.apps !== wikiTeam.appearances) {
          changes.apps = wikiTeam.appearances;
        }
        if (dbTeam.goals !== wikiTeam.goals) {
          changes.goals = wikiTeam.goals;
        }
        if (dbTeam.transfer_type !== transferType) {
          changes.transfer_type = transferType;
        }
        if (dbTeam.start_year !== wikiTeam.joinYear) {
          changes.start_year = wikiTeam.joinYear;
        }
        if (dbTeam.end_year !== wikiTeam.departYear) {
          changes.end_year = wikiTeam.departYear;
        }

        if (Object.keys(changes).length > 0) {
          // Include required fields for PUT requests to prevent null values
          changes.team_id = dbTeam.team_id;
          changes.role = dbTeam.role;

          // Always include start_year and end_year if they weren't already in changes
          // to prevent them from being set to null in the backend
          if (!changes.hasOwnProperty('start_year')) {
            changes.start_year = dbTeam.start_year;
          }
          if (!changes.hasOwnProperty('end_year')) {
            changes.end_year = dbTeam.end_year;
          }

          updates.push({
            id: dbTeam.id,
            changes,
            teamName: wikiTeam.teamName,
            position: i + 1,
          });
        }
      } else {
        // Different team - delete the old one and create the new one
        deletes.push({
          id: dbTeam.id,
          teamName: dbTeam.team_name,
          position: i + 1,
        });

        const teamData: CreateFootballerTeamRequest = {
          footballer_id: dbPlayerInfo.id,
          team_id: wikiTeam.teamID!,
          role: 'player',
          apps: wikiTeam.appearances,
          goals: wikiTeam.goals,
          transfer_type: transferType,
          start_year: wikiTeam.joinYear,
          end_year: wikiTeam.departYear,
        };

        creates.push({
          teamData,
          teamName: wikiTeam.teamName,
          position: i + 1,
        });
      }
    }

    // Handle extra Wikipedia teams (more teams in Wikipedia than in DB)
    if (wikipediaTeams.length > dbTeams.length) {
      for (let i = dbTeams.length; i < wikipediaTeams.length; i++) {
        const wikiTeam = wikipediaTeams[i];
        const transferTypeString = (wikiTeam.typeOfTransfer || '').toLowerCase().trim();
        const transferType = transferTypeString.includes('loan') ? 'loan' : 'permanent';

        const teamData: CreateFootballerTeamRequest = {
          footballer_id: dbPlayerInfo.id,
          team_id: wikiTeam.teamID!,
          role: 'player',
          apps: wikiTeam.appearances,
          goals: wikiTeam.goals,
          transfer_type: transferType,
          start_year: wikiTeam.joinYear,
          end_year: wikiTeam.departYear,
        };

        creates.push({
          teamData,
          teamName: wikiTeam.teamName,
          position: i + 1,
        });
      }
    }

    // Handle extra DB teams (more teams in DB than in Wikipedia)
    if (dbTeams.length > wikipediaTeams.length) {
      for (let i = wikipediaTeams.length; i < dbTeams.length; i++) {
        const dbTeam = dbTeams[i];

        deletes.push({
          id: dbTeam.id,
          teamName: dbTeam.team_name,
          position: i + 1,
        });
      }
    }

    return { updates, creates, deletes };
  }, [isExistingPlayer, dbPlayerInfo, chosenDataSource, playerData]);

  const hasTeamChanges = getTeamChanges.updates.length > 0 || getTeamChanges.creates.length > 0 || getTeamChanges.deletes.length > 0;

  // Function to analyze national team changes (comparing Wikipedia vs DB nation stats)
  const getNationChanges = useMemo(() => {
    if (!playerData?.nationalTeams) {
      return { creates: [] as Array<{ nationData: CreateFootballerNationRequest; nationName: string }>, updates: [] as Array<{ id: number; changes: Partial<CreateFootballerNationRequest>; nationName: string }> };
    }

    const wikiNations = playerData.nationalTeams.filter(nt => nt.nationFound && nt.nationID);
    const creates: Array<{ nationData: CreateFootballerNationRequest; nationName: string }> = [];
    const updates: Array<{ id: number; changes: Partial<CreateFootballerNationRequest>; nationName: string }> = [];

    const footballerId = dbPlayerInfo?.id ?? 0;

    for (const wikiNation of wikiNations) {
      const dbMatch = dbNationalTeams?.find(db => db.nation_id === wikiNation.nationID) ?? null;

      if (!dbMatch) {
        creates.push({
          nationData: {
            footballer_id: footballerId,
            nation_id: wikiNation.nationID!,
            apps: wikiNation.apps,
            goals: wikiNation.goals,
          },
          nationName: wikiNation.teamName,
        });
      } else {
        const changes: Partial<CreateFootballerNationRequest> = {};
        if (dbMatch.apps !== wikiNation.apps) {
          changes.apps = wikiNation.apps;
        }
        if (dbMatch.goals !== wikiNation.goals) {
          changes.goals = wikiNation.goals;
        }
        if (Object.keys(changes).length > 0) {
          updates.push({
            id: dbMatch.id,
            changes,
            nationName: wikiNation.teamName,
          });
        }
      }
    }

    return { creates, updates };
  }, [playerData, dbPlayerInfo, dbNationalTeams]);

  const hasNationChanges = getNationChanges.creates.length > 0 || getNationChanges.updates.length > 0;

  // Compute position operations from selectedPositions
  const getPositionOps = useMemo(() => {
    if (!selectedPositions || selectedPositions.length === 0) {
      return { hasChanges: false, positionsPayload: null };
    }

    const positionsTracker = playerData?.positionsTracker;
    const footballerId = dbPlayerInfo?.id;

    // For new players, show positions that will be assigned on deploy
    if (!isExistingPlayer) {
      const payload = {
        footballer_id: '{{footballer_id}}',
        positions: selectedPositions.map(p => ({
          position_id: p.position_id,
          is_primary: p.is_primary,
          sort_order: p.sort_order,
        })),
      };
      return { hasChanges: true, positionsPayload: payload };
    }

    // For existing players, check if positions differ from DB
    if (positionsTracker && footballerId) {
      const dbIds = new Set(positionsTracker.databasePositions.map(p => p.id));
      const selectedIds = new Set(selectedPositions.map(p => p.position_id));
      const hasChange =
        selectedIds.size !== dbIds.size
        || [...selectedIds].some(id => !dbIds.has(id))
        || [...dbIds].some(id => !selectedIds.has(id))
        || selectedPositions.some(sp => {
          const dbP = positionsTracker.databasePositions.find(d => d.id === sp.position_id);
          return dbP && dbP.isPrimary !== sp.is_primary;
        });

      if (hasChange) {
        const payload = {
          footballer_id: footballerId,
          positions: selectedPositions.map(p => ({
            position_id: p.position_id,
            is_primary: p.is_primary,
            sort_order: p.sort_order,
          })),
        };
        return { hasChanges: true, positionsPayload: payload };
      }
    }

    return { hasChanges: false, positionsPayload: null };
  }, [selectedPositions, playerData, dbPlayerInfo, isExistingPlayer]);

  const hasPositionChanges = getPositionOps.hasChanges;

  // Generate footballer creation/update JSON
  const footballerJson = useMemo(() => {
    if (!playerData || !playerConfig.countryID || !user) {
      return null;
    }

    // If it's an existing player, return only the changes
    if (isExistingPlayer && getPlayerChanges) {
      const updateData = {
        ...getPlayerChanges,
        user: user.id,
      };
      return Object.keys(updateData).length > 1 ? updateData : null; // > 1 because user is always included
    }

    // For new players, return full creation data
    const createFootballerData: CreateFootballerRequest = {
      status: playerConfig.status,
      user: user.id,
      first_name: playerConfig.firstName ? playerConfig.firstName.trim() : '',
      last_name: playerConfig.lastName ? playerConfig.lastName.trim() : '',
      nation_id: playerConfig.countryID,
      date_of_birth: playerConfig.dateOfBirth,
      wikipedia_url: playerConfig.wikipediaUrl || null,
      show_date_of_birth_on_search: playerConfig.show_date_of_birth_on_search,
      retired: playerConfig.retired,
      is_player: playerConfig.is_player,
      is_manager: playerConfig.is_manager,
      might_change: playerConfig.might_change,
      available_for_career_path: playerConfig.available_for_career_path,
      career_path_difficulty: playerConfig.career_path_difficulty,
    };

    return createFootballerData;
  }, [playerData, playerConfig, user, isExistingPlayer, getPlayerChanges]);

  // Generate footballer teams creation/update JSON
  const footballerTeamsJson = useMemo(() => {
    if (!playerData?.teams || !footballerJson) {
      return [];
    }

    // If it's an existing player and Wikipedia data source is chosen, show team updates/creates
    if (isExistingPlayer && chosenDataSource === 'wikipedia') {
      return []; // We'll handle this separately with getTeamChanges
    }

    // For new players, return team creation data as before
    if (!isExistingPlayer) {
      const foundTeams = playerData.teams.filter(team => team.teamFound && team.teamID);

      return foundTeams.map((team) => {
        const transferTypeString = (team.typeOfTransfer || '').toLowerCase().trim();
        const transferType = transferTypeString.includes('loan') ? 'loan' : 'permanent';

        const createTeamData: CreateFootballerTeamRequest = {
          footballer_id: 0, // Will be replaced with actual ID after footballer creation
          team_id: team.teamID!,
          role: 'player',
          apps: team.appearances,
          goals: team.goals,
          transfer_type: transferType,
          start_year: team.joinYear,
          end_year: team.departYear,
        };
        return createTeamData;
      });
    }

    return [];
  }, [playerData, footballerJson, isExistingPlayer, chosenDataSource]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate HTTP request format
  const generateHttpRequest = (endpoint: string, method: string, data: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    return `${method} ${baseUrl}${endpoint}
Content-Type: application/json
Authorization: Bearer ${token || 'YOUR_JWT_TOKEN'}

${JSON.stringify(data, null, 2)}`;
  };

  // Determine the appropriate endpoint and method
  const getFootballerEndpoint = () => {
    if (isExistingPlayer && dbPlayerInfo) {
      return `/data/footballers/${dbPlayerInfo.id}/`;
    }
    return '/data/footballers/';
  };

  const getFootballerMethod = () => {
    return isExistingPlayer ? 'PUT' : 'POST';
  };

  if (!playerData || !footballerJson) {
    return null; // Don't show anything if no data
  }

  const hasValidationIssues
    = !playerConfig.countryID
      || !(playerConfig.firstName && playerConfig.firstName.trim())
      || !(playerConfig.lastName && playerConfig.lastName.trim())
      || !playerConfig.dateOfBirth;
  const operationType = isExistingPlayer ? 'Update' : 'Create';
  const footballerEndpoint = getFootballerEndpoint();
  const footballerMethod = getFootballerMethod();

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowApiCommands(!showApiCommands)}
          className="flex items-center gap-2"
        >
          <Code className="size-4" />
          {showApiCommands ? 'Hide API Commands' : 'Show API Commands'}
          {showApiCommands ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {/* API Commands Preview - Only show when toggled */}
      {showApiCommands && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="size-5" />
              API Commands Preview
              {isExistingPlayer && (
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  {hasChanges || hasTeamChanges || hasNationChanges || hasPositionChanges ? 'Has Changes' : 'No Changes'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isExistingPlayer
                ? hasChanges || hasTeamChanges || hasNationChanges || hasPositionChanges
                  ? `JSON commands that will be executed to update the existing footballer record${hasTeamChanges ? ' and team records' : ''}${hasNationChanges ? ' and nation stats' : ''}${hasPositionChanges ? ' and positions' : ''}`
                  : `Current footballer data matches database - no updates needed`
                : `JSON commands that will be executed to create the footballer and team records`}
              {isExistingPlayer && chosenDataSource !== 'wikipedia' && chosenDataSource === 'database' && playerData?.teams && dbPlayerInfo?.teams_played_for && (
                // Only show hint if there might be team differences (different array lengths or if Wikipedia has teams)
                playerData.teams.length !== dbPlayerInfo.teams_played_for.length || playerData.teams.some(t => t.teamFound && t.teamID)
              ) && (
                <span className="mt-1 block text-amber-600">
                  💡 Select "Wikipedia" as data source to see team update options
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hasValidationIssues && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 text-amber-600" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Validation Issues</p>
                      <p className="text-amber-700">
                        Please resolve missing data before executing commands
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="footballer" className="w-full">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList className={`grid w-full sm:w-auto ${
                    (() => {
                      const showTeams = (!isExistingPlayer && footballerTeamsJson.length > 0) || (isExistingPlayer && hasTeamChanges);
                      const tabCount = 1 + (showTeams ? 1 : 0) + (hasNationChanges ? 1 : 0) + (hasPositionChanges ? 1 : 0);
                      const colsMap: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
                      return colsMap[Math.min(tabCount, 4)] || 'grid-cols-1';
                    })()
                  }`}
                  >
                    <TabsTrigger value="footballer" className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">
                        {operationType}
                        {' '}
                        Footballer
                      </span>
                      <span className="sm:hidden">{operationType}</span>
                      <Badge variant="secondary" className="ml-1 text-xs sm:ml-2">1</Badge>
                    </TabsTrigger>
                    {((!isExistingPlayer && footballerTeamsJson.length > 0) || (isExistingPlayer && hasTeamChanges)) && (
                      <TabsTrigger value="teams" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{isExistingPlayer ? 'Team Operations' : 'Create Teams'}</span>
                        <span className="sm:hidden">Teams</span>
                        <Badge variant="secondary" className="ml-1 text-xs sm:ml-2">
                          {isExistingPlayer ? getTeamChanges.deletes.length + getTeamChanges.updates.length + getTeamChanges.creates.length : footballerTeamsJson.length}
                        </Badge>
                      </TabsTrigger>
                    )}
                    {hasNationChanges && (
                      <TabsTrigger value="nations" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{isExistingPlayer ? 'Nation Operations' : 'Create Nations'}</span>
                        <span className="sm:hidden">Nations</span>
                        <Badge variant="secondary" className="ml-1 text-xs sm:ml-2">
                          {getNationChanges.updates.length + getNationChanges.creates.length}
                        </Badge>
                      </TabsTrigger>
                    )}
                    {hasPositionChanges && (
                      <TabsTrigger value="positions" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{isExistingPlayer ? 'Position Sync' : 'Set Positions'}</span>
                        <span className="sm:hidden">Positions</span>
                        <Badge variant="secondary" className="ml-1 text-xs sm:ml-2">
                          {selectedPositions?.length ?? 0}
                        </Badge>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAsHttpRequest(!showAsHttpRequest)}
                    className="flex items-center gap-2"
                    disabled={!!(isExistingPlayer && hasChanges)}
                  >
                    {showAsHttpRequest ? 'Show JSON' : 'Show HTTP Request'}
                  </Button>
                </div>

                <TabsContent value="footballer" className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="break-all text-sm font-medium">
                      {showAsHttpRequest
                        ? (
                            <span className="hidden sm:inline">
                              HTTP Request to
                              {footballerMethod}
                              {' '}
                              {footballerEndpoint}
                            </span>
                          )
                        : (
                            <span>
                              {footballerMethod}
                              {' '}
                              {footballerEndpoint}
                            </span>
                          )}
                      <span className="sm:hidden">
                        {showAsHttpRequest ? `${footballerMethod}` : `${footballerMethod}`}
                      </span>
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const content = showAsHttpRequest
                          ? generateHttpRequest(footballerEndpoint, footballerMethod, footballerJson)
                          : JSON.stringify(footballerJson, null, 2);
                        copyToClipboard(content, 'footballer');
                      }}
                      disabled={!!(isExistingPlayer && !hasChanges)}
                      className="w-full sm:w-auto"
                    >
                      {copiedStates.footballer ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="ml-2">{copiedStates.footballer ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>

                  {isExistingPlayer && !hasChanges
                    ? (
                        <div className="rounded-lg border bg-gray-50 py-8 text-center text-gray-500 dark:bg-slate-800">
                          <p className="text-sm">No changes detected - API call not needed</p>
                        </div>
                      )
                    : (
                        <ScrollArea className="h-64 w-full rounded-lg border">
                          <div className="bg-gray-100 p-3 dark:bg-slate-700 sm:p-4">
                            <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                              <code>
                                {showAsHttpRequest
                                  ? generateHttpRequest(footballerEndpoint, footballerMethod, footballerJson)
                                  : JSON.stringify(footballerJson, null, 2)}
                              </code>
                            </pre>
                          </div>
                        </ScrollArea>
                      )}
                </TabsContent>

                <TabsContent value="teams" className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="break-all text-sm font-medium">
                      <span className="hidden sm:inline">
                        {isExistingPlayer ? 'Team Updates' : showAsHttpRequest ? 'HTTP Request to POST /data/footballer-teams/' : 'POST /data/footballer-teams/'}
                      </span>
                      <span className="sm:hidden">
                        {isExistingPlayer ? 'Team Updates' : 'POST /data/footballer-teams/'}
                      </span>
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isExistingPlayer) {
                          // For existing players, create a combined view of all operations
                          const allOperations = [
                            ...getTeamChanges.deletes.map(deleteOp => ({
                              operation: 'DELETE',
                              endpoint: `/data/footballer-teams/${deleteOp.id}/`,
                              method: 'DELETE',
                              data: { reason: 'Team mismatch or extra team in database', position: deleteOp.position, team_name: deleteOp.teamName },
                              teamName: deleteOp.teamName,
                            })),
                            ...getTeamChanges.updates.map(update => ({
                              operation: 'UPDATE',
                              endpoint: `/data/footballer-teams/${update.id}/`,
                              method: 'PUT',
                              data: update.changes,
                              teamName: update.teamName,
                            })),
                            ...getTeamChanges.creates.map(create => ({
                              operation: 'CREATE',
                              endpoint: '/data/footballer-teams/',
                              method: 'POST',
                              data: create.teamData,
                              teamName: create.teamName,
                            })),
                          ];
                          const content = showAsHttpRequest
                            ? allOperations.map(op =>
                                `// ${op.operation} ${op.teamName}\n${generateHttpRequest(op.endpoint, op.method, op.data)}`,
                              ).join('\n\n')
                            : JSON.stringify(allOperations, null, 2);
                          copyToClipboard(content, 'teams');
                        } else {
                          const content = showAsHttpRequest
                            ? generateHttpRequest('/data/footballer-teams/', 'POST', footballerTeamsJson)
                            : JSON.stringify(footballerTeamsJson, null, 2);
                          copyToClipboard(content, 'teams');
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      {copiedStates.teams ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="ml-2">{copiedStates.teams ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>

                  {isExistingPlayer ? (
                    // Show team deletes, updates and creates for existing players
                    <div className="space-y-4">
                      {getTeamChanges.deletes.length > 0 && (
                        <div>
                          <h5 className="mb-2 text-xs font-medium text-red-700 dark:text-red-400 sm:text-sm">
                            Team Record Deletions (
                            {getTeamChanges.deletes.length}
                            )
                          </h5>
                          <ScrollArea className="h-48 w-full rounded-lg border">
                            <div className="space-y-3 bg-red-50 p-3 dark:bg-red-900/20 sm:p-4">
                              {getTeamChanges.deletes.map((deleteOp, index) => (
                                <div key={index} className="border-b border-red-200 pb-2 last:border-b-0 last:pb-0 dark:border-red-700">
                                  <p className="mb-1 break-all text-[10px] font-medium text-red-800 dark:text-red-300 sm:text-xs">
                                    DELETE /data/footballer-teams/
                                    {deleteOp.id}
                                    / -
                                    {' '}
                                    {deleteOp.teamName}
                                    {' '}
                                    (position
                                    {' '}
                                    {deleteOp.position}
                                    )
                                  </p>
                                  <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                                    <code>
                                      {showAsHttpRequest
                                        ? generateHttpRequest(`/data/footballer-teams/${deleteOp.id}/`, 'DELETE', { reason: 'Team mismatch or extra team in database', position: deleteOp.position, team_name: deleteOp.teamName })
                                        : JSON.stringify({ reason: 'Team mismatch or extra team in database', position: deleteOp.position, team_name: deleteOp.teamName }, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {getTeamChanges.updates.length > 0 && (
                        <div>
                          <h5 className="mb-2 text-xs font-medium text-blue-700 dark:text-blue-400 sm:text-sm">
                            Team Record Updates (
                            {getTeamChanges.updates.length}
                            )
                          </h5>
                          <ScrollArea className="h-48 w-full rounded-lg border">
                            <div className="space-y-3 bg-blue-50 p-3 dark:bg-blue-900/20 sm:p-4">
                              {getTeamChanges.updates.map((update, index) => (
                                <div key={index} className="border-b border-blue-200 pb-2 last:border-b-0 last:pb-0 dark:border-blue-700">
                                  <p className="mb-1 break-all text-[10px] font-medium text-blue-800 dark:text-blue-300 sm:text-xs">
                                    PUT /data/footballer-teams/
                                    {update.id}
                                    / -
                                    {' '}
                                    {update.teamName}
                                    {' '}
                                    (position
                                    {' '}
                                    {update.position}
                                    )
                                  </p>
                                  <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                                    <code>
                                      {showAsHttpRequest
                                        ? generateHttpRequest(`/data/footballer-teams/${update.id}/`, 'PUT', update.changes)
                                        : JSON.stringify(update.changes, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {getTeamChanges.creates.length > 0 && (
                        <div>
                          <h5 className="mb-2 text-xs font-medium text-green-700 dark:text-green-400 sm:text-sm">
                            New Team Records (
                            {getTeamChanges.creates.length}
                            )
                          </h5>
                          <ScrollArea className="h-48 w-full rounded-lg border">
                            <div className="space-y-3 bg-green-50 p-3 dark:bg-green-900/20 sm:p-4">
                              {getTeamChanges.creates.map((create, index) => (
                                <div key={index} className="border-b border-green-200 pb-2 last:border-b-0 last:pb-0 dark:border-green-700">
                                  <p className="mb-1 break-all text-[10px] font-medium text-green-800 dark:text-green-300 sm:text-xs">
                                    POST /data/footballer-teams/ -
                                    {' '}
                                    {create.teamName}
                                    {' '}
                                    (position
                                    {' '}
                                    {create.position}
                                    )
                                  </p>
                                  <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                                    <code>
                                      {showAsHttpRequest
                                        ? generateHttpRequest('/data/footballer-teams/', 'POST', create.teamData)
                                        : JSON.stringify(create.teamData, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {!hasTeamChanges && (
                        <div className="rounded-lg border bg-gray-50 py-8 text-center text-gray-500 dark:bg-slate-800">
                          <p className="text-sm">No team changes detected</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show team creation for new players
                    footballerTeamsJson.length > 0
                      ? (
                          <ScrollArea className="h-64 w-full rounded-lg border">
                            <div className="bg-gray-100 p-3 dark:bg-slate-700 sm:p-4">
                              <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                                <code>
                                  {showAsHttpRequest
                                    ? generateHttpRequest('/data/footballer-teams/', 'POST', footballerTeamsJson)
                                    : JSON.stringify(footballerTeamsJson, null, 2)}
                                </code>
                              </pre>
                            </div>
                          </ScrollArea>
                        )
                      : (
                          <div className="rounded-lg border py-8 text-center text-gray-500">
                            <p>No teams found in database to create records for</p>
                          </div>
                        )
                  )}
                </TabsContent>

                <TabsContent value="nations" className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="break-all text-sm font-medium">
                      <span>{isExistingPlayer ? 'Nation Stats Operations' : 'POST /data/footballer-nations/'}</span>
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allNationOps = [
                          ...getNationChanges.updates.map(update => ({
                            operation: 'UPDATE',
                            endpoint: `/data/footballer-nations/${update.id}/`,
                            method: 'PUT',
                            data: update.changes,
                            nationName: update.nationName,
                          })),
                          ...getNationChanges.creates.map(create => ({
                            operation: 'CREATE',
                            endpoint: '/data/footballer-nations/',
                            method: 'POST',
                            data: create.nationData,
                            nationName: create.nationName,
                          })),
                        ];
                        const content = showAsHttpRequest
                          ? allNationOps.map(op =>
                              `// ${op.operation} ${op.nationName}\n${generateHttpRequest(op.endpoint, op.method, op.data)}`,
                            ).join('\n\n')
                          : JSON.stringify(allNationOps, null, 2);
                        copyToClipboard(content, 'nations');
                      }}
                      className="w-full sm:w-auto"
                    >
                      {copiedStates.nations ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="ml-2">{copiedStates.nations ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {getNationChanges.updates.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-xs font-medium text-blue-700 dark:text-blue-400 sm:text-sm">
                          Nation Stat Updates (
                          {getNationChanges.updates.length}
                          )
                        </h5>
                        <ScrollArea className="h-48 w-full rounded-lg border">
                          <div className="space-y-3 bg-blue-50 p-3 dark:bg-blue-900/20 sm:p-4">
                            {getNationChanges.updates.map((update, index) => (
                              <div key={index} className="border-b border-blue-200 pb-2 last:border-b-0 last:pb-0 dark:border-blue-700">
                                <p className="mb-1 break-all text-[10px] font-medium text-blue-800 dark:text-blue-300 sm:text-xs">
                                  PUT /data/footballer-nations/
                                  {update.id}
                                  / -
                                  {' '}
                                  {update.nationName}
                                </p>
                                <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                                  <code>
                                    {showAsHttpRequest
                                      ? generateHttpRequest(`/data/footballer-nations/${update.id}/`, 'PUT', update.changes)
                                      : JSON.stringify(update.changes, null, 2)}
                                  </code>
                                </pre>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {getNationChanges.creates.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-xs font-medium text-green-700 dark:text-green-400 sm:text-sm">
                          New Nation Stats (
                          {getNationChanges.creates.length}
                          )
                        </h5>
                        <ScrollArea className="h-48 w-full rounded-lg border">
                          <div className="space-y-3 bg-green-50 p-3 dark:bg-green-900/20 sm:p-4">
                            {getNationChanges.creates.map((create, index) => (
                              <div key={index} className="border-b border-green-200 pb-2 last:border-b-0 last:pb-0 dark:border-green-700">
                                <p className="mb-1 break-all text-[10px] font-medium text-green-800 dark:text-green-300 sm:text-xs">
                                  POST /data/footballer-nations/ -
                                  {' '}
                                  {create.nationName}
                                </p>
                                <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                                  <code>
                                    {showAsHttpRequest
                                      ? generateHttpRequest('/data/footballer-nations/', 'POST', create.nationData)
                                      : JSON.stringify(create.nationData, null, 2)}
                                  </code>
                                </pre>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {!hasNationChanges && (
                      <div className="rounded-lg border bg-gray-50 py-8 text-center text-gray-500 dark:bg-slate-800">
                        <p className="text-sm">No nation changes detected</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Positions Tab */}
                <TabsContent value="positions" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {isExistingPlayer ? 'Position Sync' : 'Set Positions'}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!getPositionOps.positionsPayload) return;
                        const posOp = {
                          operation: isExistingPlayer ? 'SYNC' : 'SET',
                          endpoint: '/data/footballer-positions/set-positions/',
                          method: 'POST',
                          data: getPositionOps.positionsPayload,
                        };
                        const content = showAsHttpRequest
                          ? `// ${posOp.operation} Positions\n${generateHttpRequest(posOp.endpoint, posOp.method, posOp.data)}`
                          : JSON.stringify(posOp, null, 2);
                        copyToClipboard(content, 'positions');
                      }}
                      className="w-full sm:w-auto"
                    >
                      {copiedStates.positions ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="ml-2">{copiedStates.positions ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>

                  {getPositionOps.positionsPayload ? (
                    <div>
                      <h5 className="mb-2 text-xs font-medium text-purple-700 dark:text-purple-400 sm:text-sm">
                        {isExistingPlayer ? 'Sync' : 'Set'}
                        {' '}
                        Positions (
                        {selectedPositions?.length ?? 0}
                        )
                      </h5>
                      <ScrollArea className="h-48 w-full rounded-lg border">
                        <div className="space-y-3 bg-purple-50 p-3 dark:bg-purple-900/20 sm:p-4">
                          <div className="border-b border-purple-200 pb-2 last:border-b-0 last:pb-0 dark:border-purple-700">
                            <p className="mb-1 break-all text-[10px] font-medium text-purple-800 dark:text-purple-300 sm:text-xs">
                              POST /data/footballer-positions/set-positions/
                            </p>
                            <pre className="overflow-x-auto font-mono text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs">
                              <code>
                                {showAsHttpRequest
                                  ? generateHttpRequest('/data/footballer-positions/set-positions/', 'POST', getPositionOps.positionsPayload)
                                  : JSON.stringify(getPositionOps.positionsPayload, null, 2)}
                              </code>
                            </pre>
                          </div>

                          {/* Show individual positions being set */}
                          <div className="mt-2 space-y-1">
                            {selectedPositions?.map(pos => (
                              <div key={pos.position_id} className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                                <span className="font-mono">{pos.name}</span>
                                <span className="opacity-60">{pos.full_name}</span>
                                {pos.is_primary && <span className="font-medium text-amber-600 dark:text-amber-400">★ Primary</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-gray-50 py-8 text-center text-gray-500 dark:bg-slate-800">
                      <p className="text-sm">No position changes detected</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Separator />

              <div className="flex gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <GraphiteButton
                      onClick={() => setDialogOpen(true)}
                      disabled={hasValidationIssues || !!(isExistingPlayer && !hasChanges && !hasTeamChanges && !hasNationChanges && !hasPositionChanges)}
                      icon={FileText}
                      className="flex-1"
                    >
                      Preview Full Commands
                    </GraphiteButton>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>
                        Complete API Commands
                        {isExistingPlayer && (
                          <Badge variant="outline" className="ml-2 border-blue-200 bg-blue-50 text-blue-700">
                            Update Mode
                          </Badge>
                        )}
                      </DialogTitle>
                      <DialogDescription>
                        {isExistingPlayer
                          ? `Full JSON payload for updating the existing footballer record`
                          : `Full JSON payload for creating footballer and all team records`}
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 font-medium">
                            1.
                            {' '}
                            {operationType}
                            {' '}
                            Footballer
                            {isExistingPlayer && (
                              <span className="ml-2 text-sm text-gray-600">
                                (
                                {footballerMethod}
                                {' '}
                                {footballerEndpoint}
                                )
                              </span>
                            )}
                          </h4>
                          <div className="overflow-x-auto rounded-lg bg-gray-100 p-3 dark:bg-slate-700">
                            <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                              <code>{JSON.stringify(footballerJson, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                        {!isExistingPlayer && footballerTeamsJson.length > 0 && (
                          <div>
                            <h4 className="mb-2 font-medium">2. Create Team Records</h4>
                            {footballerTeamsJson.map((team, index) => (
                              <div key={index} className="mb-3">
                                <p className="mb-1 text-sm text-gray-600">
                                  Team
                                  {index + 1}
                                  :
                                </p>
                                <div className="overflow-x-auto rounded-lg bg-gray-100 p-3 dark:bg-slate-700">
                                  <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                    <code>{JSON.stringify(team, null, 2)}</code>
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {isExistingPlayer && hasTeamChanges && (
                          <div>
                            <h4 className="mb-2 font-medium">2. Team Operations</h4>

                            {getTeamChanges.deletes.length > 0 && (
                              <div className="mb-4">
                                <p className="mb-2 text-sm font-medium text-red-700">
                                  Delete Teams (
                                  {getTeamChanges.deletes.length}
                                  )
                                </p>
                                {getTeamChanges.deletes.map((deleteOp, index) => (
                                  <div key={index} className="mb-3">
                                    <p className="mb-1 text-sm text-gray-600">
                                      DELETE /data/footballer-teams/
                                      {deleteOp.id}
                                      / -
                                      {' '}
                                      {deleteOp.teamName}
                                      {' '}
                                      (position
                                      {' '}
                                      {deleteOp.position}
                                      )
                                    </p>
                                    <div className="overflow-x-auto rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                                      <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                        <code>{JSON.stringify({ reason: 'Team mismatch or extra team in database', position: deleteOp.position, team_name: deleteOp.teamName }, null, 2)}</code>
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {getTeamChanges.updates.length > 0 && (
                              <div className="mb-4">
                                <p className="mb-2 text-sm font-medium text-blue-700">
                                  Update Existing Teams (
                                  {getTeamChanges.updates.length}
                                  )
                                </p>
                                {getTeamChanges.updates.map((update, index) => (
                                  <div key={index} className="mb-3">
                                    <p className="mb-1 text-sm text-gray-600">
                                      PUT /data/footballer-teams/
                                      {update.id}
                                      / -
                                      {' '}
                                      {update.teamName}
                                      {' '}
                                      (position
                                      {' '}
                                      {update.position}
                                      )
                                    </p>
                                    <div className="overflow-x-auto rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                      <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                        <code>{JSON.stringify(update.changes, null, 2)}</code>
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {getTeamChanges.creates.length > 0 && (
                              <div>
                                <p className="mb-2 text-sm font-medium text-green-700">
                                  Create New Teams (
                                  {getTeamChanges.creates.length}
                                  )
                                </p>
                                {getTeamChanges.creates.map((create, index) => (
                                  <div key={index} className="mb-3">
                                    <p className="mb-1 text-sm text-gray-600">
                                      POST /data/footballer-teams/ -
                                      {' '}
                                      {create.teamName}
                                      {' '}
                                      (position
                                      {' '}
                                      {create.position}
                                      )
                                    </p>
                                    <div className="overflow-x-auto rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                      <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                        <code>{JSON.stringify(create.teamData, null, 2)}</code>
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {hasNationChanges && (
                          <div>
                            <h4 className="mb-2 font-medium">
                              {isExistingPlayer && hasTeamChanges ? '3' : '2'}
                              .
                              {' '}
                              Nation Operations
                            </h4>

                            {getNationChanges.updates.length > 0 && (
                              <div className="mb-4">
                                <p className="mb-2 text-sm font-medium text-blue-700">
                                  Update Nation Stats (
                                  {getNationChanges.updates.length}
                                  )
                                </p>
                                {getNationChanges.updates.map((update, index) => (
                                  <div key={index} className="mb-3">
                                    <p className="mb-1 text-sm text-gray-600">
                                      PUT /data/footballer-nations/
                                      {update.id}
                                      / -
                                      {' '}
                                      {update.nationName}
                                    </p>
                                    <div className="overflow-x-auto rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                      <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                        <code>{JSON.stringify(update.changes, null, 2)}</code>
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {getNationChanges.creates.length > 0 && (
                              <div>
                                <p className="mb-2 text-sm font-medium text-green-700">
                                  Create Nation Stats (
                                  {getNationChanges.creates.length}
                                  )
                                </p>
                                {getNationChanges.creates.map((create, index) => (
                                  <div key={index} className="mb-3">
                                    <p className="mb-1 text-sm text-gray-600">
                                      POST /data/footballer-nations/ -
                                      {' '}
                                      {create.nationName}
                                    </p>
                                    <div className="overflow-x-auto rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                      <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                        <code>{JSON.stringify(create.nationData, null, 2)}</code>
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {hasPositionChanges && getPositionOps.positionsPayload && (
                          <div>
                            <h4 className="mb-2 font-medium">
                              {(() => {
                                let step = 2;
                                if (isExistingPlayer && hasTeamChanges) step++;
                                if (hasNationChanges) step++;
                                return step;
                              })()}
                              .
                              {' '}
                              {isExistingPlayer ? 'Sync Positions' : 'Set Positions'}
                            </h4>
                            <div className="mb-3">
                              <p className="mb-1 text-sm text-gray-600">
                                POST /data/footballer-positions/set-positions/
                              </p>
                              <div className="overflow-x-auto rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                                <pre className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                  <code>{JSON.stringify(getPositionOps.positionsPayload, null, 2)}</code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
