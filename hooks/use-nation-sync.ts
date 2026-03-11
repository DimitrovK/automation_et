/**
 * Hook for managing national team sync operations:
 * sync status tracking, inline add/update, and batch sync-all.
 */

import type { BulkLookupResult, NationSyncStatusMap } from '@/components/bulk-career-lookup/types';
import type { NationalTeam } from '@/types/player';
import { useState } from 'react';
import { getNationComparisons } from '@/lib/bulk-career-lookup';
import { FootballerAPI } from '@/lib/footballer-api';

export function useNationSync(
  bulkResults: Map<number, BulkLookupResult>,
  setBulkResults: React.Dispatch<React.SetStateAction<Map<number, BulkLookupResult>>>,
) {
  const [nationSyncStatus, setNationSyncStatus] = useState<NationSyncStatusMap>({});
  const [nationSyncErrors, setNationSyncErrors] = useState<Record<string, string>>({});
  const [syncingAllNations, setSyncingAllNations] = useState(false);

  const refreshResultNationStats = async (fId: number) => {
    try {
      const freshDbNations = await FootballerAPI.getFootballerNations(fId);
      setBulkResults((prev) => {
        const newResults = new Map(prev);
        const existing = newResults.get(fId);
        if (existing) {
          newResults.set(fId, { ...existing, dbNationalTeams: freshDbNations });
        }
        return newResults;
      });
    } catch {
      /* silently fail */
    }
  };

  const handleInlineAddNation = async (fId: number, wikiNation: NationalTeam) => {
    if (!wikiNation.nationID) {
      return;
    }
    const key = `${fId}-${wikiNation.nationID}`;
    setNationSyncStatus(prev => ({ ...prev, [key]: 'loading' }));
    setNationSyncErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      await FootballerAPI.createFootballerNation({
        footballer_id: fId,
        nation_id: wikiNation.nationID,
        apps: wikiNation.apps,
        goals: wikiNation.goals,
      });
      setNationSyncStatus(prev => ({ ...prev, [key]: 'success' }));
      await refreshResultNationStats(fId);
    } catch (err) {
      setNationSyncStatus(prev => ({ ...prev, [key]: 'error' }));
      setNationSyncErrors(prev => ({ ...prev, [key]: err instanceof Error ? err.message : 'Failed to add' }));
    }
  };

  const handleInlineUpdateNation = async (fId: number, wikiNation: NationalTeam, dbStatId: number, dbNationId: number) => {
    const key = `${fId}-${wikiNation.nationID}`;
    setNationSyncStatus(prev => ({ ...prev, [key]: 'loading' }));
    setNationSyncErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      await FootballerAPI.updateFootballerNation(dbStatId, {
        footballer_id: fId,
        nation_id: dbNationId,
        apps: wikiNation.apps,
        goals: wikiNation.goals,
      });
      setNationSyncStatus(prev => ({ ...prev, [key]: 'success' }));
      await refreshResultNationStats(fId);
    } catch (err) {
      setNationSyncStatus(prev => ({ ...prev, [key]: 'error' }));
      setNationSyncErrors(prev => ({ ...prev, [key]: err instanceof Error ? err.message : 'Failed to update' }));
    }
  };

  const handleSyncAllNations = async () => {
    setSyncingAllNations(true);
    const results = Array.from(bulkResults.values());

    for (const result of results) {
      if (result.hasNoInternationalCareer) {
        continue;
      }
      const comparisons = getNationComparisons(result);
      const pending = comparisons.filter(c => c.status === 'not-in-db' || c.status === 'mismatch');

      for (const comp of pending) {
        const key = `${result.footballer.id}-${comp.wikiTeam.nationID}`;
        if (nationSyncStatus[key] === 'success') {
          continue;
        }

        if (comp.status === 'not-in-db') {
          await handleInlineAddNation(result.footballer.id, comp.wikiTeam);
        } else if (comp.status === 'mismatch' && comp.dbStat) {
          await handleInlineUpdateNation(result.footballer.id, comp.wikiTeam, comp.dbStat.id, comp.dbStat.nation_id);
        }
      }
    }

    setSyncingAllNations(false);
  };

  const clearNationSyncState = () => {
    setNationSyncStatus({});
    setNationSyncErrors({});
  };

  return {
    nationSyncStatus,
    nationSyncErrors,
    syncingAllNations,
    handleInlineAddNation,
    handleInlineUpdateNation,
    handleSyncAllNations,
    clearNationSyncState,
  };
}
