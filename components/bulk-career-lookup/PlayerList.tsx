'use client';

import { Users } from 'lucide-react';
import React from 'react';
import { useBulkProcessingContext, usePlayerListContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';

import { PlayerRow } from '@/components/bulk-career-lookup/PlayerRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataPagination } from '@/components/ui/data-pagination';

export function PlayerList() {
  const {
    footballers,
    loadingFootballers,
    selectedFootballers,
    currentPage,
    totalFootballers,
    totalPages,
    handleSelectAll,
    handlePageChange,
  } = usePlayerListContext();

  const { isProcessing: _isProcessing } = useBulkProcessingContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Players (
            {totalFootballers}
            {' '}
            total, showing
            {footballers.length}
            {' '}
            on page
            {currentPage}
            /
            {totalPages}
            )
          </span>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedFootballers.size === footballers.length && footballers.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All (Page)
            </label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingFootballers
          ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                  <div className="size-4 animate-spin rounded-full border-b-2 border-emerald-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading footballers...</span>
                </div>
              </div>
            )
          : (
              <div className="space-y-4">
                {footballers.map(footballer => (
                  <PlayerRow key={footballer.id} footballer={footballer} />
                ))}

                {footballers.length === 0 && (
                  <div className="py-12 text-center">
                    <Users className="mx-auto mb-4 size-12 text-gray-400" />
                    <p className="text-lg text-gray-500">No players found with current filters</p>
                    <p className="mt-1 text-sm text-gray-400">Try adjusting your filter criteria</p>
                  </div>
                )}
              </div>
            )}
      </CardContent>

      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            hideCount
          />
        </div>
      )}
    </Card>
  );
}
