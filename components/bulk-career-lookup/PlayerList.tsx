'use client';

import { Users } from 'lucide-react';
import React from 'react';
import { useBulkProcessingContext, usePlayerListContext } from '@/components/bulk-career-lookup/BulkCareerLookupContext';

import { PlayerRow } from '@/components/bulk-career-lookup/PlayerRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {/* Show first page */}
              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => handlePageChange(1)}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {/* Show pages around current page */}
              {[...Array.from({ length: Math.min(5, totalPages) })].map((_, i) => {
                const pageStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const pageNum = pageStart + i;
                if (pageNum > totalPages) {
                  return null;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={pageNum === currentPage}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Show last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => handlePageChange(totalPages)}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
}
