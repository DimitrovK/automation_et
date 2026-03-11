'use client';

import { Users } from 'lucide-react';
import React from 'react';
import { usePlayerListContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphiteButton } from '@/components/ui/graphite-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function FilterControls() {
  const {
    playerFilter,
    setPlayerFilter,
    statusFilter,
    setStatusFilter,
    itemsPerPage,
    setItemsPerPage,
    loadingFootballers,
    applyFilters,
  } = usePlayerListContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          Player Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="player-status-filter" className="mb-2 block text-sm font-medium">Player Status</label>
          <Select value={playerFilter} onValueChange={(value: any) => setPlayerFilter(value)}>
            <SelectTrigger id="player-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              <SelectItem value="active">Active Players</SelectItem>
              <SelectItem value="retired">Retired Players</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="review-status-filter" className="mb-2 block text-sm font-medium">Review Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="review-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="AWAITING_REVISION">Awaiting Revision</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="DENIED">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="players-per-page" className="mb-2 block text-sm font-medium">Players Per Page</label>
          <Select value={itemsPerPage.toString()} onValueChange={value => setItemsPerPage(Number.parseInt(value))}>
            <SelectTrigger id="players-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="250">250 per page</SelectItem>
              <SelectItem value="500">500 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <GraphiteButton
          onClick={applyFilters}
          disabled={loadingFootballers}
          loading={loadingFootballers}
          loadingText="Loading..."
          className="w-full"
        >
          Apply Filters
        </GraphiteButton>
      </CardContent>
    </Card>
  );
}
