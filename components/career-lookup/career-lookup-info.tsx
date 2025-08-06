import { Calendar, MapPin, Users, AlertTriangle, ExternalLink, Shield, Search, HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ApiButton } from "@/components/ui/emerald-button"
import { GraphiteButton } from "@/components/ui/graphite-button"
import type { n8nWikiPlayerData, Team, Footballer } from "@/types/player"
import config from "@/lib/config"

interface CareerLookupInfoProps {
  playerData: n8nWikiPlayerData
  dbPlayerInfo?: Footballer | null
  chosenDataSource?: 'wikipedia' | 'database' | null
  onDataSourceChange?: (dataSource: 'wikipedia' | 'database') => void
  className?: string
}

export function CareerLookupInfo({
  playerData,
  dbPlayerInfo,
  chosenDataSource,
  onDataSourceChange,
  className
}: CareerLookupInfoProps) {
  // Calculate age directly from playerData.dateOfBirth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Parse player name from playerData
  const parsePlayerName = (fullName: string) => {
    const nameParts = fullName.replace(/_/g, " ").split(" ")
    if (nameParts.length >= 2) {
      const first = nameParts[0]
      const last = nameParts.slice(1).join(" ")
      return { first, last }
    }
    return { first: "", last: fullName.replace(/_/g, " ") }
  }

  // Check for specific field conflicts (only for players in DB)
  const getFieldConflicts = () => {
    if (!playerData.playerFoundInDB || !dbPlayerInfo) return {}
    
    const { first, last } = parsePlayerName(playerData.playerName)
    return {
      name: first !== dbPlayerInfo.first_name || last !== dbPlayerInfo.last_name,
      dateOfBirth: playerData.dateOfBirth !== dbPlayerInfo.date_of_birth,
      nationality: playerData.birthCountry !== dbPlayerInfo.nation.name
    }
  }

  // Get display value based on chosen data source (only applies to players in DB with conflicts)
  const getDisplayValue = (field: 'name' | 'dateOfBirth' | 'nationality') => {
    const conflicts = getFieldConflicts()
    
    // No conflicts or not in DB - use Wikipedia data
    if (!playerData.playerFoundInDB || !dbPlayerInfo || !conflicts[field]) {
      const { first, last } = parsePlayerName(playerData.playerName)
      return {
        name: `${first} ${last}`.trim(),
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry
      }[field]
    }

    // There's a conflict - use chosen data source or default to Wikipedia
    if (chosenDataSource === 'database') {
      return {
        name: `${dbPlayerInfo.first_name} ${dbPlayerInfo.last_name}`.trim(),
        dateOfBirth: dbPlayerInfo.date_of_birth,
        nationality: dbPlayerInfo.nation.name
      }[field]
    } else {
      const { first, last } = parsePlayerName(playerData.playerName)
      return {
        name: `${first} ${last}`.trim(),
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry
      }[field]
    }
  }

  // Helper to render conflict indicator badge
  const renderConflictBadge = (field: 'name' | 'dateOfBirth' | 'nationality') => {
    const conflicts = getFieldConflicts()
    if (!conflicts[field]) return null

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ml-2 ${
          chosenDataSource === 'database' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
            : 'bg-blue-50 text-blue-700 border-blue-300'
        }`}
      >
        {chosenDataSource === 'database' ? (
          <><Shield className="h-3 w-3 mr-1" />Using DB</>
        ) : (
          <><Search className="h-3 w-3 mr-1" />Using Wiki</>
        )}
      </Badge>
    )
  }

  // Generate admin links using config
  const getTeamAdminLink = (team: Team) => {
    if (!team.teamFound || !team.teamID) return null
    return config.getAdminUrl(`FootballData/team/${team.teamID}/change/`)
  }

  const getCountryAdminLink = (playerData: n8nWikiPlayerData) => {
    if (!playerData.countryFoundInDB || !playerData.countryID) return null
    return config.getAdminUrl(`FootballData/nation/${playerData.countryID}/change/`)
  }

  // Check if there are any conflicts at all (including team count mismatch)
  const hasAnyTeamConflicts = () => {
    if (!playerData.playerFoundInDB || !dbPlayerInfo) return false
    
    // Check for team count mismatch
    const wikiTeamCount = playerData.teams.length
    const dbTeamCount = dbPlayerInfo.teams_played_for.length
    if (wikiTeamCount !== dbTeamCount) return true
    
    // Check for individual team conflicts
    return playerData.teams.some((team, index) => {
      const dbTeam = dbPlayerInfo.teams_played_for[index]
      if (!dbTeam) return false
      
      const wikiTransferType = (team.typeOfTransfer || "").toLowerCase().trim()
      const wikiType = wikiTransferType.includes("loan") ? "loan" : "permanent"
      
      return team.appearances !== dbTeam.apps || team.goals !== dbTeam.goals || 
             team.joinYear !== dbTeam.start_year || team.departYear !== dbTeam.end_year ||
             wikiType !== dbTeam.transfer_type
    })
  }

  // Check for team count mismatch specifically
  const hasTeamCountMismatch = () => {
    if (!playerData.playerFoundInDB || !dbPlayerInfo) return false
    return playerData.teams.length !== dbPlayerInfo.teams_played_for.length
  }
  return (
    <TooltipProvider>
      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Left Sidebar - Player Profile */}
      <div className="lg:col-span-1 space-y-4">
        {/* Player Profile Card */}
        <Card className="sticky top-4">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              {getDisplayValue('name')}
              {!playerData.playerFoundInDB && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {renderConflictBadge('name')}
            </CardTitle>
            <div className="flex justify-center gap-2 flex-wrap">
              {!playerData.playerFoundInDB && (
                <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Not in Database
                </Badge>
              )}
              {playerData.playerFoundInDB && dbPlayerInfo && chosenDataSource && (
                <Badge 
                  variant="secondary" 
                  className={chosenDataSource === 'database' 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                    : "bg-blue-100 text-blue-800 border-blue-300"
                  }
                >
                  {chosenDataSource === 'database' ? (
                    <><Shield className="h-3 w-3 mr-1" />Database Data Active</>
                  ) : (
                    <><Search className="h-3 w-3 mr-1" />Wikipedia Data Active</>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Age</p>
                  <div className="flex items-center">
                    <p className="font-medium text-sm dark:text-white">
                      {calculateAge(getDisplayValue('dateOfBirth') as string)} ({getDisplayValue('dateOfBirth')})
                    </p>
                    {renderConflictBadge('dateOfBirth')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nationality</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm dark:text-white">{getDisplayValue('nationality')}</p>
                    {renderConflictBadge('nationality')}
                    {!playerData.countryFoundInDB && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  </div>
                  {!playerData.countryFoundInDB && (
                    <Badge
                      variant="destructive"
                      className="bg-amber-100 text-amber-800 border-amber-300 text-xs mt-1"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not in Database
                    </Badge>
                  )}
                  {getCountryAdminLink(playerData) && (
                    <a
                      href={getCountryAdminLink(playerData)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors text-xs mt-1"
                    >
                      Edit Country
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Position</p>
                  <p className="font-medium text-sm dark:text-white">{playerData.position}</p>
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
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Team Data Comparison:</strong> This player exists in the database with the following conflicts:
                  <div className="mt-2 space-y-1">
                    {hasTeamCountMismatch() && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>
                          <strong>Team Count Mismatch:</strong> Wikipedia has {playerData.teams.length} teams, 
                          Database has {dbPlayerInfo.teams_played_for.length} teams
                          {(() => {
                            const wikiCount = playerData.teams.length
                            const dbCount = dbPlayerInfo.teams_played_for.length
                            
                            if (wikiCount > dbCount) {
                              const extraTeams = wikiCount - dbCount
                              const extraTeamNames = playerData.teams
                                .slice(dbCount)
                                .map(team => team.teamName)
                                .join(', ')
                              return (
                                <span className="block mt-1 text-sm">
                                  📊 <strong>Wikipedia has {extraTeams} additional team{extraTeams > 1 ? 's' : ''}:</strong> {extraTeamNames}
                                </span>
                              )
                            } else if (dbCount > wikiCount) {
                              const extraTeams = dbCount - wikiCount
                              const extraTeamNames = dbPlayerInfo.teams_played_for
                                .slice(wikiCount)
                                .map(team => team.team_name)
                                .join(', ')
                              return (
                                <span className="block mt-1 text-sm">
                                  🏛️ <strong>Database has {extraTeams} additional team{extraTeams > 1 ? 's' : ''}:</strong> {extraTeamNames}
                                </span>
                              )
                            }
                            return null
                          })()}
                        </span>
                      </div>
                    )}
                    {hasAnyTeamConflicts() && !hasTeamCountMismatch() && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Teams with data conflicts are highlighted below</span>
                      </div>
                    )}
                  </div>
                  {chosenDataSource && (
                    <div className="mt-2">
                      Currently using <strong>{chosenDataSource === 'database' ? 'Database' : 'Wikipedia'}</strong> data where conflicts exist.
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                      Club
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                      Apps
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                      Goals
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                      Transfer
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                      Season
                    </th>
                    {/* Only show Data Source column if there are any conflicts */}
                    {hasAnyTeamConflicts() && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                        <div className="flex items-center justify-center gap-1">
                          Data Source
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-48">
                                {playerData?.playerFoundInDB 
                                  ? "Used to indicate the source of truth used for updating existing footballer records in case of conflicts"
                                  : "Used to indicate the source of truth that would be used for creating new footballer records"
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                    )}
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs">
                      Admin Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // For players in DB, we need to handle different scenarios
                    if (playerData.playerFoundInDB && dbPlayerInfo) {
                      const allTeamEntries: Array<{
                        team: Team
                        dbTeam: any
                        index: number
                        source: 'wikipedia' | 'database' | 'both'
                        isDifferentTeam: boolean
                      }> = []
                      
                      // Handle Wikipedia teams
                      playerData.teams.forEach((wikiTeam, index) => {
                        const correspondingDbTeam = dbPlayerInfo.teams_played_for[index]
                        
                        // If team IDs are different or DB team doesn't exist, these are different teams
                        const isDifferentTeam = !correspondingDbTeam || 
                          (wikiTeam.teamID && correspondingDbTeam.team_id && wikiTeam.teamID !== correspondingDbTeam.team_id)
                        
                        if (isDifferentTeam) {
                          // Only show Wikipedia team if Wikipedia is chosen or no source is chosen
                          if (!chosenDataSource || chosenDataSource === 'wikipedia') {
                            allTeamEntries.push({
                              team: wikiTeam,
                              dbTeam: null,
                              index,
                              source: 'wikipedia' as const,
                              isDifferentTeam: true
                            })
                          }
                        } else {
                          // Same team with potential conflicts
                          allTeamEntries.push({
                            team: wikiTeam,
                            dbTeam: correspondingDbTeam,
                            index,
                            source: 'both' as const,
                            isDifferentTeam: false
                          })
                        }
                      })
                      
                      // Handle DB teams that don't have corresponding Wikipedia teams
                      dbPlayerInfo.teams_played_for.forEach((dbTeam, index) => {
                        const correspondingWikiTeam = playerData.teams[index]
                        
                        // If team IDs are different or Wiki team doesn't exist, these are different teams
                        const isDifferentTeam = !correspondingWikiTeam || 
                          (correspondingWikiTeam.teamID && dbTeam.team_id && correspondingWikiTeam.teamID !== dbTeam.team_id)
                        
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
                              dateOfBirth: playerData.dateOfBirth
                            }
                            
                            allTeamEntries.push({
                              team: fakeWikiTeam,
                              dbTeam: dbTeam,
                              index,
                              source: 'database' as const,
                              isDifferentTeam: true
                            })
                          }
                        }
                      })
                      
                      return allTeamEntries.sort((a, b) => a.team.joinYear - b.team.joinYear)
                    } else {
                      // For players not in DB, just show Wikipedia teams
                      return playerData.teams
                        .sort((a, b) => a.joinYear - b.joinYear)
                        .map((team, index) => ({
                          team,
                          dbTeam: null,
                          index,
                          source: 'wikipedia' as const,
                          isDifferentTeam: false
                        }))
                    }
                  })().map(({ team, dbTeam, index, source, isDifferentTeam }) => {
                      // Check if this team has conflicts with DB data (only for same teams)
                      const teamConflicts = dbTeam && !isDifferentTeam ? {
                        appearances: team.appearances !== dbTeam.apps,
                        goals: team.goals !== dbTeam.goals,
                        joinYear: team.joinYear !== dbTeam.start_year,
                        departYear: team.departYear !== dbTeam.end_year,
                        transferType: (() => {
                          const wikiTransferType = (team.typeOfTransfer || "").toLowerCase().trim()
                          const wikiType = wikiTransferType.includes("loan") ? "loan" : "permanent"
                          return wikiType !== dbTeam.transfer_type
                        })()
                      } : null

                      const hasAnyConflicts = teamConflicts && (
                        teamConflicts.appearances || teamConflicts.goals || 
                        teamConflicts.joinYear || teamConflicts.departYear || teamConflicts.transferType
                      )

                      // Get specific conflict indicators or source info
                      const getConflictIndicators = () => {
                        if (isDifferentTeam) {
                          return source === 'database' ? ['From Database Only'] : ['From Wikipedia Only']
                        }
                        if (!teamConflicts || !hasAnyConflicts) return []
                        
                        const conflicts = []
                        if (teamConflicts.appearances) conflicts.push('Apps')
                        if (teamConflicts.goals) conflicts.push('Goals')
                        if (teamConflicts.joinYear) conflicts.push('Join')
                        if (teamConflicts.departYear) conflicts.push('End')
                        if (teamConflicts.transferType) conflicts.push('Transfer')
                        
                        return conflicts
                      }

                      return (
                        <tr
                          key={`${index}-${team.teamName}-${source}`}
                          className={`border-b border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                            !team.teamFound ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : 
                            hasAnyConflicts ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : 
                            isDifferentTeam ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : ""
                          }`}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div>
                                <div
                                  className={`font-medium ${!team.teamFound ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"} flex items-center gap-1`}
                                >
                                  {!team.teamFound && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                  {isDifferentTeam && source === 'database' && <Shield className="h-4 w-4 text-emerald-600" />}
                                  {isDifferentTeam && source === 'wikipedia' && <Search className="h-4 w-4 text-blue-600" />}
                                  {team.teamName}
                                </div>
                                {team.originalTeamName !== team.teamName && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">({team.originalTeamName})</div>
                                )}
                                {team.teamFound && team.TeamNameDB && team.TeamNameDB !== team.teamName && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    Name in DB: {team.TeamNameDB}
                                  </div>
                                )}
                                {isDifferentTeam && (
                                  <div className={`text-xs font-medium ${
                                    source === 'database' 
                                      ? 'text-emerald-600 dark:text-emerald-400' 
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {source === 'database' ? 'Database Only' : 'Wikipedia Only'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(() => {
                                // If different team or no DB team, use wiki data
                                if (isDifferentTeam || !dbTeam) return team.appearances
                                
                                // If same team and database is chosen and there's a conflict, use DB data
                                if (chosenDataSource === 'database' && teamConflicts?.appearances) {
                                  return dbTeam.apps
                                }
                                
                                // Default to wiki data
                                return team.appearances
                              })()}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(() => {
                                // If different team or no DB team, use wiki data
                                if (isDifferentTeam || !dbTeam) return team.goals
                                
                                // If same team and database is chosen and there's a conflict, use DB data
                                if (chosenDataSource === 'database' && teamConflicts?.goals) {
                                  return dbTeam.goals
                                }
                                
                                // Default to wiki data
                                return team.goals
                              })()}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                (() => {
                                  let transferType = team.typeOfTransfer || ""
                                  
                                  // If same team and database is chosen and there's a transfer type conflict, use DB data
                                  if (!isDifferentTeam && dbTeam && chosenDataSource === 'database' && teamConflicts?.transferType) {
                                    transferType = dbTeam.transfer_type === 'loan' ? 'loan' : 'permanent'
                                  }
                                  
                                  return transferType.toLowerCase().includes("loan")
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                })()
                              }`}
                            >
                              {(() => {
                                let transferType = team.typeOfTransfer || ""
                                
                                // If same team and database is chosen and there's a transfer type conflict, use DB data
                                if (!isDifferentTeam && dbTeam && chosenDataSource === 'database' && teamConflicts?.transferType) {
                                  transferType = dbTeam.transfer_type === 'loan' ? 'loan' : 'permanent'
                                }
                                
                                return transferType.toLowerCase().includes("loan") ? "Loan" : "Permanent"
                              })()}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(() => {
                                let joinYear = team.joinYear
                                let departYear = team.departYear
                                
                                // If same team and database is chosen and there are join/depart year conflicts, use DB data
                                if (!isDifferentTeam && dbTeam && chosenDataSource === 'database') {
                                  if (teamConflicts?.joinYear) {
                                    joinYear = dbTeam.start_year
                                  }
                                  if (teamConflicts?.departYear) {
                                    departYear = dbTeam.end_year
                                  }
                                }
                                
                                return `${joinYear}${departYear ? `-${departYear}` : ""}`
                              })()}
                            </div>
                          </td>
                          {/* Only render Data Source column if there are any conflicts */}
                          {hasAnyTeamConflicts() && (
                            <td className="py-3 px-2 text-center">
                              {isDifferentTeam ? (
                                <div className="space-y-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      source === 'database' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                        : 'bg-blue-50 text-blue-700 border-blue-300'
                                    }`}
                                  >
                                    {source === 'database' ? (
                                      <><Shield className="h-3 w-3 mr-1" />Database</>
                                    ) : (
                                      <><Search className="h-3 w-3 mr-1" />Wikipedia</>
                                    )}
                                  </Badge>
                                  <div className={`text-xs ${
                                    source === 'database' 
                                      ? 'text-emerald-600 dark:text-emerald-400' 
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {getConflictIndicators().join(', ')}
                                  </div>
                                </div>
                              ) : hasAnyConflicts ? (
                                <div className="space-y-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      chosenDataSource === 'database' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                        : 'bg-blue-50 text-blue-700 border-blue-300'
                                    }`}
                                  >
                                    {chosenDataSource === 'database' ? (
                                      <><Shield className="h-3 w-3 mr-1" />Database</>
                                    ) : (
                                      <><Search className="h-3 w-3 mr-1" />Wikipedia</>
                                    )}
                                  </Badge>
                                  <div className="text-xs text-amber-600 dark:text-amber-400">
                                    Conflicts: {getConflictIndicators().join(', ')}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="text-xs text-gray-500">Wikipedia</span>
                                  <div className="text-xs text-green-600 dark:text-green-400">
                                    No conflicts
                                  </div>
                                </div>
                              )}
                            </td>
                          )}
                          <td className="py-3 px-2">
                            <div className="flex gap-1 flex-wrap">
                              {team.teamFound ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                  Found in DB
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Not found in DB
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            {getTeamAdminLink(team) ? (
                              <a
                                href={getTeamAdminLink(team)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors text-sm"
                              >
                                Edit Team
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">No link</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30">
                    <td className="py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                      {playerData.summary.totalTeams} clubs
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-gray-900 dark:text-white">
                      {playerData.totalAppearances}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-gray-900 dark:text-white">
                      {playerData.totalGoals}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-gray-900 dark:text-white">-</td>
                    <td className="py-3 px-2 font-semibold text-gray-900 dark:text-white">Total</td>
                    {/* Only show Data Source column if there are any conflicts */}
                    {hasAnyTeamConflicts() && (
                      <td className="py-3 px-2 text-center">
                        {playerData.playerFoundInDB && chosenDataSource && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              chosenDataSource === 'database' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : 'bg-blue-50 text-blue-700 border-blue-300'
                            }`}
                          >
                            {chosenDataSource === 'database' ? (
                              <><Shield className="h-3 w-3 mr-1" />DB Active</>
                            ) : (
                              <><Search className="h-3 w-3 mr-1" />Wiki Active</>
                            )}
                          </Badge>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {playerData.summary.foundTeams} found
                        </Badge>
                        {playerData.summary.notFoundTeams > 0 && (
                          <Badge variant="destructive" className="text-xs bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {playerData.summary.notFoundTeams} missing
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  )
}
