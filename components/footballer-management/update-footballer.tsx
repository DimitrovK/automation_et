'use client';

import type { CreateFootballerRequest, Footballer, FootballerNation, FootballerTeam } from '@/types/player';
import { Edit, Loader2, Search } from 'lucide-react';
import React, { useMemo } from 'react';
import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { NationsMultiSelect } from '@/components/footballer-management/NationsMultiSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type UpdateFootballerProps = {
  updateForm: CreateFootballerRequest;
  updateLoading: boolean;
  nations: FootballerNation[];
  nationsLoading: boolean;
  footballerToUpdate: Footballer | null;
  fetchLoading: boolean;
  footballerId: string;
  onFormChange: (form: CreateFootballerRequest) => void;
  onUpdateFootballer: () => void;
  onFootballerIdChange: (id: string) => void;
  onFetchFootballerForUpdate: () => void;
};

export function UpdateFootballer({
  updateForm,
  updateLoading,
  nations,
  footballerToUpdate,
  fetchLoading,
  footballerId,
  onFormChange,
  onUpdateFootballer,
  onFootballerIdChange,
  onFetchFootballerForUpdate,
}: UpdateFootballerProps) {
  // Resolve other_nation_ids → Nation objects for the multi-select chip
  // renderer. Falls back gracefully when ``nations`` is still loading.
  const otherNations = useMemo(() => {
    const ids = updateForm.other_nation_ids ?? [];
    return ids
      .map((id) => nations.find((n) => n.id === id))
      .filter((n): n is FootballerNation => Boolean(n));
  }, [updateForm.other_nation_ids, nations]);

  return (
    <div className="space-y-6">
      {/* Step 1: Fetch Footballer to Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
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
              onChange={e => onFootballerIdChange(e.target.value)}
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
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                ✅ Loaded:
                {' '}
                {footballerToUpdate.first_name}
                {' '}
                {footballerToUpdate.last_name}
                {' '}
                (ID:
                {' '}
                {footballerToUpdate.id}
                )
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
              <Edit className="size-5" />
              Step 2: Update Footballer Details
            </CardTitle>
            <CardDescription>
              PUT /data/footballers/
              {footballerToUpdate.id}
              / - Modify the footballer information below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status - First and alone */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-status">Status</Label>
                <Select
                  value={updateForm.status}
                  onValueChange={value => onFormChange({ ...updateForm, status: value as any })}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="update-first-name">First Name</Label>
                <Input
                  id="update-first-name"
                  placeholder="Enter first name"
                  value={updateForm.first_name}
                  onChange={e => onFormChange({ ...updateForm, first_name: e.target.value })}
                  disabled={updateLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-last-name">Last Name *</Label>
                <Input
                  id="update-last-name"
                  placeholder="Enter last name"
                  value={updateForm.last_name}
                  onChange={e => onFormChange({ ...updateForm, last_name: e.target.value })}
                  disabled={updateLoading}
                  required
                />
              </div>
            </div>

            {/* Date of Birth and Nation - Same line */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="update-date-of-birth">Date of Birth *</Label>
                <Input
                  id="update-date-of-birth"
                  type="date"
                  value={updateForm.date_of_birth}
                  onChange={e => onFormChange({ ...updateForm, date_of_birth: e.target.value })}
                  disabled={updateLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nation</Label>
                <NationCombobox
                  value={updateForm.nation_id || null}
                  onChange={(id) => onFormChange({ ...updateForm, nation_id: id })}
                  placeholder="Search and pick a nation…"
                  disabled={updateLoading}
                />
              </div>
            </div>

            {/* Secondary nationalities (other_nations M2M) - full width */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Other Nationalities</Label>
                <NationsMultiSelect
                  value={otherNations}
                  onChange={(arr) => onFormChange({ ...updateForm, other_nation_ids: arr.map((n) => n.id) })}
                  excludeIds={updateForm.nation_id ? [updateForm.nation_id] : []}
                  disabled={updateLoading}
                />
                <p className="text-xs text-gray-500">
                  Optional: dual citizenship. The primary nation above is excluded from this list.
                </p>
              </div>
            </div>

            {/* Wikipedia URL - Full width */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-wikipedia-url">Wikipedia URL</Label>
                <Input
                  id="update-wikipedia-url"
                  placeholder="https://en.wikipedia.org/wiki/Player_Name"
                  value={updateForm.wikipedia_url || ''}
                  onChange={e => onFormChange({ ...updateForm, wikipedia_url: e.target.value || null })}
                  disabled={updateLoading}
                />
                <p className="text-xs text-gray-500">
                  Optional: Link to the player's Wikipedia page
                </p>
              </div>
            </div>

            {/* Additional Info - full-width textarea */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-additional-info">Additional Info</Label>
                <Textarea
                  id="update-additional-info"
                  placeholder="Free-form notes about this footballer (used by some game prompts)…"
                  value={updateForm.additional_info ?? ''}
                  onChange={e => onFormChange({ ...updateForm, additional_info: e.target.value || null })}
                  rows={3}
                  disabled={updateLoading}
                />
              </div>
            </div>

            {/* Career Difficulty - Full width */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-career-difficulty">Career Difficulty</Label>
                <Select
                  value={updateForm.career_path_difficulty}
                  onValueChange={value => onFormChange({ ...updateForm, career_path_difficulty: value as any })}
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
            </div>

            {/* Game eligibility group — three switches side-by-side. */}
            <div className="rounded-md border bg-gray-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <Label className="mb-2 block text-sm font-medium">Game Eligibility</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="update-career-available"
                    checked={updateForm.available_for_career_path}
                    onCheckedChange={checked => onFormChange({ ...updateForm, available_for_career_path: checked })}
                    disabled={updateLoading}
                  />
                  <Label htmlFor="update-career-available" className="text-sm">Career Path</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="update-grid-available"
                    checked={updateForm.available_for_grid}
                    onCheckedChange={checked => onFormChange({ ...updateForm, available_for_grid: checked })}
                    disabled={updateLoading}
                  />
                  <Label htmlFor="update-grid-available" className="text-sm">Grid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="update-scout-available"
                    checked={updateForm.available_for_scout}
                    onCheckedChange={checked => onFormChange({ ...updateForm, available_for_scout: checked })}
                    disabled={updateLoading}
                  />
                  <Label htmlFor="update-scout-available" className="text-sm">Scout</Label>
                </div>
              </div>
            </div>

            {/* Rest - One per line */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="update-retired"
                  checked={updateForm.retired}
                  onCheckedChange={checked => onFormChange({ ...updateForm, retired: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-retired" className="text-sm">Retired</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-is-player"
                  checked={updateForm.is_player}
                  onCheckedChange={checked => onFormChange({ ...updateForm, is_player: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-is-player" className="text-sm">Is Player</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-is-manager"
                  checked={updateForm.is_manager}
                  onCheckedChange={checked => onFormChange({ ...updateForm, is_manager: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-is-manager" className="text-sm">Is Manager</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-might-change"
                  checked={updateForm.might_change}
                  onCheckedChange={checked => onFormChange({ ...updateForm, might_change: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-might-change" className="text-sm">Might Change</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-show-dob"
                  checked={updateForm.show_date_of_birth_on_search}
                  onCheckedChange={checked => onFormChange({ ...updateForm, show_date_of_birth_on_search: checked })}
                  disabled={updateLoading}
                />
                <Label htmlFor="update-show-dob" className="text-sm">Show Date of Birth in Search</Label>
              </div>
            </div>

            <Button
              onClick={onUpdateFootballer}
              disabled={updateLoading || !updateForm.last_name.trim() || !updateForm.date_of_birth}
              className="border-slate-500 bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm hover:from-slate-600 hover:to-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateLoading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> Updating footballer...</>
              ) : (
                <><Edit className="mr-2 size-4" /> Update Footballer</>
              )}
            </Button>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              * Required fields. Team stints, positions, nation stats, and pictures
              are managed in the editors below — saving the form here only updates
              the core footballer record.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
