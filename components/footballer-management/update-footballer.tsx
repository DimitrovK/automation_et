"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiButton } from "@/components/ui/emerald-button"
import { Edit, Search, Loader2 } from "lucide-react"
import { FootballerAPI } from "@/lib/footballer-api"
import type { CreateFootballerRequest, FootballerNation, Footballer, FootballerTeam } from "@/types/player"

interface UpdateFootballerProps {
  updateForm: CreateFootballerRequest
  updateLoading: boolean
  nations: FootballerNation[]
  nationsLoading: boolean
  footballerToUpdate: Footballer | null
  fetchLoading: boolean
  footballerId: string
  footballerTeams: FootballerTeam[]
  footballerTeamsLoading: boolean
  onFormChange: (form: CreateFootballerRequest) => void
  onUpdateFootballer: (teamChanges?: Array<{ id: number; changes: Partial<FootballerTeam> }>) => void
  onFootballerIdChange: (id: string) => void
  onFetchFootballerForUpdate: () => void
  onTeamUpdate?: (teamId: number, updatedTeam: Partial<FootballerTeam>) => void
  onTeamsSaved?: () => void
}

export function UpdateFootballer({
  updateForm,
  updateLoading,
  nations,
  nationsLoading,
  footballerToUpdate,
  fetchLoading,
  footballerId,
  footballerTeams,
  footballerTeamsLoading,
  onFormChange,
  onUpdateFootballer,
  onFootballerIdChange,
  onFetchFootballerForUpdate,
  onTeamUpdate,
  onTeamsSaved,
}: UpdateFootballerProps) {
  const [editingTeams, setEditingTeams] = useState<Record<number, Partial<FootballerTeam>>>({})
  const [originalTeams, setOriginalTeams] = useState<Record<number, FootballerTeam>>({})

  // Track original team values when footballerTeams changes
  useEffect(() => {
    if (footballerTeams && footballerTeams.length > 0) {
      const teamsMap = footballerTeams.reduce((acc, team) => {
        acc[team.id] = { ...team }
        return acc
      }, {} as Record<number, FootballerTeam>)
      setOriginalTeams(teamsMap)
      // Clear any existing edits when new teams are loaded
      setEditingTeams({})
    }
  }, [footballerTeams])

  const handleTeamFieldChange = (teamId: number, field: keyof FootballerTeam, value: string | number | null) => {
    setEditingTeams(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value
      }
    }))
  }

  const getTeamFieldValue = (team: FootballerTeam, field: keyof FootballerTeam) => {
    const editedValue = editingTeams[team.id]?.[field]
    return editedValue !== undefined ? editedValue : team[field]
  }

  // Get changed teams - only teams that have been modified
  const getChangedTeams = (): Array<{ id: number; changes: Partial<FootballerTeam> }> => {
    const changedTeams: Array<{ id: number; changes: Partial<FootballerTeam> }> = []
    
    Object.entries(editingTeams).forEach(([teamIdStr, editedFields]) => {
      const teamId = parseInt(teamIdStr)
      const originalTeam = originalTeams[teamId]
      
      if (!originalTeam) return
      
      const actualChanges: Partial<FootballerTeam> = {}
      let hasChanges = false
      
      // Check each edited field to see if it's actually different from original
      Object.entries(editedFields).forEach(([field, newValue]) => {
        const originalValue = originalTeam[field as keyof FootballerTeam]
        if (originalValue !== newValue) {
          actualChanges[field as keyof FootballerTeam] = newValue as any
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        changedTeams.push({ id: teamId, changes: actualChanges })
      }
    })
    
    return changedTeams
  }

  const hasUnsavedTeamChanges = getChangedTeams().length > 0

  const handleUpdateClick = () => {
    const teamChanges = getChangedTeams()
    onUpdateFootballer(teamChanges)
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Fetch Footballer to Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Step 1: Load Footballer to Update
          </CardTitle>
          <CardDescription>
            First, fetch the footballer you want to update to populate the form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-footballer-id">Footballer ID</Label>
            <Input
              id="update-footballer-id"
              type="number"
              placeholder="Enter footballer ID to update"
              value={footballerId}
              onChange={(e) => onFootballerIdChange(e.target.value)}
              disabled={fetchLoading}
            />
          </div>

          <ApiButton 
            onClick={onFetchFootballerForUpdate}
            disabled={!footballerId.trim()}
            loading={fetchLoading}
            loadingText="Loading footballer..."
            icon={Search}
          >
            Load Footballer Data
          </ApiButton>

          {footballerToUpdate && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                ✅ Loaded: {footballerToUpdate.first_name} {footballerToUpdate.last_name} (ID: {footballerToUpdate.id})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Update Form (only show if footballer is loaded) */}
      {footballerToUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Step 2: Update Footballer Details
            </CardTitle>
            <CardDescription>
              PUT /data/footballers/{footballerToUpdate.id}/ - Modify the footballer information below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status - First and alone */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-status">Status</Label>
                <Select 
                  value={updateForm.status} 
                  onValueChange={(value) => onFormChange({ ...updateForm, status: value as any })}
                  disabled={updateLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AWAITING_REVISION">Awaiting Revision</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="DENIED">Denied</SelectItem>
                    <SelectItem value="AWAITING_CHANGE_CHECK">Awaiting Change Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* First Name and Last Name - Same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-first-name">First Name</Label>
                <Input
                  id="update-first-name"
                  placeholder="Enter first name"
                  value={updateForm.first_name}
                  onChange={(e) => onFormChange({ ...updateForm, first_name: e.target.value })}
                  disabled={updateLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-last-name">Last Name *</Label>
                <Input
                  id="update-last-name"
                  placeholder="Enter last name"
                  value={updateForm.last_name}
                  onChange={(e) => onFormChange({ ...updateForm, last_name: e.target.value })}
                  disabled={updateLoading}
                  required
                />
              </div>
            </div>

            {/* Date of Birth and Nation - Same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-date-of-birth">Date of Birth *</Label>
                <Input
                  id="update-date-of-birth"
                  type="date"
                  value={updateForm.date_of_birth}
                  onChange={(e) => onFormChange({ ...updateForm, date_of_birth: e.target.value })}
                  disabled={updateLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-nation">Nation</Label>
                <Select 
                  value={updateForm.nation_id.toString()} 
                  onValueChange={(value) => onFormChange({ ...updateForm, nation_id: parseInt(value) })}
                  disabled={updateLoading || nationsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nation" />
                  </SelectTrigger>
                  <SelectContent>
                    {nations.map((nation) => (
                      <SelectItem key={nation.id} value={nation.id.toString()}>
                        {nation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Career Difficulty + Available For Career Path - Same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-career-difficulty">Career Difficulty</Label>
                <Select 
                  value={updateForm.career_path_difficulty} 
                  onValueChange={(value) => onFormChange({ ...updateForm, career_path_difficulty: value as any })}
                  disabled={updateLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                    <SelectItem value="EXTREME">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Available for Career Path</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="update-career-available"
                    checked={updateForm.available_for_career_path}
                    onCheckedChange={(checked) => onFormChange({ ...updateForm, available_for_career_path: checked })}
                    disabled={updateLoading}
                  />
                  <Label htmlFor="update-career-available" className="text-sm">Available for Career Path</Label>
                </div>
              </div>
            </div>

            {/* Rest - One per line */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="update-retired"
                  checked={updateForm.retired}
                  onCheckedChange={(checked) => onFormChange({ ...updateForm, retired: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-retired" className="text-sm">Retired</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-is-player"
                  checked={updateForm.is_player}
                  onCheckedChange={(checked) => onFormChange({ ...updateForm, is_player: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-is-player" className="text-sm">Is Player</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-is-manager"
                  checked={updateForm.is_manager}
                  onCheckedChange={(checked) => onFormChange({ ...updateForm, is_manager: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-is-manager" className="text-sm">Is Manager</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-might-change"
                  checked={updateForm.might_change}
                  onCheckedChange={(checked) => onFormChange({ ...updateForm, might_change: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-might-change" className="text-sm">Might Change</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-show-dob"
                  checked={updateForm.show_date_of_birth_on_search}
                  onCheckedChange={(checked) => onFormChange({ ...updateForm, show_date_of_birth_on_search: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-show-dob" className="text-sm">Show Date of Birth in Search</Label>
              </div>
            </div>

            {/* Team History Section */}
            <div className="space-y-3">
              <div className="border-t pt-4">
                <h4 className="font-medium text-lg mb-3">Team History</h4>
                {footballerTeamsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading team history...
                  </div>
                ) : !footballerTeams || footballerTeams.length === 0 ? (
                  <p className="text-sm text-gray-600">No team records found.</p>
                ) : (
                  <Tabs defaultValue="player" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="player" className="text-sm">
                        Player ({footballerTeams.filter(team => team.role === "player").length})
                      </TabsTrigger>
                      <TabsTrigger value="manager" className="text-sm">
                        Manager ({footballerTeams.filter(team => team.role === "manager").length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="player" className="mt-4">
                      {footballerTeams.filter(team => team.role === "player").length > 0 ? (
                        <div className="space-y-4">
                          {footballerTeams.filter(team => team.role === "player").map((team, index) => (
                            <div key={team.id}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Team Name</Label>
                                  <Input value={team.team_name} disabled className="bg-gray-100 dark:bg-gray-800 h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Apps</Label>
                                  <Input 
                                    type="number"
                                    value={(getTeamFieldValue(team, 'apps') || 0).toString()} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'apps', parseInt(e.target.value) || 0)}
                                    className="bg-blue-50 dark:bg-blue-950/20 h-8 text-sm" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Goals</Label>
                                  <Input 
                                    type="number"
                                    value={(getTeamFieldValue(team, 'goals') || 0).toString()} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'goals', parseInt(e.target.value) || 0)}
                                    className="bg-blue-50 dark:bg-blue-950/20 h-8 text-sm" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Transfer Type</Label>
                                  <Select 
                                    value={getTeamFieldValue(team, 'transfer_type') as string || 'permanent'}
                                    onValueChange={(value) => handleTeamFieldChange(team.id, 'transfer_type', value)}
                                  >
                                    <SelectTrigger className="bg-blue-50 dark:bg-blue-950/20 h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="permanent">Permanent</SelectItem>
                                      <SelectItem value="loan">Loan</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Start Year</Label>
                                  <Input 
                                    type="number"
                                    value={(getTeamFieldValue(team, 'start_year') || new Date().getFullYear()).toString()} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'start_year', parseInt(e.target.value) || new Date().getFullYear())}
                                    className="bg-blue-50 dark:bg-blue-950/20 h-8 text-sm" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">End Year</Label>
                                  <Input 
                                    type="number"
                                    value={getTeamFieldValue(team, 'end_year') ? (getTeamFieldValue(team, 'end_year') as number).toString() : ''} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'end_year', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Present"
                                    className="bg-blue-50 dark:bg-blue-950/20 h-8 text-sm" 
                                  />
                                </div>
                              </div>
                              {index < footballerTeams.filter(team => team.role === "player").length - 1 && (
                                <hr className="mt-4 border-gray-200 dark:border-gray-700" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No player records found.</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="manager" className="mt-4">
                      {footballerTeams.filter(team => team.role === "manager").length > 0 ? (
                        <div className="space-y-4">
                          {footballerTeams.filter(team => team.role === "manager").map((team, index) => (
                            <div key={team.id}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Team Name</Label>
                                  <Input value={team.team_name} disabled className="bg-gray-100 dark:bg-gray-800 h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Apps</Label>
                                  <Input 
                                    type="number"
                                    value={(getTeamFieldValue(team, 'apps') || 0).toString()} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'apps', parseInt(e.target.value) || 0)}
                                    className="bg-green-50 dark:bg-green-950/20 h-8 text-sm" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Goals</Label>
                                  <Input 
                                    type="number"
                                    value={(getTeamFieldValue(team, 'goals') || 0).toString()} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'goals', parseInt(e.target.value) || 0)}
                                    className="bg-green-50 dark:bg-green-950/20 h-8 text-sm" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Transfer Type</Label>
                                  <Select 
                                    value={getTeamFieldValue(team, 'transfer_type') as string || 'permanent'}
                                    onValueChange={(value) => handleTeamFieldChange(team.id, 'transfer_type', value)}
                                  >
                                    <SelectTrigger className="bg-green-50 dark:bg-green-950/20 h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="permanent">Permanent</SelectItem>
                                      <SelectItem value="loan">Loan</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Start Year</Label>
                                  <Input 
                                    type="number"
                                    value={(getTeamFieldValue(team, 'start_year') || new Date().getFullYear()).toString()} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'start_year', parseInt(e.target.value) || new Date().getFullYear())}
                                    className="bg-green-50 dark:bg-green-950/20 h-8 text-sm" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">End Year</Label>
                                  <Input 
                                    type="number"
                                    value={getTeamFieldValue(team, 'end_year') ? (getTeamFieldValue(team, 'end_year') as number).toString() : ''} 
                                    onChange={(e) => handleTeamFieldChange(team.id, 'end_year', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Present"
                                    className="bg-green-50 dark:bg-green-950/20 h-8 text-sm" 
                                  />
                                </div>
                              </div>
                              {index < footballerTeams.filter(team => team.role === "manager").length - 1 && (
                                <hr className="mt-4 border-gray-200 dark:border-gray-700" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No manager records found.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>

            <Button 
              onClick={handleUpdateClick}
              disabled={updateLoading || !updateForm.last_name.trim() || !updateForm.date_of_birth}
              className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-500 shadow-sm hover:from-slate-600 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {hasUnsavedTeamChanges 
                    ? "Updating footballer & saving teams..." 
                    : "Updating footballer..."
                  }
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  {hasUnsavedTeamChanges 
                    ? `Update Footballer + Save Team Changes (${getChangedTeams().length})`
                    : "Update Footballer"
                  }
                </>
              )}
            </Button>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              * Required fields. This will completely replace the footballer record.
              {hasUnsavedTeamChanges && (
                <><br />✨ Team changes will also be saved automatically.</>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
