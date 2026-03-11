/**
 * Hook for managing bulk processing state: results, processing status,
 * expanded players, and orchestrating the processing pipeline.
 */

import type { BulkLookupResult, BulkStats, CheckMode } from '@/components/bulk-career-lookup/types';
import type { Footballer } from '@/types/player';
import { useMemo, useState } from 'react';
import { processFootballerCareer } from '@/lib/bulk-career-lookup';
import { createLogEntry } from '@/types/deployment';

export type ActiveTab = 'players' | 'results';

export function useBulkProcessing() {
  const [bulkResults, setBulkResults] = useState<Map<number, BulkLookupResult>>(() => new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<number | null>(null);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<number>>(() => new Set());
  const [activeTab, setActiveTab] = useState<ActiveTab>('players');

  // Processing settings
  const [useWikipediaUrl, setUseWikipediaUrl] = useState(true);
  const [checkMode, setCheckMode] = useState<CheckMode>('career-and-nations');
  const [autoSyncNations, setAutoSyncNations] = useState(false);

  const stats: BulkStats = useMemo(() => {
    const results = Array.from(bulkResults.values());
    return {
      total: results.length,
      processed: results.filter(r => r.status === 'completed' || r.status === 'error' || r.status === 'discrepancy').length,
      discrepancies: results.filter(r => r.status === 'discrepancy').length,
      errors: results.filter(r => r.status === 'error').length,
    };
  }, [bulkResults]);

  const togglePlayerExpanded = (footballerId: number) => {
    const newExpanded = new Set(expandedPlayers);
    if (newExpanded.has(footballerId)) {
      newExpanded.delete(footballerId);
    } else {
      newExpanded.add(footballerId);
    }
    setExpandedPlayers(newExpanded);
  };

  const startBulkProcessing = async (
    footballers: Footballer[],
    selectedFootballers: Set<number>,
  ) => {
    const processIds = selectedFootballers.size > 0
      ? Array.from(selectedFootballers)
      : footballers.map(f => f.id);

    if (processIds.length === 0) {
      return;
    }

    setIsProcessing(true);

    const newResults = new Map(bulkResults);

    // Initialize all selected footballers as pending
    processIds.forEach((footballerId) => {
      const footballer = footballers.find(f => f.id === footballerId);
      if (footballer) {
        newResults.set(footballerId, {
          footballer,
          status: 'pending',
          logs: [createLogEntry('info', `Added to processing queue`)],
        });
      }
    });
    setBulkResults(newResults);

    // Process each footballer sequentially with delay
    for (const footballerId of processIds) {
      const footballer = footballers.find(f => f.id === footballerId);
      if (!footballer) {
        continue;
      }

      setCurrentlyProcessing(footballerId);

      newResults.set(footballerId, {
        ...newResults.get(footballerId)!,
        status: 'processing',
      });
      setBulkResults(new Map(newResults));

      const result = await processFootballerCareer(footballer, {
        useWikipediaUrl,
        checkMode,
        autoSyncNations,
      });
      newResults.set(footballerId, result);
      setBulkResults(new Map(newResults));

      // Delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setCurrentlyProcessing(null);
    setIsProcessing(false);
    setActiveTab('results');
  };

  const clearAllSelections = (clearSelectedFootballers: () => void) => {
    clearSelectedFootballers();
    setBulkResults(new Map());
    setCurrentlyProcessing(null);
    setIsProcessing(false);
    setExpandedPlayers(new Set());
    setActiveTab('players');
  };

  return {
    // State
    bulkResults,
    isProcessing,
    currentlyProcessing,
    expandedPlayers,
    useWikipediaUrl,
    checkMode,
    autoSyncNations,
    stats,
    activeTab,

    // Setters
    setBulkResults,
    setUseWikipediaUrl,
    setCheckMode,
    setAutoSyncNations,
    setActiveTab,

    // Actions
    togglePlayerExpanded,
    startBulkProcessing,
    clearAllSelections,
  };
}
