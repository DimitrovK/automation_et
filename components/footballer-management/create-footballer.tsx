"use client"

import React from "react"
import { ApiButton } from "@/components/ui/emerald-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus } from "lucide-react"
import type { CreateFootballerRequest, FootballerNation } from "@/types/player"

interface CreateFootballerProps {
  createForm: CreateFootballerRequest
  createLoading: boolean
  nations: FootballerNation[]
  nationsLoading: boolean
  onFormChange: (form: CreateFootballerRequest) => void
  onCreateFootballer: () => void
}

export function CreateFootballer({ 
  createForm, 
  createLoading, 
  nations, 
  nationsLoading,
  onFormChange, 
  onCreateFootballer 
}: CreateFootballerProps) {
  const updateForm = (updates: Partial<CreateFootballerRequest>) => {
    onFormChange({ ...createForm, ...updates })
  }

  const isFormValid = createForm.last_name.trim() && createForm.date_of_birth

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Create New Footballer</h4>
        <p className="text-xs text-gray-500 mb-4">Create a new footballer entry with the required information.</p>
        
        {/* Status - First and alone */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={createForm.status} onValueChange={(value) => updateForm({ status: value })}>
              <SelectTrigger>
                <SelectValue />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              value={createForm.first_name}
              onChange={(e) => updateForm({ first_name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={createForm.last_name}
              onChange={(e) => updateForm({ last_name: e.target.value })}
            />
          </div>
        </div>

        {/* Date of Birth and Nation - Same line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={createForm.date_of_birth}
              onChange={(e) => updateForm({ date_of_birth: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Nation</Label>
            <Select 
              value={createForm.nation_id.toString()} 
              onValueChange={(value) => updateForm({ nation_id: parseInt(value) })}
              disabled={nationsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={nationsLoading ? "Loading nations..." : "Select a nation"} />
              </SelectTrigger>
              <SelectContent>
                {nations.map((nation) => (
                  <SelectItem key={nation.id} value={nation.id.toString()}>
                    {nation.name} ({nation.nationality})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Wikipedia URL - Full width */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="wikipediaUrl">Wikipedia URL</Label>
            <Input
              id="wikipediaUrl"
              placeholder="https://en.wikipedia.org/wiki/Player_Name"
              value={createForm.wikipedia_url || ""}
              onChange={(e) => updateForm({ wikipedia_url: e.target.value || null })}
            />
            <p className="text-xs text-gray-500">
              Optional: Link to the player's Wikipedia page
            </p>
          </div>
        </div>

        {/* Career Difficulty + Available For Career Path - Same line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Career Difficulty</Label>
            <Select value={createForm.career_path_difficulty} onValueChange={(value) => updateForm({ career_path_difficulty: value })}>
              <SelectTrigger>
                <SelectValue />
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
                id="availableForCareer"
                checked={createForm.available_for_career_path}
                onCheckedChange={(checked) => updateForm({ available_for_career_path: checked })}
              />
              <Label htmlFor="availableForCareer" className="text-sm">Available for Career Path</Label>
            </div>
          </div>
        </div>

        {/* Rest - One per line */}
        <div className="space-y-4 mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="retired"
              checked={createForm.retired}
              onCheckedChange={(checked) => updateForm({ retired: checked })}
            />
            <Label htmlFor="retired" className="text-sm">Retired</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPlayer"
              checked={createForm.is_player}
              onCheckedChange={(checked) => updateForm({ is_player: checked })}
            />
            <Label htmlFor="isPlayer" className="text-sm">Is Player</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isManager"
              checked={createForm.is_manager}
              onCheckedChange={(checked) => updateForm({ is_manager: checked })}
            />
            <Label htmlFor="isManager" className="text-sm">Is Manager</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="mightChange"
              checked={createForm.might_change}
              onCheckedChange={(checked) => updateForm({ might_change: checked })}
            />
            <Label htmlFor="mightChange" className="text-sm">Might Change</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="showDateOfBirth"
              checked={createForm.show_date_of_birth_on_search}
              onCheckedChange={(checked) => updateForm({ show_date_of_birth_on_search: checked })}
            />
            <Label htmlFor="showDateOfBirth" className="text-sm">Show Date of Birth in Search</Label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 flex-wrap">
          <ApiButton 
            onClick={onCreateFootballer}
            disabled={!isFormValid}
            loading={createLoading}
            loadingText="Creating..."
            icon={Plus}
          >
            POST /data/footballers/
          </ApiButton>
        </div>
        
        {!isFormValid && (
          <p className="text-xs text-orange-600 mt-2">Please fill in all required fields (*) to enable the create button</p>
        )}
      </div>
    </div>
  )
}
