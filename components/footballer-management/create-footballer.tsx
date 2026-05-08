'use client';

import type { CreateFootballerRequest, FootballerNation } from '@/types/player';
import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';
import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { NationsMultiSelect } from '@/components/footballer-management/NationsMultiSelect';
import { ApiButton } from '@/components/ui/emerald-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type CreateFootballerProps = {
  createForm: CreateFootballerRequest;
  createLoading: boolean;
  nations: FootballerNation[];
  nationsLoading: boolean;
  onFormChange: (form: CreateFootballerRequest) => void;
  onCreateFootballer: () => void;
};

export function CreateFootballer({
  createForm,
  createLoading,
  nations,
  nationsLoading,
  onFormChange,
  onCreateFootballer,
}: CreateFootballerProps) {
  const updateForm = (updates: Partial<CreateFootballerRequest>) => {
    onFormChange({ ...createForm, ...updates });
  };

  const isFormValid = createForm.last_name.trim() && createForm.date_of_birth;

  // Resolve ``other_nation_ids`` (numbers) into the full Nation objects
  // the multi-select renders as chips. Falls back to {} placeholders if
  // the nations list hasn't loaded yet — preserves the user's selection
  // across re-renders without dropping the ids.
  const otherNations = useMemo(() => {
    const ids = createForm.other_nation_ids ?? [];
    return ids
      .map((id) => nations.find((n) => n.id === id))
      .filter((n): n is FootballerNation => Boolean(n));
  }, [createForm.other_nation_ids, nations]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-sm font-medium">Create New Footballer</h4>
        <p className="mb-4 text-xs text-gray-500">Create a new footballer entry with the required information.</p>

        {/* Status - First and alone */}
        <div className="mb-4 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={createForm.status} onValueChange={value => updateForm({ status: value as CreateFootballerRequest['status'] })}>
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
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              value={createForm.first_name}
              onChange={e => updateForm({ first_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={createForm.last_name}
              onChange={e => updateForm({ last_name: e.target.value })}
            />
          </div>
        </div>

        {/* Date of Birth and Nation - Same line */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={createForm.date_of_birth}
              onChange={e => updateForm({ date_of_birth: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Nation</Label>
            <NationCombobox
              value={createForm.nation_id || null}
              onChange={(id) => updateForm({ nation_id: id })}
              placeholder="Search and pick a nation…"
            />
          </div>
        </div>

        {/* Secondary nationalities (other_nations M2M) — full width */}
        <div className="mb-4 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Other Nationalities</Label>
            <NationsMultiSelect
              value={otherNations}
              onChange={(arr) => updateForm({ other_nation_ids: arr.map((n) => n.id) })}
              excludeIds={createForm.nation_id ? [createForm.nation_id] : []}
            />
            <p className="text-xs text-gray-500">
              Optional: dual citizenship. The primary nation above is excluded from this list.
            </p>
          </div>
        </div>

        {/* Wikipedia URL - Full width */}
        <div className="mb-4 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wikipediaUrl">Wikipedia URL</Label>
            <Input
              id="wikipediaUrl"
              placeholder="https://en.wikipedia.org/wiki/Player_Name"
              value={createForm.wikipedia_url || ''}
              onChange={e => updateForm({ wikipedia_url: e.target.value || null })}
            />
            <p className="text-xs text-gray-500">
              Optional: Link to the player's Wikipedia page
            </p>
          </div>
        </div>

        {/* Additional Info - full-width textarea */}
        <div className="mb-4 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Info</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Free-form notes about this footballer (used by some game prompts)…"
              value={createForm.additional_info ?? ''}
              onChange={e => updateForm({ additional_info: e.target.value || null })}
              rows={3}
            />
          </div>
        </div>

        {/* Career Difficulty - Full width */}
        <div className="mb-4 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Career Difficulty</Label>
            <Select value={createForm.career_path_difficulty} onValueChange={value => updateForm({ career_path_difficulty: value as CreateFootballerRequest['career_path_difficulty'] })}>
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
        </div>

        {/* Game eligibility group — three switches side-by-side. */}
        <div className="mb-4 rounded-md border bg-gray-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
          <Label className="mb-2 block text-sm font-medium">Game Eligibility</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="availableForCareer"
                checked={createForm.available_for_career_path}
                onCheckedChange={checked => updateForm({ available_for_career_path: checked })}
              />
              <Label htmlFor="availableForCareer" className="text-sm">Career Path</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="availableForGrid"
                checked={createForm.available_for_grid}
                onCheckedChange={checked => updateForm({ available_for_grid: checked })}
              />
              <Label htmlFor="availableForGrid" className="text-sm">Grid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="availableForScout"
                checked={createForm.available_for_scout}
                onCheckedChange={checked => updateForm({ available_for_scout: checked })}
              />
              <Label htmlFor="availableForScout" className="text-sm">Scout</Label>
            </div>
          </div>
        </div>

        {/* Rest - One per line */}
        <div className="mb-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="retired"
              checked={createForm.retired}
              onCheckedChange={checked => updateForm({ retired: checked })}
            />
            <Label htmlFor="retired" className="text-sm">Retired</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPlayer"
              checked={createForm.is_player}
              onCheckedChange={checked => updateForm({ is_player: checked })}
            />
            <Label htmlFor="isPlayer" className="text-sm">Is Player</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isManager"
              checked={createForm.is_manager}
              onCheckedChange={checked => updateForm({ is_manager: checked })}
            />
            <Label htmlFor="isManager" className="text-sm">Is Manager</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="mightChange"
              checked={createForm.might_change}
              onCheckedChange={checked => updateForm({ might_change: checked })}
            />
            <Label htmlFor="mightChange" className="text-sm">Might Change</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="showDateOfBirth"
              checked={createForm.show_date_of_birth_on_search}
              onCheckedChange={checked => updateForm({ show_date_of_birth_on_search: checked })}
            />
            <Label htmlFor="showDateOfBirth" className="text-sm">Show Date of Birth in Search</Label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-wrap gap-2">
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
          <p className="mt-2 text-xs text-orange-600">Please fill in all required fields (*) to enable the create button</p>
        )}
      </div>
    </div>
  );
}
