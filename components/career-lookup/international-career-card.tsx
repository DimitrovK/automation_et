import type { FootballerNationStat, n8nWikiPlayerData, NationalTeam } from '@/types/player';
import { AlertTriangle, Check, Info, Loader2, Plus, RefreshCw, Shield, Upload } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FootballerAPI } from '@/lib/footballer-api';

type NationSyncStatus = 'synced' | 'mismatch' | 'not-in-db' | 'not-found';

type NationComparison = {
  wikiTeam: NationalTeam;
  dbStat: FootballerNationStat | null;
  status: NationSyncStatus;
};

type InternationalCareerCardProps = {
  nationalTeams?: n8nWikiPlayerData['nationalTeams'];
  dbNationalTeams?: FootballerNationStat[];
  footballerId: number | null;
  onNationStatsUpdated?: () => void;
};

export function InternationalCareerCard({
  nationalTeams,
  dbNationalTeams,
  footballerId,
  onNationStatsUpdated,
}: InternationalCareerCardProps) {
  const [operationStatus, setOperationStatus] = useState<Record<string, 'loading' | 'success' | 'error'>>({});
  const [operationErrors, setOperationErrors] = useState<Record<string, string>>({});
  const [syncingAll, setSyncingAll] = useState(false);

  if (!nationalTeams || nationalTeams.length === 0) {
    return null;
  }

  const hasDbData = dbNationalTeams && dbNationalTeams.length > 0;

  // Compare Wikipedia national teams to DB records by nationID
  const comparisons: NationComparison[] = nationalTeams.map((nt) => {
    if (!nt.nationFound || !nt.nationID) {
      return { wikiTeam: nt, dbStat: null, status: 'not-found' as NationSyncStatus };
    }

    const dbMatch = dbNationalTeams?.find(db => db.nation_id === nt.nationID) ?? null;

    if (!dbMatch) {
      return { wikiTeam: nt, dbStat: null, status: 'not-in-db' as NationSyncStatus };
    }

    const isSynced = dbMatch.apps === nt.apps && dbMatch.goals === nt.goals;
    return {
      wikiTeam: nt,
      dbStat: dbMatch,
      status: isSynced ? 'synced' : 'mismatch',
    };
  });

  const pendingOperations = comparisons.filter(c => c.status === 'not-in-db' || c.status === 'mismatch');
  const hasMultipleNations = nationalTeams.length > 1;

  const getRowClassName = (status: NationSyncStatus): string => {
    switch (status) {
      case 'synced':
        return '';
      case 'mismatch':
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
      case 'not-in-db':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'not-found':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    }
  };

  const handleAddToDb = async (comparison: NationComparison) => {
    if (!footballerId || !comparison.wikiTeam.nationID) return;

    const key = `${comparison.wikiTeam.nationID}`;
    setOperationStatus(prev => ({ ...prev, [key]: 'loading' }));
    setOperationErrors(prev => { const next = { ...prev }; delete next[key]; return next; });

    try {
      await FootballerAPI.createFootballerNation({
        footballer_id: footballerId,
        nation_id: comparison.wikiTeam.nationID,
        apps: comparison.wikiTeam.apps,
        goals: comparison.wikiTeam.goals,
      });
      setOperationStatus(prev => ({ ...prev, [key]: 'success' }));
      onNationStatsUpdated?.();
    } catch (err) {
      setOperationStatus(prev => ({ ...prev, [key]: 'error' }));
      setOperationErrors(prev => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'Failed to add national team stat',
      }));
    }
  };

  const handleUpdateInDb = async (comparison: NationComparison) => {
    if (!footballerId || !comparison.dbStat) return;

    const key = `${comparison.wikiTeam.nationID}`;
    setOperationStatus(prev => ({ ...prev, [key]: 'loading' }));
    setOperationErrors(prev => { const next = { ...prev }; delete next[key]; return next; });

    try {
      await FootballerAPI.updateFootballerNation(comparison.dbStat.id, {
        footballer_id: footballerId,
        nation_id: comparison.dbStat.nation_id,
        apps: comparison.wikiTeam.apps,
        goals: comparison.wikiTeam.goals,
      });
      setOperationStatus(prev => ({ ...prev, [key]: 'success' }));
      onNationStatsUpdated?.();
    } catch (err) {
      setOperationStatus(prev => ({ ...prev, [key]: 'error' }));
      setOperationErrors(prev => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'Failed to update national team stat',
      }));
    }
  };

  const handleSyncAll = async () => {
    if (!footballerId) return;
    setSyncingAll(true);

    for (const comparison of pendingOperations) {
      if (comparison.status === 'not-in-db') {
        await handleAddToDb(comparison);
      } else if (comparison.status === 'mismatch') {
        await handleUpdateInDb(comparison);
      }
    }

    setSyncingAll(false);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-emerald-600" />
              International Career
            </CardTitle>
            <CardDescription>
              National team appearances and statistics
              {footballerId
                ? (
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      💡 You can sync national team stats here directly, or they will be included when you click Deploy/Update Footballer below.
                    </span>
                  )
                : (
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      📋 National team stats will be created automatically when you deploy the footballer below.
                    </span>
                  )}
            </CardDescription>
          </div>
          {footballerId && pendingOperations.length > 0 && (
            <Button
              size="sm"
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
            >
              {syncingAll
                ? <><Loader2 className="mr-1 size-4 animate-spin" />Syncing...</>
                : <><RefreshCw className="mr-1 size-4" />Sync All ({pendingOperations.length})</>}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Multi-nation warning */}
        {hasMultipleNations && footballerId && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
            <Info className="size-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              This footballer has represented multiple nations. Ensure additional nations are configured in <strong>other_nations</strong> via the admin panel before updating. If the update fails, configure the nations first.
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {footballerId ? (
                <>
                  <tr className="border-b border-gray-100 dark:border-slate-700">
                    <th rowSpan={2} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Nation
                    </th>
                    <th colSpan={2} className="border-b border-gray-200 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-slate-600 dark:text-blue-400">
                      Wikipedia
                    </th>
                    <th colSpan={2} className="border-b border-gray-200 border-l-2 border-l-gray-300 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-slate-600 dark:border-l-slate-500 dark:text-emerald-400">
                      Database
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Season
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Action
                    </th>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-slate-600">
                    <th className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-400">Apps</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-400">Goals</th>
                    <th className="border-l-2 border-l-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-600 dark:border-l-slate-500 dark:text-gray-400">Apps</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-400">Goals</th>
                  </tr>
                </>
              ) : (
                <tr className="border-b border-gray-200">
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Nation
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Apps
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Goals
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Season
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {comparisons.map((comp) => {
                const nt = comp.wikiTeam;
                const key = `${nt.nationID ?? nt.teamName}`;
                const opStatus = operationStatus[key];
                const opError = operationErrors[key];

                return (
                  <tr
                    key={`nt-${nt.teamName}`}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700/50 ${getRowClassName(comp.status)}`}
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div
                            className={`font-medium ${comp.status === 'not-found' ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'} flex items-center gap-1`}
                          >
                            {comp.status === 'not-found' && <AlertTriangle className="size-4 text-red-500" />}
                            {nt.teamName}
                          </div>
                          {nt.nationFound && nt.nationNameDB && nt.nationNameDB !== nt.teamName && (
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              DB:
                              {' '}
                              {nt.nationNameDB}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className={`font-medium ${comp.status === 'mismatch' && comp.dbStat && comp.dbStat.apps !== nt.apps ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                        {nt.apps}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className={`font-medium ${comp.status === 'mismatch' && comp.dbStat && comp.dbStat.goals !== nt.goals ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                        {nt.goals}
                      </div>
                    </td>
                    {footballerId && (
                      <>
                        <td className="border-l-2 border-l-gray-300 px-2 py-3 text-center dark:border-l-slate-500">
                          <div className={`font-medium ${comp.status === 'mismatch' && comp.dbStat && comp.dbStat.apps !== nt.apps ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {comp.dbStat ? comp.dbStat.apps : '—'}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div className={`font-medium ${comp.status === 'mismatch' && comp.dbStat && comp.dbStat.goals !== nt.goals ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {comp.dbStat ? comp.dbStat.goals : '—'}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-2 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {`${nt.startYear}${nt.endYear ? `–${nt.endYear}` : ''}`}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col gap-1">
                        {/* Action / Status rendering */}
                        {opStatus === 'loading' && (
                          <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-800">
                            <Loader2 className="mr-1 size-3 animate-spin" />
                            Processing...
                          </Badge>
                        )}
                        {opStatus === 'success' && (
                          <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                            <Check className="mr-1 size-3" />
                            Done
                          </Badge>
                        )}
                        {opStatus === 'error' && (
                          <>
                            <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
                              <AlertTriangle className="mr-1 size-3" />
                              Failed
                            </Badge>
                            {opError && (
                              <span className="max-w-[200px] text-xs text-red-600 dark:text-red-400">{opError}</span>
                            )}
                          </>
                        )}
                        {!opStatus && comp.status === 'synced' && (
                          <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                            <Check className="mr-1 size-3" />
                            Synced
                          </Badge>
                        )}
                        {!opStatus && comp.status === 'mismatch' && footballerId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateInDb(comp)}
                            className="h-7 border-amber-300 text-xs text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
                          >
                            <Upload className="mr-1 size-3" />
                            Update in DB
                          </Button>
                        )}
                        {!opStatus && comp.status === 'mismatch' && !footballerId && (
                          <Badge variant="secondary" className="border-amber-200 bg-amber-100 text-amber-800">
                            <AlertTriangle className="mr-1 size-3" />
                            Mismatch
                          </Badge>
                        )}
                        {!opStatus && comp.status === 'not-in-db' && footballerId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddToDb(comp)}
                            className="h-7 border-blue-300 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          >
                            <Plus className="mr-1 size-3" />
                            Add to DB
                          </Button>
                        )}
                        {!opStatus && comp.status === 'not-in-db' && !footballerId && (
                          <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                            <Check className="mr-1 size-3" />
                            Ready
                          </Badge>
                        )}
                        {!opStatus && comp.status === 'not-found' && (
                          <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
                            <AlertTriangle className="mr-1 size-3" />
                            Nation not in DB
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-700/30">
                <td className="px-2 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  {`${nationalTeams.length} nation${nationalTeams.length !== 1 ? 's' : ''}`}
                </td>
                <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">
                  {nationalTeams.reduce((sum, nt) => sum + nt.apps, 0)}
                </td>
                <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">
                  {nationalTeams.reduce((sum, nt) => sum + nt.goals, 0)}
                </td>
                {footballerId && (
                  <>
                    <td className="border-l-2 border-l-gray-300 px-2 py-3 text-center font-semibold text-gray-900 dark:border-l-slate-500 dark:text-white">
                      {hasDbData ? dbNationalTeams!.reduce((sum, db) => sum + db.apps, 0) : '—'}
                    </td>
                    <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">
                      {hasDbData ? dbNationalTeams!.reduce((sum, db) => sum + db.goals, 0) : '—'}
                    </td>
                  </>
                )}
                <td className="px-2 py-3 font-semibold text-gray-900 dark:text-white">Total</td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap gap-1">
                    {footballerId ? (
                      <>
                        {comparisons.filter(c => c.status === 'synced').length > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-xs text-green-800">
                            {comparisons.filter(c => c.status === 'synced').length}
                            {' '}
                            synced
                          </Badge>
                        )}
                        {comparisons.filter(c => c.status === 'mismatch').length > 0 && (
                          <Badge variant="secondary" className="bg-amber-100 text-xs text-amber-800">
                            <AlertTriangle className="mr-1 size-3" />
                            {comparisons.filter(c => c.status === 'mismatch').length}
                            {' '}
                            mismatch
                          </Badge>
                        )}
                        {comparisons.filter(c => c.status === 'not-in-db').length > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-xs text-blue-800">
                            {comparisons.filter(c => c.status === 'not-in-db').length}
                            {' '}
                            to add
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        {comparisons.filter(c => c.status !== 'not-found').length > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-xs text-green-800">
                            <Check className="mr-1 size-3" />
                            {comparisons.filter(c => c.status !== 'not-found').length}
                            {' '}
                            ready
                          </Badge>
                        )}
                      </>
                    )}
                    {comparisons.filter(c => c.status === 'not-found').length > 0 && (
                      <Badge variant="destructive" className="bg-red-100 text-xs text-red-800">
                        <AlertTriangle className="mr-1 size-3" />
                        {comparisons.filter(c => c.status === 'not-found').length}
                        {' '}
                        nation missing
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
