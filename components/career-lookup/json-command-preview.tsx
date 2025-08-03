"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { GraphiteButton } from "@/components/ui/graphite-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Code, Copy, Check, AlertTriangle, FileText, Database, ChevronDown, ChevronUp } from "lucide-react"
import type { 
  PlayerData, 
  PlayerConfiguration, 
  CreateFootballerRequest, 
  CreateFootballerTeamRequest 
} from "@/types/player"
import { useAuth } from "@/lib/auth"

interface JsonCommandPreviewProps {
  playerData: PlayerData | null
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  playerConfig: PlayerConfiguration
  countryID: number | null
}

export function JsonCommandPreview({
  playerData,
  firstName,
  lastName,
  dateOfBirth,
  nationality,
  playerConfig,
  countryID
}: JsonCommandPreviewProps) {
  const { user } = useAuth()
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showApiCommands, setShowApiCommands] = useState(false)
  const [showAsHttpRequest, setShowAsHttpRequest] = useState(false)

  // Generate footballer creation JSON
  const footballerJson = useMemo(() => {
    if (!playerData || !countryID || !user) return null

    const createFootballerData: CreateFootballerRequest = {
      status: playerConfig.status,
      user: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      nation_id: countryID,
      date_of_birth: dateOfBirth,
      show_date_of_birth_on_search: playerConfig.show_date_of_birth_on_search,
      retired: playerConfig.retired,
      is_player: true,
      is_manager: false,
      might_change: playerConfig.might_change,
      available_for_career_path: playerConfig.available_for_career_path,
      career_path_difficulty: playerConfig.career_path_difficulty,
    }

    return createFootballerData
  }, [playerData, firstName, lastName, dateOfBirth, countryID, playerConfig, user])

  // Generate footballer teams creation JSON
  const footballerTeamsJson = useMemo(() => {
    if (!playerData?.teams || !footballerJson) return []

    // Filter teams that were found in the database
    const foundTeams = playerData.teams.filter(team => team.teamFound && team.teamID)

    return foundTeams.map(team => {
      // Map the typeOfTransfer to the API expected format - be more flexible with detection
      const transferTypeString = (team.typeOfTransfer || "").toLowerCase().trim()
      const transferType = transferTypeString.includes("loan") ? "loan" : "permanent"
      
      const createTeamData: CreateFootballerTeamRequest = {
        footballer_id: 0, // Will be replaced with actual ID after footballer creation
        team_id: team.teamID!,
        role: "player",
        apps: team.appearances,
        goals: team.goals,
        transfer_type: transferType,
        start_year: team.joinYear,
        end_year: team.departYear,
      }
      return createTeamData
    })
  }, [playerData, footballerJson])

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Generate HTTP request format
  const generateHttpRequest = (endpoint: string, method: string, data: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    return `${method} ${baseUrl}${endpoint}
Content-Type: application/json
Authorization: Bearer ${token || 'YOUR_JWT_TOKEN'}

${JSON.stringify(data, null, 2)}`
  }

  if (!playerData || !footballerJson) {
    return null // Don't show anything if no data
  }

  const hasValidationIssues = !countryID || !firstName.trim() || !lastName.trim() || !dateOfBirth

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowApiCommands(!showApiCommands)}
          className="flex items-center gap-2"
        >
          <Code className="h-4 w-4" />
          {showApiCommands ? 'Hide API Commands' : 'Show API Commands'}
          {showApiCommands ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* API Commands Preview - Only show when toggled */}
      {showApiCommands && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Commands Preview
            </CardTitle>
            <CardDescription>
              JSON commands that will be executed to create the footballer and team records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hasValidationIssues && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
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
                <div className="flex items-center justify-between mb-3">
                  <TabsList className="grid grid-cols-2 w-auto">
                    <TabsTrigger value="footballer">
                      Create Footballer
                      <Badge variant="secondary" className="ml-2">1</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="teams">
                      Create Teams
                      <Badge variant="secondary" className="ml-2">{footballerTeamsJson.length}</Badge>
                    </TabsTrigger>
                  </TabsList>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAsHttpRequest(!showAsHttpRequest)}
                    className="flex items-center gap-2"
                  >
                    {showAsHttpRequest ? 'Show JSON' : 'Show HTTP Request'}
                  </Button>
                </div>

                <TabsContent value="footballer" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {showAsHttpRequest ? 'HTTP Request to POST /data/footballers/' : 'POST /data/footballers/'}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const content = showAsHttpRequest 
                          ? generateHttpRequest('/data/footballers/', 'POST', footballerJson)
                          : JSON.stringify(footballerJson, null, 2)
                        copyToClipboard(content, 'footballer')
                      }}
                    >
                      {copiedStates.footballer ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedStates.footballer ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <ScrollArea className="h-64 w-full border rounded-lg">
                    <div className="bg-gray-100 dark:bg-slate-700 p-4">
                      <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        <code>
                          {showAsHttpRequest 
                            ? generateHttpRequest('/data/footballers/', 'POST', footballerJson)
                            : JSON.stringify(footballerJson, null, 2)
                          }
                        </code>
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="teams" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {showAsHttpRequest ? 'HTTP Request to POST /data/footballer-teams/' : 'POST /data/footballer-teams/'}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const content = showAsHttpRequest 
                          ? generateHttpRequest('/data/footballer-teams/', 'POST', footballerTeamsJson)
                          : JSON.stringify(footballerTeamsJson, null, 2)
                        copyToClipboard(content, 'teams')
                      }}
                    >
                      {copiedStates.teams ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedStates.teams ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  {footballerTeamsJson.length > 0 ? (
                    <ScrollArea className="h-64 w-full border rounded-lg">
                      <div className="bg-gray-100 dark:bg-slate-700 p-4">
                        <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
                          <code>
                            {showAsHttpRequest 
                              ? generateHttpRequest('/data/footballer-teams/', 'POST', footballerTeamsJson)
                              : JSON.stringify(footballerTeamsJson, null, 2)
                            }
                          </code>
                        </pre>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-gray-500 py-8 border rounded-lg">
                      <p>No teams found in database to create records for</p>
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
                      disabled={hasValidationIssues}
                      icon={FileText}
                      className="flex-1"
                    >
                      Preview Full Commands
                    </GraphiteButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Complete API Commands</DialogTitle>
                      <DialogDescription>
                        Full JSON payload for creating footballer and all team records
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">1. Create Footballer</h4>
                          <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-lg overflow-x-auto">
                            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
                              <code>{JSON.stringify(footballerJson, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                        {footballerTeamsJson.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">2. Create Team Records</h4>
                            {footballerTeamsJson.map((team, index) => (
                              <div key={index} className="mb-3">
                                <p className="text-sm text-gray-600 mb-1">Team {index + 1}:</p>
                                <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-lg overflow-x-auto">
                                  <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                    <code>{JSON.stringify(team, null, 2)}</code>
                                  </pre>
                                </div>
                              </div>
                            ))}
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
  )
}
