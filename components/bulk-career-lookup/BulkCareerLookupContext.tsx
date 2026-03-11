'use client';

import type { ReactNode } from 'react';
import type {
  BulkLookupResult,
  BulkStats,
  CheckMode,
  NationSyncStatusMap,
  PlayerFilter,
} from '@/components/bulk-career-lookup/types';
import type { ActiveTab } from '@/hooks/use-bulk-processing';
import type { Footballer, NationalTeam } from '@/types/player';

import React, { createContext, useMemo } from 'react';
import { useBulkProcessing } from '@/hooks/use-bulk-processing';
import { useNationSync } from '@/hooks/use-nation-sync';
import { usePlayerList } from '@/hooks/use-player-list';

// ─── Player List Context ────────────────────────────────────────────────────

type PlayerListContextState = {
  footballers: Footballer[];
  loadingFootballers: boolean;
  selectedFootballers: Set<number>;
  currentPage: number;
  totalFootballers: number;
  totalPages: number;
  itemsPerPage: number;
  playerFilter: PlayerFilter;
  statusFilter: string;
  setItemsPerPage: (size: number) => void;
  setPlayerFilter: (filter: PlayerFilter) => void;
  setStatusFilter: (filter: string) => void;
  setSelectedFootballers: React.Dispatch<React.SetStateAction<Set<number>>>;
  loadFootballers: () => Promise<void>;
  applyFilters: () => void;
  handleSelectAll: (checked: boolean) => void;
  handleSelectFootballer: (footballerId: number, checked: boolean) => void;
  handlePageChange: (page: number) => void;
};

const PlayerListContext = createContext<PlayerListContextState | undefined>(undefined);

export function usePlayerListContext() {
  const context = React.use(PlayerListContext);
  if (context === undefined) {
    throw new Error('usePlayerListContext must be used within a BulkCareerLookupProvider');
  }
  return context;
}

// ─── Bulk Processing Context ────────────────────────────────────────────────

type BulkProcessingContextState = {
  bulkResults: Map<number, BulkLookupResult>;
  isProcessing: boolean;
  currentlyProcessing: number | null;
  expandedPlayers: Set<number>;
  useWikipediaUrl: boolean;
  checkMode: CheckMode;
  autoSyncNations: boolean;
  stats: BulkStats;
  activeTab: ActiveTab;
  setBulkResults: React.Dispatch<React.SetStateAction<Map<number, BulkLookupResult>>>;
  setUseWikipediaUrl: (value: boolean) => void;
  setCheckMode: (mode: CheckMode) => void;
  setAutoSyncNations: (value: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  togglePlayerExpanded: (footballerId: number) => void;
  startBulkProcessing: () => void;
  clearAll: () => void;
};

const BulkProcessingContext = createContext<BulkProcessingContextState | undefined>(undefined);

export function useBulkProcessingContext() {
  const context = React.use(BulkProcessingContext);
  if (context === undefined) {
    throw new Error('useBulkProcessingContext must be used within a BulkCareerLookupProvider');
  }
  return context;
}

// ─── Nation Sync Context ────────────────────────────────────────────────────

type NationSyncContextState = {
  nationSyncStatus: NationSyncStatusMap;
  nationSyncErrors: Record<string, string>;
  syncingAllNations: boolean;
  handleInlineAddNation: (fId: number, wikiNation: NationalTeam) => Promise<void>;
  handleInlineUpdateNation: (fId: number, wikiNation: NationalTeam, dbStatId: number, dbNationId: number) => Promise<void>;
  handleSyncAllNations: () => Promise<void>;
};

const NationSyncContext = createContext<NationSyncContextState | undefined>(undefined);

export function useNationSyncContext() {
  const context = React.use(NationSyncContext);
  if (context === undefined) {
    throw new Error('useNationSyncContext must be used within a BulkCareerLookupProvider');
  }
  return context;
}

// ─── Combined Provider ──────────────────────────────────────────────────────

export function BulkCareerLookupProvider({ isAuthenticated, children }: { isAuthenticated: boolean; children: ReactNode }) {
  const playerList = usePlayerList(isAuthenticated);
  const processing = useBulkProcessing();
  const nationSync = useNationSync(processing.bulkResults, processing.setBulkResults);

  const playerListValue = useMemo<PlayerListContextState>(() => ({
    footballers: playerList.footballers,
    loadingFootballers: playerList.loadingFootballers,
    selectedFootballers: playerList.selectedFootballers,
    currentPage: playerList.currentPage,
    totalFootballers: playerList.totalFootballers,
    totalPages: playerList.totalPages,
    itemsPerPage: playerList.itemsPerPage,
    playerFilter: playerList.playerFilter,
    statusFilter: playerList.statusFilter,
    setItemsPerPage: playerList.setItemsPerPage,
    setPlayerFilter: playerList.setPlayerFilter,
    setStatusFilter: playerList.setStatusFilter,
    setSelectedFootballers: playerList.setSelectedFootballers,
    loadFootballers: playerList.loadFootballers,
    applyFilters: playerList.applyFilters,
    handleSelectAll: playerList.handleSelectAll,
    handleSelectFootballer: playerList.handleSelectFootballer,
    handlePageChange: playerList.handlePageChange,
  }), [playerList]);

  const processingValue = useMemo<BulkProcessingContextState>(() => ({
    bulkResults: processing.bulkResults,
    isProcessing: processing.isProcessing,
    currentlyProcessing: processing.currentlyProcessing,
    expandedPlayers: processing.expandedPlayers,
    useWikipediaUrl: processing.useWikipediaUrl,
    checkMode: processing.checkMode,
    autoSyncNations: processing.autoSyncNations,
    stats: processing.stats,
    activeTab: processing.activeTab,
    setBulkResults: processing.setBulkResults,
    setUseWikipediaUrl: processing.setUseWikipediaUrl,
    setCheckMode: processing.setCheckMode,
    setAutoSyncNations: processing.setAutoSyncNations,
    setActiveTab: processing.setActiveTab,
    togglePlayerExpanded: processing.togglePlayerExpanded,
    startBulkProcessing: () => processing.startBulkProcessing(playerList.footballers, playerList.selectedFootballers),
    clearAll: () => {
      processing.clearAllSelections(() => playerList.setSelectedFootballers(new Set()));
      nationSync.clearNationSyncState();
    },
  }), [processing, playerList, nationSync]);

  const nationSyncValue = useMemo<NationSyncContextState>(() => ({
    nationSyncStatus: nationSync.nationSyncStatus,
    nationSyncErrors: nationSync.nationSyncErrors,
    syncingAllNations: nationSync.syncingAllNations,
    handleInlineAddNation: nationSync.handleInlineAddNation,
    handleInlineUpdateNation: nationSync.handleInlineUpdateNation,
    handleSyncAllNations: nationSync.handleSyncAllNations,
  }), [nationSync]);

  return (
    <PlayerListContext value={playerListValue}>
      <BulkProcessingContext value={processingValue}>
        <NationSyncContext value={nationSyncValue}>
          {children}
        </NationSyncContext>
      </BulkProcessingContext>
    </PlayerListContext>
  );
}
