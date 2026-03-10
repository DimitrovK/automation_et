import type { DeploymentLogEntry } from '@/components/career-lookup/deployment-console';
import type { CreateFootballerNationRequest, CreateFootballerRequest, CreateFootballerTeamRequest, Footballer, FootballerNationStat, n8nWikiPlayerData, PlayerConfiguration } from '@/types/player';
import { AlertTriangle, Edit, RefreshCcw, RotateCcw, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createLogEntry, DeploymentConsole } from '@/components/career-lookup/deployment-console';
import { JsonCommandPreview } from '@/components/career-lookup/json-command-preview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { FootballerAPI } from '@/lib/footballer-api';

type CareerLookupPlayerConfigurationProps = {
  // Player data
  playerData: n8nWikiPlayerData;
  dbPlayerInfo: Footballer | null;
  dbNationalTeams?: FootballerNationStat[];

  // Data source choice for validation conflicts
  chosenDataSource?: 'wikipedia' | 'database' | null;

  // Handlers
  onErrorChange: (error: string | null) => void;
  onReloadPlayer?: () => void;
  onNationStatsUpdated?: () => void;

  className?: string;
};

export function CareerLookupPlayerConfiguration({
  playerData,
  dbPlayerInfo,
  dbNationalTeams,
  chosenDataSource,
  onErrorChange,
  onReloadPlayer,
  onNationStatsUpdated,
  className,
}: CareerLookupPlayerConfigurationProps) {
  const { user } = useAuth();

  // Internal deployment console ref
  const deploymentConsoleRef = useRef<HTMLDivElement>(null);

  // Internal editing state management
  const [isEditingNames, setIsEditingNames] = useState(false);

  // Internal deployment state
  const [deploying, setDeploying] = useState(false);
  const [deploymentComplete, setDeploymentComplete] = useState(false);

  // Internal deployment logs state
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLogEntry[]>([]);

  // Internal player configuration state
  const [playerConfig, setPlayerConfig] = useState<PlayerConfiguration>({
    status: 'APPROVED',
    show_date_of_birth_on_search: false,
    retired: false,
    is_player: true,
    is_manager: false,
    might_change: false,
    available_for_career_path: true,
    career_path_difficulty: 'NORMAL',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    countryID: null,
    wikipediaUrl: '',
  });

  // Initialize player configuration based on data source preference
  useEffect(() => {
    if (dbPlayerInfo && playerData) {
      // Use database configuration and data when player exists in DB
      const dbConfig = {
        status: 'APPROVED' as const,
        show_date_of_birth_on_search: dbPlayerInfo.show_date_of_birth_on_search,
        retired: dbPlayerInfo.retired,
        is_player: dbPlayerInfo.is_player,
        is_manager: dbPlayerInfo.is_manager,
        might_change: dbPlayerInfo.might_change,
        available_for_career_path: dbPlayerInfo.available_for_career_path,
        career_path_difficulty: dbPlayerInfo.career_path_difficulty as 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME',
        firstName: dbPlayerInfo.first_name,
        lastName: dbPlayerInfo.last_name,
        dateOfBirth: dbPlayerInfo.date_of_birth,
        nationality: dbPlayerInfo.nation.name,
        countryID: dbPlayerInfo.nation.id,
        wikipediaUrl: dbPlayerInfo.wikipedia_url || '',
      };
      setPlayerConfig(dbConfig);
    } else if (playerData && !dbPlayerInfo) {
      // Use default configuration and playerData when it's a new player
      const { first, last } = parsePlayerName(playerData.playerName);
      const defaultConfig = {
        status: 'AWAITING_REVISION' as const,
        show_date_of_birth_on_search: false,
        retired: false,
        is_player: true,
        is_manager: false,
        might_change: false,
        available_for_career_path: true,
        career_path_difficulty: 'NORMAL' as const,
        firstName: first,
        lastName: last,
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
        countryID: playerData.countryID,
        wikipediaUrl: '',
      };
      setPlayerConfig(defaultConfig);
    }
  }, [playerData, dbPlayerInfo]);

  // Update player data when validation dialog resolves data conflicts
  useEffect(() => {
    if (chosenDataSource === 'database' && dbPlayerInfo) {
      setPlayerConfig(prev => ({
        ...prev,
        dateOfBirth: dbPlayerInfo.date_of_birth,
        nationality: dbPlayerInfo.nation.name,
      }));
    } else if (chosenDataSource === 'wikipedia' && playerData) {
      setPlayerConfig(prev => ({
        ...prev,
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
      }));
    }
  }, [chosenDataSource, dbPlayerInfo, playerData]);

  const parsePlayerName = (fullName: string) => {
    const nameParts = fullName.replace(/_/g, ' ').split(' ');
    if (nameParts.length >= 2) {
      const first = nameParts[0];
      const last = nameParts.slice(1).join(' ');
      return { first, last };
    }
    // For single names (like "Kaka"), put them in the Last Name field
    return { first: '', last: fullName.replace(/_/g, ' ') };
  };

  const handleResync = () => {
    if (!playerData) {
      return;
    }

    // Reset to original playerData values
    const { first, last } = parsePlayerName(playerData.playerName);
    setPlayerConfig(prev => ({
      ...prev,
      firstName: first,
      lastName: last,
      dateOfBirth: playerData.dateOfBirth,
      nationality: playerData.birthCountry,
      countryID: playerData.countryID,
      wikipediaUrl: '', // Reset to empty as originally set
    }));
    setIsEditingNames(false); // Reset editing state to false
  };

  const handleToggleEditing = () => {
    setIsEditingNames(!isEditingNames);
  };

  const addDeploymentLog = (type: DeploymentLogEntry['type'], message: string, data?: any) => {
    const logEntry = createLogEntry(type, message, data);
    setDeploymentLogs(prev => [...prev, logEntry]);
    return logEntry;
  };

  const clearDeploymentLogs = () => {
    setDeploymentLogs([]);
  };

  // Function to detect changes between current config and database data
  const getPlayerChanges = () => {
    if (!dbPlayerInfo) {
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
  };

  const hasChanges = () => {
    return getPlayerChanges() !== null;
  };

  // Function to analyze team changes when Wikipedia is chosen as data source
  const getTeamChanges = () => {
    if (!dbPlayerInfo || chosenDataSource !== 'wikipedia' || !playerData?.teams) {
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
  };

  const hasTeamChanges = () => {
    const teamChanges = getTeamChanges();
    return teamChanges.updates.length > 0 || teamChanges.creates.length > 0 || teamChanges.deletes.length > 0;
  };

  // Function to analyze national team changes (comparing Wikipedia vs DB nation stats)
  const getNationChanges = () => {
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
        // Nation not in DB — needs creation
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
        // Nation exists in DB — check for mismatches
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
  };

  const hasNationChanges = () => {
    const nationChanges = getNationChanges();
    return nationChanges.creates.length > 0 || nationChanges.updates.length > 0;
  };

  const handleUpdatePlayer = async () => {
    if (!dbPlayerInfo || (!hasChanges() && !hasTeamChanges() && !hasNationChanges())) {
      return;
    }

    // Prevent multiple simultaneous operations
    if (deploying) {
      return;
    }

    // Clear previous logs
    clearDeploymentLogs();

    const playerChanges = getPlayerChanges();
    const teamChanges = getTeamChanges();

    if (!playerChanges && !hasTeamChanges() && !hasNationChanges()) {
      addDeploymentLog('info', '💡 No changes detected - Update cancelled');
      return;
    }

    try {
      setDeploying(true);
      setDeploymentComplete(false);
      onErrorChange(null);

      // Scroll to deployment console
      setTimeout(() => {
        deploymentConsoleRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);

      addDeploymentLog('info', '🔄 Starting footballer update...');
      addDeploymentLog('info', `Player: ${playerConfig.firstName} ${playerConfig.lastName}`);

      let updatedFootballer = null;

      // Update footballer if there are player changes
      if (playerChanges) {
        addDeploymentLog('info', `Player changes detected in: ${Object.keys(playerChanges).join(', ')}`);

        // Add user ID to changes (required for updates)
        const updateData = {
          ...playerChanges,
          user: user!.id,
        };

        addDeploymentLog('loading', 'Updating footballer in database...');
        addDeploymentLog('request', `PUT /data/footballers/${dbPlayerInfo.id}/`, updateData);

        // Update the footballer
        updatedFootballer = await FootballerAPI.updateFootballer(dbPlayerInfo.id, updateData as CreateFootballerRequest);

        addDeploymentLog('response', `✅ Footballer updated successfully`, updatedFootballer);
        console.log('Footballer updated successfully:', updatedFootballer);
      }

      // Update and create team records if there are team changes
      if (hasTeamChanges()) {
        addDeploymentLog('info', `📊 Team operations: ${teamChanges.deletes.length} deletes, ${teamChanges.updates.length} updates, ${teamChanges.creates.length} creates`);

        let deletedTeams = 0;
        let updatedTeams = 0;
        let createdTeams = 0;

        // First: Delete teams that need to be removed or replaced
        for (let i = 0; i < teamChanges.deletes.length; i++) {
          const teamDelete = teamChanges.deletes[i];
          try {
            addDeploymentLog('loading', `Deleting team record ${i + 1}/${teamChanges.deletes.length}: ${teamDelete.teamName} (position ${teamDelete.position})`);
            addDeploymentLog('request', `DELETE /data/footballer-teams/${teamDelete.id}/`);

            await FootballerAPI.deleteFootballerTeam(teamDelete.id);

            addDeploymentLog('response', `✅ Team record deleted: ${teamDelete.teamName}`);
            deletedTeams++;
          } catch (teamError) {
            addDeploymentLog('error', `❌ Failed to delete team record for ${teamDelete.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`);
            console.error(`Failed to delete team record for ${teamDelete.teamName}:`, teamError);
          }
        }

        // Second: Update existing team records
        for (let i = 0; i < teamChanges.updates.length; i++) {
          const teamUpdate = teamChanges.updates[i];
          try {
            addDeploymentLog('loading', `Updating team record ${i + 1}/${teamChanges.updates.length}: ${teamUpdate.teamName} (position ${teamUpdate.position})`);
            addDeploymentLog('request', `PUT /data/footballer-teams/${teamUpdate.id}/`, teamUpdate.changes);

            const updatedTeamRecord = await FootballerAPI.updateFootballerTeam(teamUpdate.id, teamUpdate.changes);

            addDeploymentLog('response', `✅ Team record updated: ${teamUpdate.teamName}`, updatedTeamRecord);
            updatedTeams++;
          } catch (teamError) {
            addDeploymentLog('error', `❌ Failed to update team record for ${teamUpdate.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`);
            console.error(`Failed to update team record for ${teamUpdate.teamName}:`, teamError);
          }
        }

        // Third: Create new team records
        for (let i = 0; i < teamChanges.creates.length; i++) {
          const teamCreate = teamChanges.creates[i];
          try {
            addDeploymentLog('loading', `Creating new team record ${i + 1}/${teamChanges.creates.length}: ${teamCreate.teamName} (position ${teamCreate.position})`);
            addDeploymentLog('request', 'POST /data/footballer-teams/', teamCreate.teamData);

            const createdTeamRecord = await FootballerAPI.createFootballerTeam(teamCreate.teamData);

            addDeploymentLog('response', `✅ Team record created: ${teamCreate.teamName}`, createdTeamRecord);
            createdTeams++;
          } catch (teamError) {
            addDeploymentLog('error', `❌ Failed to create team record for ${teamCreate.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`);
            console.error(`Failed to create team record for ${teamCreate.teamName}:`, teamError);
          }
        }

        addDeploymentLog('success', `📈 Team operations completed: ${deletedTeams}/${teamChanges.deletes.length} deletes, ${updatedTeams}/${teamChanges.updates.length} updates, ${createdTeams}/${teamChanges.creates.length} creates`);
      }

      // Update and create national team records if there are nation changes
      const nationChanges = getNationChanges();
      if (hasNationChanges()) {
        addDeploymentLog('info', `🏳️ Nation operations: ${nationChanges.updates.length} updates, ${nationChanges.creates.length} creates`);

        let updatedNations = 0;
        let createdNations = 0;

        // First: Update existing nation stats
        for (let i = 0; i < nationChanges.updates.length; i++) {
          const nationUpdate = nationChanges.updates[i];
          try {
            addDeploymentLog('loading', `Updating nation stat ${i + 1}/${nationChanges.updates.length}: ${nationUpdate.nationName}`);
            addDeploymentLog('request', `PUT /data/footballer-nations/${nationUpdate.id}/`, nationUpdate.changes);

            const updatedNationRecord = await FootballerAPI.updateFootballerNation(nationUpdate.id, nationUpdate.changes as CreateFootballerNationRequest);

            addDeploymentLog('response', `✅ Nation stat updated: ${nationUpdate.nationName}`, updatedNationRecord);
            updatedNations++;
          } catch (nationError) {
            addDeploymentLog('error', `❌ Failed to update nation stat for ${nationUpdate.nationName}: ${nationError instanceof Error ? nationError.message : 'Unknown error'}`);
            console.error(`Failed to update nation stat for ${nationUpdate.nationName}:`, nationError);
          }
        }

        // Second: Create new nation stats
        for (let i = 0; i < nationChanges.creates.length; i++) {
          const nationCreate = nationChanges.creates[i];
          try {
            addDeploymentLog('loading', `Creating nation stat ${i + 1}/${nationChanges.creates.length}: ${nationCreate.nationName}`);
            addDeploymentLog('request', 'POST /data/footballer-nations/', nationCreate.nationData);

            const createdNationRecord = await FootballerAPI.createFootballerNation(nationCreate.nationData);

            addDeploymentLog('response', `✅ Nation stat created: ${nationCreate.nationName}`, createdNationRecord);
            createdNations++;
          } catch (nationError) {
            addDeploymentLog('error', `❌ Failed to create nation stat for ${nationCreate.nationName}: ${nationError instanceof Error ? nationError.message : 'Unknown error'}`);
            console.error(`Failed to create nation stat for ${nationCreate.nationName}:`, nationError);
          }
        }

        addDeploymentLog('success', `🏳️ Nation operations completed: ${updatedNations}/${nationChanges.updates.length} updates, ${createdNations}/${nationChanges.creates.length} creates`);
        onNationStatsUpdated?.();
      }

      // Final success message
      const operations = [];
      if (playerChanges) {
        operations.push(`player data updated`);
      }
      if (hasTeamChanges()) {
        const totalTeamOps = teamChanges.deletes.length + teamChanges.updates.length + teamChanges.creates.length;
        operations.push(`${totalTeamOps} team operations completed`);
      }
      if (hasNationChanges()) {
        const totalNationOps = nationChanges.updates.length + nationChanges.creates.length;
        operations.push(`${totalNationOps} nation operations completed`);
      }

      addDeploymentLog('success', `🎉 Update completed! ${operations.join(', ')}`);
      setDeploymentComplete(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDeploymentLog('error', `❌ Update failed: ${errorMessage}`);
      console.error('Update failed:', error);
      onErrorChange(`Update failed: ${errorMessage}`);
      setDeploymentComplete(false);
    } finally {
      setDeploying(false);
      addDeploymentLog('info', '🏁 Update process finished');
    }
  };

  const handleDeployment = async () => {
    // Only allow deployment if player is not found in DB
    if (playerData?.playerFoundInDB) {
      alert('This player already exists in the database. Deployment is only available for new players.');
      return;
    }

    // Prevent multiple simultaneous deployments
    if (deploying) {
      return;
    }

    // Clear previous logs
    clearDeploymentLogs();

    // Validate required fields
    if (!playerConfig.countryID || !playerConfig.firstName.trim() || !playerConfig.lastName.trim() || !playerConfig.dateOfBirth) {
      alert('Please ensure all required fields are completed before deployment.');
      return;
    }

    try {
      setDeploying(true);
      setDeploymentComplete(false);
      onErrorChange(null);

      // Scroll to deployment console
      setTimeout(() => {
        deploymentConsoleRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);

      addDeploymentLog('info', '🚀 Starting footballer deployment...');
      addDeploymentLog('info', `Player: ${playerConfig.firstName} ${playerConfig.lastName}`);

      // Prepare footballer data
      const footballerData: CreateFootballerRequest = {
        status: playerConfig.status,
        user: user!.id,
        first_name: playerConfig.firstName.trim(),
        last_name: playerConfig.lastName.trim(),
        nation_id: playerConfig.countryID!,
        date_of_birth: playerConfig.dateOfBirth,
        wikipedia_url: playerConfig.wikipediaUrl.trim() || null,
        show_date_of_birth_on_search: playerConfig.show_date_of_birth_on_search,
        retired: playerConfig.retired,
        is_player: playerConfig.is_player,
        is_manager: playerConfig.is_manager,
        might_change: playerConfig.might_change,
        available_for_career_path: playerConfig.available_for_career_path,
        career_path_difficulty: playerConfig.career_path_difficulty,
      };

      addDeploymentLog('loading', 'Deploying footballer to database...');
      addDeploymentLog('request', 'POST /data/footballers/', footballerData);

      // Create the footballer
      const createdFootballer = await FootballerAPI.createFootballer(footballerData);

      addDeploymentLog('response', `✅ Footballer created successfully (ID: ${createdFootballer.id})`, createdFootballer);
      console.log('Footballer created successfully:', createdFootballer);

      // Create team records for teams found in the database
      const foundTeams = playerData.teams.filter(team => team.teamFound && team.teamID);
      let createdTeams = 0;

      addDeploymentLog('info', `📊 Found ${foundTeams.length} teams to create records for`);

      for (let i = 0; i < foundTeams.length; i++) {
        const team = foundTeams[i];
        try {
          const transferTypeString = (team.typeOfTransfer || '').toLowerCase().trim();
          const transferType = transferTypeString.includes('loan') ? 'loan' : 'permanent';

          const teamData: CreateFootballerTeamRequest = {
            footballer_id: createdFootballer.id,
            team_id: team.teamID!,
            role: 'player',
            apps: team.appearances,
            goals: team.goals,
            transfer_type: transferType,
            start_year: team.joinYear,
            end_year: team.departYear,
          };

          addDeploymentLog('loading', `Deploying team record ${i + 1}/${foundTeams.length}: ${team.teamName}`);
          addDeploymentLog('request', 'POST /data/footballer-teams/', teamData);

          const createdTeamRecord = await FootballerAPI.createFootballerTeam(teamData);

          addDeploymentLog('response', `✅ Team record created: ${team.teamName} (${team.joinYear}${team.departYear ? `-${team.departYear}` : ''})`, createdTeamRecord);
          createdTeams++;
        } catch (teamError) {
          addDeploymentLog('error', `❌ Failed to create team record for ${team.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`);
          console.error(`Failed to create team record for ${team.teamName}:`, teamError);
        }
      }

      addDeploymentLog('success', `🎉 Deployment completed! Footballer: ${playerConfig.firstName} ${playerConfig.lastName}`);
      addDeploymentLog('success', `📈 Statistics: ${createdTeams}/${foundTeams.length} team records created`);

      // Create national team stat records for nations found in the database
      const foundNations = playerData.nationalTeams?.filter(nt => nt.nationFound && nt.nationID) || [];
      let createdNations = 0;

      if (foundNations.length > 0) {
        addDeploymentLog('info', `🏳️ Found ${foundNations.length} national team(s) to create records for`);

        for (let i = 0; i < foundNations.length; i++) {
          const nation = foundNations[i];
          try {
            const nationData: CreateFootballerNationRequest = {
              footballer_id: createdFootballer.id,
              nation_id: nation.nationID!,
              apps: nation.apps,
              goals: nation.goals,
            };

            addDeploymentLog('loading', `Deploying nation stat ${i + 1}/${foundNations.length}: ${nation.teamName}`);
            addDeploymentLog('request', 'POST /data/footballer-nations/', nationData);

            const createdNationRecord = await FootballerAPI.createFootballerNation(nationData);

            addDeploymentLog('response', `✅ Nation stat created: ${nation.teamName}`, createdNationRecord);
            createdNations++;
          } catch (nationError) {
            addDeploymentLog('error', `❌ Failed to create nation stat for ${nation.teamName}: ${nationError instanceof Error ? nationError.message : 'Unknown error'}`);
            console.error(`Failed to create nation stat for ${nation.teamName}:`, nationError);
          }
        }

        addDeploymentLog('success', `🏳️ Nation stats: ${createdNations}/${foundNations.length} records created`);
        onNationStatsUpdated?.();
      }

      setDeploymentComplete(true);

      // Trigger a resync to show the updated state
      handleResync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDeploymentLog('error', `❌ Deployment failed: ${errorMessage}`);
      console.error('Deployment failed:', error);
      onErrorChange(`Deployment failed: ${errorMessage}`);
      setDeploymentComplete(false);
    } finally {
      setDeploying(false);
      addDeploymentLog('info', '🏁 Deployment process finished');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Save className="size-6" />
              Player Configuration
            </CardTitle>
            <CardDescription>Configure player settings for deployment to the database</CardDescription>
          </div>
          <Button variant="outline" onClick={handleResync} className="flex items-center gap-2 bg-transparent">
            <RotateCcw className="size-4" />
            Resync Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Top Row - Player Information and Player Settings */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Player Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Player Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleEditing}
                className="h-8 px-3"
              >
                <Edit className="mr-1 size-3" />
                {isEditingNames ? 'Lock' : 'Edit'}
              </Button>
            </div>

            {/* Player Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Player Status
              </Label>
              <Select
                value={playerConfig.status}
                onValueChange={(value: 'APPROVED' | 'AWAITING_REVISION' | 'DENIED' | 'AWAITING_CHANGE_CHECK') =>
                  setPlayerConfig({
                    ...playerConfig,
                    status: value,
                  })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="AWAITING_REVISION">Awaiting Revision</SelectItem>
                  <SelectItem value="DENIED">Denied</SelectItem>
                  <SelectItem value="AWAITING_CHANGE_CHECK">Awaiting Change Check</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">The approval status of this footballer record</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="first-name"
                  value={playerConfig.firstName}
                  onChange={e => setPlayerConfig(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? 'cursor-not-allowed bg-gray-50 dark:bg-slate-600' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="last-name"
                  value={playerConfig.lastName}
                  onChange={e => setPlayerConfig(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? 'cursor-not-allowed bg-gray-50 dark:bg-slate-600' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-of-birth" className="text-sm font-medium">
                  Date of Birth
                </Label>
                <Input
                  id="date-of-birth"
                  type="date"
                  value={playerConfig.dateOfBirth}
                  onChange={e => setPlayerConfig(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? 'cursor-not-allowed bg-gray-50 dark:bg-slate-600' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-sm font-medium">
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  value={playerConfig.nationality}
                  onChange={e => setPlayerConfig(prev => ({ ...prev, nationality: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? 'cursor-not-allowed bg-gray-50 dark:bg-slate-600' : ''}`}
                />
              </div>
            </div>

            {/* Wikipedia URL - Full width */}
            <div className="space-y-2">
              <Label htmlFor="wikipediaUrl" className="text-sm font-medium">
                Wikipedia URL
              </Label>
              <Input
                id="wikipediaUrl"
                placeholder="https://en.wikipedia.org/wiki/Player_Name"
                value={playerConfig.wikipediaUrl}
                onChange={e => setPlayerConfig(prev => ({ ...prev, wikipediaUrl: e.target.value }))}
                disabled={!isEditingNames}
                className={`${!isEditingNames ? 'cursor-not-allowed bg-gray-50 dark:bg-slate-600' : ''}`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Optional: Link to the player's Wikipedia page
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Player information is automatically loaded from the search results. Click "Edit" to modify any field.
            </p>
          </div>

          {/* Right Column - Player Settings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Player Settings</h3>
              {playerData?.playerFoundInDB && dbPlayerInfo && (
                <Badge variant="secondary" className="border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  Pre-loaded from DB
                </Badge>
              )}
            </div>

            {/* Display Settings */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="show_date_of_birth"
                  checked={playerConfig.show_date_of_birth_on_search}
                  onCheckedChange={checked =>
                    setPlayerConfig({
                      ...playerConfig,
                      show_date_of_birth_on_search: checked as boolean,
                    })}
                />
                <Label htmlFor="show_date_of_birth" className="text-sm font-medium">
                  Show date of birth in search results
                </Label>
              </div>
              <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                Whether to display the year of birth in search results
              </p>
            </div>

            {/* Player Status */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="retired"
                  checked={playerConfig.retired}
                  onCheckedChange={checked =>
                    setPlayerConfig({
                      ...playerConfig,
                      retired: checked as boolean,
                    })}
                />
                <Label htmlFor="retired" className="text-sm font-medium">
                  Player is retired
                </Label>
              </div>
              <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                Indicates whether the footballer has retired from professional football
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="is_player"
                  checked={playerConfig.is_player}
                  onCheckedChange={checked =>
                    setPlayerConfig({
                      ...playerConfig,
                      is_player: checked as boolean,
                    })}
                />
                <Label htmlFor="is_player" className="text-sm font-medium">
                  Is a Player
                </Label>
              </div>
              <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                Indicates whether this person has played as a footballer
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="is_manager"
                  checked={playerConfig.is_manager}
                  onCheckedChange={checked =>
                    setPlayerConfig({
                      ...playerConfig,
                      is_manager: checked as boolean,
                    })}
                />
                <Label htmlFor="is_manager" className="text-sm font-medium">
                  Is a Manager
                </Label>
              </div>
              <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                Indicates whether this person has managed as a football manager/coach
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="might_change"
                  checked={playerConfig.might_change}
                  onCheckedChange={checked =>
                    setPlayerConfig({
                      ...playerConfig,
                      might_change: checked as boolean,
                    })}
                />
                <Label htmlFor="might_change" className="text-sm font-medium">
                  Information might change
                </Label>
              </div>
              <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                Indicates if the player information might need revisions in the future
              </p>
            </div>

            {/* CareerPath Game Settings */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="available_for_career_path"
                  checked={playerConfig.available_for_career_path}
                  onCheckedChange={checked =>
                    setPlayerConfig({
                      ...playerConfig,
                      available_for_career_path: checked as boolean,
                    })}
                />
                <Label htmlFor="available_for_career_path" className="text-sm font-medium">
                  Available for CareerPath game
                </Label>
              </div>
              <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                Whether the footballer is available in the CareerPath game
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                CareerPath Difficulty Level
              </Label>
              <Select
                value={playerConfig.career_path_difficulty}
                onValueChange={(value: 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME') =>
                  setPlayerConfig({
                    ...playerConfig,
                    career_path_difficulty: value,
                  })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                  <SelectItem value="EXTREME">Extreme</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">The difficulty level of this footballer in CareerPath</p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* JSON Commands Preview */}
        <JsonCommandPreview
          playerData={playerData}
          playerConfig={playerConfig}
          dbPlayerInfo={dbPlayerInfo}
          chosenDataSource={chosenDataSource}
          dbNationalTeams={dbNationalTeams}
        />

        <Separator className="my-8" />

        {/* Validation Message and Save Button */}
        <div className="space-y-4">
          {playerData.summary.notFoundTeams > 0 && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Deployment Warning:</strong>
                {' '}
                {playerData.summary.notFoundTeams}
                {' '}
                team(s) not found in
                database.
                <br />
                All teams must be added to the database before deployment. Use the admin links above to add
                missing teams.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <Button
              onClick={playerData?.playerFoundInDB ? handleUpdatePlayer : handleDeployment}
              size="lg"
              className="border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 px-8 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                deploying
                || (!playerData?.playerFoundInDB && playerData.summary.notFoundTeams > 0)
                || (playerData?.playerFoundInDB && !hasChanges() && !hasTeamChanges() && !hasNationChanges())
              }
            >
              <Save className="mr-2 size-5" />
              {deploying
                ? (playerData?.playerFoundInDB ? 'Updating...' : 'Deploying...')
                : playerData?.playerFoundInDB
                  ? (hasChanges() || hasTeamChanges() || hasNationChanges() ? 'Update Footballer' : 'No Changes Detected')
                  : 'Deploy Footballer'}
            </Button>
          </div>

          {!deploying
            ? (
                playerData?.playerFoundInDB
                  ? (
                      (hasChanges() || hasTeamChanges() || hasNationChanges())
                        ? (
                            <p className="text-center text-sm font-medium text-blue-600">
                              ✏️ Changes detected - Ready to update existing player
                              {hasChanges() && (hasTeamChanges() || hasNationChanges()) && ' and'}
                              {hasTeamChanges() && ' teams'}
                              {hasTeamChanges() && hasNationChanges() && ' and'}
                              {hasNationChanges() && ' nations'}
                              {!hasChanges() && hasTeamChanges() && !hasNationChanges() && ' teams'}
                              {!hasChanges() && !hasTeamChanges() && hasNationChanges() && ' nations'}
                            </p>
                          )
                        : (
                            <p className="text-center text-sm font-medium text-gray-600">
                              ✅ Player data matches database - No updates needed
                              {chosenDataSource === 'wikipedia' && ' (including team records)'}
                            </p>
                          )
                    )
                  : playerData.summary.notFoundTeams === 0
                    ? (
                        <p className="text-center text-sm font-medium text-green-600">
                          ✅ All teams verified in database - Ready for deployment
                        </p>
                      )
                    : null
              )
            : null}
        </div>

        {/* Deployment Console */}
        <div ref={deploymentConsoleRef}>
          <DeploymentConsole
            logs={deploymentLogs}
            isActive={deploying}
            onClear={clearDeploymentLogs}
          />
        </div>

        {/* Load Player with New Info Button - Only show after successful deployment/update */}
        {deploymentComplete && onReloadPlayer && (
          <div className="mt-6">
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setDeploymentComplete(false); // Reset the state
                  onReloadPlayer();
                }}
                size="lg"
                className="border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 px-8 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl"
              >
                <RefreshCcw className="mr-2 size-5" />
                Load Player with New Info
              </Button>
            </div>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Reload the player data to see the updated information from the database
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
