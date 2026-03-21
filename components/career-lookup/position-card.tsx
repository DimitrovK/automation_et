'use client';

import { AlertTriangle, Check, Loader2, MapPin, Plus, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { Position, PositionsTracker, SetPositionsRequest } from '@/types/player';
import { FootballerAPI } from '@/lib/footballer-api';

export type SelectedPosition = {
  position_id: number;
  name: string;
  full_name: string;
  role: string;
  is_primary: boolean;
  sort_order: number;
  source: 'wikipedia' | 'database' | 'manual';
};

type PositionCardProps = {
  positionsTracker?: PositionsTracker;
  footballerId?: number | null;
  playerFoundInDB?: boolean;
  className?: string;
  onPositionsApplied?: () => void;
  onSelectedPositionsChange?: (positions: SelectedPosition[]) => void;
};

const ROLE_COLORS: Record<string, string> = {
  GK: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  DEF: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  MID: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  FWD: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

const ROLE_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards',
};

function getRoleBadgeClass(role: string): string {
  return ROLE_COLORS[role] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
}

function inferRole(positionName: string): string {
  const gk = ['GK'];
  const def = ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW'];
  const mid = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
  if (gk.includes(positionName)) return 'GK';
  if (def.includes(positionName)) return 'DEF';
  if (mid.includes(positionName)) return 'MID';
  return 'FWD';
}

type SyncStatus = 'synced' | 'mismatch' | 'new-player' | 'no-data';

function getSyncStatus(positionsTracker?: PositionsTracker, playerFoundInDB?: boolean): SyncStatus {
  if (!positionsTracker) return 'no-data';
  if (!playerFoundInDB) return 'new-player';
  if (positionsTracker.hasDiscrepancy) return 'mismatch';
  return 'synced';
}

const STATUS_BADGES: Record<SyncStatus, { label: string; className: string }> = {
  'synced': { label: 'Synced', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  'mismatch': { label: 'Mismatch', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  'new-player': { label: 'New Player', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  'no-data': { label: 'No Data', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
};

export function PositionCard({
  positionsTracker,
  footballerId,
  playerFoundInDB,
  className,
  onPositionsApplied,
  onSelectedPositionsChange,
}: PositionCardProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<SelectedPosition[]>([]);

  const syncStatus = getSyncStatus(positionsTracker, playerFoundInDB);
  const statusBadge = STATUS_BADGES[syncStatus];

  // Initialize selected positions from tracker data
  useEffect(() => {
    if (!positionsTracker) return;

    const initial: SelectedPosition[] = [];

    // Add existing DB positions
    if (positionsTracker.databaseHasPositions) {
      positionsTracker.databasePositions.forEach((p, i) => {
        initial.push({
          position_id: p.id,
          name: p.name,
          full_name: p.fullName,
          role: inferRole(p.name),
          is_primary: p.isPrimary,
          sort_order: i,
          source: 'database',
        });
      });
    }

    // Add Wikipedia positions not already in DB
    const dbIds = new Set(initial.map(p => p.position_id));
    positionsTracker.wikipediaPositions.forEach((p) => {
      if (!dbIds.has(p.id)) {
        initial.push({
          position_id: p.id,
          name: p.name,
          full_name: p.fullName,
          role: inferRole(p.name),
          is_primary: initial.length === 0,
          sort_order: initial.length,
          source: 'wikipedia',
        });
      }
    });

    setSelectedPositions(initial);
  }, [positionsTracker]);

  // Notify parent when selection changes
  useEffect(() => {
    onSelectedPositionsChange?.(selectedPositions);
  }, [selectedPositions, onSelectedPositionsChange]);

  // Fetch all available positions from DB
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoadingPositions(true);
        const positions = await FootballerAPI.getPositions();
        setAllPositions(positions);
      } catch {
        setAllPositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };
    fetchPositions();
  }, []);

  const addPosition = (pos: Position) => {
    if (selectedPositions.some(s => s.position_id === pos.id)) return;
    const newPos: SelectedPosition = {
      position_id: pos.id,
      name: pos.name,
      full_name: pos.full_name,
      role: pos.role,
      is_primary: selectedPositions.length === 0,
      sort_order: selectedPositions.length,
      source: 'manual',
    };
    setSelectedPositions(prev => [...prev, newPos]);
    setApplied(false);
  };

  const removePosition = (positionId: number) => {
    setSelectedPositions(prev => {
      const filtered = prev.filter(p => p.position_id !== positionId);
      // If we removed the primary, make the first one primary
      if (filtered.length > 0 && !filtered.some(p => p.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered.map((p, i) => ({ ...p, sort_order: i }));
    });
    setApplied(false);
  };

  const setPrimary = (positionId: number) => {
    setSelectedPositions(prev =>
      prev.map(p => ({ ...p, is_primary: p.position_id === positionId })),
    );
    setApplied(false);
  };

  const handleApplyPositions = async () => {
    if (!footballerId || selectedPositions.length === 0) return;

    const request: SetPositionsRequest = {
      footballer_id: footballerId,
      positions: selectedPositions.map(p => ({
        position_id: p.position_id,
        is_primary: p.is_primary,
        sort_order: p.sort_order,
      })),
    };

    try {
      setApplying(true);
      setError(null);
      await FootballerAPI.setPositions(request);
      setApplied(true);
      onPositionsApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply positions');
    } finally {
      setApplying(false);
    }
  };

  if (!positionsTracker) {
    return null;
  }

  const hasWikipediaPositions = positionsTracker.wikipediaPositions.length > 0;
  const hasMissing = positionsTracker.missingInDatabase.length > 0;

  // Determine if current selection differs from DB state
  const dbPositionIds = new Set(positionsTracker.databasePositions.map(p => p.id));
  const selectedIds = new Set(selectedPositions.map(p => p.position_id));
  const hasUnsavedChanges = positionsTracker.databaseHasPositions
    ? (selectedIds.size !== dbPositionIds.size
      || [...selectedIds].some(id => !dbPositionIds.has(id))
      || [...dbPositionIds].some(id => !selectedIds.has(id))
      || selectedPositions.some(sp => {
        const dbP = positionsTracker.databasePositions.find(d => d.id === sp.position_id);
        return dbP && dbP.isPrimary !== sp.is_primary;
      }))
    : selectedPositions.length > 0;

  // Group allPositions by role for the selector
  const positionsByRole = allPositions.reduce<Record<string, Position[]>>((acc, pos) => {
    if (!acc[pos.role]) acc[pos.role] = [];
    acc[pos.role].push(pos);
    return acc;
  }, {});

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-gray-600 dark:text-gray-400" />
            <div>
              <CardTitle className="text-lg">Positions</CardTitle>
              <CardDescription>{positionsTracker.message}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && !applied && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Unsaved
              </Badge>
            )}
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discrepancy Alert */}
        {syncStatus === 'mismatch' && hasMissing && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>{positionsTracker.missingInDatabase.length}</strong>
              {' '}
              position{positionsTracker.missingInDatabase.length > 1 ? 's' : ''}
              {' '}
              found on Wikipedia but missing in database:
              {' '}
              <strong>{positionsTracker.missingInDatabase.map(p => p.fullName).join(', ')}</strong>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="selected" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selected" className="text-xs sm:text-sm">
              Selected Positions
              <Badge variant="secondary" className="ml-2 text-xs">{selectedPositions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All Positions
              <Badge variant="secondary" className="ml-2 text-xs">{allPositions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Selected / Active Positions */}
          <TabsContent value="selected" className="space-y-4 pt-2">
            {selectedPositions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No positions selected. Go to &quot;All Positions&quot; tab to add some.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPositions.map(pos => (
                  <div
                    key={pos.position_id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`border ${getRoleBadgeClass(pos.role)}`}>
                        {pos.name}
                      </Badge>
                      <span className="text-sm font-medium">{pos.full_name}</span>
                      {pos.is_primary && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <Star className="mr-1 size-3 fill-current" />
                          Primary
                        </Badge>
                      )}
                      {pos.source === 'wikipedia' && !positionsTracker.databasePositions.some(d => d.id === pos.position_id) && (
                        <Badge variant="outline" className="text-xs text-blue-600 dark:text-blue-400">Wiki</Badge>
                      )}
                      {pos.source === 'manual' && (
                        <Badge variant="outline" className="text-xs text-purple-600 dark:text-purple-400">Manual</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!pos.is_primary && (
                        <button
                          onClick={() => setPrimary(pos.position_id)}
                          className="rounded p-1 text-xs text-gray-500 transition-colors hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
                          title="Set as primary"
                        >
                          <Star className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removePosition(pos.position_id)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title="Remove"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Apply Button */}
            {hasUnsavedChanges && footballerId && !applied && (
              <ApiButton
                onClick={handleApplyPositions}
                disabled={applying || selectedPositions.length === 0}
                loading={applying}
                loadingText="Applying..."
                size="sm"
              >
                Save Positions
              </ApiButton>
            )}

            {/* Success State */}
            {applied && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="size-4" />
                Positions saved successfully!
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                ❌ {error}
              </div>
            )}

            {/* New Player Info */}
            {syncStatus === 'new-player' && selectedPositions.length > 0 && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                💡 These positions will be assigned when the player is deployed.
              </div>
            )}
          </TabsContent>

          {/* Tab 2: All Available Positions */}
          <TabsContent value="all" className="space-y-4 pt-2">
            {loadingPositions ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading positions...</span>
              </div>
            ) : (
              Object.entries(ROLE_LABELS).map(([role, label]) => {
                const positions = positionsByRole[role] || [];
                if (positions.length === 0) return null;

                return (
                  <div key={role}>
                    <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {label}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {positions.map(pos => {
                        const isSelected = selectedPositions.some(s => s.position_id === pos.id);
                        return (
                          <button
                            key={pos.id}
                            onClick={() => isSelected ? removePosition(pos.id) : addPosition(pos)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                              isSelected
                                ? `${getRoleBadgeClass(pos.role)} ring-2 ring-offset-1 ring-emerald-500 dark:ring-offset-gray-900`
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700'
                            }`}
                            title={isSelected ? `Remove ${pos.full_name}` : `Add ${pos.full_name}`}
                          >
                            {isSelected ? (
                              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Plus className="size-3.5 text-gray-400" />
                            )}
                            <span>{pos.name}</span>
                            <span className="hidden text-xs opacity-60 sm:inline">{pos.full_name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
