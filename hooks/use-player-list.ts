/**
 * Hook for managing the footballer list: loading, pagination, selection, and filters.
 */

import type { PlayerFilter } from '@/components/bulk-career-lookup/types';
import type { Footballer } from '@/types/player';
import { useCallback, useEffect, useState } from 'react';
import { FootballerAPI } from '@/lib/footballer-api';

export function usePlayerList(isAuthenticated: boolean) {
  const [footballers, setFootballers] = useState<Footballer[]>([]);
  const [loadingFootballers, setLoadingFootballers] = useState(false);
  const [selectedFootballers, setSelectedFootballers] = useState<Set<number>>(() => new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFootballers, setTotalFootballers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadFootballers = useCallback(async () => {
    setLoadingFootballers(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: itemsPerPage,
      };

      if (playerFilter !== 'all') {
        params.retired = playerFilter === 'retired' ? 'true' : 'false';
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await FootballerAPI.getFootballers(params);
      setFootballers(response.results);
      setTotalFootballers(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Failed to load footballers:', error);
    } finally {
      setLoadingFootballers(false);
    }
  }, [currentPage, itemsPerPage, playerFilter, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFootballers();
    }
  }, [isAuthenticated, loadFootballers]);

  const applyFilters = () => {
    setCurrentPage(1);
    setSelectedFootballers(new Set());
    loadFootballers();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFootballers(new Set(footballers.map(f => f.id)));
    } else {
      setSelectedFootballers(new Set());
    }
  };

  const handleSelectFootballer = (footballerId: number, checked: boolean) => {
    const newSelection = new Set(selectedFootballers);
    if (checked) {
      newSelection.add(footballerId);
    } else {
      newSelection.delete(footballerId);
    }
    setSelectedFootballers(newSelection);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedFootballers(new Set());
    }
  };

  return {
    // State
    footballers,
    loadingFootballers,
    selectedFootballers,
    currentPage,
    totalFootballers,
    totalPages,
    itemsPerPage,
    playerFilter,
    statusFilter,

    // Setters
    setItemsPerPage,
    setPlayerFilter,
    setStatusFilter,
    setSelectedFootballers,

    // Actions
    loadFootballers,
    applyFilters,
    handleSelectAll,
    handleSelectFootballer,
    handlePageChange,
  };
}
