import { Save, Edit, RotateCcw, AlertTriangle, RefreshCcw } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JsonCommandPreview } from "@/components/career-lookup/json-command-preview"
import { DeploymentConsole, type DeploymentLogEntry, createLogEntry } from "@/components/career-lookup/deployment-console"
import type { n8nWikiPlayerData, PlayerConfiguration, Footballer, CreateFootballerRequest, CreateFootballerTeamRequest } from "@/types/player"
import { FootballerAPI } from "@/lib/footballer-api"
import { useAuth } from "@/lib/auth"

interface CareerLookupPlayerConfigurationProps {
  // Player data
  playerData: n8nWikiPlayerData
  dbPlayerInfo: Footballer | null
  
  // Data source choice for validation conflicts
  chosenDataSource?: 'wikipedia' | 'database' | null
  
  // Handlers
  onErrorChange: (error: string | null) => void
  onReloadPlayer?: () => void
  
  className?: string
}

export function CareerLookupPlayerConfiguration({
  playerData,
  dbPlayerInfo,
  chosenDataSource,
  onErrorChange,
  onReloadPlayer,
  className
}: CareerLookupPlayerConfigurationProps) {
  const { user } = useAuth()
  
  // Internal deployment console ref
  const deploymentConsoleRef = useRef<HTMLDivElement>(null)
  
  // Internal editing state management
  const [isEditingNames, setIsEditingNames] = useState(false)
  
  // Internal deployment state
  const [deploying, setDeploying] = useState(false)
  const [deploymentComplete, setDeploymentComplete] = useState(false)
  
  // Internal deployment logs state
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLogEntry[]>([])
  
  // Internal player configuration state
  const [playerConfig, setPlayerConfig] = useState<PlayerConfiguration>({
    status: "APPROVED",
    show_date_of_birth_on_search: false,
    retired: false,
    might_change: false,
    available_for_career_path: true,
    career_path_difficulty: "NORMAL",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    countryID: null,
    wikipediaUrl: "",
  })

  // Initialize player configuration based on data source preference
  useEffect(() => {
    if (dbPlayerInfo && playerData) {
      // Use database configuration and data when player exists in DB
      const dbConfig = {
        status: "APPROVED" as const,
        show_date_of_birth_on_search: dbPlayerInfo.show_date_of_birth_on_search,
        retired: dbPlayerInfo.retired,
        might_change: dbPlayerInfo.might_change,
        available_for_career_path: dbPlayerInfo.available_for_career_path,
        career_path_difficulty: dbPlayerInfo.career_path_difficulty as "EASY" | "NORMAL" | "HARD" | "EXTREME",
        firstName: dbPlayerInfo.first_name,
        lastName: dbPlayerInfo.last_name,
        dateOfBirth: dbPlayerInfo.date_of_birth,
        nationality: dbPlayerInfo.nation.name,
        countryID: dbPlayerInfo.nation.id,
        wikipediaUrl: dbPlayerInfo.wikipedia_url || "",
      }
      setPlayerConfig(dbConfig)
    } else if (playerData && !dbPlayerInfo) {
      // Use default configuration and playerData when it's a new player
      const { first, last } = parsePlayerName(playerData.playerName)
      const defaultConfig = {
        status: "AWAITING_REVISION" as const,
        show_date_of_birth_on_search: false,
        retired: false,
        might_change: false,
        available_for_career_path: true,
        career_path_difficulty: "NORMAL" as const,
        firstName: first,
        lastName: last,
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
        countryID: playerData.countryID,
        wikipediaUrl: "",
      }
      setPlayerConfig(defaultConfig)
    }
  }, [playerData, dbPlayerInfo])

  // Update player data when validation dialog resolves data conflicts
  useEffect(() => {
    if (chosenDataSource === 'database' && dbPlayerInfo) {
      setPlayerConfig(prev => ({
        ...prev,
        dateOfBirth: dbPlayerInfo.date_of_birth,
        nationality: dbPlayerInfo.nation.name,
      }))
    } else if (chosenDataSource === 'wikipedia' && playerData) {
      setPlayerConfig(prev => ({
        ...prev,
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
      }))
    }
  }, [chosenDataSource, dbPlayerInfo, playerData])

  const parsePlayerName = (fullName: string) => {
    const nameParts = fullName.replace(/_/g, " ").split(" ")
    if (nameParts.length >= 2) {
      const first = nameParts[0]
      const last = nameParts.slice(1).join(" ")
      return { first, last }
    }
    // For single names (like "Kaka"), put them in the Last Name field
    return { first: "", last: fullName.replace(/_/g, " ") }
  }

  const handleResync = () => {
    if (!playerData) return
    
    // Reset to original playerData values
    const { first, last } = parsePlayerName(playerData.playerName)
    setPlayerConfig(prev => ({
      ...prev,
      firstName: first,
      lastName: last,
      dateOfBirth: playerData.dateOfBirth,
      nationality: playerData.birthCountry,
      countryID: playerData.countryID,
      wikipediaUrl: "", // Reset to empty as originally set
    }))
    setIsEditingNames(false) // Reset editing state to false
  }

  const handleToggleEditing = () => {
    setIsEditingNames(!isEditingNames)
  }

  const addDeploymentLog = (type: DeploymentLogEntry['type'], message: string, data?: any) => {
    const logEntry = createLogEntry(type, message, data)
    setDeploymentLogs(prev => [...prev, logEntry])
    return logEntry
  }

  const clearDeploymentLogs = () => {
    setDeploymentLogs([])
  }

  // Function to detect changes between current config and database data
  const getPlayerChanges = () => {
    if (!dbPlayerInfo) return null

    const changes: Partial<CreateFootballerRequest> = {}

    // Compare basic info
    if (playerConfig.firstName.trim() !== dbPlayerInfo.first_name) {
      changes.first_name = playerConfig.firstName.trim()
    }
    if (playerConfig.lastName.trim() !== dbPlayerInfo.last_name) {
      changes.last_name = playerConfig.lastName.trim()
    }
    if (playerConfig.dateOfBirth !== dbPlayerInfo.date_of_birth) {
      changes.date_of_birth = playerConfig.dateOfBirth
    }
    if (playerConfig.countryID !== dbPlayerInfo.nation.id) {
      changes.nation_id = playerConfig.countryID!
    }
    if ((playerConfig.wikipediaUrl.trim() || null) !== dbPlayerInfo.wikipedia_url) {
      changes.wikipedia_url = playerConfig.wikipediaUrl.trim() || null
    }
    
    // Compare settings
    if (playerConfig.show_date_of_birth_on_search !== dbPlayerInfo.show_date_of_birth_on_search) {
      changes.show_date_of_birth_on_search = playerConfig.show_date_of_birth_on_search
    }
    if (playerConfig.retired !== dbPlayerInfo.retired) {
      changes.retired = playerConfig.retired
    }
    if (playerConfig.might_change !== dbPlayerInfo.might_change) {
      changes.might_change = playerConfig.might_change
    }
    if (playerConfig.available_for_career_path !== dbPlayerInfo.available_for_career_path) {
      changes.available_for_career_path = playerConfig.available_for_career_path
    }
    if (playerConfig.career_path_difficulty !== dbPlayerInfo.career_path_difficulty) {
      changes.career_path_difficulty = playerConfig.career_path_difficulty
    }
    if (playerConfig.status !== dbPlayerInfo.status) {
      changes.status = playerConfig.status
    }

    return Object.keys(changes).length > 0 ? changes : null
  }

  const hasChanges = () => {
    return getPlayerChanges() !== null
  }

  // Function to analyze team changes when Wikipedia is chosen as data source
  const getTeamChanges = () => {
    if (!dbPlayerInfo || chosenDataSource !== 'wikipedia' || !playerData?.teams) {
      return { updates: [], creates: [], deletes: [] }
    }

    const wikipediaTeams = playerData.teams.filter(team => team.teamFound && team.teamID)
    const dbTeams = dbPlayerInfo.teams_played_for || []
    
    const updates: Array<{ id: number; changes: Partial<CreateFootballerTeamRequest>; teamName: string; position: number }> = []
    const creates: Array<{ teamData: CreateFootballerTeamRequest; teamName: string; position: number }> = []
    const deletes: Array<{ id: number; teamName: string; position: number }> = []

    // Position-based matching: compare teams by their position in the arrays
    const minLength = Math.min(wikipediaTeams.length, dbTeams.length)
    
    // Process teams that exist in both arrays (by position)
    for (let i = 0; i < minLength; i++) {
      const wikiTeam = wikipediaTeams[i]
      const dbTeam = dbTeams[i]
      
      const transferTypeString = (wikiTeam.typeOfTransfer || "").toLowerCase().trim()
      const transferType = transferTypeString.includes("loan") ? "loan" : "permanent"

      // Check if this is the same team (by team_id) or a completely different team
      const isSameTeam = dbTeam.team_id === wikiTeam.teamID
      
      if (isSameTeam) {
        // Same team - check for field changes
        const changes: Partial<CreateFootballerTeamRequest> = {}
        
        if (dbTeam.apps !== wikiTeam.appearances) {
          changes.apps = wikiTeam.appearances
        }
        if (dbTeam.goals !== wikiTeam.goals) {
          changes.goals = wikiTeam.goals
        }
        if (dbTeam.transfer_type !== transferType) {
          changes.transfer_type = transferType
        }
        if (dbTeam.start_year !== wikiTeam.joinYear) {
          changes.start_year = wikiTeam.joinYear
        }
        if (dbTeam.end_year !== wikiTeam.departYear) {
          changes.end_year = wikiTeam.departYear
        }

        if (Object.keys(changes).length > 0) {
          // Only include team_id and role when we have changes to update (for PUT requests)
          changes.team_id = dbTeam.team_id
          changes.role = dbTeam.role
          
          updates.push({
            id: dbTeam.id,
            changes,
            teamName: wikiTeam.teamName,
            position: i + 1
          })
        }
      } else {
        // Different team - delete the old one and create the new one
        deletes.push({
          id: dbTeam.id,
          teamName: dbTeam.team_name,
          position: i + 1
        })
        
        const teamData: CreateFootballerTeamRequest = {
          footballer_id: dbPlayerInfo.id,
          team_id: wikiTeam.teamID!,
          role: "player",
          apps: wikiTeam.appearances,
          goals: wikiTeam.goals,
          transfer_type: transferType,
          start_year: wikiTeam.joinYear,
          end_year: wikiTeam.departYear,
        }
        
        creates.push({
          teamData,
          teamName: wikiTeam.teamName,
          position: i + 1
        })
      }
    }

    // Handle extra Wikipedia teams (more teams in Wikipedia than in DB)
    if (wikipediaTeams.length > dbTeams.length) {
      for (let i = dbTeams.length; i < wikipediaTeams.length; i++) {
        const wikiTeam = wikipediaTeams[i]
        const transferTypeString = (wikiTeam.typeOfTransfer || "").toLowerCase().trim()
        const transferType = transferTypeString.includes("loan") ? "loan" : "permanent"
        
        const teamData: CreateFootballerTeamRequest = {
          footballer_id: dbPlayerInfo.id,
          team_id: wikiTeam.teamID!,
          role: "player",
          apps: wikiTeam.appearances,
          goals: wikiTeam.goals,
          transfer_type: transferType,
          start_year: wikiTeam.joinYear,
          end_year: wikiTeam.departYear,
        }
        
        creates.push({
          teamData,
          teamName: wikiTeam.teamName,
          position: i + 1
        })
      }
    }

    // Handle extra DB teams (more teams in DB than in Wikipedia)
    if (dbTeams.length > wikipediaTeams.length) {
      for (let i = wikipediaTeams.length; i < dbTeams.length; i++) {
        const dbTeam = dbTeams[i]
        
        deletes.push({
          id: dbTeam.id,
          teamName: dbTeam.team_name,
          position: i + 1
        })
      }
    }

    return { updates, creates, deletes }
  }

  const hasTeamChanges = () => {
    const teamChanges = getTeamChanges()
    return teamChanges.updates.length > 0 || teamChanges.creates.length > 0 || teamChanges.deletes.length > 0
  }

  const handleUpdatePlayer = async () => {
    if (!dbPlayerInfo || (!hasChanges() && !hasTeamChanges())) return

    // Prevent multiple simultaneous operations
    if (deploying) return

    // Clear previous logs
    clearDeploymentLogs()

    const playerChanges = getPlayerChanges()
    const teamChanges = getTeamChanges()
    
    if (!playerChanges && !hasTeamChanges()) {
      addDeploymentLog('info', '💡 No changes detected - Update cancelled')
      return
    }

    try {
      setDeploying(true)
      setDeploymentComplete(false)
      onErrorChange(null)

      // Scroll to deployment console
      setTimeout(() => {
        deploymentConsoleRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)

      addDeploymentLog('info', '🔄 Starting footballer update...')
      addDeploymentLog('info', `Player: ${playerConfig.firstName} ${playerConfig.lastName}`)
      
      let updatedFootballer = null
      
      // Update footballer if there are player changes
      if (playerChanges) {
        addDeploymentLog('info', `Player changes detected in: ${Object.keys(playerChanges).join(', ')}`)

        // Add user ID to changes (required for updates)
        const updateData = {
          ...playerChanges,
          user: user!.id
        }

        addDeploymentLog('loading', 'Updating footballer in database...')
        addDeploymentLog('request', `PUT /data/footballers/${dbPlayerInfo.id}/`, updateData)

        // Update the footballer
        updatedFootballer = await FootballerAPI.updateFootballer(dbPlayerInfo.id, updateData as CreateFootballerRequest)

        addDeploymentLog('response', `✅ Footballer updated successfully`, updatedFootballer)
        console.log("Footballer updated successfully:", updatedFootballer)
      }

      // Update and create team records if there are team changes
      if (hasTeamChanges()) {
        addDeploymentLog('info', `📊 Team operations: ${teamChanges.deletes.length} deletes, ${teamChanges.updates.length} updates, ${teamChanges.creates.length} creates`)

        let deletedTeams = 0
        let updatedTeams = 0
        let createdTeams = 0

        // First: Delete teams that need to be removed or replaced
        for (let i = 0; i < teamChanges.deletes.length; i++) {
          const teamDelete = teamChanges.deletes[i]
          try {
            addDeploymentLog('loading', `Deleting team record ${i + 1}/${teamChanges.deletes.length}: ${teamDelete.teamName} (position ${teamDelete.position})`)
            addDeploymentLog('request', `DELETE /data/footballer-teams/${teamDelete.id}/`)

            await FootballerAPI.deleteFootballerTeam(teamDelete.id)
            
            addDeploymentLog('response', `✅ Team record deleted: ${teamDelete.teamName}`)
            deletedTeams++
          } catch (teamError) {
            addDeploymentLog('error', `❌ Failed to delete team record for ${teamDelete.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`)
            console.error(`Failed to delete team record for ${teamDelete.teamName}:`, teamError)
          }
        }

        // Second: Update existing team records
        for (let i = 0; i < teamChanges.updates.length; i++) {
          const teamUpdate = teamChanges.updates[i]
          try {
            addDeploymentLog('loading', `Updating team record ${i + 1}/${teamChanges.updates.length}: ${teamUpdate.teamName} (position ${teamUpdate.position})`)
            addDeploymentLog('request', `PUT /data/footballer-teams/${teamUpdate.id}/`, teamUpdate.changes)

            const updatedTeamRecord = await FootballerAPI.updateFootballerTeam(teamUpdate.id, teamUpdate.changes)
            
            addDeploymentLog('response', `✅ Team record updated: ${teamUpdate.teamName}`, updatedTeamRecord)
            updatedTeams++
          } catch (teamError) {
            addDeploymentLog('error', `❌ Failed to update team record for ${teamUpdate.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`)
            console.error(`Failed to update team record for ${teamUpdate.teamName}:`, teamError)
          }
        }

        // Third: Create new team records
        for (let i = 0; i < teamChanges.creates.length; i++) {
          const teamCreate = teamChanges.creates[i]
          try {
            addDeploymentLog('loading', `Creating new team record ${i + 1}/${teamChanges.creates.length}: ${teamCreate.teamName} (position ${teamCreate.position})`)
            addDeploymentLog('request', 'POST /data/footballer-teams/', teamCreate.teamData)

            const createdTeamRecord = await FootballerAPI.createFootballerTeam(teamCreate.teamData)
            
            addDeploymentLog('response', `✅ Team record created: ${teamCreate.teamName}`, createdTeamRecord)
            createdTeams++
          } catch (teamError) {
            addDeploymentLog('error', `❌ Failed to create team record for ${teamCreate.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`)
            console.error(`Failed to create team record for ${teamCreate.teamName}:`, teamError)
          }
        }

        addDeploymentLog('success', `📈 Team operations completed: ${deletedTeams}/${teamChanges.deletes.length} deletes, ${updatedTeams}/${teamChanges.updates.length} updates, ${createdTeams}/${teamChanges.creates.length} creates`)
      }

      // Final success message
      const operations = []
      if (playerChanges) operations.push(`player data updated`)
      if (hasTeamChanges()) {
        const totalTeamOps = teamChanges.deletes.length + teamChanges.updates.length + teamChanges.creates.length
        operations.push(`${totalTeamOps} team operations completed`)
      }
      
      addDeploymentLog('success', `🎉 Update completed! ${operations.join(', ')}`)
      setDeploymentComplete(true)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addDeploymentLog('error', `❌ Update failed: ${errorMessage}`)
      console.error("Update failed:", error)
      onErrorChange(`Update failed: ${errorMessage}`)
      setDeploymentComplete(false)
    } finally {
      setDeploying(false)
      addDeploymentLog('info', '🏁 Update process finished')
    }
  }

  const handleDeployment = async () => {
    // Only allow deployment if player is not found in DB
    if (playerData?.playerFoundInDB) {
      alert("This player already exists in the database. Deployment is only available for new players.")
      return
    }

    // Prevent multiple simultaneous deployments
    if (deploying) return

    // Clear previous logs
    clearDeploymentLogs()
    
    // Validate required fields
    if (!playerConfig.countryID || !playerConfig.firstName.trim() || !playerConfig.lastName.trim() || !playerConfig.dateOfBirth) {
      alert("Please ensure all required fields are completed before deployment.")
      return
    }

    try {
      setDeploying(true)
      setDeploymentComplete(false)
      onErrorChange(null)

      // Scroll to deployment console
      setTimeout(() => {
        deploymentConsoleRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)

      addDeploymentLog('info', '🚀 Starting footballer deployment...')
      addDeploymentLog('info', `Player: ${playerConfig.firstName} ${playerConfig.lastName}`)
      
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
        is_player: true,
        is_manager: false,
        might_change: playerConfig.might_change,
        available_for_career_path: playerConfig.available_for_career_path,
        career_path_difficulty: playerConfig.career_path_difficulty,
      }

      addDeploymentLog('loading', 'Deploying footballer to database...')
      addDeploymentLog('request', 'POST /data/footballers/', footballerData)
      
      // Create the footballer
      const createdFootballer = await FootballerAPI.createFootballer(footballerData)
      
      addDeploymentLog('response', `✅ Footballer created successfully (ID: ${createdFootballer.id})`, createdFootballer)
      console.log("Footballer created successfully:", createdFootballer)

      // Create team records for teams found in the database
      const foundTeams = playerData.teams.filter(team => team.teamFound && team.teamID)
      let createdTeams = 0

      addDeploymentLog('info', `📊 Found ${foundTeams.length} teams to create records for`)

      for (let i = 0; i < foundTeams.length; i++) {
        const team = foundTeams[i]
        try {
          const transferTypeString = (team.typeOfTransfer || "").toLowerCase().trim()
          const transferType = transferTypeString.includes("loan") ? "loan" : "permanent"
          
          const teamData: CreateFootballerTeamRequest = {
            footballer_id: createdFootballer.id,
            team_id: team.teamID!,
            role: "player",
            apps: team.appearances,
            goals: team.goals,
            transfer_type: transferType,
            start_year: team.joinYear,
            end_year: team.departYear,
          }

          addDeploymentLog('loading', `Deploying team record ${i + 1}/${foundTeams.length}: ${team.teamName}`)
          addDeploymentLog('request', 'POST /data/footballer-teams/', teamData)

          const createdTeamRecord = await FootballerAPI.createFootballerTeam(teamData)
          
          addDeploymentLog('response', `✅ Team record created: ${team.teamName} (${team.joinYear}${team.departYear ? `-${team.departYear}` : ''})`, createdTeamRecord)
          createdTeams++
        } catch (teamError) {
          addDeploymentLog('error', `❌ Failed to create team record for ${team.teamName}: ${teamError instanceof Error ? teamError.message : 'Unknown error'}`)
          console.error(`Failed to create team record for ${team.teamName}:`, teamError)
        }
      }

      addDeploymentLog('success', `🎉 Deployment completed! Footballer: ${playerConfig.firstName} ${playerConfig.lastName}`)
      addDeploymentLog('success', `📈 Statistics: ${createdTeams}/${foundTeams.length} team records created`)
      setDeploymentComplete(true)

      // Trigger a resync to show the updated state
      handleResync()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addDeploymentLog('error', `❌ Deployment failed: ${errorMessage}`)
      console.error("Deployment failed:", error)
      onErrorChange(`Deployment failed: ${errorMessage}`)
      setDeploymentComplete(false)
    } finally {
      setDeploying(false)
      addDeploymentLog('info', '🏁 Deployment process finished')
    }
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Save className="h-6 w-6" />
              Player Configuration
            </CardTitle>
            <CardDescription>Configure player settings for deployment to the database</CardDescription>
          </div>
          <Button variant="outline" onClick={handleResync} className="flex items-center gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Resync Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Top Row - Player Information and Player Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Player Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Player Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleEditing}
                className="h-8 px-3"
              >
                <Edit className="h-3 w-3 mr-1" />
                {isEditingNames ? "Lock" : "Edit"}
              </Button>
            </div>
            
            {/* Player Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Player Status
              </Label>
              <Select
                value={playerConfig.status}
                onValueChange={(value: "APPROVED" | "AWAITING_REVISION" | "DENIED" | "AWAITING_CHANGE_CHECK") =>
                  setPlayerConfig({
                    ...playerConfig,
                    status: value,
                  })
                }
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="first-name"
                  value={playerConfig.firstName}
                  onChange={(e) => setPlayerConfig(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="last-name"
                  value={playerConfig.lastName}
                  onChange={(e) => setPlayerConfig(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
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
                  onChange={(e) => setPlayerConfig(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-sm font-medium">
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  value={playerConfig.nationality}
                  onChange={(e) => setPlayerConfig(prev => ({ ...prev, nationality: e.target.value }))}
                  disabled={!isEditingNames}
                  className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
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
                onChange={(e) => setPlayerConfig(prev => ({ ...prev, wikipediaUrl: e.target.value }))}
                disabled={!isEditingNames}
                className={`${!isEditingNames ? "bg-gray-50 dark:bg-slate-600 cursor-not-allowed" : ""}`}
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
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Player Settings</h3>
              {playerData?.playerFoundInDB && dbPlayerInfo && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700">
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
                  onCheckedChange={(checked) =>
                    setPlayerConfig({
                      ...playerConfig,
                      show_date_of_birth_on_search: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="show_date_of_birth" className="text-sm font-medium">
                  Show date of birth in search results
                </Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Whether to display the year of birth in search results
              </p>
            </div>

            {/* Player Status */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="retired"
                  checked={playerConfig.retired}
                  onCheckedChange={(checked) =>
                    setPlayerConfig({
                      ...playerConfig,
                      retired: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="retired" className="text-sm font-medium">
                  Player is retired
                </Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Indicates whether the footballer has retired from professional football
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="might_change"
                  checked={playerConfig.might_change}
                  onCheckedChange={(checked) =>
                    setPlayerConfig({
                      ...playerConfig,
                      might_change: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="might_change" className="text-sm font-medium">
                  Information might change
                </Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Indicates if the player information might need revisions in the future
              </p>
            </div>

            {/* CareerPath Game Settings */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="available_for_career_path"
                  checked={playerConfig.available_for_career_path}
                  onCheckedChange={(checked) =>
                    setPlayerConfig({
                      ...playerConfig,
                      available_for_career_path: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="available_for_career_path" className="text-sm font-medium">
                  Available for CareerPath game
                </Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Whether the footballer is available in the CareerPath game
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                CareerPath Difficulty Level
              </Label>
              <Select
                value={playerConfig.career_path_difficulty}
                onValueChange={(value: "EASY" | "NORMAL" | "HARD" | "EXTREME") =>
                  setPlayerConfig({
                    ...playerConfig,
                    career_path_difficulty: value,
                  })
                }
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
        />

        <Separator className="my-8" />

        {/* Validation Message and Save Button */}
        <div className="space-y-4">
          {playerData.summary.notFoundTeams > 0 && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Deployment Warning:</strong> {playerData.summary.notFoundTeams} team(s) not found in
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
              className="px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                deploying ||
                (!playerData?.playerFoundInDB && playerData.summary.notFoundTeams > 0) || 
                (playerData?.playerFoundInDB && !hasChanges() && !hasTeamChanges())
              }
            >
              <Save className="h-5 w-5 mr-2" />
              {deploying 
                ? (playerData?.playerFoundInDB ? 'Updating...' : 'Deploying...') 
                : playerData?.playerFoundInDB 
                  ? (hasChanges() || hasTeamChanges() ? 'Update Footballer' : 'No Changes Detected')
                  : 'Deploy Footballer'
              }
            </Button>
          </div>

          {!deploying ? (
            playerData?.playerFoundInDB ? (
              (hasChanges() || hasTeamChanges()) ? (
                <p className="text-center text-sm text-blue-600 font-medium">
                  ✏️ Changes detected - Ready to update existing player
                  {hasChanges() && hasTeamChanges() && ' and teams'}
                  {!hasChanges() && hasTeamChanges() && ' teams'}
                </p>
              ) : (
                <p className="text-center text-sm text-gray-600 font-medium">
                  ✅ Player data matches database - No updates needed
                  {chosenDataSource === 'wikipedia' && ' (including team records)'}
                </p>
              )
            ) : playerData.summary.notFoundTeams === 0 ? (
              <p className="text-center text-sm text-green-600 font-medium">
                ✅ All teams verified in database - Ready for deployment
              </p>
            ) : null
          ) : null}
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
                  setDeploymentComplete(false) // Reset the state
                  onReloadPlayer()
                }}
                size="lg"
                className="px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCcw className="h-5 w-5 mr-2" />
                Load Player with New Info
              </Button>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              Reload the player data to see the updated information from the database
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
