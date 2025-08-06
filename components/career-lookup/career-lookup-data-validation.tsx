import { AlertTriangle, Search, Shield } from "lucide-react"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { n8nWikiPlayerData, Footballer } from "@/types/player"

interface DataValidation {
  firstNameMismatch: boolean
  lastNameMismatch: boolean
  dateOfBirthMismatch: boolean
  nationalityMismatch: boolean
  teamDataMismatches: TeamDataMismatch[]
}

interface TeamDataMismatch {
  teamName: string
  wikiTeam: {
    teamID: number | null
    appearances: number
    goals: number
    joinYear: number
    departYear: number | null
    typeOfTransfer: string
  }
  dbTeam: {
    team_id: number
    apps: number
    goals: number
    start_year: number
    end_year: number | null
    transfer_type: "permanent" | "loan"
  }
  mismatches: {
    teamId: boolean
    appearances: boolean
    goals: boolean
    joinYear: boolean
    departYear: boolean
    transferType: boolean
  }
}

interface CareerLookupDataValidationProps {
  // Data props
  playerData: n8nWikiPlayerData | null
  dbPlayerInfo: Footballer | null
  
  // Callback for when user makes a choice
  onDataSourceChosen: (dataSource: 'wikipedia' | 'database') => void
  
  className?: string
}

export function CareerLookupDataValidation({
  playerData,
  dbPlayerInfo,
  onDataSourceChosen,
  className
}: CareerLookupDataValidationProps) {
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [validationResolved, setValidationResolved] = useState(false)
  const [chosenDataSource, setChosenDataSource] = useState<'wikipedia' | 'database' | null>(null)
  const [dataValidation, setDataValidation] = useState<DataValidation>({
    firstNameMismatch: false,
    lastNameMismatch: false,
    dateOfBirthMismatch: false,
    nationalityMismatch: false,
    teamDataMismatches: [],
  })

  // Parse player name from playerData
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

  // Helper function to get position suffix (1st, 2nd, 3rd, 4th, etc.)
  const getPositionSuffix = (position: number): string => {
    if (position >= 11 && position <= 13) return "th"
    switch (position % 10) {
      case 1: return "st"
      case 2: return "nd"
      case 3: return "rd"
      default: return "th"
    }
  }

  // Check for validation issues when both playerData and dbPlayerInfo are available
  useEffect(() => {
    if (playerData && dbPlayerInfo) {
      const { first, last } = parsePlayerName(playerData.playerName)
      
      // Compare team data by position/order in arrays
      const teamDataMismatches: TeamDataMismatch[] = []
      
      const wikiTeams = playerData.teams
      const dbTeams = dbPlayerInfo.teams_played_for
      
      // Compare teams by their position in the arrays
      const minLength = Math.min(wikiTeams.length, dbTeams.length)
      
      for (let i = 0; i < minLength; i++) {
        const wikiTeam = wikiTeams[i]
        const dbTeam = dbTeams[i]
        
        const mismatches = {
          teamId: wikiTeam.teamID !== dbTeam.team_id,
          appearances: wikiTeam.appearances !== dbTeam.apps,
          goals: wikiTeam.goals !== dbTeam.goals,
          joinYear: wikiTeam.joinYear !== dbTeam.start_year,
          departYear: wikiTeam.departYear !== dbTeam.end_year,
          transferType: (() => {
            const wikiTransferType = (wikiTeam.typeOfTransfer || "").toLowerCase().trim()
            const wikiType = wikiTransferType.includes("loan") ? "loan" : "permanent"
            return wikiType !== dbTeam.transfer_type
          })(),
        }
        
        // Only include teams that have mismatches
        if (mismatches.teamId || mismatches.appearances || mismatches.goals || 
            mismatches.joinYear || mismatches.departYear || mismatches.transferType) {
          const positionSuffix = getPositionSuffix(i + 1)
          teamDataMismatches.push({
            teamName: `${wikiTeam.teamName} (${i + 1}${positionSuffix} team played for)`,
            wikiTeam: {
              teamID: wikiTeam.teamID,
              appearances: wikiTeam.appearances,
              goals: wikiTeam.goals,
              joinYear: wikiTeam.joinYear,
              departYear: wikiTeam.departYear,
              typeOfTransfer: wikiTeam.typeOfTransfer,
            },
            dbTeam: {
              team_id: dbTeam.team_id,
              apps: dbTeam.apps,
              goals: dbTeam.goals,
              start_year: dbTeam.start_year,
              end_year: dbTeam.end_year,
              transfer_type: dbTeam.transfer_type,
            },
            mismatches,
          })
          
          console.log(`Team mismatch found at position ${i + 1} (${i + 1}${positionSuffix} team): ${wikiTeam.teamName} vs ${dbTeam.team_name}`, mismatches)
        }
      }
      
      // Log if arrays have different lengths
      if (wikiTeams.length !== dbTeams.length) {
        console.log(`Array length mismatch: Wikipedia has ${wikiTeams.length} teams, DB has ${dbTeams.length} teams`)
      }
      
      const validation = {
        firstNameMismatch: first !== dbPlayerInfo.first_name,
        lastNameMismatch: last !== dbPlayerInfo.last_name,
        dateOfBirthMismatch: playerData.dateOfBirth !== dbPlayerInfo.date_of_birth,
        nationalityMismatch: playerData.birthCountry !== dbPlayerInfo.nation.name,
        teamDataMismatches,
      }
      
      setDataValidation(validation)

      // Open validation dialog if there are mismatches
      const hasValidationIssues = validation.firstNameMismatch || validation.lastNameMismatch || validation.dateOfBirthMismatch || validation.nationalityMismatch || validation.teamDataMismatches.length > 0
      if (hasValidationIssues) {
        setValidationDialogOpen(true)
        setValidationResolved(false)
        setChosenDataSource(null)
      } else {
        // No validation issues, automatically resolve
        setValidationResolved(true)
        setValidationDialogOpen(false)
      }

      // Log validation results
      if (validation.firstNameMismatch) {
        console.warn(`First name mismatch: Wikipedia=${first}, DB=${dbPlayerInfo.first_name}`)
      }
      if (validation.lastNameMismatch) {
        console.warn(`Last name mismatch: Wikipedia=${last}, DB=${dbPlayerInfo.last_name}`)
      }
      if (validation.dateOfBirthMismatch) {
        console.warn(`Date of birth mismatch: Wikipedia=${playerData.dateOfBirth}, DB=${dbPlayerInfo.date_of_birth}`)
      }
      if (validation.nationalityMismatch) {
        console.warn(`Nationality mismatch: Wikipedia=${playerData.birthCountry}, DB=${dbPlayerInfo.nation.name}`)
      }
      if (validation.teamDataMismatches.length > 0) {
        console.warn(`Team data mismatches found for ${validation.teamDataMismatches.length} teams:`, validation.teamDataMismatches)
      }
    } else {
      // Reset validation state if we don't have both pieces of data
      setDataValidation({
        firstNameMismatch: false,
        lastNameMismatch: false,
        dateOfBirthMismatch: false,
        nationalityMismatch: false,
        teamDataMismatches: [],
      })
      setValidationResolved(false)
      setValidationDialogOpen(false)
      setChosenDataSource(null)
    }
  }, [playerData, dbPlayerInfo])

  const handleUseWikipediaData = () => {
    setValidationResolved(true)
    setValidationDialogOpen(false)
    setChosenDataSource('wikipedia')
    onDataSourceChosen('wikipedia')
    console.log("Using Wikipedia data for player information")
  }

  const handleUseDatabaseData = () => {
    setValidationResolved(true)
    setValidationDialogOpen(false)
    setChosenDataSource('database')
    onDataSourceChosen('database')
    console.log("Using database data for player information")
  }

  // Don't render anything if we don't have both pieces of data
  if (!playerData || !dbPlayerInfo) {
    return null
  }

  const hasValidationIssues = dataValidation.firstNameMismatch || dataValidation.lastNameMismatch || dataValidation.dateOfBirthMismatch || dataValidation.nationalityMismatch || dataValidation.teamDataMismatches.length > 0
  const { first: wikiFirstName, last: wikiLastName } = parsePlayerName(playerData.playerName)
  
  return (
    <>
      {/* Persistent Action Required Alert - shows when validation issues exist but dialog is closed */}
      {hasValidationIssues && !validationDialogOpen && !validationResolved && (
        <Alert className={`border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 ${className}`}>
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Action Required:</strong> Data validation issues detected between Wikipedia and database information. Please resolve these conflicts to proceed with configuration.
            <div className="mt-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setValidationDialogOpen(true)}
                className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Resolve Conflicts
              </Button>
              <div className="text-xs text-amber-600 dark:text-amber-400 self-center">
                {dataValidation.teamDataMismatches.length > 0 && `${dataValidation.teamDataMismatches.length} team conflicts`}
                {(dataValidation.firstNameMismatch || dataValidation.lastNameMismatch || dataValidation.dateOfBirthMismatch || dataValidation.nationalityMismatch) && 
                  dataValidation.teamDataMismatches.length > 0 && ', '}
                {(dataValidation.firstNameMismatch || dataValidation.lastNameMismatch || dataValidation.dateOfBirthMismatch || dataValidation.nationalityMismatch) && 
                  'player info conflicts'}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Data Validation Dialog */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Data Validation Required
            </DialogTitle>
            <DialogDescription>
              We found discrepancies between Wikipedia and Extratime DB information. Please choose which data to use for the player configuration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            {/* Data Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Field</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Wikipedia Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Extratime DB Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dataValidation.firstNameMismatch && (
                    <tr className="bg-amber-50 dark:bg-amber-950/30">
                      <td className="px-4 py-3 text-sm font-medium">First Name</td>
                      <td className="px-4 py-3 text-sm">{wikiFirstName}</td>
                      <td className="px-4 py-3 text-sm">{dbPlayerInfo.first_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                          Mismatch
                        </Badge>
                      </td>
                    </tr>
                  )}
                  {dataValidation.lastNameMismatch && (
                    <tr className="bg-amber-50 dark:bg-amber-950/30">
                      <td className="px-4 py-3 text-sm font-medium">Last Name</td>
                      <td className="px-4 py-3 text-sm">{wikiLastName}</td>
                      <td className="px-4 py-3 text-sm">{dbPlayerInfo.last_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                          Mismatch
                        </Badge>
                      </td>
                    </tr>
                  )}
                  {dataValidation.dateOfBirthMismatch && (
                    <tr className="bg-amber-50 dark:bg-amber-950/30">
                      <td className="px-4 py-3 text-sm font-medium">Date of Birth</td>
                      <td className="px-4 py-3 text-sm">{playerData.dateOfBirth}</td>
                      <td className="px-4 py-3 text-sm">{dbPlayerInfo.date_of_birth}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                          Mismatch
                        </Badge>
                      </td>
                    </tr>
                  )}
                  {dataValidation.nationalityMismatch && (
                    <tr className="bg-amber-50 dark:bg-amber-950/30">
                      <td className="px-4 py-3 text-sm font-medium">Nationality</td>
                      <td className="px-4 py-3 text-sm">{playerData.birthCountry}</td>
                      <td className="px-4 py-3 text-sm">{dbPlayerInfo.nation.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                          Mismatch
                        </Badge>
                      </td>
                    </tr>
                  )}
                  
                  {/* Team Data Mismatches */}
                  {dataValidation.teamDataMismatches.map((teamMismatch, index) => {
                    const teamRows = []
                    
                    // Team header row
                    teamRows.push(
                      <tr key={`team-header-${index}`} className="bg-blue-50 dark:bg-blue-950/30 border-t-2 border-blue-200 dark:border-blue-800">
                        <td colSpan={4} className="px-4 py-2 text-sm font-bold text-blue-800 dark:text-blue-300 text-center">
                          Team: {teamMismatch.teamName}
                        </td>
                      </tr>
                    )
                    
                    // Individual mismatch rows
                    if (teamMismatch.mismatches.teamId) {
                      teamRows.push(
                        <tr key={`team-id-${index}`} className="bg-amber-50 dark:bg-amber-950/30">
                          <td className="px-4 py-3 text-sm font-medium pl-8">└ Team ID</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.wikiTeam.teamID || 'Not Found'}</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.dbTeam.team_id}</td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                              Mismatch
                            </Badge>
                          </td>
                        </tr>
                      )
                    }
                    
                    if (teamMismatch.mismatches.appearances) {
                      teamRows.push(
                        <tr key={`team-apps-${index}`} className="bg-amber-50 dark:bg-amber-950/30">
                          <td className="px-4 py-3 text-sm font-medium pl-8">└ Appearances</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.wikiTeam.appearances}</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.dbTeam.apps}</td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                              Mismatch
                            </Badge>
                          </td>
                        </tr>
                      )
                    }
                    
                    if (teamMismatch.mismatches.goals) {
                      teamRows.push(
                        <tr key={`team-goals-${index}`} className="bg-amber-50 dark:bg-amber-950/30">
                          <td className="px-4 py-3 text-sm font-medium pl-8">└ Goals</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.wikiTeam.goals}</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.dbTeam.goals}</td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                              Mismatch
                            </Badge>
                          </td>
                        </tr>
                      )
                    }
                    
                    if (teamMismatch.mismatches.joinYear) {
                      teamRows.push(
                        <tr key={`team-join-${index}`} className="bg-amber-50 dark:bg-amber-950/30">
                          <td className="px-4 py-3 text-sm font-medium pl-8">└ Join Year</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.wikiTeam.joinYear}</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.dbTeam.start_year}</td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                              Mismatch
                            </Badge>
                          </td>
                        </tr>
                      )
                    }
                    
                    if (teamMismatch.mismatches.departYear) {
                      teamRows.push(
                        <tr key={`team-depart-${index}`} className="bg-amber-50 dark:bg-amber-950/30">
                          <td className="px-4 py-3 text-sm font-medium pl-8">└ Depart Year</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.wikiTeam.departYear || 'Current'}</td>
                          <td className="px-4 py-3 text-sm">{teamMismatch.dbTeam.end_year || 'Current'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                              Mismatch
                            </Badge>
                          </td>
                        </tr>
                      )
                    }
                    
                    if (teamMismatch.mismatches.transferType) {
                      const wikiTransferType = (teamMismatch.wikiTeam.typeOfTransfer || "").toLowerCase().trim()
                      const wikiType = wikiTransferType.includes("loan") ? "loan" : "permanent"
                      
                      teamRows.push(
                        <tr key={`team-transfer-${index}`} className="bg-amber-50 dark:bg-amber-950/30">
                          <td className="px-4 py-3 text-sm font-medium pl-8">└ Transfer Type</td>
                          <td className="px-4 py-3 text-sm capitalize">{wikiType}</td>
                          <td className="px-4 py-3 text-sm capitalize">{teamMismatch.dbTeam.transfer_type}</td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-300">
                              Mismatch
                            </Badge>
                          </td>
                        </tr>
                      )
                    }
                    
                    return teamRows
                  }).flat()}
                </tbody>
              </table>
            </div>

            {/* Team Count Mismatch Information */}
            {playerData.teams.length !== dbPlayerInfo.teams_played_for.length && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
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
                        <div className="mt-2 p-3 rounded-md">
                          <div className="text-sm">
                            📊 <strong>Wikipedia has {extraTeams} additional team{extraTeams > 1 ? 's' : ''}:</strong>
                          </div>
                          <div className="text-sm mt-1 font-medium text-blue-800 dark:text-blue-300">
                            {extraTeamNames}
                          </div>
                        </div>
                      )
                    } else if (dbCount > wikiCount) {
                      const extraTeams = dbCount - wikiCount
                      const extraTeamNames = dbPlayerInfo.teams_played_for
                        .slice(wikiCount)
                        .map(team => team.team_name)
                        .join(', ')
                      return (
                        <div className="mt-2 p-3 rounded-md">
                          <div className="text-sm">
                            🏛️ <strong>Database has {extraTeams} additional team{extraTeams > 1 ? 's' : ''}:</strong>
                          </div>
                          <div className="text-sm mt-1 font-medium text-emerald-800 dark:text-emerald-300">
                            {extraTeamNames}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Your choice will update the Player Information section and affect the final configuration.
            </p>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex gap-4 justify-center pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button
              onClick={handleUseWikipediaData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Use Wikipedia Data
            </Button>
            <Button
              onClick={handleUseDatabaseData}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
            >
              <Shield className="h-4 w-4" />
              Use Database Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Validation Summary (for resolved validations) */}
      {playerData.playerFoundInDB && validationResolved && hasValidationIssues && (
        <Alert className={`border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950 ${className}`}>
          <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">
            <strong>Data Validation Resolved:</strong> You have chosen to use <strong>{chosenDataSource === 'wikipedia' ? 'Wikipedia' : 'Extratime Database'}</strong> data for conflicting information. The Player Configuration section has been updated accordingly.
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setValidationDialogOpen(true)}
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
              >
                Review Choices
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
